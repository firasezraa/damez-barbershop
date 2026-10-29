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
