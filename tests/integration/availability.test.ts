import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { resetTestDb } from "../helpers/db.ts";
import { seed } from "../../scripts/seed.ts";
import { insertBooking, insertCustomer } from "../helpers/fixtures.ts";
import { findAvailability } from "../../src/features/slots/availability.ts";

/**
 * Diuji terhadap Postgres nyata dengan seed asli (R0.9): 3 barber, jam
 * 10:00–21:00, istirahat bergilir 12/13/14 dan 18/19/20, hari off Minggu/Senin/Selasa.
 *
 * 2026-11-02 adalah Senin (dow 1) → Dimas libur, Rian (kursi 1) dan Kevin (kursi 3) masuk.
 */
const MONDAY = "2026-11-02";

let pool: Pool;

beforeAll(async () => {
  pool = await resetTestDb();
  await seed(pool);
});

afterAll(async () => {
  await pool.end();
});

function startsOf(slots: string[]): number[] {
  return slots.map((slot) => Number(slot.slice(11, 13)) * 60 + Number(slot.slice(14, 16)));
}

function byName(days: { fullName: string; slots: string[] }[], name: string): number[] {
  const found = days.find((day) => day.fullName === name);
  if (found === undefined) {
    throw new Error(`${name} tidak ada di hasil ketersediaan`);
  }
  return startsOf(found.slots);
}

describe("findAvailability", () => {
  it("returns only the barbers who work that day, with slots on the 15-minute grid", async () => {
    const days = await findAvailability(pool, { dateJakarta: MONDAY, durationMinutes: 45 }, new Date("2026-11-01T02:00:00Z"));

    expect(days.map((day) => day.fullName)).toEqual(["Rian Pratama", "Kevin Sanjaya"]);
    expect(days.map((day) => day.chairNumber)).toEqual([1, 3]);
    expect(startsOf(days[0]?.slots as string[])[0]).toBe(600);
  });

  it("keeps the staggered breaks of each chair free", async () => {
    const days = await findAvailability(pool, { dateJakarta: MONDAY, durationMinutes: 45 }, new Date("2026-11-01T02:00:00Z"));

    const rian = byName(days, "Rian Pratama");
    // istirahat 12:00–12:55 → 45 menit layanan + 10 menit buffer tidak boleh masuk
    expect(rian).not.toContain(11 * 60 + 15);
    expect(rian).not.toContain(12 * 60);
    expect(rian).not.toContain(12 * 60 + 45);
    expect(rian).toContain(11 * 60);
    expect(rian).toContain(13 * 60);

    const kevin = byName(days, "Kevin Sanjaya");
    // istirahat 14:00–14:55
    expect(kevin).not.toContain(13 * 60 + 15);
    expect(kevin).not.toContain(14 * 60);
    expect(kevin).toContain(13 * 60);
    expect(kevin).toContain(15 * 60);
  });

  it("drops a slot once a real booking occupies it", async () => {
    const barber = await pool.query<{ id: string }>(
      "SELECT id FROM public.barbers WHERE full_name = 'Rian Pratama'",
    );
    const customerId = await insertCustomer(pool);
    await insertBooking(pool, {
      barberId: (barber.rows[0] as { id: string }).id,
      customerId,
      startIso: `${MONDAY}T10:00:00+07:00`,
      durationMinutes: 45,
      bufferMinutes: 10,
      status: "confirmed",
    });

    const days = await findAvailability(pool, { dateJakarta: MONDAY, durationMinutes: 45 }, new Date("2026-11-01T02:00:00Z"));
    const rian = byName(days, "Rian Pratama");

    expect(rian).not.toContain(10 * 60);
    expect(rian).not.toContain(10 * 60 + 30);
    expect(rian).toContain(11 * 60);
  });

  it("honours the 30-minute lead time when the day is today", async () => {
    // 2026-11-02T02:45:00Z = 09:45 WIB
    const days = await findAvailability(
      pool,
      { dateJakarta: MONDAY, durationMinutes: 45 },
      new Date("2026-11-02T02:45:00Z"),
    );

    expect(byName(days, "Kevin Sanjaya")[0]).toBe(10 * 60 + 15);
  });

  it("offers nothing once the day is over", async () => {
    // 2026-11-02T15:00:00Z = 22:00 WIB
    const days = await findAvailability(
      pool,
      { dateJakarta: MONDAY, durationMinutes: 45 },
      new Date("2026-11-02T15:00:00Z"),
    );

    expect(days.map((day) => day.slots)).toEqual([[], []]);
  });

  it("can be narrowed to one barber", async () => {
    const barber = await pool.query<{ id: string }>(
      "SELECT id FROM public.barbers WHERE full_name = 'Kevin Sanjaya'",
    );

    const days = await findAvailability(
      pool,
      { dateJakarta: MONDAY, durationMinutes: 45, barberId: (barber.rows[0] as { id: string }).id },
      new Date("2026-11-01T02:00:00Z"),
    );

    expect(days).toHaveLength(1);
    expect(days[0]?.fullName).toBe("Kevin Sanjaya");
  });

  it("returns nothing when the requested barber is off that day", async () => {
    const barber = await pool.query<{ id: string }>(
      "SELECT id FROM public.barbers WHERE full_name = 'Dimas Arisandi'",
    );

    const days = await findAvailability(
      pool,
      { dateJakarta: MONDAY, durationMinutes: 45, barberId: (barber.rows[0] as { id: string }).id },
      new Date("2026-11-01T02:00:00Z"),
    );

    expect(days).toEqual([]);
  });

  it("offers fewer slots for a longer service", async () => {
    const short = await findAvailability(pool, { dateJakarta: MONDAY, durationMinutes: 30 }, new Date("2026-11-01T02:00:00Z"));
    const long = await findAvailability(pool, { dateJakarta: MONDAY, durationMinutes: 60 }, new Date("2026-11-01T02:00:00Z"));

    expect((long[0]?.slots.length ?? 0)).toBeLessThan(short[0]?.slots.length ?? 0);
  });
});
