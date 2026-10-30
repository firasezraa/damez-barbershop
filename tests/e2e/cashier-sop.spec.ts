import { expect, test, type Page } from "@playwright/test";

/**
 * SOP kasir dan rekap owner, dijalankan penuh di browser (IDEA.md §11 R4).
 *
 * Autentikasi memakai Supabase sungguhan (secret CI), sedangkan data memakai
 * Postgres milik job ini. Test dilewati bila secret belum diset supaya kontribusi
 * luar tidak gagal karena kredensial yang tidak mereka miliki.
 */
const cashierEmail = process.env["E2E_ADMIN_EMAIL"];
const ownerEmail = process.env["E2E_OWNER_EMAIL"];
const password = process.env["E2E_ADMIN_PASSWORD"];

function todayJakarta(): string {
  const shifted = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function uniquePhone(): string {
  return `+62${String(Date.now()).slice(-11)}`;
}

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi").fill(password as string);
  await page.getByRole("button", { name: /^Masuk$/ }).click();
  await expect(page.getByRole("heading", { name: /Matriks kursi hari ini/i })).toBeVisible();
}

test("cashier runs the desk SOP and cannot download the cash recap", async ({ page, request }) => {
  test.skip(
    cashierEmail === undefined || password === undefined,
    "secret akun kasir belum diset",
  );

  const guestName = `Tamu SOP ${Date.now().toString().slice(-5)}`;

  // 1. Masuk lewat formulir sungguhan.
  await signIn(page, cashierEmail as string);
  await expect(page.getByText(/masuk sebagai cashier/i)).toBeVisible();

  // 2. Catat tamu walk-in: kursi langsung terisi tanpa DP.
  await page.getByLabel("Nama").fill(guestName);
  await page.getByLabel("WhatsApp").fill(uniquePhone());
  await page.getByLabel("Jam").fill("20:00");
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: /Catat walk-in/i }).click();
  await expect(page.getByText(guestName)).toBeVisible();

  // 3. Layani lalu lunasi tunai.
  const card = page.locator("li", { hasText: guestName }).first();
  await card.getByRole("button", { name: /Mulai layani/i }).click();
  await expect(card.getByText(/Sedang dilayani/)).toBeVisible();

  await card.getByRole("button", { name: /Lunas tunai/i }).click();
  await expect(card.getByText(/lunas Rp/)).toBeVisible();

  // 4. Uang masuk tampil di rekap layar, tetapi berkas rekap tetap milik owner.
  const cashCard = page.getByText(/Tunai\/QRIS masuk/i).locator("..");
  const cashOnScreen = Number(((await cashCard.textContent()) ?? "").replace(/[^\d]/g, ""));
  expect(cashOnScreen).toBeGreaterThan(0);

  const csvAsCashier = await page.request.get(`/api/admin/reports/daily-csv?date=${todayJakarta()}`);
  expect(csvAsCashier.status()).toBe(403);
  await expect(page.getByRole("link", { name: /Unduh rekap kas/i })).toHaveCount(0);

  // Konteks API tanpa cookie sesi: guard berlaku untuk API juga.
  const csvAnonymous = await request.get("/api/admin/reports/daily-csv");
  expect(csvAnonymous.status()).toBe(401);
});

test("owner downloads the cash recap and the CSV matches the screen", async ({ page }) => {
  test.skip(ownerEmail === undefined || password === undefined, "secret akun owner belum diset");

  await signIn(page, ownerEmail as string);
  await expect(page.getByText(/masuk sebagai owner/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Unduh rekap kas/i })).toBeVisible();

  const cashCard = page.getByText(/Tunai\/QRIS masuk/i).locator("..");
  const cashOnScreen = Number(((await cashCard.textContent()) ?? "").replace(/[^\d]/g, ""));

  const response = await page.request.get(`/api/admin/reports/daily-csv?date=${todayJakarta()}`);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/csv");
  expect(response.headers()["content-disposition"]).toContain(`damez-kas-${todayJakarta()}.csv`);

  const lines = (await response.text()).split("\n");
  expect(lines[0]).toContain("kode_booking");
  expect(lines.at(-1)).toContain("TOTAL");

  // Angka kas di CSV harus sama dengan kartu di layar.
  if (cashOnScreen > 0) {
    expect(lines.at(-1)).toContain(`,${cashOnScreen},`);
  }
});

test("an unauthenticated visitor cannot reach the cashier desk", async ({ page }) => {
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/admin\/login/);
});