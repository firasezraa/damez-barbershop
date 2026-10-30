import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

/**
 * Dua viewport sesuai §9: ponsel 390×844 dan tablet 1024×768. Keduanya memakai
 * Chromium supaya CI hanya perlu satu browser (RAM runner terbatas).
 *
 * Setiap project mengaku datang dari alamat IP berbeda. Aplikasi membatasi laju
 * per IP klien; tanpa ini seluruh suite berbagi satu jatah sehingga test yang
 * berjalan belakangan mendapat 429 dan gagal karena sebab yang tidak ada
 * hubungannya dengan aplikasi (pelajaran dari CI run 40957007319 dan
 * 40958639795). Alamat diambil dari rentang dokumentasi TEST-NET-2.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile-chrome",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        extraHTTPHeaders: { "x-forwarded-for": "198.51.100.10" },
      },
    },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1024, height: 768 },
        hasTouch: true,
        extraHTTPHeaders: { "x-forwarded-for": "198.51.100.11" },
      },
    },
  ],
  webServer: {
    command: "npm run start",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
