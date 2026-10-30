import type { Pool } from "pg";
import { bookingPool } from "../slots/services.ts";

/**
 * Pembuatan hold. Seluruh keputusan (harga, durasi, waktu selesai, TTL,
 * anti-hoarding, penguncian slot) ada di `fn_create_booking_hold` di Postgres —
 * lihat migrasi 0002. Modul ini hanya memanggilnya dan menerjemahkan hasilnya
 * menjadi kode HTTP, supaya tidak ada aturan bisnis yang terduplikasi di Node.
 */

export type HoldInput = {
  fullName: string;
  phoneE164: string;
  barberId: string;
  startTime: string;
  serviceIds: string[];
  notes?: string;
};

export type HoldSuccess = {
  bookingId: string;
  bookingCode: string;
  holdExpiresAt: string;
  totalIdr: number;
  dpIdr: number;
  remainingIdr: number;
};

export type HoldFailure = {
  error: "BARBER_NOT_FOUND" | "SLOT_TAKEN" | "INVALID_SERVICE" | "MAX_ACTIVE_HOLDS_EXCEEDED";
  message: string;
};

type RawHoldResult = {
  success: boolean;
  booking_id?: string;
  booking_code?: string;
  hold_expires_at?: string;
  total_idr?: number;
  dp_idr?: number;
  remaining_idr?: number;
  error?: HoldFailure["error"];
  message?: string;
};

/** Kode HTTP per kegagalan yang bisa dikembalikan fungsi database. */
export const HOLD_ERROR_STATUS: Record<HoldFailure["error"], number> = {
  SLOT_TAKEN: 409,
  BARBER_NOT_FOUND: 404,
  INVALID_SERVICE: 422,
  MAX_ACTIVE_HOLDS_EXCEEDED: 422,
};

export type HoldResult = { ok: true; hold: HoldSuccess } | { ok: false; failure: HoldFailure };

export async function createHold(input: HoldInput, target: Pool = bookingPool()): Promise<HoldResult> {
  const result = await target.query<{ result: RawHoldResult }>(
    `SELECT public.fn_create_booking_hold(
       $1::varchar, $2::varchar, $3::uuid, $4::timestamptz, $5::uuid[],
       'online'::public.booking_type_enum, $6::text
     ) AS result`,
    [input.fullName, input.phoneE164, input.barberId, input.startTime, input.serviceIds, input.notes ?? null],
  );

  const payload = (result.rows[0] as { result: RawHoldResult }).result;

  if (payload.success !== true) {
    const error = payload.error ?? "INVALID_SERVICE";
    return {
      ok: false,
      failure: { error, message: payload.message ?? "Permintaan booking tidak dapat diproses." },
    };
  }

  return {
    ok: true,
    hold: {
      bookingId: payload.booking_id as string,
      bookingCode: payload.booking_code as string,
      holdExpiresAt: payload.hold_expires_at as string,
      totalIdr: Number(payload.total_idr ?? 0),
      dpIdr: Number(payload.dp_idr ?? 0),
      remainingIdr: Number(payload.remaining_idr ?? 0),
    },
  };
}
