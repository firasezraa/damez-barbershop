import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Vitest tidak memuat `.env` otomatis, dan di Windows tidak ada `set -a && . ./.env`.
 * Nilai yang sudah ada di lingkungan tidak ditimpa, jadi CI tetap memakai env job.
 */
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

/**
 * Satu project saja (bukan dua seperti draft plan): fileParallelism dimatikan
 * karena test integrasi berbagi satu database Postgres nyata dan VPS ini hanya
 * punya ~600 MB RAM bebas. Test unit dipilih lewat filter CLI di `npm run *`.
 *
 * `resolve.alias` mencerminkan `paths` di tsconfig supaya test bisa mengimpor
 * route handler yang memakai alias `@/`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/lib/**/*.ts", "src/features/*/queries/**/*.ts"],
      // Alasan tertulis: src/lib/db/server.ts mengimpor `server-only`, yang
      // melempar di luar runtime React Server, jadi tidak bisa di-import Vitest.
      // Berkas itu baru ada di milestone R1.
      exclude: ["src/lib/db/server.ts"],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
});
