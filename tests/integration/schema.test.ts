import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { resetTestDb } from "../helpers/db.ts";
import { insertBarber, insertBooking, insertCustomer } from "../helpers/fixtures.ts";

const EXPECTED_TABLES = [
  "audit_log",
  "barbers",
  "blocked_slots",
  "booking_services",
  "bookings",
  "customers",
  "notifications",
  "payments",
  "services",
  "settings",
  "working_hours",
];

let pool: Pool;

beforeAll(async () => {
  pool = await resetTestDb();
});

afterAll(async () => {
  await pool.end();
});

describe("core schema", () => {
  it("creates every table from IDEA.md §6 in the public schema", async () => {
    const result = await pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
    );
    const tables = result.rows.map((row) => row.table_name);

    for (const expected of EXPECTED_TABLES) {
      expect(tables).toContain(expected);
    }
  });

  it("makes booking_range a stored generated column over [start, end)", async () => {
    const column = await pool.query<{ is_generated: string; generation_expression: string }>(
      `SELECT is_generated, generation_expression FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'booking_range'`,
    );

    expect(column.rows[0]?.is_generated).toBe("ALWAYS");
    expect(column.rows[0]?.generation_expression).toContain("tstzrange");
  });

  it("computes booking_range as a half-open range covering start but not end", async () => {
    const barberId = await insertBarber(pool);
    const customerId = await insertCustomer(pool);
    const startIso = "2026-11-02T10:00:00+07:00";
    const booking = await insertBooking(pool, {
      barberId,
      customerId,
      startIso,
      durationMinutes: 45,
      bufferMinutes: 10,
    });

    // Dibandingkan sebagai instant, bukan sebagai teks: representasi teks
    // tstzrange ikut TimeZone sesi Postgres.
    const range = await pool.query<{
      contains_start: boolean;
      contains_end: boolean;
      lower_is_start: boolean;
      upper_is_end: boolean;
    }>(
      `SELECT booking_range @> $2::timestamptz AS contains_start,
              booking_range @> ($2::timestamptz + make_interval(mins => 55)) AS contains_end,
              lower(booking_range) = $2::timestamptz AS lower_is_start,
              upper(booking_range) = ($2::timestamptz + make_interval(mins => 55)) AS upper_is_end
       FROM public.bookings WHERE id = $1`,
      [booking.id, startIso],
    );

    expect(range.rows[0]).toEqual({
      contains_start: true,
      contains_end: false,
      lower_is_start: true,
      upper_is_end: true,
    });
    expect(booking.endTime.getTime() - booking.startTime.getTime()).toBe(55 * 60 * 1000);
  });

  it("enforces the remaining balance invariant (total - dp, floored at 0)", async () => {
    const barberId = await insertBarber(pool);
    const customerId = await insertCustomer(pool);
    const booking = await insertBooking(pool, {
      barberId,
      customerId,
      startIso: "2026-11-03T10:00:00+07:00",
      totalIdr: 65000,
      dpIdr: 20000,
    });

    const row = await pool.query<{ remaining_idr: number }>(
      "SELECT remaining_idr FROM public.bookings WHERE id = $1",
      [booking.id],
    );

    expect(row.rows[0]?.remaining_idr).toBe(45000);
  });

  it("rejects a booking whose end_time is not after start_time", async () => {
    const barberId = await insertBarber(pool);
    const customerId = await insertCustomer(pool);

    // Ditolak oleh kolom generated booking_range ("range lower bound must be
    // less than upper bound") atau CHECK chk_booking_time_order — keduanya
    // pertahanan sah; yang penting baris tidak masuk.
    await expect(
      pool.query(
        `INSERT INTO public.bookings
           (booking_code, customer_id, barber_id, start_time, end_time,
            service_duration_minutes, total_idr, dp_idr, remaining_idr)
         VALUES ('DMZ-BAD-ORDER', $1, $2, '2026-11-04T10:00:00+07:00', '2026-11-04T09:00:00+07:00',
                 45, 50000, 20000, 30000)`,
        [customerId, barberId],
      ),
    ).rejects.toThrow(/chk_booking_time_order|range lower bound must be less/i);

    const stored = await pool.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM public.bookings WHERE booking_code = 'DMZ-BAD-ORDER'",
    );
    expect(stored.rows[0]?.count).toBe("0");
  });

  it("keeps payments unique per idempotency key", async () => {
    const constraint = await pool.query<{ conname: string }>(
      `SELECT conname FROM pg_constraint
       WHERE conrelid = 'public.payments'::regclass AND contype = 'u'`,
    );
    const definitions = await pool.query<{ definition: string }>(
      `SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint
       WHERE conrelid = 'public.payments'::regclass AND contype = 'u'`,
    );

    expect(constraint.rows.length).toBeGreaterThan(0);
    expect(definitions.rows.some((row) => row.definition.includes("idempotency_key"))).toBe(true);
  });

  it("enables row level security on every sensitive table", async () => {
    const result = await pool.query<{ relname: string }>(
      `SELECT relname FROM pg_class
       WHERE relnamespace = 'public'::regnamespace AND relrowsecurity = true
       ORDER BY relname`,
    );
    const tables = result.rows.map((row) => row.relname);

    for (const table of ["bookings", "payments", "customers", "audit_log", "settings", "notifications"]) {
      expect(tables).toContain(table);
    }
  });
});
