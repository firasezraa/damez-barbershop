import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";
import { resetTestDb, testDatabaseUrl } from "../helpers/db.ts";
import { seed } from "../../scripts/seed.ts";
import { buildDailyReport } from "../../src/features/admin/report.ts";
import { insertBooking, insertCustomer } from "../helpers/fixtures.ts";
import { scheduleWalkIn, settleBooking, setBookingStatus } from "../../src/features/admin/actions.ts";
import { jakartaDateString } from "../../src/lib/time/jakarta.ts";

/**
 * Rekap kas diuji terhadap Postgres nyata. Yang dijaga: angka di CSV sama dengan
 * angka di ringkasan layar (satu sumber), DP dan kas tunai dihitung terpisah,
 * dan route CSV hanya bisa dibuka owner.
 */
const actor = { role: "owner" as string | null };

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: async (
    _request: Request,
    _deps: unknown,
    allowedRoles: readonly string[] = ["owner", "cashier", "barber"],
  ) => {
    if (actor.role === null) {
      return { ok: false, status: 401, body: { error: "UNAUTHENTICATED", message: "Tidak ada sesi." } };
    }
    if (!allowedRoles.includes(actor.role)) {
      return { ok: false, status: 403, body: { error: "FORBIDDEN_ROLE", message: "Tidak berwenang." } };
    }
    return {
      ok: true,
      session: { userId: "22222222-2222-2222-2222-222222222222", email: null, role: actor.role },
    };
  },
}));

type CsvRoute = typeof import("../../src/app/api/admin/reports/daily-csv/route.ts");

let pool: Pool;
let csvRoute: CsvRoute;
let barberId: string;
let serviceId: string;
const staff = { actorRole: "cashier" as const, actorId: "22222222-2222-2222-2222-222222222222" };

beforeAll(async () => {
  process.env["DATABASE_URL"] = testDatabaseUrl();
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

  csvRoute = await import("../../src/app/api/admin/reports/daily-csv/route.ts");
});

afterAll(async () => {
  await pool.end();
});

describe("buildDailyReport", () => {
  it("separates DP from cash taken and matches the CSV totals", async () => {
    const today = jakartaDateString(new Date());

    const walkIn = await scheduleWalkIn(
      {
        fullName: "Tamu Rekap",
        phone: "+6281700000001",
        barberId,
        startTime: `${today}T20:00:00+07:00`,
        serviceIds: [serviceId],
      },
      staff,
      pool,
    );
    expect(walkIn.ok).toBe(true);
    const bookingId = (walkIn.body as { bookingId: string }).bookingId;

    await setBookingStatus({ bookingId, status: "in_progress" }, staff, pool);
    await settleBooking({ bookingId, method: "cash" }, staff, pool);

    // Booking online dengan DP Midtrans, supaya DP dan kas tunai benar-benar
    // dihitung terpisah (walk-in tidak memungut DP sama sekali).
    const onlineCustomer = await insertCustomer(pool);
    const online = await insertBooking(pool, {
      barberId,
      customerId: onlineCustomer,
      startIso: `${today}T21:00:00+07:00`,
      status: "confirmed",
      totalIdr: 95000,
      dpIdr: 20000,
    });
    await pool.query(
      `INSERT INTO public.payments (booking_id, provider, provider_ref, idempotency_key, amount_idr, status, method, paid_at)
       VALUES ($1, 'midtrans', 'ref-online', 'midtrans:txn-online', 20000, 'paid', 'qris', now())`,
      [online.id],
    );

    const report = await buildDailyReport(today, pool);

    expect(report.summary.bookings).toBe(2);
    expect(report.summary.completed).toBe(1);
    expect(report.summary.dpTotalIdr).toBe(20000); // hanya dari Midtrans
    expect(report.summary.cashTotalIdr).toBe(50000); // walk-in bayar penuh di kasir
    expect(report.summary.revenueIdr).toBe(70000);
    expect(report.rows[0]?.settleMethod).toBe("cash");
    const walkInRow = report.rows.find((row) => row.bookingCode.startsWith("DMZ-"));
    expect(walkInRow?.dpPaidIdr).toBe(0);
    expect(walkInRow?.paidIdr).toBe(50000);
  });
});

describe("GET /api/admin/reports/daily-csv", () => {
  const request = (date?: string): Request =>
    new Request(`http://localhost/api/admin/reports/daily-csv${date === undefined ? "" : `?date=${date}`}`);

  it("answers 401 without a session and 403 for a cashier", async () => {
    actor.role = null;
    expect((await csvRoute.GET(request())).status).toBe(401);

    actor.role = "cashier";
    expect((await csvRoute.GET(request())).status).toBe(403);

    actor.role = "owner";
  });

  it("returns a CSV attachment whose totals match the screen summary", async () => {
    const today = jakartaDateString(new Date());
    const response = await csvRoute.GET(request(today));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain(`damez-kas-${today}.csv`);

    const csv = await response.text();
    const lines = csv.split("\n");
    expect(lines[0]).toContain("kode_booking");
    expect(lines.at(-1)).toContain("TOTAL");

    const report = await buildDailyReport(today, pool);
    const totals = lines.at(-1) ?? "";
    expect(totals).toContain(`,${report.summary.dpTotalIdr},${report.summary.cashTotalIdr},`);
  });

  it("rejects a malformed date", async () => {
    actor.role = "owner";
    expect((await csvRoute.GET(request("2 November"))).status).toBe(400);
  });
});