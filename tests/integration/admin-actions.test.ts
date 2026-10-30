import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { resetTestDb } from "../helpers/db.ts";
import { seed } from "../../scripts/seed.ts";
import { insertBarber, insertBooking, insertCustomer, insertService } from "../helpers/fixtures.ts";

/**
 * Aksi kasir (IDEA.md §6, §11 R4). Semua mutasi status dan kas lewat fungsi
 * database supaya transisi tidak bisa dilewati dari klien dan setiap perubahan
 * meninggalkan jejak di `audit_log` (append-only).
 */
let pool: Pool;
let barberId: string;
let serviceId: string;

type AdminResult = { success: boolean; error?: string; status?: string };

beforeAll(async () => {
  pool = await resetTestDb();
  await seed(pool);

  const barber = await pool.query<{ id: string }>(
    "SELECT id FROM public.barbers WHERE full_name = 'Rian Pratama'",
  );
  barberId = (barber.rows[0] as { id: string }).id;
  const service = await pool.query<{ id: string }>(
    "SELECT id FROM public.services WHERE service_code = 'SRV-01'",
  );
  serviceId = (service.rows[0] as { id: string }).id;
});

afterAll(async () => {
  await pool.end();
});

async function setStatus(
  bookingId: string,
  next: string,
  actorRole = "cashier",
): Promise<AdminResult> {
  const result = await pool.query<{ result: AdminResult }>(
    "SELECT public.fn_admin_set_booking_status($1, $2::public.booking_status_enum, $3, $4, $5) AS result",
    [bookingId, next, actorRole, null, "aksi kasir uji"],
  );
  return (result.rows[0] as { result: AdminResult }).result;
}

async function settle(bookingId: string, method = "cash", actorRole = "cashier"): Promise<AdminResult> {
  const result = await pool.query<{ result: AdminResult }>(
    "SELECT public.fn_admin_settle_booking($1, $2, $3, $4) AS result",
    [bookingId, method, actorRole, null],
  );
  return (result.rows[0] as { result: AdminResult }).result;
}

async function confirmedBookingAt(startIso: string, status = "confirmed"): Promise<string> {
  const customerId = await insertCustomer(pool);
  const booking = await insertBooking(pool, {
    barberId,
    customerId,
    startIso,
    durationMinutes: 45,
    bufferMinutes: 10,
    status,
  });
  return booking.id;
}

describe("fn_admin_set_booking_status", () => {
  it("walks confirmed to in_progress to completed", async () => {
    const bookingId = await confirmedBookingAt("2026-11-02T10:00:00+07:00");

    expect(await setStatus(bookingId, "in_progress")).toMatchObject({ success: true, status: "in_progress" });
    expect(await setStatus(bookingId, "completed")).toMatchObject({ success: true, status: "completed" });
  });

  it("refuses to skip steps and never resurrects a finished booking", async () => {
    const bookingId = await confirmedBookingAt("2026-11-02T11:00:00+07:00");

    expect(await setStatus(bookingId, "completed")).toMatchObject({ success: false, error: "INVALID_TRANSITION" });
    await setStatus(bookingId, "in_progress");
    await setStatus(bookingId, "completed");
    expect(await setStatus(bookingId, "in_progress")).toMatchObject({
      success: false,
      error: "INVALID_TRANSITION",
    });
  });

  it("lets a cashier release a late chair as no_show, but not one still unpaid", async () => {
    const late = await confirmedBookingAt("2026-11-02T12:00:00+07:00");
    const unpaid = await confirmedBookingAt("2026-11-02T13:00:00+07:00", "pending_payment");

    expect(await setStatus(late, "no_show")).toMatchObject({ success: false, error: "INVALID_TRANSITION" });
    await setStatus(late, "in_progress");
    expect(await setStatus(late, "no_show")).toMatchObject({ success: true, status: "no_show" });
    expect(await setStatus(unpaid, "no_show")).toMatchObject({ success: false, error: "INVALID_TRANSITION" });
  });

  it("rejects an unknown booking and an unknown actor role", async () => {
    expect(
      await setStatus("00000000-0000-0000-0000-000000000000", "in_progress"),
    ).toMatchObject({ success: false, error: "BOOKING_NOT_FOUND" });

    const bookingId = await confirmedBookingAt("2026-11-02T14:00:00+07:00");
    expect(await setStatus(bookingId, "in_progress", "robot")).toMatchObject({
      success: false,
      error: "INVALID_ACTOR_ROLE",
    });
  });

  it("leaves an audit trail with before and after", async () => {
    const bookingId = await confirmedBookingAt("2026-11-02T15:00:00+07:00");
    await setStatus(bookingId, "in_progress");

    const audit = await pool.query<{ action: string; actor_role: string; before: { status: string }; after: { status: string } }>(
      `SELECT action, actor_role, before, after FROM public.audit_log
        WHERE action = 'booking.status_changed' AND entity_id = $1`,
      [bookingId],
    );

    expect(audit.rows[0]?.actor_role).toBe("cashier");
    expect(audit.rows[0]?.before).toEqual({ status: "confirmed" });
    expect(audit.rows[0]?.after).toEqual({ status: "in_progress", reason: "aksi kasir uji" });
  });
});

describe("fn_admin_settle_booking", () => {
  it("records the cash payment for the remaining amount and closes the booking", async () => {
    const bookingId = await confirmedBookingAt("2026-11-02T16:00:00+07:00");
    await setStatus(bookingId, "in_progress");

    const result = await settle(bookingId, "cash");
    expect(result).toMatchObject({ success: true, status: "completed" });

    const booking = await pool.query<{ status: string; remaining_idr: number }>(
      "SELECT status::text AS status, remaining_idr FROM public.bookings WHERE id = $1",
      [bookingId],
    );
    // remaining_idr adalah snapshot (total - DP) yang dijaga chk_booking_remaining;
    // uang yang benar-benar masuk dicatat di tabel payments.
    expect(booking.rows[0]).toEqual({ status: "completed", remaining_idr: 30000 });

    const payments = await pool.query<{ amount_idr: number; method: string; status: string }>(
      "SELECT amount_idr, method, status::text AS status FROM public.payments WHERE booking_id = $1",
      [bookingId],
    );
    expect(payments.rows).toEqual([{ amount_idr: 30000, method: "cash", status: "paid" }]);
  });

  it("refuses to settle twice", async () => {
    const bookingId = await confirmedBookingAt("2026-11-02T17:00:00+07:00");
    await setStatus(bookingId, "in_progress");
    expect(await settle(bookingId)).toMatchObject({ success: true });

    expect(await settle(bookingId)).toMatchObject({ success: false, error: "ALREADY_SETTLED" });
  });

  it("refuses to settle a booking whose DP was never paid", async () => {
    const unpaid = await confirmedBookingAt("2026-11-02T18:00:00+07:00", "pending_payment");

    expect(await settle(unpaid)).toMatchObject({ success: false, error: "INVALID_STATE" });
  });

  it("rejects a payment method outside the allowed set", async () => {
    const bookingId = await confirmedBookingAt("2026-11-02T19:00:00+07:00");
    await setStatus(bookingId, "in_progress");

    expect(await settle(bookingId, "bitcoin")).toMatchObject({ success: false, error: "INVALID_METHOD" });
  });

  it("writes an audit row for the cash movement", async () => {
    const bookingId = await confirmedBookingAt("2026-11-03T10:00:00+07:00");
    await setStatus(bookingId, "in_progress");
    await settle(bookingId, "qris");

    const audit = await pool.query<{ action: string; after: { amountIdr: number; method: string } }>(
      "SELECT action, after FROM public.audit_log WHERE action = 'booking.settled' AND entity_id = $1",
      [bookingId],
    );
    expect(audit.rows[0]?.after).toEqual({ amountIdr: 30000, method: "qris" });
  });
});

describe("fn_admin_schedule_walk_in", () => {
  async function walkIn(startIso: string, barber = barberId): Promise<AdminResult & { bookingId?: string; bookingCode?: string }> {
    const result = await pool.query<{ result: AdminResult & { bookingId?: string; bookingCode?: string } }>(
      `SELECT public.fn_admin_schedule_walk_in($1, $2, $3, $4::timestamptz, $5::uuid[], $6, $7) AS result`,
      ["Tamu Walk In", "+6281200000000", barber, startIso, [serviceId], "cashier", null],
    );
    return (result.rows[0] as { result: AdminResult & { bookingId?: string; bookingCode?: string } }).result;
  }

  it("creates an immediately confirmed chair without a payment hold", async () => {
    const result = await walkIn("2026-11-04T10:00:00+07:00");

    expect(result).toMatchObject({ success: true });
    const booking = await pool.query<{ status: string; booking_type: string; hold_expires_at: Date | null; total_idr: number }>(
      "SELECT status::text AS status, booking_type::text AS booking_type, hold_expires_at, total_idr FROM public.bookings WHERE id = $1",
      [result.bookingId],
    );
    expect(booking.rows[0]?.status).toBe("confirmed");
    expect(booking.rows[0]?.booking_type).toBe("walk_in");
    expect(booking.rows[0]?.hold_expires_at).toBeNull();
    expect(booking.rows[0]?.total_idr).toBe(50000);
  });

  it("still refuses a chair that is already taken", async () => {
    const free = await walkIn("2026-11-04T11:00:00+07:00");
    expect(free).toMatchObject({ success: true });

    const clash = await walkIn("2026-11-04T11:30:00+07:00");
    expect(clash).toMatchObject({ success: false, error: "SLOT_TAKEN" });
  });

  it("prices from the catalogue and rejects unknown services", async () => {
    const unknown = await pool.query<{ result: AdminResult }>(
      `SELECT public.fn_admin_schedule_walk_in($1, $2, $3, $4::timestamptz, $5::uuid[], $6, $7) AS result`,
      [
        "Tamu Walk In",
        "+6281200000001",
        barberId,
        "2026-11-04T12:00:00+07:00",
        ["00000000-0000-0000-0000-000000000000"],
        "cashier",
        null,
      ],
    );

    expect((unknown.rows[0] as { result: AdminResult }).result).toMatchObject({
      success: false,
      error: "INVALID_SERVICE",
    });
  });

  it("audits the creation", async () => {
    const result = await walkIn("2026-11-04T13:00:00+07:00");

    const audit = await pool.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM public.audit_log WHERE action = 'booking.walk_in' AND entity_id = $1",
      [result.bookingId],
    );
    expect(audit.rows[0]?.count).toBe("1");
  });
});

describe("konsistensi dengan data seed", () => {
  it("keeps a walk-in priced with the same catalogue as the public flow", async () => {
    const extraBarber = await insertBarber(pool, { chair: 2 });
    const extraService = await insertService(pool, { durationMinutes: 30, priceIdr: 40000 });

    const result = await pool.query<{ result: { success: boolean; bookingId: string } }>(
      `SELECT public.fn_admin_schedule_walk_in($1, $2, $3, $4::timestamptz, $5::uuid[], $6, $7) AS result`,
      ["Tamu Dua Layanan", "+6281200000002", extraBarber, "2026-11-05T10:00:00+07:00", [serviceId, extraService], "owner", null],
    );

    const booking = await pool.query<{ total_idr: number; service_duration_minutes: number }>(
      "SELECT total_idr, service_duration_minutes FROM public.bookings WHERE id = $1",
      [result.rows[0]?.result.bookingId],
    );
    expect(booking.rows[0]).toEqual({ total_idr: 90000, service_duration_minutes: 75 });
  });
});