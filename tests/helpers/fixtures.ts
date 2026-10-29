import type { Pool } from "pg";

/**
 * Fixture minimal untuk test DB. Semua nilai unik diacak supaya aman dipakai
 * lintas test dalam satu database tanpa saling menimpa (unique constraint).
 */

let counter = 0;
function uniqueSuffix(): string {
  counter += 1;
  return `${process.pid.toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Digit-only suffix untuk nomor telepon E.164 (`chk_customer_phone`). */
function uniqueDigits(): string {
  counter += 1;
  const stamp = String(Date.now() % 1_000_000_000).padStart(9, "0");
  return `${stamp}${String(counter).padStart(4, "0")}`;
}

/** Nomor WA unik berformat E.164 untuk test anti-hoarding dan pelanggan baru. */
export function uniquePhone(): string {
  return `+62${uniqueDigits()}`;
}

export async function insertBarber(
  pool: Pool,
  overrides: { chair?: number; isActive?: boolean; fullName?: string } = {},
): Promise<string> {
  const suffix = uniqueSuffix();
  const result = await pool.query<{ id: string }>(
    `INSERT INTO public.barbers (barber_code, full_name, chair_number, is_active)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [
      `BBR-${suffix}`,
      overrides.fullName ?? `Barber ${suffix}`,
      overrides.chair ?? 1,
      overrides.isActive ?? true,
    ],
  );

  return (result.rows[0] as { id: string }).id;
}

export async function insertCustomer(pool: Pool): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO public.customers (full_name, phone_e164)
     VALUES ($1, $2)
     RETURNING id`,
    [`Pelanggan ${uniqueSuffix()}`, `+62${uniqueDigits()}`],
  );

  return (result.rows[0] as { id: string }).id;
}

export async function insertService(
  pool: Pool,
  overrides: { durationMinutes?: number; priceIdr?: number } = {},
): Promise<string> {
  const suffix = uniqueSuffix();
  const result = await pool.query<{ id: string }>(
    `INSERT INTO public.services
       (service_code, name, slug, category, duration_minutes, price_idr)
     VALUES ($1, $2, $3, 'Core Haircut', $4, $5)
     RETURNING id`,
    [
      `SRV-${suffix}`,
      `Layanan ${suffix}`,
      `layanan-${suffix}`,
      overrides.durationMinutes ?? 45,
      overrides.priceIdr ?? 50000,
    ],
  );

  return (result.rows[0] as { id: string }).id;
}

export type InsertedBooking = {
  id: string;
  bookingCode: string;
  startTime: Date;
  endTime: Date;
};

export async function insertBooking(
  pool: Pool,
  input: {
    barberId: string;
    customerId: string;
    startIso: string;
    durationMinutes?: number;
    bufferMinutes?: number;
    status?: string;
    totalIdr?: number;
    dpIdr?: number;
  },
): Promise<InsertedBooking> {
  const suffix = uniqueSuffix();
  const duration = input.durationMinutes ?? 45;
  const buffer = input.bufferMinutes ?? 10;
  const total = input.totalIdr ?? 50000;
  const dp = input.dpIdr ?? 20000;

  const result = await pool.query<{
    id: string;
    booking_code: string;
    start_time: Date;
    end_time: Date;
  }>(
    `INSERT INTO public.bookings
       (booking_code, customer_id, barber_id, status, start_time, end_time,
        service_duration_minutes, buffer_minutes, total_idr, dp_idr, remaining_idr)
     VALUES ($1, $2, $3, $4::public.booking_status_enum, $5::timestamptz,
             $5::timestamptz + make_interval(mins => ($6::int + $7::int)),
             $6::int, $7::int, $8::int, $9::int, GREATEST(0, $8::int - $9::int))
     RETURNING id, booking_code, start_time, end_time`,
    [
      `DMZ-TEST-${suffix}`,
      input.customerId,
      input.barberId,
      input.status ?? "pending_payment",
      input.startIso,
      duration,
      buffer,
      total,
      dp,
    ],
  );

  const row = result.rows[0] as {
    id: string;
    booking_code: string;
    start_time: Date;
    end_time: Date;
  };

  return {
    id: row.id,
    bookingCode: row.booking_code,
    startTime: row.start_time,
    endTime: row.end_time,
  };
}
