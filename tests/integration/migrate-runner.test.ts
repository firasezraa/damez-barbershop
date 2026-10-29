import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { resetTestDb, testDatabaseUrl } from "../helpers/db.ts";
import { applyMigrations } from "../../scripts/migrate.ts";

const execFileAsync = promisify(execFile);
const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

const EXPECTED_VERSIONS = [
  "0001_core_schema.sql",
  "0002_slot_hold.sql",
  "0003_audit_rate_limit.sql",
];

let pool: Pool;

beforeAll(async () => {
  pool = await resetTestDb();
});

afterAll(async () => {
  await pool.end();
});

describe("migration runner against a real Postgres", () => {
  it("brings an empty database up from zero and records every migration", async () => {
    const rows = await pool.query<{ version: string }>(
      "SELECT version FROM public.schema_migrations ORDER BY version",
    );

    expect(rows.rows.map((row) => row.version)).toEqual(EXPECTED_VERSIONS);
  });

  it("is idempotent: a second run applies nothing", async () => {
    const applied = await applyMigrations(testDatabaseUrl());

    expect(applied).toEqual([]);

    const count = await pool.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM public.schema_migrations",
    );
    expect(count.rows[0]?.count).toBe(String(EXPECTED_VERSIONS.length));
  });

  it("refuses to run when an applied migration changed on disk", async () => {
    await pool.query(
      "UPDATE public.schema_migrations SET checksum = 'deadbeef' WHERE version = '0001_core_schema.sql'",
    );

    await expect(applyMigrations(testDatabaseUrl())).rejects.toThrow(
      /checksum mismatch.*0001_core_schema\.sql/s,
    );
  });

  it("exits non-zero from the CLI when a migration is inconsistent", async () => {
    const { code, stderr } = await execFileAsync(
      process.execPath,
      ["--experimental-strip-types", "scripts/migrate.ts"],
      { cwd: REPO_ROOT, env: { ...process.env, DATABASE_URL: testDatabaseUrl() } },
    ).then(
      () => ({ code: 0, stderr: "" }),
      (error: { code?: number; stderr?: string }) => ({
        code: error.code ?? 1,
        stderr: error.stderr ?? "",
      }),
    );

    expect(code).toBe(1);
    expect(stderr).toContain("checksum mismatch");
  });
});
