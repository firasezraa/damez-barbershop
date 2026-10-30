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
  /** Lingkungan Snap. Datang dari MIDTRANS_IS_PRODUCTION, bukan NODE_ENV. */
  isProduction: boolean;
  appBaseUrl?: string;
  pool?: Pool;
  /** Titik sambung untuk test/observasi; default fetch global. */
  fetchImpl?: typeof fetch;
};

const SNAP_PRODUCTION_URL = "https://app.midtrans.com/snap/v1/transactions";
const SNAP_SANDBOX_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";

/** Batas keras dari dokumentasi Midtrans; lebih pendek dari ini wajib dipotong. */
const MAX_ITEM_NAME_LENGTH = 50;
const MAX_BCA_VA_NAME_LENGTH = 30;

type BookingRow = {
  id: string;
  booking_code: string;
  dp_idr: number;
  status: string;
  hold_active: boolean;
  customer_name: string;
  phone_e164: string;
};

function clamp(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
}

export function snapEndpoint(isProduction: boolean): string {
  return isProduction ? SNAP_PRODUCTION_URL : SNAP_SANDBOX_URL;
}

/**
 * Muatan Snap. Dipisah dari pemanggilan jaringan supaya bentuknya bisa diuji
 * tanpa server palsu. Subtotal `item_details` wajib sama dengan `gross_amount`.
 */
export function buildSnapPayload(
  booking: BookingRow,
  deps: Pick<CheckoutDeps, "appBaseUrl">,
): Record<string, unknown> {
  const dp = booking.dp_idr;

  return {
    transaction_details: {
      order_id: booking.booking_code,
      gross_amount: dp,
    },
    item_details: [
      {
        id: "DP",
        price: dp,
        quantity: 1,
        name: clamp(`DP Booking ${booking.booking_code}`, MAX_ITEM_NAME_LENGTH),
      },
    ],
    customer_details: {
      // BCA VA menolak nama lebih dari 30 karakter, jadi dipotong dari awal.
      first_name: clamp(booking.customer_name, MAX_BCA_VA_NAME_LENGTH),
      phone: booking.phone_e164,
    },
    // QRIS prioritas: MDR 0,7% (IDEA.md §3).
    enabled_payments: ["qris", "bank_transfer"],
    // 15 menit, selaras dengan HOLD_TTL_SECONDS.
    expiry: { unit: "minutes", duration: 15 },
    ...(deps.appBaseUrl === undefined
      ? {}
      : { callbacks: { finish: `${deps.appBaseUrl}/booking/success/${booking.booking_code}` } }),
  };
}

export async function createCheckout(
  bookingCode: string,
  deps: CheckoutDeps,
): Promise<CheckoutResult> {
  const pool = deps.pool ?? bookingPool();

  const found = await pool.query<BookingRow>(
    `SELECT b.id, b.booking_code, b.dp_idr, b.status::text AS status,
            public.fn_hold_is_active(b.id) AS hold_active,
            c.full_name AS customer_name, c.phone_e164
       FROM public.bookings b
       JOIN public.customers c ON c.id = b.customer_id
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

  const doFetch = deps.fetchImpl ?? fetch;

  try {
      const response = await doFetch(snapEndpoint(deps.isProduction), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          authorization: `Basic ${Buffer.from(`${deps.serverKey}:`).toString("base64")}`,
        },
        body: JSON.stringify(buildSnapPayload(booking, { ...deps })),
      });

      // Snap menjawab 201 saat token berhasil dibuat; `ok` mencakup 201.
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
