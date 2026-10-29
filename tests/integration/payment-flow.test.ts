import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { resetTestDb, testDatabaseUrl } from "../helpers/db.ts";
import { seed } from "../../scripts/seed.ts";
import { midtransSignature } from "../../src/features/payment/signature.ts";

/**
 * Alur DP diuji terhadap Postgres nyata dengan `MOCK_MIDTRANS`/`MOCK_WHATSAPP`
 * aktif (tanpa biaya, tanpa jaringan). Yang dibuktikan: konfirmasi hanya datang
 * dari webhook bertanda tangan sah, pengiriman ulang tidak menggandakan data,
 * dan kursi tidak pernah terkonfirmasi oleh nominal yang salah.
 */
const SERVER_KEY = "kunci-server-midtrans-integrasi";
const MOCK_WHATSAPP = "true";

type HoldRoute = typeof import("../../src/app/api/booking/hold/route.ts");
type CheckoutRoute = typeof import("../../src/app/api/booking/checkout/route.ts");
type WebhookRoute = typeof import("../../src/app/api/webhooks/midtrans/route.ts");

let pool: Pool;
let barberId: string;
let serviceId: string;
let holdRoute: HoldRoute;
let checkoutRoute: CheckoutRoute;
let webhookRoute: WebhookRoute;
let ipCounter = 0;

function jsonRequest(url: string, body: unknown): Request {
  ipCounter += 1;
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `203.0.113.${ipCounter % 250}` },
    body: JSON.stringify(body),
  });
}

async function createHoldAt(startTime: string): Promise<string> {
  const response = await holdRoute.POST(
    jsonRequest("/api/booking/hold", {
      fullName: "Pelanggan DP",
      phone: `+62812${String(Date.now()).slice(-8)}`,
      barberId,
      startTime,
      serviceIds: [serviceId],
    }),
  );

  expect(response.status).toBe(201);
  const body = (await response.json()) as { bookingCode: string; bookingId: string };
  return body.bookingCode;
}

function notificationFor(orderId: string, overrides: Record<string, string> = {}) {
  const base = {
    order_id: orderId,
    status_code: "200",
    gross_amount: "20000.00",
    transaction_id: `txn-${orderId}`,
    transaction_status: "settlement",
    payment_type: "qris",
    ...overrides,
  };

  return {
    ...base,
    signature_key: midtransSignature(base.order_id, base.status_code, base.gross_amount, SERVER_KEY),
  };
}

beforeAll(async () => {
  process.env["DATABASE_URL"] = testDatabaseUrl();
  process.env["MIDTRANS_SERVER_KEY"] = SERVER_KEY;
  process.env["MOCK_MIDTRANS"] = "true";
  process.env["MOCK_WHATSAPP"] = MOCK_WHATSAPP;

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

  holdRoute = await import("../../src/app/api/booking/hold/route.ts");
  checkoutRoute = await import("../../src/app/api/booking/checkout/route.ts");
  webhookRoute = await import("../../src/app/api/webhooks/midtrans/route.ts");
});

beforeEach(async () => {
  await pool.query("DELETE FROM public.rate_limits");
});

afterAll(async () => {
  delete process.env["MOCK_MIDTRANS"];
  await pool.end();
});

describe("POST /api/booking/checkout", () => {
  it("returns a mock Snap transaction priced from the booking row", async () => {
    const code = await createHoldAt("2026-11-03T10:00:00+07:00");

    const response = await checkoutRoute.POST(jsonRequest("/api/booking/checkout", { bookingCode: code }));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { mock: boolean; amountIdr: number; token: string };
    expect(body.mock).toBe(true);
    expect(body.amountIdr).toBe(20000);
    expect(body.token).toBe(`mock-snap-${code}`);
  });

  it("answers 404 for an unknown booking code", async () => {
    const response = await checkoutRoute.POST(
      jsonRequest("/api/booking/checkout", { bookingCode: "DMZ-20261103-9999" }),
    );

    expect(response.status).toBe(404);
  });

  it("answers 400 for a code that is not a booking code", async () => {
    const response = await checkoutRoute.POST(
      jsonRequest("/api/booking/checkout", { bookingCode: "apa-saja" }),
    );

    expect(response.status).toBe(400);
  });
});

describe("POST /api/webhooks/midtrans", () => {
  it("confirms the booking once and enqueues exactly one notification", async () => {
    const code = await createHoldAt("2026-11-03T11:00:00+07:00");

    const first = await webhookRoute.POST(jsonRequest("/api/webhooks/midtrans", notificationFor(code)));
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ status: "confirmed" });

    const status = await pool.query<{ status: string }>(
      "SELECT status::text AS status FROM public.bookings WHERE booking_code = $1",
      [code],
    );
    expect(status.rows[0]?.status).toBe("confirmed");

    const payments = await pool.query<{ status: string; amount_idr: number }>(
      `SELECT p.status::text AS status, p.amount_idr FROM public.payments p
        JOIN public.bookings b ON b.id = p.booking_id WHERE b.booking_code = $1`,
      [code],
    );
    expect(payments.rows).toEqual([{ status: "paid", amount_idr: 20000 }]);

    const notifications = await pool.query<{ provider: string; kind: string; status: string }>(
      `SELECT n.provider, n.kind, n.status FROM public.notifications n
        JOIN public.bookings b ON b.id = n.booking_id WHERE b.booking_code = $1`,
      [code],
    );
    expect(notifications.rows).toEqual([
      { provider: "mock", kind: "booking_confirmed", status: "pending" },
    ]);
  });

  it("does not duplicate anything when the same webhook is replayed", async () => {
    const code = await createHoldAt("2026-11-03T13:00:00+07:00");
    const notification = notificationFor(code);

    const first = await webhookRoute.POST(jsonRequest("/api/webhooks/midtrans", notification));
    const replay = await webhookRoute.POST(jsonRequest("/api/webhooks/midtrans", notification));

    expect(await first.json()).toEqual({ status: "confirmed" });
    expect(await replay.json()).toEqual({ status: "duplicate" });

    const counts = await pool.query<{ payments: string; notifications: string }>(
      `SELECT (SELECT count(*) FROM public.payments p JOIN public.bookings b ON b.id = p.booking_id
                WHERE b.booking_code = $1)::text AS payments,
              (SELECT count(*) FROM public.notifications n JOIN public.bookings b ON b.id = n.booking_id
                WHERE b.booking_code = $1)::text AS notifications`,
      [code],
    );
    expect(counts.rows[0]).toEqual({ payments: "1", notifications: "1" });
  });

  it("rejects a tampered signature and leaves the booking untouched", async () => {
    const code = await createHoldAt("2026-11-03T14:00:00+07:00");
    const notification = { ...notificationFor(code), gross_amount: "1.00" };

    const response = await webhookRoute.POST(jsonRequest("/api/webhooks/midtrans", notification));

    expect(response.status).toBe(401);
    const status = await pool.query<{ status: string }>(
      "SELECT status::text AS status FROM public.bookings WHERE booking_code = $1",
      [code],
    );
    expect(status.rows[0]?.status).toBe("pending_payment");
  });

  it("rejects an unknown order id even with a valid signature", async () => {
    const response = await webhookRoute.POST(
      jsonRequest("/api/webhooks/midtrans", notificationFor("DMZ-20261103-8888")),
    );

    expect(response.status).toBe(404);
  });

  it("rejects an amount that does not match the DP on the booking", async () => {
    const code = await createHoldAt("2026-11-03T15:00:00+07:00");
    const tampered = notificationFor(code, { gross_amount: "10000.00" });

    const response = await webhookRoute.POST(jsonRequest("/api/webhooks/midtrans", tampered));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "rejected", detail: "AMOUNT_MISMATCH" });
  });

  it("ignores a non-settling status without confirming the chair", async () => {
    const code = await createHoldAt("2026-11-03T16:00:00+07:00");
    const expired = notificationFor(code, { transaction_status: "expire" });

    const response = await webhookRoute.POST(jsonRequest("/api/webhooks/midtrans", expired));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ignored", detail: "expire" });

    const status = await pool.query<{ status: string }>(
      "SELECT status::text AS status FROM public.bookings WHERE booking_code = $1",
      [code],
    );
    expect(status.rows[0]?.status).toBe("pending_payment");
  });

  it("rejects a body that is not a Midtrans notification", async () => {
    const response = await webhookRoute.POST(jsonRequest("/api/webhooks/midtrans", { hello: "world" }));

    expect(response.status).toBe(400);
  });

  it("refuses a second checkout once the booking is confirmed", async () => {
    const code = await createHoldAt("2026-11-03T17:00:00+07:00");
    await webhookRoute.POST(jsonRequest("/api/webhooks/midtrans", notificationFor(code)));

    const response = await checkoutRoute.POST(jsonRequest("/api/booking/checkout", { bookingCode: code }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "BOOKING_NOT_PAYABLE", detail: "confirmed" });
  });
});