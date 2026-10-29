import type { Pool } from "pg";
import { z } from "zod";
import { bookingPool } from "../slots/services.ts";

/**
 * Aksi kasir (IDEA.md §11 R4). Logika transisi dan uang ada di Postgres
 * (migrasi 0005); modul ini menyiapkan validasi input dan menerjemahkan kode
 * error database menjadi status HTTP.
 */

export const BOOKING_STATUSES = [
  "pending_payment",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
  "expired",
] as const;

export const statusSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum(BOOKING_STATUSES),
  reason: z.string().trim().max(200).optional(),
});

export const settleSchema = z.object({
  bookingId: z.string().uuid(),
  method: z.enum(["cash", "qris", "transfer"]),
});

export const walkInSchema = z.object({
  fullName: z.string().trim().min(3).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\+62\d{8,13}$/, "nomor harus format E.164 Indonesia"),
  barberId: z.string().uuid(),
  startTime: z.string().datetime({ offset: true }),
  serviceIds: z.array(z.string().uuid()).min(1).max(3),
});

export type AdminActionResult =
  | { ok: true; status: number; body: Record<string, unknown> }
  | { ok: false; status: number; body: { error: string; message?: string } };

const ERROR_STATUS: Record<string, number> = {
  BOOKING_NOT_FOUND: 404,
  BARBER_NOT_FOUND: 404,
  INVALID_TRANSITION: 409,
  INVALID_STATE: 409,
  ALREADY_SETTLED: 409,
  SLOT_TAKEN: 409,
  INVALID_METHOD: 400,
  INVALID_SERVICE: 422,
  INVALID_ACTOR_ROLE: 403,
};

function failure(raw: { error?: string; message?: string }): AdminActionResult {
  const error = raw.error ?? "UNKNOWN";
  return {
    ok: false,
    status: ERROR_STATUS[error] ?? 500,
    body: raw.message === undefined ? { error } : { error, message: raw.message },
  };
}

export type ActorContext = { actorRole: "owner" | "cashier" | "barber"; actorId: string };

type RawResult = Record<string, unknown> & { success?: boolean; error?: string; message?: string };

async function callFunction(
  pool: Pool,
  sql: string,
  params: unknown[],
): Promise<AdminActionResult> {
  const result = await pool.query<{ result: RawResult }>(sql, params);
  const payload = (result.rows[0] as { result: RawResult }).result;

  if (payload.success !== true) {
    return failure(payload);
  }

  return { ok: true, status: 200, body: { ...payload, success: undefined } };
}

export async function setBookingStatus(
  input: z.infer<typeof statusSchema>,
  actor: ActorContext,
  pool: Pool = bookingPool(),
): Promise<AdminActionResult> {
  return callFunction(
    pool,
    "SELECT public.fn_admin_set_booking_status($1, $2::public.booking_status_enum, $3, $4, $5) AS result",
    [input.bookingId, input.status, actor.actorRole, actor.actorId, input.reason ?? null],
  );
}

export async function settleBooking(
  input: z.infer<typeof settleSchema>,
  actor: ActorContext,
  pool: Pool = bookingPool(),
): Promise<AdminActionResult> {
  return callFunction(pool, "SELECT public.fn_admin_settle_booking($1, $2, $3, $4) AS result", [
    input.bookingId,
    input.method,
    actor.actorRole,
    actor.actorId,
  ]);
}

export async function scheduleWalkIn(
  input: z.infer<typeof walkInSchema>,
  actor: ActorContext,
  pool: Pool = bookingPool(),
): Promise<AdminActionResult> {
  return callFunction(
    pool,
    "SELECT public.fn_admin_schedule_walk_in($1, $2, $3, $4::timestamptz, $5::uuid[], $6, $7) AS result",
    [
      input.fullName,
      input.phone,
      input.barberId,
      input.startTime,
      input.serviceIds,
      actor.actorRole,
      actor.actorId,
    ],
  );
}