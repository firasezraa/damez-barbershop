import type { Pool } from "pg";
import {
  MIN_LEAD_TIME_MINUTES,
  SLOT_GRID_STEP_MINUTES,
  TURNAROUND_BUFFER_MINUTES,
} from "../../lib/config/constants.ts";
import { jakartaDateString, jakartaIso, jakartaMinutesOf } from "../../lib/time/jakarta.ts";
import { computeAvailableSlots, type Interval } from "./engine.ts";

/**
 * Lapisan data untuk ketersediaan slot: mengambil jam kerja, istirahat, dan
 * booking aktif dari Postgres, lalu menyerahkan keputusan ke `computeAvailableSlots`
 * (fungsi murni yang sudah diuji terpisah).
 */

export type AvailabilityRequest = {
  dateJakarta: string;
  durationMinutes: number;
  barberId?: string;
};

export type BarberDay = {
  barberId: string;
  fullName: string;
  chairNumber: number;
  slots: string[];
};

/** Status yang benar-benar memegang slot. `expired`, `cancelled`, `no_show` tidak. */
const HOLDING_STATUSES = ["pending_payment", "confirmed", "in_progress"] as const;
const MINUTES_PER_DAY = 24 * 60;

function parseTimeOfDay(value: string): number {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function overlapsDay(start: Date, end: Date, dayStart: Date, dayEnd: Date): boolean {
  return start < dayEnd && dayStart < end;
}

export async function findAvailability(
  pool: Pool,
  request: AvailabilityRequest,
  now: Date = new Date(),
): Promise<BarberDay[]> {
  const dayOfWeek = new Date(`${request.dateJakarta}T00:00:00Z`).getUTCDay();
  const dayStartIso = jakartaIso(request.dateJakarta, 0);
  const dayEndIso = jakartaIso(request.dateJakarta, MINUTES_PER_DAY);
  const dayStart = new Date(dayStartIso);
  const dayEnd = new Date(dayEndIso);

  const barbers = await pool.query<{
    id: string;
    full_name: string;
    chair_number: number;
    open_time: string;
    close_time: string;
    is_day_off: boolean;
  }>(
    `SELECT b.id, b.full_name, b.chair_number,
            w.open_time::text AS open_time, w.close_time::text AS close_time, w.is_day_off
       FROM public.barbers b
       JOIN public.working_hours w ON w.barber_id = b.id AND w.day_of_week = $1
      WHERE b.is_active
        AND ($2::uuid IS NULL OR b.id = $2::uuid)
      ORDER BY b.chair_number`,
    [dayOfWeek, request.barberId ?? null],
  );

  if (barbers.rows.length === 0) {
    return [];
  }

  // Barber yang libur tidak ditawarkan sama sekali; kalau diminta secara khusus
  // (barberId) hasilnya kosong, bukan daftar slot kosong yang membingungkan UI.
  const workingBarbers = barbers.rows.filter((barber) => !barber.is_day_off);
  if (workingBarbers.length === 0) {
    return [];
  }

  const breaks = await pool.query<{ barber_id: string; start_time: string; end_time: string }>(
    `SELECT barber_id, start_time::text AS start_time, end_time::text AS end_time
       FROM public.blocked_slots
      WHERE slot_type = 'recurring_break' AND is_active AND day_of_week = $1`,
    [dayOfWeek],
  );

  const bookings = await pool.query<{ barber_id: string; start_time: Date; end_time: Date }>(
    `SELECT barber_id, start_time, end_time
       FROM public.bookings
      WHERE status = ANY($1::public.booking_status_enum[])
        AND start_time < $3::timestamptz
        AND end_time > $2::timestamptz`,
    [HOLDING_STATUSES, dayStartIso, dayEndIso],
  );

  const breaksByBarber = new Map<string, Interval[]>();
  for (const row of breaks.rows) {
    const list = breaksByBarber.get(row.barber_id) ?? [];
    list.push({ startMinutes: parseTimeOfDay(row.start_time), endMinutes: parseTimeOfDay(row.end_time) });
    breaksByBarber.set(row.barber_id, list);
  }

  const busyByBarber = new Map<string, Interval[]>();
  for (const row of bookings.rows) {
    if (!overlapsDay(row.start_time, row.end_time, dayStart, dayEnd)) {
      continue;
    }
    const list = busyByBarber.get(row.barber_id) ?? [];
    list.push({
      startMinutes: jakartaMinutesOf(row.start_time),
      endMinutes: jakartaMinutesOf(row.end_time),
    });
    busyByBarber.set(row.barber_id, list);
  }

  const todayJakarta = jakartaDateString(now);
  const nowMinutes =
    request.dateJakarta === todayJakarta
      ? jakartaMinutesOf(now)
      : // Tanggal yang sudah lewat tidak punya slot; tanggal ke depan tidak kena lead time.
        request.dateJakarta < todayJakarta
        ? MINUTES_PER_DAY
        : null;

  return workingBarbers.map((barber) => ({
    barberId: barber.id,
    fullName: barber.full_name,
    chairNumber: barber.chair_number,
    slots: computeAvailableSlots({
      dateJakarta: request.dateJakarta,
      openMinutes: parseTimeOfDay(barber.open_time),
      closeMinutes: parseTimeOfDay(barber.close_time),
      breaks: breaksByBarber.get(barber.id) ?? [],
      busy: busyByBarber.get(barber.id) ?? [],
      durationMinutes: request.durationMinutes,
      bufferMinutes: TURNAROUND_BUFFER_MINUTES,
      gridStepMinutes: SLOT_GRID_STEP_MINUTES,
      leadTimeMinutes: MIN_LEAD_TIME_MINUTES,
      nowMinutes,
      isDayOff: barber.is_day_off,
    }),
  }));
}