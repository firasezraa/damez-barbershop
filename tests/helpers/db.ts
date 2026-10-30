import type { Pool } from "pg";
import { createPgPool } from "../../src/lib/db/pg.ts";
import { applyMigrations } from "../../scripts/migrate.ts";

/** URL database test. Wajib terpisah dari DATABASE_URL produksi/dev. */
export function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (url === undefined || url.length === 0) {
    throw new Error(
      "TEST_DATABASE_URL belum diset. Contoh: TEST_DATABASE_URL=postgresql://damez:damez@127.0.0.1:5432/damez_test",
    );
  }
  return url;
}

/**
 * Mengosongkan schema `public` lalu menerapkan seluruh migrasi dari nol.
 * Mengembalikan pool baru yang siap dipakai test. Pemanggil wajib `end()` pool-nya.
 */
export async function resetTestDb(): Promise<Pool> {
  const url = testDatabaseUrl();

  const admin = createPgPool(url, 1);
  try {
    await admin.query("DROP SCHEMA IF EXISTS public CASCADE");
    await admin.query("CREATE SCHEMA public");
  } finally {
    await admin.end();
  }

  await applyMigrations(url);

  return createPgPool(url, 5);
}
