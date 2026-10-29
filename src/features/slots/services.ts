import type { Pool } from "pg";
import { createPgPool } from "../../lib/db/pg.ts";
import { readDatabaseEnv } from "../../lib/config/database-env.ts";

/**
 * Ringkasan layanan yang dipakai alur booking. Durasi dan harga **selalu** dari
 * tabel `services`, tidak pernah dari payload klien (IDEA.md §8.7).
 */

export type ServiceSummary = {
  durationMinutes: number;
  totalIdr: number;
  serviceCount: number;
};

let pool: Pool | null = null;

export function bookingPool(): Pool {
  if (pool === null) {
    pool = createPgPool(readDatabaseEnv().DATABASE_URL, 5);
  }
  return pool;
}

/** `null` kalau ada id yang tidak dikenal atau layanannya tidak aktif. */
export async function loadServiceSummary(
  ids: string[],
  target: Pool = bookingPool(),
): Promise<ServiceSummary | null> {
  const result = await target.query<{
    duration_minutes: string;
    total_idr: string;
    matched: string;
    requested: string;
  }>(
    `WITH requested AS (SELECT DISTINCT unnest($1::uuid[]) AS id)
     SELECT COALESCE(sum(s.duration_minutes) FILTER (WHERE s.id IS NOT NULL), 0)::text AS duration_minutes,
            COALESCE(sum(s.price_idr) FILTER (WHERE s.id IS NOT NULL), 0)::text AS total_idr,
            count(s.id)::text AS matched,
            (SELECT count(*) FROM requested)::text AS requested
       FROM requested r
       LEFT JOIN public.services s ON s.id = r.id AND s.is_active`,
    [ids],
  );

  const row = result.rows[0];
  if (row === undefined || row.matched !== row.requested) {
    return null;
  }

  return {
    durationMinutes: Number(row.duration_minutes),
    totalIdr: Number(row.total_idr),
    serviceCount: Number(row.matched),
  };
}
