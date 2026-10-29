import { defineConfig } from "vitest/config";

/**
 * Satu project saja (bukan dua seperti draft plan): fileParallelism dimatikan
 * karena test integrasi berbagi satu database Postgres nyata dan VPS ini hanya
 * punya ~600 MB RAM bebas. Test unit dipilih lewat filter CLI di `npm run *`.
 */
export default defineConfig({
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
