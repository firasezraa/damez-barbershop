import type { Pool } from "pg";
import { bookingPool } from "./services.ts";

/**
 * Worker pelepasan hold kedaluwarsa. Logikanya ada di Postgres
 * (`fn_expire_stale_holds`) supaya atomik: satu UPDATE, idempoten, dan tidak
 * bergantung pada proses Node mana yang menjalankannya.
 */
export async function expireStaleHolds(target: Pool = bookingPool()): Promise<number> {
  const result = await target.query<{ expired: number }>("SELECT public.fn_expire_stale_holds() AS expired");
  return Number((result.rows[0] as { expired: number }).expired);
}
