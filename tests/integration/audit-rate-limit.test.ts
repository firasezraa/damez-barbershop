import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { resetTestDb } from "../helpers/db.ts";

const RATE_KEY = "ip:203.0.113.7:hold";

let pool: Pool;

beforeAll(async () => {
  pool = await resetTestDb();
});

afterAll(async () => {
  await pool.end();
});

async function writeAudit(action: string): Promise<void> {
  await pool.query("SELECT public.fn_write_audit($1, $2, $3, $4, $5, $6, $7)", [
    null,
    "system",
    action,
    "bookings",
    "1",
    null,
    JSON.stringify({ status: "confirmed" }),
  ]);
}

async function rateLimitHit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const result = await pool.query<{ allowed: boolean }>(
    "SELECT public.fn_rate_limit_hit($1, $2, $3) AS allowed",
    [key, limit, windowSeconds],
  );
  return (result.rows[0] as { allowed: boolean }).allowed;
}

describe("audit_log", () => {
  it("accepts inserts through fn_write_audit", async () => {
    await writeAudit("booking.status_changed");

    const result = await pool.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM public.audit_log WHERE action = 'booking.status_changed'",
    );
    expect(result.rows[0]?.count).toBe("1");
  });

  it("refuses updates: append-only", async () => {
    await writeAudit("booking.updated");

    await expect(
      pool.query("UPDATE public.audit_log SET action = 'tampered' WHERE action = 'booking.updated'"),
    ).rejects.toThrow(/append-only/);
  });

  it("refuses deletes: append-only", async () => {
    await writeAudit("booking.deleted");

    await expect(
      pool.query("DELETE FROM public.audit_log WHERE action = 'booking.deleted'"),
    ).rejects.toThrow(/append-only/);
  });
});

describe("fn_rate_limit_hit", () => {
  it("allows up to the limit inside one window, then blocks", async () => {
    const results = [
      await rateLimitHit(RATE_KEY, 3, 60),
      await rateLimitHit(RATE_KEY, 3, 60),
      await rateLimitHit(RATE_KEY, 3, 60),
      await rateLimitHit(RATE_KEY, 3, 60),
    ];

    expect(results).toEqual([true, true, true, false]);
  });

  it("starts a fresh window and rewinds hits once the window expired", async () => {
    await rateLimitHit(RATE_KEY, 3, 60);
    await rateLimitHit(RATE_KEY, 3, 60);

    await pool.query(
      "UPDATE public.rate_limits SET window_expires_at = now() - interval '1 second' WHERE key = $1",
      [RATE_KEY],
    );

    const allowed = await rateLimitHit(RATE_KEY, 3, 60);
    const row = await pool.query<{ hits: number }>(
      "SELECT hits FROM public.rate_limits WHERE key = $1",
      [RATE_KEY],
    );

    expect(allowed).toBe(true);
    expect(row.rows[0]?.hits).toBe(1);
  });

  it("stays atomic under 20 parallel hits with limit 5", async () => {
    const key = `${RATE_KEY}:parallel`;

    const results = await Promise.all(
      Array.from({ length: 20 }, () => rateLimitHit(key, 5, 60)),
    );

    expect(results.filter(Boolean)).toHaveLength(5);
    const row = await pool.query<{ hits: number }>(
      "SELECT hits FROM public.rate_limits WHERE key = $1",
      [key],
    );
    expect(row.rows[0]?.hits).toBe(20);
  });
});
