import type { Pool } from "pg";
import { bookingPool } from "../slots/services.ts";

export type OverallStats = {
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenueIdr: number;
  totalDpIdr: number;
};

export type BookingListItem = {
  id: string;
  bookingCode: string;
  customerName: string;
  phoneE164: string;
  barberName: string;
  chairNumber: number;
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

export async function getOverallStats(pool: Pool = bookingPool()): Promise<OverallStats> {
  const result = await pool.query<{
    total_bookings: string;
    confirmed_bookings: string;
    completed_bookings: string;
    cancelled_bookings: string;
    total_revenue_idr: string;
    total_dp_idr: string;
  }>(
    `SELECT
       COUNT(*)::text AS total_bookings,
       COUNT(*) FILTER (WHERE status = 'confirmed')::text AS confirmed_bookings,
       COUNT(*) FILTER (WHERE status = 'completed')::text AS completed_bookings,
       COUNT(*) FILTER (WHERE status IN ('cancelled', 'expired', 'no_show'))::text AS cancelled_bookings,
       COALESCE(SUM(total_idr) FILTER (WHERE status = 'completed'), 0)::text AS total_revenue_idr,
       COALESCE(SUM(dp_idr) FILTER (WHERE status IN ('confirmed', 'in_progress', 'completed')), 0)::text AS total_dp_idr
     FROM public.bookings;`
  );

  const row = result.rows[0];
  return {
    totalBookings: Number(row?.total_bookings ?? 0),
    confirmedBookings: Number(row?.confirmed_bookings ?? 0),
    completedBookings: Number(row?.completed_bookings ?? 0),
    cancelledBookings: Number(row?.cancelled_bookings ?? 0),
    totalRevenueIdr: Number(row?.total_revenue_idr ?? 0),
    totalDpIdr: Number(row?.total_dp_idr ?? 0),
  };
}

export async function listRecentBookings(
  limit = 20,
  queryOrPool?: string | Pool,
  maybePool?: Pool
): Promise<BookingListItem[]> {
  const query = typeof queryOrPool === "string" ? queryOrPool : undefined;
  const pool = (typeof queryOrPool === "object" ? queryOrPool : maybePool) ?? bookingPool();
  const trimmed = query?.trim() ?? "";
  const filterClause = trimmed
    ? `AND (
        b.booking_code ILIKE '%' || $2 || '%'
        OR c.full_name ILIKE '%' || $2 || '%'
        OR c.phone_e164 ILIKE '%' || $2 || '%'
        OR bar.full_name ILIKE '%' || $2 || '%'
      )`
    : "";

  const params: unknown[] = [limit];
  if (trimmed) {
    params.push(trimmed);
  }

  const result = await pool.query<{
    id: string;
    booking_code: string;
    full_name: string;
    phone_e164: string;
    barber_name: string;
    chair_number: number;
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
    `SELECT b.id, b.booking_code,
            c.full_name, c.phone_e164,
            bar.full_name AS barber_name, bar.chair_number,
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
       JOIN public.barbers bar ON bar.id = b.barber_id
       LEFT JOIN public.booking_services bs ON bs.booking_id = b.id
       LEFT JOIN public.services s ON s.id = bs.service_id
      WHERE 1=1 ${filterClause}
      GROUP BY b.id, c.full_name, c.phone_e164, bar.full_name, bar.chair_number
      ORDER BY b.start_time DESC
      LIMIT $1`,
    params
  );

  return result.rows.map((row) => ({
    id: row.id,
    bookingCode: row.booking_code,
    customerName: row.full_name,
    phoneE164: row.phone_e164,
    barberName: row.barber_name,
    chairNumber: row.chair_number,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    bookingType: row.booking_type,
    totalIdr: row.total_idr,
    dpIdr: row.dp_idr,
    remainingIdr: row.remaining_idr,
    settled: row.settled,
    services: row.services ?? [],
  }));
}
