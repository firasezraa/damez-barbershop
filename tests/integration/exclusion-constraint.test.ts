import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { resetTestDb } from "../helpers/db.ts";
import { insertBarber, insertBooking, insertCustomer } from "../helpers/fixtures.ts";

const FIRST_SLOT = "2026-11-02T10:00:00+07:00";
const OVERLAPPING_SLOT = "2026-11-02T10:30:00+07:00";
const NEXT_SLOT = "2026-11-02T11:00:00+07:00";

let pool: Pool;

beforeAll(async () => {
  pool = await resetTestDb();
});

afterAll(async () => {
  await pool.end();
});

describe("no_overlapping_active_bookings (GiST exclusion)", () => {
  it("rejects a second active booking that overlaps the same barber", async () => {
    const barberId = await insertBarber(pool);
    const customerId = await insertCustomer(pool);
    await insertBooking(pool, { barberId, customerId, startIso: FIRST_SLOT });

    const conflict = await insertBooking(pool, {
      barberId,
      customerId,
      startIso: OVERLAPPING_SLOT,
    }).then(
      () => null,
      (error: { code?: string }) => error,
    );

    expect(conflict?.code).toBe("23P01");
  });

  it("allows the same time range for a different barber", async () => {
    const firstBarber = await insertBarber(pool, { chair: 1 });
    const secondBarber = await insertBarber(pool, { chair: 2 });
    const customerId = await insertCustomer(pool);

    await insertBooking(pool, { barberId: firstBarber, customerId, startIso: FIRST_SLOT });
    await insertBooking(pool, { barberId: secondBarber, customerId, startIso: FIRST_SLOT });

    const count = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM public.bookings
       WHERE barber_id = ANY($1::uuid[]) AND status = 'pending_payment'`,
      [[firstBarber, secondBarber]],
    );

    expect(count.rows[0]?.count).toBe("2");
  });

  it("allows back-to-back bookings because the buffer sits inside end_time", async () => {
    const barberId = await insertBarber(pool);
    const customerId = await insertCustomer(pool);

    const first = await insertBooking(pool, {
      barberId,
      customerId,
      startIso: FIRST_SLOT,
      durationMinutes: 45,
      bufferMinutes: 10,
    });
    const second = await insertBooking(pool, {
      barberId,
      customerId,
      startIso: NEXT_SLOT,
    });

    expect(first.endTime.toISOString()).toBe("2026-11-02T03:55:00.000Z");
    expect(second.id).not.toBe(first.id);
  });

  it("lets a cancelled booking overlap an active one", async () => {
    const barberId = await insertBarber(pool);
    const customerId = await insertCustomer(pool);

    await insertBooking(pool, { barberId, customerId, startIso: FIRST_SLOT, status: "cancelled" });
    const active = await insertBooking(pool, { barberId, customerId, startIso: FIRST_SLOT });

    expect(active.id).toBeTruthy();
  });

  it("does not block an in_progress booking from claiming the same slot", async () => {
    const barberId = await insertBarber(pool);
    const customerId = await insertCustomer(pool);

    await insertBooking(pool, { barberId, customerId, startIso: FIRST_SLOT, status: "in_progress" });

    const conflict = await insertBooking(pool, {
      barberId,
      customerId,
      startIso: OVERLAPPING_SLOT,
    }).then(
      () => null,
      (error: { code?: string }) => error,
    );

    expect(conflict?.code).toBe("23P01");
  });
});
