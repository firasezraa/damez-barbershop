import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { resetTestDb, testDatabaseUrl } from "../helpers/db.ts";
import { seed } from "../../scripts/seed.ts";

/**
 * Route diuji sebagai handler sungguhan (bukan salinan logikanya), terhadap
 * Postgres nyata. `DATABASE_URL` diarahkan ke database test SEBELUM route
 * dipanggil, karena route membaca env saat request, bukan saat import.
 */
const CRON_SECRET = "rahasia-cron-untuk-test-16";

let pool: Pool;
let barberId: string;
let serviceId: string;

type SlotsRoute = typeof import("../../src/app/api/slots/available/route.ts");
type HoldRoute = typeof import("../../src/app/api/booking/hold/route.ts");
type CronRoute = typeof import("../../src/app/api/cron/expire-slots/route.ts");

let slotsRoute: SlotsRoute;
let holdRoute: HoldRoute;
let cronRoute: CronRoute;

function postJson(url: string, body: unknown, ip = "203.0.113.10"): Request {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  process.env["DATABASE_URL"] = testDatabaseUrl();
  process.env["CRON_SECRET"] = CRON_SECRET;

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

  slotsRoute = await import("../../src/app/api/slots/available/route.ts");
  holdRoute = await import("../../src/app/api/booking/hold/route.ts");
  cronRoute = await import("../../src/app/api/cron/expire-slots/route.ts");
});

beforeEach(async () => {
  await pool.query("DELETE FROM public.rate_limits");
});

afterAll(async () => {
  delete process.env["CRON_SECRET"];
  await pool.end();
});

describe("POST /api/slots/available", () => {
  it("returns the barbers who work that day with their slots", async () => {
    const response = await slotsRoute.POST(postJson("/api/slots/available", {
      date: "2026-11-02",
      serviceIds: [serviceId],
    }));

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      durationMinutes: number;
      totalIdr: number;
      barbers: { fullName: string; slots: string[] }[];
    };

    expect(body.durationMinutes).toBe(45);
    expect(body.totalIdr).toBe(50000);
    expect(body.barbers.map((barber) => barber.fullName)).toEqual(["Rian Pratama", "Kevin Sanjaya"]);
    expect(body.barbers[0]?.slots[0]).toBe("2026-11-02T10:00:00+07:00");
  });

  it("rejects a malformed payload without touching the database", async () => {
    const response = await slotsRoute.POST(postJson("/api/slots/available", { date: "2 November" }));

    expect(response.status).toBe(400);
  });

  it("rejects an unknown service with 422", async () => {
    const response = await slotsRoute.POST(
      postJson("/api/slots/available", {
        date: "2026-11-02",
        serviceIds: ["00000000-0000-0000-0000-000000000000"],
      }),
    );

    expect(response.status).toBe(422);
  });

  it("answers 429 once the client exceeds the persistent limit", async () => {
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 61; attempt += 1) {
      const response = await slotsRoute.POST(
        postJson("/api/slots/available", { date: "2026-11-02", serviceIds: [serviceId] }, "198.51.100.7"),
      );
      statuses.push(response.status);
    }

    expect(statuses.slice(0, 60).every((status) => status === 200)).toBe(true);
    expect(statuses[60]).toBe(429);

    const stored = await pool.query<{ hits: number }>(
      "SELECT hits FROM public.rate_limits WHERE key = 'slots:198.51.100.7'",
    );
    expect(stored.rows[0]?.hits).toBe(61);
  });
});

describe("POST /api/booking/hold", () => {
  const validHold = (overrides: Record<string, unknown> = {}) => ({
    fullName: "Budi Santoso",
    phone: "+6281234567890",
    barberId,
    startTime: "2026-11-02T10:00:00+07:00",
    serviceIds: [serviceId],
    ...overrides,
  });

  it("creates a 15-minute hold priced by the server", async () => {
    const response = await holdRoute.POST(postJson("/api/booking/hold", validHold(), "203.0.113.20"));

    expect(response.status).toBe(201);
    const body = (await response.json()) as {
      bookingCode: string;
      totalIdr: number;
      dpIdr: number;
      remainingIdr: number;
      holdExpiresAt: string;
    };

    expect(body.bookingCode).toMatch(/^DMZ-\d{8}-\d{4}$/);
    expect(body.totalIdr).toBe(50000);
    expect(body.dpIdr).toBe(20000);
    expect(body.remainingIdr).toBe(30000);
    expect(Number.isNaN(Date.parse(body.holdExpiresAt))).toBe(false);
  });

  it("rejects a second hold on the same slot with 409", async () => {
    const slot = "2026-11-02T13:00:00+07:00";
    const first = await holdRoute.POST(
      postJson("/api/booking/hold", validHold({ startTime: slot }), "203.0.113.21"),
    );
    const second = await holdRoute.POST(
      postJson("/api/booking/hold", validHold({ phone: "+6281234567891", startTime: slot }), "203.0.113.22"),
    );

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    const body = (await second.json()) as { error: string };
    expect(body.error).toBe("SLOT_TAKEN");
  });

  it("lets exactly one of two concurrent requests hold the same slot", async () => {
    const slot = "2026-11-02T15:00:00+07:00";
    const [a, b] = await Promise.all([
      holdRoute.POST(postJson("/api/booking/hold", validHold({ phone: "+6281234567892", startTime: slot }), "203.0.113.23")),
      holdRoute.POST(postJson("/api/booking/hold", validHold({ phone: "+6281234567893", startTime: slot }), "203.0.113.24")),
    ]);

    expect([a.status, b.status].sort()).toEqual([201, 409]);
  });

  it("rejects a phone that is not E.164 Indonesia", async () => {
    const response = await holdRoute.POST(
      postJson("/api/booking/hold", validHold({ phone: "0812345678" }), "203.0.113.25"),
    );

    expect(response.status).toBe(400);
  });
});

describe("GET /api/cron/expire-slots", () => {
  const cronRequest = (authorization?: string): Request =>
    new Request("http://localhost/api/cron/expire-slots", {
      headers: authorization === undefined ? {} : { authorization },
    });

  it("answers 401 without the cron secret and does not touch the database", async () => {
    const response = await cronRoute.GET(cronRequest());

    expect(response.status).toBe(401);
  });

  it("answers 401 for a wrong secret of the same length", async () => {
    const wrong = `Bearer ${"x".repeat(CRON_SECRET.length)}`;
    const response = await cronRoute.GET(cronRequest(wrong));

    expect(response.status).toBe(401);
  });

  it("expires a stale hold once and frees the slot", async () => {
    const hold = await holdRoute.POST(
      postJson("/api/booking/hold", {
        fullName: "Siti Aminah",
        phone: "+6281234567894",
        barberId,
        startTime: "2026-11-02T16:00:00+07:00",
        serviceIds: [serviceId],
      }, "203.0.113.26"),
    );
    expect(hold.status).toBe(201);

    const created = (await hold.json()) as { bookingId: string };
    await pool.query(
      "UPDATE public.bookings SET hold_expires_at = now() - interval '1 second' WHERE id = $1",
      [created.bookingId],
    );

    const first = await cronRoute.GET(cronRequest(`Bearer ${CRON_SECRET}`));
    const second = await cronRoute.GET(cronRequest(`Bearer ${CRON_SECRET}`));

    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ expired: 1 });
    expect(await second.json()).toEqual({ expired: 0 });

    const status = await pool.query<{ status: string }>(
      "SELECT status::text AS status FROM public.bookings WHERE id = $1",
      [created.bookingId],
    );
    expect(status.rows[0]?.status).toBe("expired");

    const rehold = await holdRoute.POST(
      postJson("/api/booking/hold", {
        fullName: "Siti Aminah",
        phone: "+6281234567894",
        barberId,
        startTime: "2026-11-02T16:00:00+07:00",
        serviceIds: [serviceId],
      }, "203.0.113.27"),
    );
    expect(rehold.status).toBe(201);
  });
});