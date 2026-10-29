import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { resetTestDb } from "../helpers/db.ts";
import { insertBarber, insertService, uniquePhone } from "../helpers/fixtures.ts";

type HoldResult = {
  success: boolean;
  booking_id?: string;
  booking_code?: string;
  hold_expires_at?: string;
  total_idr?: number;
  dp_idr?: number;
  remaining_idr?: number;
  error?: string;
  message?: string;
};

const SLOT_START = "2026-11-02T10:00:00+07:00";

let pool: Pool;

beforeAll(async () => {
  pool = await resetTestDb();
});

afterAll(async () => {
  await pool.end();
});

async function createHold(
  target: Pool,
  input: {
    fullName?: string;
    phone?: string;
    barberId: string;
    startIso?: string;
    serviceIds: string[];
  },
): Promise<HoldResult> {
  const result = await target.query<{ result: HoldResult }>(
    `SELECT public.fn_create_booking_hold($1, $2, $3, $4::timestamptz, $5::uuid[], $6::public.booking_type_enum, $7) AS result`,
    [
      input.fullName ?? "Pelanggan Test",
      input.phone ?? uniquePhone(),
      input.barberId,
      input.startIso ?? SLOT_START,
      input.serviceIds,
      "online",
      null,
    ],
  );

  return (result.rows[0] as { result: HoldResult }).result;
}

async function holdTtlSeconds(bookingId: string): Promise<number> {
  const result = await pool.query<{ ttl: string }>(
    `SELECT round(extract(epoch from (hold_expires_at - created_at)))::text AS ttl
     FROM public.bookings WHERE id = $1`,
    [bookingId],
  );
  return Number((result.rows[0] as { ttl: string }).ttl);
}

describe("fn_create_booking_hold", () => {
  it("locks the slot for exactly 15 minutes from creation", async () => {
    const barberId = await insertBarber(pool);
    const serviceId = await insertService(pool);

    const hold = await createHold(pool, { barberId, serviceIds: [serviceId] });

    expect(hold.success).toBe(true);
    expect(await holdTtlSeconds(hold.booking_id as string)).toBe(900);
  });

  it("prices the booking from the services table, never from the caller", async () => {
    const barberId = await insertBarber(pool);
    const first = await insertService(pool, { durationMinutes: 45, priceIdr: 50000 });
    const second = await insertService(pool, { durationMinutes: 35, priceIdr: 45000 });

    const hold = await createHold(pool, { barberId, serviceIds: [first, second] });

    expect(hold.total_idr).toBe(95000);
    expect(hold.dp_idr).toBe(20000);
    expect(hold.remaining_idr).toBe(75000);

    const stored = await pool.query<{ service_duration_minutes: number; end_time: Date; start_time: Date }>(
      "SELECT service_duration_minutes, start_time, end_time FROM public.bookings WHERE id = $1",
      [hold.booking_id],
    );
    expect(stored.rows[0]?.service_duration_minutes).toBe(80);
    const row = stored.rows[0] as { start_time: Date; end_time: Date };
    expect(row.end_time.getTime() - row.start_time.getTime()).toBe((80 + 10) * 60 * 1000);
  });

  it("lets exactly one of 20 concurrent requests hold the same slot", async () => {
    const barberId = await insertBarber(pool);
    const serviceId = await insertService(pool);

    const attempts = await Promise.all(
      Array.from({ length: 20 }, () =>
        createHold(pool, { barberId, serviceIds: [serviceId] }).catch(
          (error: { code?: string; message?: string }) => ({
            success: false,
            error: (error.code ?? "THROWN") as string,
            message: error.message,
          }),
        ),
      ),
    );

    const winners = attempts.filter((attempt) => attempt.success);
    expect(winners).toHaveLength(1);

    const losers = attempts.filter((attempt) => !attempt.success);
    for (const loser of losers) {
      expect(["SLOT_TAKEN", "23P01"]).toContain(loser.error);
    }

    const active = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM public.bookings
       WHERE barber_id = $1 AND status = 'pending_payment'`,
      [barberId],
    );
    expect(active.rows[0]?.count).toBe("1");
  });

  it("refuses a third unpaid hold from the same phone number", async () => {
    const barberId = await insertBarber(pool);
    const serviceId = await insertService(pool);
    const phone = uniquePhone();

    const first = await createHold(pool, { barberId, serviceIds: [serviceId], phone });
    const second = await createHold(pool, {
      barberId,
      serviceIds: [serviceId],
      phone,
      startIso: "2026-11-02T12:00:00+07:00",
    });
    const third = await createHold(pool, {
      barberId,
      serviceIds: [serviceId],
      phone,
      startIso: "2026-11-02T15:00:00+07:00",
    });

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(third.success).toBe(false);
    expect(third.error).toBe("MAX_ACTIVE_HOLDS_EXCEEDED");
  });

  it("rejects unknown service ids instead of trusting the payload", async () => {
    const barberId = await insertBarber(pool);

    const hold = await createHold(pool, {
      barberId,
      serviceIds: ["00000000-0000-0000-0000-000000000000"],
    });

    expect(hold.success).toBe(false);
    expect(hold.error).toBe("INVALID_SERVICE");
  });

  it("rejects an inactive barber", async () => {
    const barberId = await insertBarber(pool, { isActive: false });
    const serviceId = await insertService(pool);

    const hold = await createHold(pool, { barberId, serviceIds: [serviceId] });

    expect(hold.success).toBe(false);
    expect(hold.error).toBe("BARBER_NOT_FOUND");
  });

  it("exposes no price or end-time parameter to the caller", async () => {
    const signature = await pool.query<{ nargs: number; names: string[] }>(
      `SELECT pronargs AS nargs, proargnames AS names FROM pg_proc
       WHERE proname = 'fn_create_booking_hold' AND pronamespace = 'public'::regnamespace`,
    );

    expect(signature.rows[0]?.nargs).toBe(7);
    const names = signature.rows[0]?.names ?? [];
    for (const forbidden of ["total", "price", "end_time", "dp"]) {
      expect(names.some((name) => name.includes(forbidden))).toBe(false);
    }
  });
});

describe("fn_expire_stale_holds", () => {
  it("expires an unpaid hold once, then frees the slot", async () => {
    const barberId = await insertBarber(pool);
    const serviceId = await insertService(pool);
    const hold = await createHold(pool, { barberId, serviceIds: [serviceId] });

    await pool.query(
      "UPDATE public.bookings SET hold_expires_at = now() - interval '1 second' WHERE id = $1",
      [hold.booking_id],
    );

    const firstRun = await pool.query<{ expired: number }>(
      "SELECT public.fn_expire_stale_holds() AS expired",
    );
    const secondRun = await pool.query<{ expired: number }>(
      "SELECT public.fn_expire_stale_holds() AS expired",
    );

    expect(firstRun.rows[0]?.expired).toBe(1);
    expect(secondRun.rows[0]?.expired).toBe(0);

    const status = await pool.query<{ status: string }>(
      "SELECT status::text AS status FROM public.bookings WHERE id = $1",
      [hold.booking_id],
    );
    expect(status.rows[0]?.status).toBe("expired");

    const rehold = await createHold(pool, { barberId, serviceIds: [serviceId] });
    expect(rehold.success).toBe(true);
  });
});

describe("fn_hold_is_active", () => {
  it("reports true only for an unexpired pending_payment booking", async () => {
    const barberId = await insertBarber(pool);
    const serviceId = await insertService(pool);
    const hold = await createHold(pool, { barberId, serviceIds: [serviceId] });

    const before = await pool.query<{ active: boolean }>(
      "SELECT public.fn_hold_is_active($1) AS active",
      [hold.booking_id],
    );
    await pool.query(
      "UPDATE public.bookings SET hold_expires_at = now() - interval '1 second' WHERE id = $1",
      [hold.booking_id],
    );
    const after = await pool.query<{ active: boolean }>(
      "SELECT public.fn_hold_is_active($1) AS active",
      [hold.booking_id],
    );

    expect(before.rows[0]?.active).toBe(true);
    expect(after.rows[0]?.active).toBe(false);
  });
});
