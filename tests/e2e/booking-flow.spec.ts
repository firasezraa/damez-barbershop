import { expect, test } from "@playwright/test";

/**
 * Alur booking sungguhan terhadap database nyata (job e2e di CI memakai service
 * Postgres 16 + migrate + seed). Yang dibuktikan: pelanggan memilih layanan,
 * barber, dan jam, lalu mendapat tiket; dan slot yang sudah dipegang hilang dari
 * daftar pelanggan berikutnya.
 */
function futureDateJakarta(daysAhead: number): string {
  const shifted = new Date(Date.now() + 7 * 60 * 60 * 1000 + daysAhead * 24 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function uniquePhone(): string {
  return `+62${String(Date.now()).slice(-11)}`;
}

const slotButtons = /^\d{2}\.\d{2}$/;

/**
 * Offset hari per proyek. Kedua proyek menjalankan spec ini bersamaan terhadap
 * satu database; memakai tanggal yang sama membuat hold proyek A mengubah papan
 * proyek B, dan kegagalannya terbaca seperti bug aplikasi.
 */
function dateOffsetFor(projectName: string): number {
  return projectName === "tablet" ? 6 * 31 : 5;
}

function dateFor(testInfo: import("@playwright/test").TestInfo, daysAhead: number): string {
  return futureDateJakarta(dateOffsetFor(testInfo.project.name) + daysAhead);
}

async function openSlotStep(page: import("@playwright/test").Page, date: string): Promise<void> {
  await page.goto("/booking");
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: /Lanjut Pilih Barber/i }).click();
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: /Lanjut Pilih Tanggal/i }).click();
  await page.getByLabel("Tanggal").fill(date);
  const menungguJawaban = page.waitForResponse(
    (response) => response.url().includes("/api/slots/available") && response.request().method() === "POST",
    { timeout: 15_000 },
  );
  await page.getByRole("button", { name: /Tampilkan jadwal tersedia/i }).click();
  const jawaban = await menungguJawaban;
  expect(jawaban.status()).toBe(200);
  await expect(page.getByRole("button", { name: slotButtons }).first()).toBeVisible();
}

test("a customer books a chair without creating an account", async ({ page }, testInfo) => {
  await page.goto("/booking");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Booking Kursi/);
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: /Lanjut Pilih Barber/i }).click();

  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: /Lanjut Pilih Tanggal/i }).click();

  const date = futureDateJakarta(3);
  await page.getByLabel("Tanggal").fill(date);
  await page.getByRole("button", { name: /Tampilkan jadwal tersedia/i }).click();
  await page.getByRole("button", { name: slotButtons }).first().click();
  await page.getByRole("button", { name: /Lanjut Isi Data Diri/i }).click();

  await page.getByLabel("Nama lengkap").fill("Pelanggan E2E");
  await page.getByLabel(/Nomor WhatsApp/).fill(uniquePhone());
  await page.getByRole("button", { name: /Kunci Slot/i }).click();

  await expect(page.getByRole("heading", { name: "Tiket Anda" })).toBeVisible();
  await expect(page.getByText(/^DMZ-\d{8}-\d{4}$/)).toBeVisible();
  await expect(page.getByText(/Rp 20\.000/).first()).toBeVisible();
});

test("a slot already held disappears for the next customer", async ({ page }, testInfo) => {
  const date = dateFor(testInfo, 0);

  // Rekaman jawaban ketersediaan yang benar-benar diterima halaman ini. Kalau
  // asersi gagal, inilah buktinya: permintaan apa yang dikirim dan apa jawabannya,
  // bukan probe terpisah yang mudah salah bentuk.
  const rekaman: string[] = [];
  page.on("response", (response) => {
    if (!response.url().includes("/api/slots/available")) {
      return;
    }
    const permintaan = response.request().postData() ?? "(tanpa muatan)";
    void response
      .text()
      .then((badan) => {
        const isi = badan.length > 400 ? `${badan.slice(0, 400)}…` : badan;
        rekaman.push(`status=${response.status()} minta=${permintaan} jawab=${isi}`);
      })
      .catch(() => {
        rekaman.push(`status=${response.status()} minta=${permintaan} jawab=(tidak terbaca)`);
      });
  });

  await openSlotStep(page, date);
  const firstSlot = page.getByRole("button", { name: slotButtons }).first();
  const takenLabel = ((await firstSlot.textContent()) ?? "").trim();
  expect(takenLabel).toMatch(slotButtons);

  await firstSlot.click();
  await page.getByRole("button", { name: /Lanjut Isi Data Diri/i }).click();
  await page.getByLabel("Nama lengkap").fill("Pelanggan Pertama");
  await page.getByLabel(/Nomor WhatsApp/).fill(uniquePhone());
  await page.getByRole("button", { name: /Kunci Slot/i }).click();
  await expect(page.getByRole("heading", { name: "Tiket Anda" })).toBeVisible();

  // Pelanggan kedua membuka tanggal yang sama: slot tadi tidak lagi ditawarkan.
  await openSlotStep(page, date);

  const papanTerlihat = await page.getByRole("button", { name: slotButtons }).allInnerTexts();
  const kodeBooking = (await page.getByText(/^DMZ-\d{8}-\d{4}$/).first().textContent().catch(() => null)) ?? "?";
  console.log(
    `[diagnostik] tanggal=${date} slot=${takenLabel} booking=${kodeBooking.trim()} papan=${JSON.stringify(papanTerlihat)}`,
  );

  try {
    await expect(page.getByRole("button", { name: takenLabel, exact: true })).toHaveCount(0);
  } catch (error) {
    await page.waitForTimeout(300);
    console.log(`[diagnostik] jawaban ketersediaan halaman ini:\n  ${rekaman.join("\n  ")}`);
    throw error;
  }
});