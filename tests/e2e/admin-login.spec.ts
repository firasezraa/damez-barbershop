import { expect, test } from "@playwright/test";

/**
 * Halaman masuk nyata: formulir ada, tidak ada kredensial contoh, tidak ada sesi
 * di browser storage, dan pengiriman kredensial salah tidak pernah menghasilkan
 * cookie sesi. Di CI (tanpa Postgres & Supabase) jalur ini berhenti di 503; di
 * mesin pengembangan 401 dari Supabase. Keduanya diterima — yang wajib sama:
 * TIDAK ada cookie sesi.
 */
test("login page renders a real form without demo credentials", async ({ page }) => {
  const response = await page.goto("/admin/login");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Masuk Admin/);
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Kata sandi")).toBeVisible();

  const body = (await page.textContent("body")) ?? "";
  expect(body.toLowerCase()).not.toContain("demo");
  expect(body).not.toContain("damez123");

  const storedSession = await page.evaluate(() => window.localStorage.getItem("damez_admin_session"));
  expect(storedSession).toBeNull();
});

test("wrong credentials never produce a session cookie", async ({ request }) => {
  const response = await request.post("/api/admin/auth/sign-in", {
    form: { email: "owner@damez.id", password: "kata-sandi-salah-panjang" },
    maxRedirects: 0,
  });

  expect([401, 503]).toContain(response.status());
  const cookies = response.headers()["set-cookie"] ?? "";
  expect(cookies).not.toContain("dmz_admin_session=ey");
});

test("sign-out clears the session cookie", async ({ request }) => {
  const response = await request.post("/api/admin/auth/sign-out", { maxRedirects: 0 });

  expect(response.status()).toBe(303);
  const cookies = response.headers()["set-cookie"] ?? "";
  expect(cookies).toContain("dmz_admin_session=");
  expect(cookies).toContain("Max-Age=0");
});
