import { Pool } from "pg";
// Ekstensi .ts wajib: scripts/* dijalankan lewat `node --experimental-strip-types`,
// yang tidak me-resolve impor tanpa ekstensi. Next.js/Turbopack menerima keduanya.
import { TIMEZONE } from "../config/constants.ts";

/**
 * Pool Postgres untuk skrip (migrasi, seed, worker) dan route handler server.
 * Hanya dipakai di server — lihat aturan lint `damez-boundaries/no-direct-db-in-api-route`.
 *
 * `options` memin TimeZone sesi ke Asia/Jakarta untuk setiap koneksi. Tanpa ini
 * `date_trunc('day', ...)`, `to_char(...)` dan cast `::date` mengikuti zona mesin
 * (VPS: Asia/Shanghai, runner CI: UTC) sehingga batas hari pada rekap kas bisa
 * berbeda antara lokal, CI dan produksi.
 */
export function createPgPool(connectionString: string, max = 5): Pool {
  return new Pool({
    connectionString,
    max,
    options: `-c timezone=${TIMEZONE}`,
  });
}
