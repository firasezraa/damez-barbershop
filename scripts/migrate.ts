import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { checksum, sortMigrationFiles, splitSqlStatements } from "./migrate-lib.ts";
import { createPgPool } from "../src/lib/db/pg.ts";

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, "../supabase/migrations");

type AppliedRow = { version: string; checksum: string };

/**
 * Menerapkan migrasi yang belum ada di `schema_migrations`, satu transaksi per
 * berkas. Melempar kalau isi migrasi yang sudah terterap berubah (checksum).
 * Mengembalikan daftar versi yang baru diterapkan.
 */
export async function applyMigrations(databaseUrl: string): Promise<string[]> {
  const pool = createPgPool(databaseUrl, 2);
  const client = await pool.connect();

  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS public.schema_migrations (
         version text PRIMARY KEY,
         checksum text NOT NULL,
         applied_at timestamptz NOT NULL DEFAULT now()
       )`,
    );

    const entries = await readdir(MIGRATIONS_DIR);
    const files = sortMigrationFiles(entries.filter((name) => name.endsWith(".sql")));

    const existing = await client.query<AppliedRow>(
      "SELECT version, checksum FROM public.schema_migrations",
    );
    const applied = new Map(existing.rows.map((row) => [row.version, row.checksum]));
    const newlyApplied: string[] = [];

    for (const file of files) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
      const sum = checksum(sql);
      const known = applied.get(file);

      if (known !== undefined) {
        if (known !== sum) {
          throw new Error(
            `checksum mismatch pada ${file}: berkas berubah setelah diterapkan. ` +
              `Buat migrasi baru, jangan ubah migrasi yang sudah terterap.`,
          );
        }
        continue;
      }

      await client.query("BEGIN");
      try {
        for (const statement of splitSqlStatements(sql)) {
          await client.query(statement);
        }
        await client.query(
          "INSERT INTO public.schema_migrations (version, checksum) VALUES ($1, $2)",
          [file, sum],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }

      newlyApplied.push(file);
    }

    return newlyApplied;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined || databaseUrl.length === 0) {
    console.error("DATABASE_URL belum diset. Contoh: DATABASE_URL=postgresql://damez:damez@127.0.0.1:5432/damez_dev npm run migrate");
    process.exit(1);
  }

  const applied = await applyMigrations(databaseUrl);
  console.error(
    applied.length === 0
      ? "Tidak ada migrasi baru."
      : `Migrasi diterapkan: ${applied.join(", ")}`,
  );
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
