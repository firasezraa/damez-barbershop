/**
 * DAMEZ BARBERSHOP - PRODUCTION SLOT GENERATION ENGINE
 * Strict Asia/Jakarta (WIB / UTC+07:00) Timezone Standards
 * 
 * Modul inti untuk menghitung slot ketersediaan reservasi berdasarkan:
 * 1. Jam operasional gerai (10:00 - 21:00 WIB)
 * 2. Hari libur rutin barber & hari libur gerai
 * 3. Waktu istirahat bergantian (staggered breaks) per barber
 * 4. Durasi total layanan + buffer sanitasi & sterilisasi alat 10 menit
 * 5. Booking eksisting aktif (confirmed, in_progress, dan pending_payment dengan TTL 15 menit)
 * 6. Lead time pemesanan harian (mencegah booking mendadak pada hari H)
 */

import {
  getJakartaDateTimeParts,
  getJakartaDateString,
  getJakartaDayOfWeek,
  timeStringToMinutes,
  minutesToTimeString,
  createJakartaIsoString,
  isIntervalOverlapping,
  parseBookingToJakartaMinutes
} from '../utils/timezone.ts';
import type { JakartaDateTimeParts } from '../utils/timezone.ts';

// Parameter Kebijakan Baku Damez Barbershop
export const DEFAULT_TURNAROUND_BUFFER_MINUTES: number = 10;
export const DEFAULT_SLOT_GRID_STEP_MINUTES: number = 15;
export const DEFAULT_MIN_LEAD_TIME_MINUTES: number = 30; // 30 menit minimum lead time
export const DEFAULT_HOLD_TTL_MINUTES: number = 15;

export const DEFAULT_OPERATING_HOURS: { open: string; close: string } = {
  open: '10:00',
  close: '21:00'
};

export interface ServiceItem {
  id: string;
  name: string;
  duration_minutes: number;
  price_idr?: number;
}

export interface BarberBreak {
  start_time: string; // "HH:mm" atau "HH:mm:ss"
  end_time: string;   // "HH:mm" atau "HH:mm:ss"
  title?: string;
}

export interface BarberProfile {
  id: string;
  name: string;
  chair_number: number;
  regular_day_off: number; // 0 = Minggu, 1 = Senin, 2 = Selasa, dst.
  is_active: boolean;
  breaks: BarberBreak[];
  working_hours?: {
    open_time: string;
    close_time: string;
    is_day_off: boolean;
  };
}

export interface ExistingBooking {
  id: string;
  barber_id: string;
  start_time: string; // ISO 8601 String
  end_time: string;   // ISO 8601 String
  status:
    | 'pending_payment'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'no_show'
    | 'rescheduled'
    | 'cancelled'
    | 'expired';
  hold_expires_at?: string | null;
}

export interface BlockedSlotItem {
  id?: string;
  barber_id: string | null; // null jika berlaku untuk seluruh barber/kursi
  title: string;
  day_of_week?: number | null;
  start_time: string; // "HH:mm"
  end_time: string;   // "HH:mm"
  start_datetime?: string | null;
  end_datetime?: string | null;
  is_active: boolean;
}

export interface AvailableSlot {
  slot_id: string;
  time: string;             // "10:00" (format ringkas Contract-06)
  barber_id: string;
  barber_name: string;
  chair_number: number;
  start_time: string;       // ISO 8601 string dengan +07:00
  end_time: string;         // ISO 8601 string dengan +07:00
  service_duration: number; // Durasi layanan bersih (menit)
  buffer_duration: number;  // Buffer sanitasi (menit, default 10)
  total_window: number;     // Total blok waktu kursi (service + buffer)
  formatted_time: string;   // "10:00 WIB"
  available: boolean;       // Selalu true untuk slot yang lolos kalkulasi
}

export interface CalculateBarberSlotsParams {
  targetDate: string; // "YYYY-MM-DD" dalam zona waktu Asia/Jakarta
  totalDurationMinutes: number;
  barber: BarberProfile;
  existingBookings: ExistingBooking[];
  customBlockedSlots?: BlockedSlotItem[];
  turnaroundBufferMinutes?: number;
  gridStepMinutes?: number;
  minLeadTimeMinutes?: number;
  operatingHours?: {
    open: string;
    close: string;
  };
  currentTime?: Date; // Untuk determinisme pengujian waktu
}

export interface MinuteInterval {
  start: number;
  end: number;
  source: string;
}

/**
 * Menghitung ketersediaan slot untuk satu orang barber pada tanggal target tertentu.
 */
export function calculateBarberSlots(params: CalculateBarberSlotsParams): AvailableSlot[] {
  const {
    targetDate,
    totalDurationMinutes,
    barber,
    existingBookings,
    customBlockedSlots = [],
    turnaroundBufferMinutes = DEFAULT_TURNAROUND_BUFFER_MINUTES,
    gridStepMinutes = DEFAULT_SLOT_GRID_STEP_MINUTES,
    minLeadTimeMinutes = DEFAULT_MIN_LEAD_TIME_MINUTES,
    operatingHours = DEFAULT_OPERATING_HOURS,
    currentTime = new Date()
  } = params;

  // Jika barber non-aktif secara global, tidak ada slot
  if (!barber.is_active) {
    return [];
  }

  // 1. Validasi Hari Libur Rutin Barber & Jam Kerja Harian
  const dayOfWeek: number = getJakartaDayOfWeek(targetDate);

  if (barber.working_hours) {
    if (barber.working_hours.is_day_off) {
      return []; // Libur berdasarkan record working_hours
    }
  } else if (dayOfWeek === barber.regular_day_off) {
    return []; // Libur rutin mingguan
  }

  // 2. Hitung Total Window yang Dibutuhkan Kursi
  const validDuration: number = Math.max(15, totalDurationMinutes);
  const totalWindowMinutes: number = validDuration + turnaroundBufferMinutes;

  // 3. Batas Jam Buka Gerai
  const openTimeStr: string = barber.working_hours?.open_time ?? operatingHours.open;
  const closeTimeStr: string = barber.working_hours?.close_time ?? operatingHours.close;

  const shopOpenMinutes: number = timeStringToMinutes(openTimeStr);
  const shopCloseMinutes: number = timeStringToMinutes(closeTimeStr);

  // 4. Kumpulkan Seluruh Interval Pemblokir Waktu (Breaks + Blocked Slots)
  const blockedIntervals: MinuteInterval[] = [];

  // A. Jam Istirahat Rutin Barber (Staggered Break)
  barber.breaks.forEach((b: BarberBreak) => {
    blockedIntervals.push({
      start: timeStringToMinutes(b.start_time),
      end: timeStringToMinutes(b.end_time),
      source: `break:${b.title ?? 'istirahat'}`
    });
  });

  // B. Custom Blocked Slots (maintenance, libur cuti, atau blok manual)
  customBlockedSlots.forEach((slot: BlockedSlotItem) => {
    if (!slot.is_active) return;
    if (slot.barber_id !== null && slot.barber_id !== barber.id) return;

    // Cek kecocokan hari berulang (recurring day_of_week)
    if (slot.day_of_week !== null && slot.day_of_week !== undefined) {
      if (slot.day_of_week === dayOfWeek) {
        blockedIntervals.push({
          start: timeStringToMinutes(slot.start_time),
          end: timeStringToMinutes(slot.end_time),
          source: `custom_recurring:${slot.title}`
        });
      }
    }

    // Cek kecocokan tanggal spesifik (start_datetime & end_datetime)
    if (slot.start_datetime && slot.end_datetime) {
      const parsedInterval = parseBookingToJakartaMinutes(
        slot.start_datetime,
        slot.end_datetime,
        targetDate
      );
      if (parsedInterval) {
        blockedIntervals.push({
          start: parsedInterval.startMinutes,
          end: parsedInterval.endMinutes,
          source: `custom_date:${slot.title}`
        });
      }
    }
  });

  // 5. Kumpulkan Interval Booking Aktif (Active Bookings)
  const nowMs: number = currentTime.getTime();

  existingBookings.forEach((booking: ExistingBooking) => {
    // Hanya periksa booking untuk barber ini
    if (booking.barber_id !== barber.id) return;

    // Evaluasi status booking
    let isActiveBooking: boolean = false;

    if (booking.status === 'confirmed' || booking.status === 'in_progress') {
      isActiveBooking = true;
    } else if (booking.status === 'pending_payment') {
      // Temporary hold hanya berlaku jika belum kedaluwarsa (TTL 15 menit)
      if (booking.hold_expires_at) {
        const expiresMs: number = new Date(booking.hold_expires_at).getTime();
        if (expiresMs > nowMs) {
          isActiveBooking = true;
        }
      }
    }

    if (!isActiveBooking) {
      return; // Abaikan booking berstatus cancelled, expired, no_show, atau pending_payment yg expired
    }

    const bookingInterval = parseBookingToJakartaMinutes(
      booking.start_time,
      booking.end_time,
      targetDate
    );

    if (bookingInterval) {
      blockedIntervals.push({
        start: bookingInterval.startMinutes,
        end: bookingInterval.endMinutes,
        source: `booking:${booking.id}:${booking.status}`
      });
    }
  });

  // 6. Hitung Batas Lead Time untuk Pemesanan pada Hari Ini (WIB)
  const currentJakartaDate: string = getJakartaDateString(currentTime);
  const isToday: boolean = targetDate === currentJakartaDate;
  const isPastDate: boolean = targetDate < currentJakartaDate;

  // Jika tanggal yang diminta sudah lewat kalender Jakarta, tidak ada slot
  if (isPastDate) {
    return [];
  }

  const currentJakartaParts: JakartaDateTimeParts = getJakartaDateTimeParts(currentTime);
  const currentMinutesToday: number = currentJakartaParts.hour * 60 + currentJakartaParts.minute;
  const leadTimeCutoffMinutes: number = currentMinutesToday + minLeadTimeMinutes;

  const availableSlots: AvailableSlot[] = [];

  // 7. Loop Grid Waktu Diskrit (Interval per gridStepMinutes, misal 15 menit)
  for (
    let slotStart: number = shopOpenMinutes;
    slotStart + totalWindowMinutes <= shopCloseMinutes;
    slotStart += gridStepMinutes
  ) {
    const slotEnd: number = slotStart + totalWindowMinutes;

    // Filter A: Lead time minimum untuk pemesanan hari ini
    if (isToday && slotStart < leadTimeCutoffMinutes) {
      continue;
    }

    // Filter B: Tabrakan dengan jam istirahat, custom block, atau booking aktif
    const hasCollision: boolean = blockedIntervals.some((blocked: MinuteInterval) =>
      isIntervalOverlapping(slotStart, slotEnd, blocked.start, blocked.end)
    );

    if (hasCollision) {
      continue; // Slot ditolak karena tumpang tindih
    }

    // Slot Valid -> Format Respons
    const timeFormatted: string = minutesToTimeString(slotStart);
    const endTimeFormatted: string = minutesToTimeString(slotEnd);

    const startIso: string = createJakartaIsoString(targetDate, timeFormatted);
    const endIso: string = createJakartaIsoString(targetDate, endTimeFormatted);

    // Bangun ID slot unik dan terprediksi
    const cleanDate: string = targetDate.replace(/-/g, '');
    const cleanTime: string = timeFormatted.replace(':', '');
    const slotId: string = `SLT-${barber.id.slice(0, 8)}-${cleanDate}-${cleanTime}`;

    availableSlots.push({
      slot_id: slotId,
      time: timeFormatted,
      barber_id: barber.id,
      barber_name: barber.name,
      chair_number: barber.chair_number,
      start_time: startIso,
      end_time: endIso,
      service_duration: validDuration,
      buffer_duration: turnaroundBufferMinutes,
      total_window: totalWindowMinutes,
      formatted_time: `${timeFormatted} WIB`,
      available: true
    });
  }

  return availableSlots;
}

export interface MultiBarberSlotOptions {
  targetDate: string;
  totalDurationMinutes: number;
  barbers: BarberProfile[];
  existingBookings: ExistingBooking[];
  customBlockedSlots?: BlockedSlotItem[];
  selectedBarberId?: string | null; // null atau "any" untuk agregasi seluruh barber
  turnaroundBufferMinutes?: number;
  gridStepMinutes?: number;
  minLeadTimeMinutes?: number;
  operatingHours?: {
    open: string;
    close: string;
  };
  currentTime?: Date;
}

export interface AggregatedSlotResult {
  date: string;
  barber_id: string | null;
  total_duration_minutes: number;
  buffer_minutes: number;
  total_window_minutes: number;
  total_slots_count: number;
  slots: AvailableSlot[];
}

/**
 * Menghitung ketersediaan slot untuk satu atau semua barber,
 * dan mengembalikan daftar slot terurut secara kronologis.
 */
export function calculateAvailableSlotsForDate(options: MultiBarberSlotOptions): AggregatedSlotResult {
  const {
    targetDate,
    totalDurationMinutes,
    barbers,
    existingBookings,
    customBlockedSlots = [],
    selectedBarberId,
    turnaroundBufferMinutes = DEFAULT_TURNAROUND_BUFFER_MINUTES,
    gridStepMinutes = DEFAULT_SLOT_GRID_STEP_MINUTES,
    minLeadTimeMinutes = DEFAULT_MIN_LEAD_TIME_MINUTES,
    operatingHours = DEFAULT_OPERATING_HOURS,
    currentTime = new Date()
  } = options;

  // Filter barber yang relevan
  let targetBarbers: BarberProfile[] = barbers.filter((b: BarberProfile) => b.is_active);

  if (selectedBarberId && selectedBarberId !== 'any' && selectedBarberId !== 'all') {
    targetBarbers = targetBarbers.filter((b: BarberProfile) => b.id === selectedBarberId);
  }

  const allSlots: AvailableSlot[] = [];

  targetBarbers.forEach((barber: BarberProfile) => {
    const barberSlots: AvailableSlot[] = calculateBarberSlots({
      targetDate,
      totalDurationMinutes,
      barber,
      existingBookings,
      customBlockedSlots,
      turnaroundBufferMinutes,
      gridStepMinutes,
      minLeadTimeMinutes,
      operatingHours,
      currentTime
    });
    allSlots.push(...barberSlots);
  });

  // Urutkan slot secara kronologis berdasarkan waktu mulai, lalu berdasarkan nomor kursi
  allSlots.sort((a: AvailableSlot, b: AvailableSlot) => {
    if (a.time !== b.time) {
      return a.time.localeCompare(b.time);
    }
    return a.chair_number - b.chair_number;
  });

  return {
    date: targetDate,
    barber_id: selectedBarberId && selectedBarberId !== 'any' && selectedBarberId !== 'all' ? selectedBarberId : null,
    total_duration_minutes: totalDurationMinutes,
    buffer_minutes: turnaroundBufferMinutes,
    total_window_minutes: totalDurationMinutes + turnaroundBufferMinutes,
    total_slots_count: allSlots.length,
    slots: allSlots
  };
}
