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

async function openSlotStep(page: import("@playwright/test").Page, date: string): Promise<void> {
  await page.goto("/booking");
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: /Lanjut Pilih Barber/i }).click();
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: /Lanjut Pilih Tanggal/i }).click();
  await page.getByLabel("Tanggal").fill(date);
  await page.getByRole("button", { name: /Tampilkan jadwal tersedia/i }).click();
  await expect(page.getByRole("button", { name: slotButtons }).first()).toBeVisible();
}

test("a customer books a chair without creating an account", async ({ page }) => {
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

test("a slot already held disappears for the next customer", async ({ page }) => {
  const date = futureDateJakarta(5);

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
  await expect(page.getByRole("button", { name: takenLabel, exact: true })).toHaveCount(0);
});