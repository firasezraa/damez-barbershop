import { describe, expect, it } from "vitest";
import { createPgPool } from "../../src/lib/db/pg.ts";
import { testDatabaseUrl } from "../helpers/db.ts";

/**
 * VPS pengembangan ini berzona Asia/Shanghai dan runner GitHub Actions berzona
 * UTC. Tanpa TimeZone yang dipin per koneksi, `date_trunc('day', ...)` menghasilkan
 * batas hari yang berbeda antara mesin dan CI — jenis bug yang muncul hanya pada
 * laporan harian/rekap kas (R4), bukan pada test biasa.
 */
describe("zona waktu sesi", () => {
  it("memin setiap koneksi pool ke Asia/Jakarta", async () => {
    const pool = createPgPool(testDatabaseUrl(), 2);

    try {
      // Dua query paralel untuk membuktikan setelannya per koneksi, bukan sekali di awal.
      const [first, second] = await Promise.all([
        pool.query<{ TimeZone: string }>("SHOW TimeZone"),
        pool.query<{ TimeZone: string }>("SHOW TimeZone"),
      ]);

      expect(first.rows[0]?.TimeZone).toBe("Asia/Jakarta");
      expect(second.rows[0]?.TimeZone).toBe("Asia/Jakarta");
    } finally {
      await pool.end();
    }
  });

  it("menghitung awal hari menurut Jakarta, bukan zona mesin", async () => {
    const pool = createPgPool(testDatabaseUrl(), 2);

    try {
      const result = await pool.query<{ same: boolean }>(
        `SELECT date_trunc('day', now())
                = (date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta')
                AS same`,
      );

      expect(result.rows[0]?.same).toBe(true);
    } finally {
      await pool.end();
    }
  });
});
