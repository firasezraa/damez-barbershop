import { expect, test } from "@playwright/test";

/**
 * Satu-satunya test E2E di R0. Fungsinya membuktikan pipeline E2E benar-benar
 * menjalankan browser terhadap build produksi — bukan skrip yang mencetak
 * "PASS". E2E alur booking menyusul di R2.
 */
test("landing page serves 200 with a visible h1 and no page errors", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Damez/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("an unknown ticket code answers 404 in Indonesian, not Next's default page", async ({
  page,
}) => {
  const response = await page.goto("/booking/success/DMZ-19990101-0000");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Halaman ini tidak ada/i);
  // Halaman bawaan Next berbunyi "This page could not be found" — kalau teks itu
  // muncul lagi, berarti not-found.tsx kita tidak terpakai.
  await expect(page.getByText(/This page could not be found/i)).toHaveCount(0);
  await expect(page.getByText(/DMZ-XXXXXXXX-XXXX/)).toBeVisible();
});
