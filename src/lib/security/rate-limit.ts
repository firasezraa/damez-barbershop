import type { Pool } from "pg";
import { createPgPool } from "../db/pg.ts";
import { readDatabaseEnv } from "../config/database-env.ts";

/**
 * Pembatas laju persisten (IDEA.md §8.6). v1 memakai `Map` di memori, yang di
 * Vercel serverless tidak pernah berlaku lintas instance. Di sini hitungannya
 * disimpan di Postgres lewat `fn_rate_limit_hit` — satu statement upsert, jadi
 * tidak ada read-modify-write yang bisa balapan.
 */

export type RateLimitRule = {
  /** Nama aturan; ikut menjadi awalan kunci supaya aturan tidak saling menimpa. */
  name: string;
  limit: number;
  windowSeconds: number;
};

export function createRateLimiter(rule: RateLimitRule): (clientKey: string) => Promise<boolean> {
  let pool: Pool | null = null;

  function getPool(): Pool {
    if (pool === null) {
      pool = createPgPool(readDatabaseEnv().DATABASE_URL, 2);
    }
    return pool;
  }

  return async (clientKey: string): Promise<boolean> => {
    const result = await getPool().query<{ allowed: boolean }>(
      "SELECT public.fn_rate_limit_hit($1, $2, $3) AS allowed",
      [`${rule.name}:${clientKey}`, rule.limit, rule.windowSeconds],
    );

    return (result.rows[0] as { allowed: boolean }).allowed;
  };
}

/** Kunci pembatas dari header proxy, bukan dari body yang bisa dipalsukan. */
export function clientKeyFrom(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded !== null && forwarded.length > 0) {
    const [first] = forwarded.split(",");
    return (first ?? "unknown").trim();
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}
