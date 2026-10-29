import { Pool } from "pg";

/**
 * Pool Postgres untuk skrip (migrasi, seed, worker) dan route handler server.
 * Hanya dipakai di server — lihat aturan lint `damez-boundaries/no-direct-db-in-api-route`.
 */
export function createPgPool(connectionString: string, max = 5): Pool {
  return new Pool({ connectionString, max });
}
