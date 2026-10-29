import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { resetTestDb } from "../helpers/db.ts";
import { seed } from "../../scripts/seed.ts";

let pool: Pool;

beforeAll(async () => {
  pool = await resetTestDb();
});

afterAll(async () => {
  await pool.end();
});

async function countRows(table: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM public.${table}`,
  );
  return Number((result.rows[0] as { count: string }).count);
}

describe("seed", () => {
  it("inserts the catalogue once", async () => {
    const result = await seed(pool);

    expect(result).toEqual({
      services: 8,
      barbers: 3,
      workingHours: 21,
      blockedSlots: 36,
    });
    expect(await countRows("services")).toBe(8);
    expect(await countRows("barbers")).toBe(3);
    expect(await countRows("working_hours")).toBe(21);
    expect(await countRows("blocked_slots")).toBe(36);
  });

  it("is idempotent: a second run adds no rows", async () => {
    const first = await seed(pool);
    const second = await seed(pool);

    expect(second).toEqual(first);
    expect(await countRows("services")).toBe(8);
    expect(await countRows("barbers")).toBe(3);
    expect(await countRows("working_hours")).toBe(21);
    expect(await countRows("blocked_slots")).toBe(36);
  });

  it("keeps the v1 prices and durations verbatim", async () => {
    const rows = await pool.query<{
      service_code: string;
      name: string;
      duration_minutes: number;
      price_idr: number;
    }>(
      `SELECT service_code, name, duration_minutes, price_idr FROM public.services
       WHERE service_code IN ('SRV-01', 'SRV-08') ORDER BY service_code`,
    );

    expect(rows.rows).toEqual([
      {
        service_code: "SRV-01",
        name: "Gentlemen Classic Haircut",
        duration_minutes: 45,
        price_idr: 50000,
      },
      {
        service_code: "SRV-08",
        name: "The Damez Signature Executive Combo",
        duration_minutes: 60,
        price_idr: 95000,
      },
    ]);
  });

  it("staggers the breaks so the three chairs never cool down together", async () => {
    const expected = [
      { chair: 1, name: "Rian Pratama", lunch: ["12:00:00", "12:55:00"], dinner: ["18:00:00", "18:55:00"] },
      { chair: 2, name: "Dimas Arisandi", lunch: ["13:00:00", "13:55:00"], dinner: ["19:00:00", "19:55:00"] },
      { chair: 3, name: "Kevin Sanjaya", lunch: ["14:00:00", "14:55:00"], dinner: ["20:00:00", "20:55:00"] },
    ];

    for (const row of expected) {
      const barber = await pool.query<{ id: string; full_name: string }>(
        "SELECT id, full_name FROM public.barbers WHERE chair_number = $1",
        [row.chair],
      );
      expect(barber.rows[0]?.full_name).toBe(row.name);
      const barberId = (barber.rows[0] as { id: string }).id;

      const breaks = await pool.query<{ start_time: string; end_time: string; days: string }>(
        `SELECT start_time::text AS start_time, end_time::text AS end_time, count(*)::text AS days
           FROM public.blocked_slots
          WHERE barber_id = $1 AND slot_type = 'recurring_break'
          GROUP BY start_time, end_time ORDER BY start_time`,
        [barberId],
      );

      expect(breaks.rows).toEqual([
        { start_time: row.lunch[0], end_time: row.lunch[1], days: "6" },
        { start_time: row.dinner[0], end_time: row.dinner[1], days: "6" },
      ]);
    }
  });

  it("marks exactly one day off per barber, matching the barbers table", async () => {
    const rows = await pool.query<{ full_name: string; day_off: number; off_days: number[] }>(
      `SELECT b.full_name,
              b.day_off,
              array_agg(w.day_of_week ORDER BY w.day_of_week) FILTER (WHERE w.is_day_off) AS off_days
         FROM public.barbers b
         JOIN public.working_hours w ON w.barber_id = b.id
        GROUP BY b.full_name, b.day_off, b.chair_number
        ORDER BY b.chair_number`,
    );

    expect(rows.rows).toEqual([
      { full_name: "Rian Pratama", day_off: 0, off_days: [0] },
      { full_name: "Dimas Arisandi", day_off: 1, off_days: [1] },
      { full_name: "Kevin Sanjaya", day_off: 2, off_days: [2] },
    ]);

    const breaksOnDayOff = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count
         FROM public.blocked_slots bs
         JOIN public.barbers b ON b.id = bs.barber_id
        WHERE bs.day_of_week = b.day_off`,
    );
    expect(breaksOnDayOff.rows[0]?.count).toBe("0");
  });

  it("stores the locked business rules in settings", async () => {
    const rows = await pool.query<{ key: string; value: unknown }>(
      `SELECT key, value FROM public.settings
        WHERE key IN ('dp_idr', 'hold_ttl_seconds', 'cancel_cutoff_hours', 'late_tolerance_minutes', 'timezone')`,
    );

    const settings = Object.fromEntries(rows.rows.map((row) => [row.key, row.value]));
    expect(settings).toEqual({
      dp_idr: 20000,
      hold_ttl_seconds: 900,
      cancel_cutoff_hours: 3,
      late_tolerance_minutes: 15,
      timezone: "Asia/Jakarta",
    });
  });
});
