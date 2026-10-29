import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";
import { resetTestDb, testDatabaseUrl } from "../helpers/db.ts";
import { seed } from "../../scripts/seed.ts";

/**
 * Route kasir diuji sebagai handler sungguhan terhadap Postgres nyata. Guard
 * sesi diganti tiruan terkendali lewat `vi.mock` karena verifikasi GoTrue tidak
 * bisa dijalankan di CI (tidak ada Supabase di runner); guard itu sendiri sudah
 * punya 14 test unit + bukti HTTP nyata terhadap Supabase. Yang diuji di sini:
 * apakah route benar menolak 401/403 dan benar meneruskan aksi ke database.
 */
const actor = { role: "cashier" as string | null };

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: async () => {
    if (actor.role === null) {
      return {
        ok: false,
        status: 401,
        body: { error: "UNAUTHENTICATED", message: "Sesi admin tidak ditemukan." },
      };
    }

    if (!["owner", "cashier", "barber"].includes(actor.role)) {
      return { ok: false, status: 403, body: { error: "FORBIDDEN_ROLE", message: "Tidak berwenang." } };
    }

    return { ok: true, session: { userId: "11111111-1111-1111-1111-111111111111", email: null, role: actor.role } };
  },
}));

type StatusRoute = typeof import("../../src/app/api/admin/bookings/[id]/status/route.ts");
type SettleRoute = typeof import("../../src/app/api/admin/settle/route.ts");
type WalkInRoute = typeof import("../../src/app/api/admin/walk-in/route.ts");

let pool: Pool;
let statusRoute: StatusRoute;
let settleRoute: SettleRoute;
let walkInRoute: WalkInRoute;
let barberId: string;
let serviceId: string;

function jsonRequest(url: string, body: unknown, ip = "203.0.113.77"): Request {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

async function confirmedBookingAt(startIso: string): Promise<string> {
  const response = await walkInRoute.POST(
    jsonRequest("/api/admin/walk-in", {
      fullName: "Tamu Kasir",
      phone: `+62815${String(Date.now()).slice(-8)}`,
      barberId,
      startTime: startIso,
      serviceIds: [serviceId],
    }),
  );
  expect(response.status).toBe(200);
  const body = (await response.json()) as { bookingId: string };
  return body.bookingId;
}

beforeAll(async () => {
  process.env["DATABASE_URL"] = testDatabaseUrl();

  pool = await resetTestDb();
  await seed(pool);

  const barber = await pool.query<{ id: string }>(
    "SELECT id FROM public.barbers WHERE full_name = 'Kevin Sanjaya'",
  );
  barberId = (barber.rows[0] as { id: string }).id;
  const service = await pool.query<{ id: string }>(
    "SELECT id FROM public.services WHERE service_code = 'SRV-02'",
  );
  serviceId = (service.rows[0] as { id: string }).id;

  statusRoute = await import("../../src/app/api/admin/bookings/[id]/status/route.ts");
  settleRoute = await import("../../src/app/api/admin/settle/route.ts");
  walkInRoute = await import("../../src/app/api/admin/walk-in/route.ts");
});

beforeEach(async () => {
  actor.role = "cashier";
  await pool.query("DELETE FROM public.rate_limits");
});

afterAll(async () => {
  await pool.end();
});

describe("guard sesi", () => {
  it("answers 401 when there is no session", async () => {
    actor.role = null;

    const response = await settleRoute.POST(
      jsonRequest("/api/admin/settle", { bookingId: "00000000-0000-0000-0000-000000000000", method: "cash" }),
    );

    expect(response.status).toBe(401);
  });

  it("answers 403 for a role outside the allowed set", async () => {
    actor.role = "robot";

    const response = await walkInRoute.POST(jsonRequest("/api/admin/walk-in", {}));

    expect(response.status).toBe(403);
  });
});

describe("POST /api/admin/walk-in", () => {
  it("creates a confirmed chair without a hold", async () => {
    const response = await walkInRoute.POST(
      jsonRequest("/api/admin/walk-in", {
        fullName: "Tamu Walk In",
        phone: "+6281500000001",
        barberId,
        startTime: "2026-11-07T10:00:00+07:00",
        serviceIds: [serviceId],
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { bookingCode: string; status: string; totalIdr: number };
    expect(body.bookingCode).toMatch(/^DMZ-\d{8}-\d{4}$/);
    expect(body.status).toBe("confirmed");
    expect(body.totalIdr).toBe(65000);
  });

  it("rejects a malformed payload", async () => {
    const response = await walkInRoute.POST(jsonRequest("/api/admin/walk-in", { fullName: "X" }));

    expect(response.status).toBe(400);
  });

  it("answers 409 when the chair is already taken", async () => {
    const payload = {
      fullName: "Tamu Bentrok",
      phone: "+6281500000002",
      barberId,
      startTime: "2026-11-07T11:00:00+07:00",
      serviceIds: [serviceId],
    };

    const first = await walkInRoute.POST(jsonRequest("/api/admin/walk-in", payload));
    const second = await walkInRoute.POST(
      jsonRequest("/api/admin/walk-in", { ...payload, phone: "+6281500000003" }),
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect((await second.json()) as { error: string }).toMatchObject({ error: "SLOT_TAKEN" });
  });

  it("answers 404 for an unknown service and 422 is used for inactive ones", async () => {
    const response = await walkInRoute.POST(
      jsonRequest("/api/admin/walk-in", {
        fullName: "Tamu Layanan Asing",
        phone: "+6281500000004",
        barberId,
        startTime: "2026-11-07T12:00:00+07:00",
        serviceIds: ["00000000-0000-0000-0000-000000000000"],
      }),
    );

    expect(response.status).toBe(422);
  });
});

describe("POST /api/admin/bookings/[id]/status", () => {
  it("moves a walk-in to in_progress and then to completed", async () => {
    const bookingId = await confirmedBookingAt("2026-11-08T10:00:00+07:00");

    const started = await statusRoute.POST(
      jsonRequest(`/api/admin/bookings/${bookingId}/status`, { status: "in_progress" }),
      params(bookingId),
    );
    const finished = await statusRoute.POST(
      jsonRequest(`/api/admin/bookings/${bookingId}/status`, { status: "completed" }),
      params(bookingId),
    );

    expect(started.status).toBe(200);
    expect(finished.status).toBe(200);
  });

  it("answers 409 for a transition that skips a step", async () => {
    const bookingId = await confirmedBookingAt("2026-11-08T11:00:00+07:00");

    const response = await statusRoute.POST(
      jsonRequest(`/api/admin/bookings/${bookingId}/status`, { status: "completed" }),
      params(bookingId),
    );

    expect(response.status).toBe(409);
    expect((await response.json()) as { error: string }).toMatchObject({ error: "INVALID_TRANSITION" });
  });

  it("answers 404 for an unknown booking and 400 for a bad status", async () => {
    const unknown = await statusRoute.POST(
      jsonRequest("/api/admin/bookings/00000000-0000-0000-0000-000000000000/status", { status: "in_progress" }),
      params("00000000-0000-0000-0000-000000000000"),
    );
    const bookingId = await confirmedBookingAt("2026-11-08T12:00:00+07:00");
    const bad = await statusRoute.POST(
      jsonRequest(`/api/admin/bookings/${bookingId}/status`, { status: "melayang" }),
      params(bookingId),
    );

    expect(unknown.status).toBe(404);
    expect(bad.status).toBe(400);
  });
});

describe("POST /api/admin/settle", () => {
  it("records the cash payment and closes the chair", async () => {
    const bookingId = await confirmedBookingAt("2026-11-08T13:00:00+07:00");
    await statusRoute.POST(
      jsonRequest(`/api/admin/bookings/${bookingId}/status`, { status: "in_progress" }),
      params(bookingId),
    );

    const response = await settleRoute.POST(
      jsonRequest("/api/admin/settle", { bookingId, method: "cash" }),
    );

    expect(response.status).toBe(200);
    const payments = await pool.query<{ amount_idr: number; method: string }>(
      "SELECT amount_idr, method FROM public.payments WHERE booking_id = $1",
      [bookingId],
    );
    expect(payments.rows).toEqual([{ amount_idr: 65000, method: "cash" }]);
  });

  it("answers 409 when the cashier presses the button twice", async () => {
    const bookingId = await confirmedBookingAt("2026-11-08T14:00:00+07:00");
    await statusRoute.POST(
      jsonRequest(`/api/admin/bookings/${bookingId}/status`, { status: "in_progress" }),
      params(bookingId),
    );

    const first = await settleRoute.POST(jsonRequest("/api/admin/settle", { bookingId, method: "qris" }));
    const second = await settleRoute.POST(jsonRequest("/api/admin/settle", { bookingId, method: "qris" }));

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect((await second.json()) as { error: string }).toMatchObject({ error: "ALREADY_SETTLED" });
  });

  it("answers 400 for a method outside the allowed set", async () => {
    const bookingId = await confirmedBookingAt("2026-11-08T15:00:00+07:00");

    const response = await settleRoute.POST(
      jsonRequest("/api/admin/settle", { bookingId, method: "bitcoin" }),
    );

    expect(response.status).toBe(400);
  });

  it("writes an audit row naming the cashier", async () => {
    const bookingId = await confirmedBookingAt("2026-11-08T16:00:00+07:00");
    await statusRoute.POST(
      jsonRequest(`/api/admin/bookings/${bookingId}/status`, { status: "in_progress" }),
      params(bookingId),
    );
    await settleRoute.POST(jsonRequest("/api/admin/settle", { bookingId, method: "cash" }));

    const audit = await pool.query<{ actor_role: string; actor_id: string | null }>(
      "SELECT actor_role, actor_id FROM public.audit_log WHERE action = 'booking.settled' AND entity_id = $1",
      [bookingId],
    );
    expect(audit.rows[0]?.actor_role).toBe("cashier");
    expect(audit.rows[0]?.actor_id).toBe("11111111-1111-1111-1111-111111111111");
  });
});