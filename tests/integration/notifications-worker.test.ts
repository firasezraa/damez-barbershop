import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { resetTestDb, testDatabaseUrl } from "../helpers/db.ts";
import { seed } from "../../scripts/seed.ts";
import { midtransSignature } from "../../src/features/payment/signature.ts";
import {
  MAX_ATTEMPTS,
  dispatchPendingNotifications,
  mockProvider,
  type MessageProvider,
} from "../../src/features/notifications/sender.ts";

/**
 * Antrean notifikasi diuji dengan Postgres nyata dan provider palsu: percobaan
 * dicatat, kegagalan diulang sampai batas, dan setelah itu baris ditandai gagal
 * (tidak dicoba selamanya).
 */
const SERVER_KEY = "kunci-server-midtrans-untuk-worker";
const CRON_SECRET = "rahasia-cron-untuk-test-16";

type HoldRoute = typeof import("../../src/app/api/booking/hold/route.ts");
type WebhookRoute = typeof import("../../src/app/api/webhooks/midtrans/route.ts");
type SendRoute = typeof import("../../src/app/api/cron/send-notifications/route.ts");

let pool: Pool;
let holdRoute: HoldRoute;
let webhookRoute: WebhookRoute;
let sendRoute: SendRoute;
let barberId: string;
let serviceId: string;
let ip = 0;

function jsonRequest(url: string, body: unknown): Request {
  ip += 1;
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `198.51.100.${ip % 250}` },
    body: JSON.stringify(body),
  });
}

async function confirmedBookingAt(startTime: string): Promise<string> {
  const hold = await holdRoute.POST(
    jsonRequest("/api/booking/hold", {
      fullName: "Pelanggan Notifikasi",
      phone: `+62813${String(Date.now()).slice(-8)}`,
      barberId,
      startTime,
      serviceIds: [serviceId],
    }),
  );
  expect(hold.status).toBe(201);
  const holdBody = (await hold.json()) as { bookingCode: string };

  const notification = {
    order_id: holdBody.bookingCode,
    status_code: "200",
    gross_amount: "20000.00",
    transaction_id: `txn-${holdBody.bookingCode}`,
    transaction_status: "settlement",
    payment_type: "qris",
  };
  const webhook = await webhookRoute.POST(
    jsonRequest("/api/webhooks/midtrans", {
      ...notification,
      signature_key: midtransSignature(
        notification.order_id,
        notification.status_code,
        notification.gross_amount,
        SERVER_KEY,
      ),
    }),
  );
  expect(webhook.status).toBe(200);

  return holdBody.bookingCode;
}

beforeAll(async () => {
  process.env["DATABASE_URL"] = testDatabaseUrl();
  process.env["MIDTRANS_SERVER_KEY"] = SERVER_KEY;
  process.env["MOCK_MIDTRANS"] = "true";
  process.env["MOCK_WHATSAPP"] = "true";
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

  holdRoute = await import("../../src/app/api/booking/hold/route.ts");
  webhookRoute = await import("../../src/app/api/webhooks/midtrans/route.ts");
  sendRoute = await import("../../src/app/api/cron/send-notifications/route.ts");
});

afterAll(async () => {
  delete process.env["MOCK_WHATSAPP"];
  await pool.end();
});

describe("GET /api/cron/send-notifications", () => {
  const cronRequest = (authorization?: string): Request =>
    new Request("http://localhost/api/cron/send-notifications", {
      headers: authorization === undefined ? {} : { authorization },
    });

  it("answers 401 without the cron secret", async () => {
    expect((await sendRoute.GET(cronRequest())).status).toBe(401);
  });

  it("answers 401 for a wrong secret", async () => {
    expect((await sendRoute.GET(cronRequest("Bearer salah-sekali-panjang-sekali"))).status).toBe(401);
  });

  it("sends the queued confirmation and marks it sent", async () => {
    const code = await confirmedBookingAt("2026-11-04T10:00:00+07:00");

    const response = await sendRoute.GET(cronRequest(`Bearer ${CRON_SECRET}`));
    expect(response.status).toBe(200);
    const summary = (await response.json()) as { sent: number; failed: number };
    expect(summary.sent).toBe(1);
    expect(summary.failed).toBe(0);

    const row = await pool.query<{ status: string; attempts: number; sent_at: Date | null }>(
      `SELECT n.status, n.attempts, n.sent_at FROM public.notifications n
         JOIN public.bookings b ON b.id = n.booking_id WHERE b.booking_code = $1`,
      [code],
    );
    expect(row.rows[0]?.status).toBe("sent");
    expect(row.rows[0]?.attempts).toBe(1);
    expect(row.rows[0]?.sent_at).not.toBeNull();
  });

  it("reports nothing left to send on a second run", async () => {
    const response = await sendRoute.GET(cronRequest(`Bearer ${CRON_SECRET}`));
    expect(await response.json()).toEqual({ sent: 0, failed: 0, drained: 0 });
  });
});

describe("dispatchPendingNotifications", () => {
  it("keeps a failing message pending, records the error, and gives up after the cap", async () => {
    const code = await confirmedBookingAt("2026-11-05T10:00:00+07:00");
    const failing: MessageProvider = {
      name: "failing",
      send: async () => ({ ok: false, error: "gateway 503" }),
    };

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const summary = await dispatchPendingNotifications(failing, { pool });
      expect(summary.failed).toBe(1);

      const row = await pool.query<{ status: string; attempts: number; last_error: string | null }>(
        `SELECT n.status, n.attempts, n.last_error FROM public.notifications n
           JOIN public.bookings b ON b.id = n.booking_id WHERE b.booking_code = $1`,
        [code],
      );

      expect(row.rows[0]?.attempts).toBe(attempt);
      expect(row.rows[0]?.last_error).toBe("gateway 503");
      expect(row.rows[0]?.status).toBe(attempt < MAX_ATTEMPTS ? "pending" : "failed");
    }

    // Sudah menyerah: tidak ada lagi yang diambil dari antrean.
    const afterCap = await dispatchPendingNotifications(failing, { pool });
    expect(afterCap.drained).toBe(0);
  });

  it("does not send a message twice", async () => {
    const log: string[] = [];
    const code = await confirmedBookingAt("2026-11-06T10:00:00+07:00");

    await dispatchPendingNotifications(mockProvider(log), { pool });
    await dispatchPendingNotifications(mockProvider(log), { pool });

    const rows = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM public.notifications n
         JOIN public.bookings b ON b.id = n.booking_id
        WHERE b.booking_code = $1 AND n.status = 'sent'`,
      [code],
    );
    expect(rows.rows[0]?.count).toBe("1");
  });
});
