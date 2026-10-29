import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";

/**
 * Alur DP penuh dengan `MOCK_MIDTRANS=true`: wizard memberi hold, panel
 * pembayaran meminta transaksi Snap, lalu webhook bertanda tangan (diperankan
 * test ini, seperti Midtrans sungguhan) mengonfirmasi kursi. Yang dibuktikan
 * adalah aturan §7: kursi HANYA berubah status lewat webhook, bukan karena
 * pengunjung menekan tombol bayar.
 */
const SERVER_KEY = process.env["MIDTRANS_SERVER_KEY"] ?? "kunci-server-midtrans-untuk-e2e";

function signature(orderId: string, statusCode: string, grossAmount: string): string {
  return createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${SERVER_KEY}`).digest("hex");
}

function futureDateJakarta(daysAhead: number): string {
  const shifted = new Date(Date.now() + 7 * 60 * 60 * 1000 + daysAhead * 24 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

/**
 * Kursi 1 (Rian) libur hari Minggu, jadi tanggal Minggu akan membuat wizard
 * menampilkan pesan "barber ini tidak buka" dan tanpa slot. Pilih hari kerja.
 */
function workingDayJakarta(daysAhead: number): string {
  let offset = daysAhead;
  while (new Date(`${futureDateJakarta(offset)}T00:00:00Z`).getUTCDay() === 0) {
    offset += 1;
  }
  return futureDateJakarta(offset);
}

test("a hold is only confirmed by a signed Midtrans webhook", async ({ page, request }) => {
  const date = workingDayJakarta(7);

  // 1. Booking sampai tiket terbit (hold 15 menit).
  await page.goto("/booking");
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: /Lanjut Pilih Barber/i }).click();
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: /Lanjut Pilih Tanggal/i }).click();
  await page.getByLabel("Tanggal").fill(date);
  await page.getByRole("button", { name: /Tampilkan jadwal tersedia/i }).click();
  await page.getByRole("button", { name: /^\d{2}\.\d{2}$/ }).first().click();
  await page.getByRole("button", { name: /Lanjut Isi Data Diri/i }).click();
  await page.getByLabel("Nama lengkap").fill("Pelanggan DP E2E");
  await page.getByLabel(/Nomor WhatsApp/).fill(`+62${String(Date.now()).slice(-11)}`);
  await page.getByRole("button", { name: /Kunci Slot/i }).click();

  const codeLabel = page.getByText(/^DMZ-\d{8}-\d{4}$/);
  await expect(codeLabel).toBeVisible();
  const bookingCode = ((await codeLabel.textContent()) ?? "").trim();
  expect(bookingCode).toMatch(/^DMZ-\d{8}-\d{4}$/);

  // 2. Halaman tiket: status masih menunggu pembayaran.
  await page.getByRole("link", { name: /Buka halaman tiket/i }).click();
  await expect(page.getByText(/Menunggu pembayaran DP/)).toBeVisible();

  // 3. Minta transaksi Snap (mock) lewat panel pembayaran.
  await page.getByRole("button", { name: /Bayar DP/i }).click();
  await expect(page.getByText(/Mode uji: pembayaran disimulasikan/)).toBeVisible();

  // Menekan tombol bayar saja TIDAK boleh mengonfirmasi kursi.
  await page.getByRole("button", { name: /Cek status pembayaran/i }).click();
  await expect(page.getByText(/Menunggu pembayaran DP/)).toBeVisible();

  // 4. Webhook bertanda tangan sah: di sinilah kursi dikonfirmasi.
  const settled = await request.post("/api/webhooks/midtrans", {
    data: {
      order_id: bookingCode,
      status_code: "200",
      gross_amount: "20000.00",
      transaction_id: `txn-e2e-${bookingCode}`,
      transaction_status: "settlement",
      payment_type: "qris",
      signature_key: signature(bookingCode, "200", "20000.00"),
    },
  });
  expect(settled.status()).toBe(200);
  expect(await settled.json()).toEqual({ status: "confirmed" });

  await page.getByRole("button", { name: /Cek status pembayaran/i }).click();
  await expect(page.getByText(/Terkonfirmasi/)).toBeVisible();
  await expect(page.getByText(/DP sudah diterima/)).toBeVisible();

  // 5. Webhook yang sama dikirim ulang: tidak ada efek ganda.
  const replay = await request.post("/api/webhooks/midtrans", {
    data: {
      order_id: bookingCode,
      status_code: "200",
      gross_amount: "20000.00",
      transaction_id: `txn-e2e-${bookingCode}`,
      transaction_status: "settlement",
      payment_type: "qris",
      signature_key: signature(bookingCode, "200", "20000.00"),
    },
  });
  expect(await replay.json()).toEqual({ status: "duplicate" });
});

test("a webhook with a bad signature never confirms anything", async ({ page, request }) => {
  const date = workingDayJakarta(9);

  await page.goto("/booking");
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: /Lanjut Pilih Barber/i }).click();
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: /Lanjut Pilih Tanggal/i }).click();
  await page.getByLabel("Tanggal").fill(date);
  await page.getByRole("button", { name: /Tampilkan jadwal tersedia/i }).click();
  await page.getByRole("button", { name: /^\d{2}\.\d{2}$/ }).first().click();
  await page.getByRole("button", { name: /Lanjut Isi Data Diri/i }).click();
  await page.getByLabel("Nama lengkap").fill("Pelanggan Tanda Tangan Salah");
  await page.getByLabel(/Nomor WhatsApp/).fill(`+62${String(Date.now()).slice(-11)}`);
  await page.getByRole("button", { name: /Kunci Slot/i }).click();

  const codeLabel = page.getByText(/^DMZ-\d{8}-\d{4}$/);
  await expect(codeLabel).toBeVisible();
  const bookingCode = ((await codeLabel.textContent()) ?? "").trim();

  const forged = await request.post("/api/webhooks/midtrans", {
    data: {
      order_id: bookingCode,
      status_code: "200",
      gross_amount: "20000.00",
      transaction_id: `txn-forged-${bookingCode}`,
      transaction_status: "settlement",
      payment_type: "qris",
      signature_key: "a".repeat(128),
    },
  });

  expect(forged.status()).toBe(401);

  await page.goto(`/booking/success/${bookingCode}`);
  await expect(page.getByText(/Menunggu pembayaran DP/)).toBeVisible();
});