import type { Pool } from "pg";
import { bookingPool } from "../slots/services.ts";
import { enqueueNotification, whatsappProvider } from "../notifications/queue.ts";
import { verifyMidtransSignature } from "./signature.ts";

/**
 * Notifikasi webhook Midtrans. Konfirmasi booking HANYA terjadi di sini, dari
 * payload yang tanda tangannya tervalidasi — redirect browser tidak pernah
 * mengubah status (IDEA.md §7). Idempotensi dijamin kunci unik
 * `payments.idempotency_key`, bukan oleh pemeriksaan di Node.
 */

export type MidtransNotification = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_id: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
};

export type WebhookResult = {
  status: 200 | 400 | 401 | 404 | 500;
  body: { status: string; detail?: string };
};

type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "refunded";

const STATUS_MAP: Record<string, PaymentStatus> = {
  settlement: "paid",
  capture: "paid",
  pending: "pending",
  deny: "failed",
  cancel: "failed",
  failure: "failed",
  expire: "expired",
  refund: "refunded",
  partial_refund: "refunded",
};

function isSettled(notification: MidtransNotification): boolean {
  const mapped = STATUS_MAP[notification.transaction_status];
  if (mapped !== "paid") {
    return false;
  }

  // `capture` dengan fraud_status challenge belum boleh mengonfirmasi kursi.
  return notification.fraud_status === undefined || notification.fraud_status === "accept";
}

export type WebhookDeps = { serverKey: string; pool?: Pool; mockWhatsapp: string | undefined };

export async function handleMidtransNotification(
  notification: MidtransNotification,
  deps: WebhookDeps,
): Promise<WebhookResult> {
  const pool = deps.pool ?? bookingPool();

  const signatureValid = verifyMidtransSignature({
    orderId: notification.order_id,
    statusCode: notification.status_code,
    grossAmount: notification.gross_amount,
    signature: notification.signature_key,
    serverKey: deps.serverKey,
  });

  if (!signatureValid) {
    return { status: 401, body: { status: "rejected", detail: "INVALID_SIGNATURE" } };
  }

  const booking = await pool.query<{ id: string; dp_idr: number; status: string }>(
    "SELECT id, dp_idr, status::text AS status FROM public.bookings WHERE booking_code = $1",
    [notification.order_id],
  );

  const row = booking.rows[0];
  if (row === undefined) {
    return { status: 404, body: { status: "rejected", detail: "UNKNOWN_ORDER" } };
  }

  // Nominal wajib sama dengan DP yang dihitung server saat hold dibuat.
  const grossAmount = Number(notification.gross_amount);
  if (!Number.isFinite(grossAmount) || grossAmount !== row.dp_idr) {
    return { status: 400, body: { status: "rejected", detail: "AMOUNT_MISMATCH" } };
  }

  const paymentStatus = STATUS_MAP[notification.transaction_status] ?? "pending";

  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO public.payments
       (booking_id, provider, provider_ref, idempotency_key, amount_idr, status, method, raw_payload, paid_at)
     VALUES ($1, 'midtrans', $2, $3, $4, $5::public.payment_status_enum, $6, $7::jsonb, $8)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING id`,
    [
      row.id,
      notification.transaction_id,
      `midtrans:${notification.transaction_id}`,
      grossAmount,
      paymentStatus,
      notification.payment_type ?? null,
      JSON.stringify(notification),
      paymentStatus === "paid" ? new Date() : null,
    ],
  );

  if (inserted.rows.length === 0) {
    // Pengiriman ulang webhook yang sama: tidak ada efek samping kedua.
    return { status: 200, body: { status: "duplicate" } };
  }

  if (!isSettled(notification)) {
    return { status: 200, body: { status: "ignored", detail: notification.transaction_status } };
  }

  await pool.query(
    `UPDATE public.bookings
        SET status = 'confirmed', updated_at = now()
      WHERE id = $1 AND status = 'pending_payment'`,
    [row.id],
  );

  await enqueueNotification(
    {
      bookingId: row.id,
      kind: "booking_confirmed",
      recipientType: "customer",
      provider: whatsappProvider({ MOCK_WHATSAPP: deps.mockWhatsapp }),
    },
    pool,
  );

  return { status: 200, body: { status: "confirmed" } };
}
