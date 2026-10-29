import type { Pool } from "pg";
import { bookingPool } from "../slots/services.ts";

/**
 * Checkout DP. Nominal selalu diambil dari baris booking (dihitung server saat
 * hold), tidak pernah dari klien. `MOCK_MIDTRANS=true` mengembalikan transaksi
 * palsu supaya pengembangan dan E2E berjalan tanpa biaya dan tanpa jaringan.
 */

export type CheckoutResult = {
  status: 200 | 404 | 409 | 502 | 503;
  body: Record<string, unknown>;
};

export type CheckoutDeps = {
  mock: boolean;
  serverKey: string;
  pool?: Pool;
  /** Titik sambung untuk test/observasi; default fetch global. */
  fetchImpl?: typeof fetch;
};

const SNAP_URL = "https://app.midtrans.com/snap/v1/transactions";
const SNAP_SANDBOX_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";

type BookingRow = {
  id: string;
  booking_code: string;
  dp_idr: number;
  status: string;
  hold_active: boolean;
};

export async function createCheckout(
  bookingCode: string,
  deps: CheckoutDeps,
): Promise<CheckoutResult> {
  const pool = deps.pool ?? bookingPool();

  const found = await pool.query<BookingRow>(
    `SELECT b.id, b.booking_code, b.dp_idr, b.status::text AS status,
            public.fn_hold_is_active(b.id) AS hold_active
       FROM public.bookings b
      WHERE b.booking_code = $1`,
    [bookingCode],
  );

  const booking = found.rows[0];
  if (booking === undefined) {
    return { status: 404, body: { error: "BOOKING_NOT_FOUND" } };
  }

  if (booking.status !== "pending_payment") {
    return { status: 409, body: { error: "BOOKING_NOT_PAYABLE", detail: booking.status } };
  }

  if (!booking.hold_active) {
    return { status: 409, body: { error: "HOLD_EXPIRED" } };
  }

  if (deps.mock) {
    return {
      status: 200,
      body: {
        mock: true,
        bookingCode: booking.booking_code,
        amountIdr: booking.dp_idr,
        token: `mock-snap-${booking.booking_code}`,
        redirectUrl: `/booking/success/${booking.booking_code}`,
      },
    };
  }

  if (deps.serverKey.length === 0) {
    return { status: 503, body: { error: "PAYMENT_NOT_CONFIGURED" } };
  }

  const baseUrl = process.env.NODE_ENV === "production" ? SNAP_URL : SNAP_SANDBOX_URL;
  const doFetch = deps.fetchImpl ?? fetch;

  try {
    const response = await doFetch(baseUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        authorization: `Basic ${Buffer.from(`${deps.serverKey}:`).toString("base64")}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: booking.booking_code,
          gross_amount: booking.dp_idr,
        },
        // QRIS prioritas: MDR 0,7% (IDEA.md §3).
        enabled_payments: ["qris", "bank_transfer"],
        expiry: { unit: "minutes", duration: 15 },
      }),
    });

    if (!response.ok) {
      return { status: 502, body: { error: "SNAP_UNAVAILABLE" } };
    }

    const payload = (await response.json()) as { token?: string; redirect_url?: string };
    if (payload.token === undefined || payload.redirect_url === undefined) {
      return { status: 502, body: { error: "SNAP_UNAVAILABLE" } };
    }

    return {
      status: 200,
      body: {
        mock: false,
        bookingCode: booking.booking_code,
        amountIdr: booking.dp_idr,
        token: payload.token,
        redirectUrl: payload.redirect_url,
      },
    };
  } catch {
    return { status: 502, body: { error: "SNAP_UNAVAILABLE" } };
  }
}
