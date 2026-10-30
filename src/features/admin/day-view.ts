import type { Pool } from "pg";
import { bookingPool } from "../slots/services.ts";
import { jakartaIso } from "../../lib/time/jakarta.ts";

/**
 * Matriks kursi untuk satu hari (IDEA.md §11 R4). Satu query untuk semua kursi:
 * dashboard kasir harus cepat dan tidak boleh menembak database 3 kali.
 */

export type ChairBooking = {
  id: string;
  bookingCode: string;
  customerName: string;
  phoneE164: string;
  startTime: Date;
  endTime: Date;
  status: string;
  bookingType: string;
  totalIdr: number;
  dpIdr: number;
  remainingIdr: number;
  settled: boolean;
  services: string[];
};

export type ChairRow = {
  barberId: string;
  barberName: string;
  chairNumber: number;
  bookings: ChairBooking[];
};

const ACTIVE_STATUSES = ["pending_payment", "confirmed", "in_progress", "completed", "no_show"];

export async function listChairMatrix(
  dateJakarta: string,
  pool: Pool = bookingPool(),
): Promise<ChairRow[]> {
  const dayStart = jakartaIso(dateJakarta, 0);
  const dayEnd = jakartaIso(dateJakarta, 24 * 60);

  const chairs = await pool.query<{ id: string; full_name: string; chair_number: number }>(
    `SELECT id, full_name, chair_number FROM public.barbers
      WHERE is_active ORDER BY chair_number`,
  );

  const bookings = await pool.query<{
    id: string;
    booking_code: string;
    barber_id: string;
    full_name: string;
    phone_e164: string;
    start_time: Date;
    end_time: Date;
    status: string;
    booking_type: string;
    total_idr: number;
    dp_idr: number;
    remaining_idr: number;
    settled: boolean;
    services: string[] | null;
  }>(
    `SELECT b.id, b.booking_code, b.barber_id,
            c.full_name, c.phone_e164,
            b.start_time, b.end_time,
            b.status::text AS status, b.booking_type::text AS booking_type,
            b.total_idr, b.dp_idr, b.remaining_idr,
            EXISTS (
              SELECT 1 FROM public.payments p
               WHERE p.booking_id = b.id AND p.idempotency_key = 'settle:' || b.id::text
            ) AS settled,
            array_agg(s.name ORDER BY s.display_order) FILTER (WHERE s.name IS NOT NULL) AS services
       FROM public.bookings b
       JOIN public.customers c ON c.id = b.customer_id
       LEFT JOIN public.booking_services bs ON bs.booking_id = b.id
       LEFT JOIN public.services s ON s.id = bs.service_id
      WHERE b.start_time >= $1::timestamptz
        AND b.start_time < $2::timestamptz
        AND b.status::text = ANY($3::text[])
      GROUP BY b.id, c.full_name, c.phone_e164
      ORDER BY b.start_time`,
    [dayStart, dayEnd, ACTIVE_STATUSES],
  );

  const byBarber = new Map<string, ChairBooking[]>();
  for (const row of bookings.rows) {
    const list = byBarber.get(row.barber_id) ?? [];
    list.push({
      id: row.id,
      bookingCode: row.booking_code,
      customerName: row.full_name,
      phoneE164: row.phone_e164,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      bookingType: row.booking_type,
      totalIdr: row.total_idr,
      dpIdr: row.dp_idr,
      remainingIdr: row.remaining_idr,
      settled: row.settled,
      services: row.services ?? [],
    });
    byBarber.set(row.barber_id, list);
  }

  return chairs.rows.map((chair) => ({
    barberId: chair.id,
    barberName: chair.full_name,
    chairNumber: chair.chair_number,
    bookings: byBarber.get(chair.id) ?? [],
  }));
}

export type DaySummary = {
  bookings: number;
  dpiTotalIdr: number;
  cashTotalIdr: number;
  noShow: number;
  expectedTotalIdr: number;
};

/** Angka di layar dan di CSV harus berasal dari fungsi yang sama. */
export function summarizeDay(chairs: ChairRow[]): DaySummary {
  const all = chairs.flatMap((chair) => chair.bookings);

  return {
    bookings: all.length,
    dpiTotalIdr: all.reduce((total, booking) => total + booking.dpIdr, 0),
    cashTotalIdr: all
      .filter((booking) => booking.settled)
      .reduce((total, booking) => total + booking.remainingIdr, 0),
    noShow: all.filter((booking) => booking.status === "no_show").length,
    expectedTotalIdr: all
      .filter((booking) => booking.status !== "cancelled" && booking.status !== "expired")
      .reduce((total, booking) => total + booking.totalIdr, 0),
  };
}