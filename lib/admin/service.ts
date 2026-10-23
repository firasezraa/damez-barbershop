/**
 * DAMEZ BARBERSHOP - ADMIN PORTAL REPOSITORY & SERVICE LAYER
 * 
 * Mengelola seluruh operasi bisnis dashboard admin & kasir:
 * - Kueri daftar reservasi harian berfilter (Barber, Status, Pencarian)
 * - Matriks kalender 3 kolom kursi barber (Rian, Dimas, Kevin)
 * - Quick Action: Input Walk-in (< 15 detik), Mulai Cukur, Selesai & Kasir, No-Show
 * - Perhitungan kalkulasi kasir otomatis (Total Layanan - DP Rp 20.000)
 * - Ekspor laporan keuangan harian CSV berstandar RFC 4180
 * - Integrasi Supabase DB dengan fallback in-memory store yang mulus
 */

import { getSupabaseClient } from '../supabase/client.ts';
import { inMemoryHoldsStore } from '../slots/auto-expire.ts';
import { SEED_BARBERS, SEED_SERVICES } from '../slots/service.ts';
import { trackTelemetryEvent } from '../analytics/telemetry.ts';
import {
  getJakartaDateString,
  getJakartaTimeString,
  getJakartaDayOfWeek,
  timeStringToMinutes,
  minutesToTimeString
} from '../utils/timezone.ts';
import type {
  AdminBookingItem,
  AdminBookingFilters,
  AdminDailyStats,
  QuickWalkInParams,
  CompleteBookingParams,
  MarkNoShowParams,
  CreateBlockSlotParams,
  AdminBarberColumn,
  AdminCalendarSlot
} from './types.ts';
import type { BookingStatus, BookingType, SettlementMethod } from '../../types/database.types.ts';

// Master time slots (10:00 - 20:00 WIB, interval 45-60 menit)
export const OPERATING_SLOT_HOURS: string[] = [
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00'
];

export const FLAT_DP_AMOUNT: number = 20000;

// In-Memory store untuk development, testing, dan offline fallback
let mockBookingsStore: AdminBookingItem[] = [];
let mockBlockedSlotsStore: {
  id: string;
  barber_id: string | null;
  day_of_week?: number | null;
  booking_date?: string;
  start_time: string;
  end_time: string;
  title: string;
  reason?: string | null;
  is_active: boolean;
}[] = [];

/**
 * Inisialisasi mock data dengan data realistis sesuai panduan SOP gerai Damez
 */
export function initializeSeedMockData(targetDate?: string): void {
  const date: string = targetDate || getJakartaDateString();

  mockBookingsStore = [
    {
      id: 'mock-bk-001',
      booking_code: `DMZ-${date.replace(/-/g, '')}-001`,
      customer_id: 'cust-001',
      customer_name: 'Budi Santoso',
      customer_phone: '081234567890',
      customer_email: 'budi@example.com',
      barber_id: 'b0000001-0000-0000-0000-000000000001',
      barber_name: 'Rian Pratama',
      barber_chair: 1,
      booking_date: date,
      booking_type: 'online',
      status: 'confirmed',
      start_time: '10:00',
      end_time: '10:45',
      service_duration_minutes: 45,
      buffer_minutes: 10,
      service_ids: ['a0000001-0000-0000-0000-000000000001'],
      service_names: ['Gentlemen Classic Haircut'],
      total_price_idr: 50000,
      down_payment_idr: 20000,
      remaining_balance_idr: 30000,
      settlement_method: 'none',
      settlement_paid_at: null,
      notes: 'Tamu minta potongan agak tipis di samping',
      created_at: `${date}T02:00:00.000Z`,
      updated_at: `${date}T02:05:00.000Z`
    },
    {
      id: 'mock-bk-002',
      booking_code: `DMZ-${date.replace(/-/g, '')}-002`,
      customer_id: 'cust-002',
      customer_name: 'Hendra Wijaya',
      customer_phone: '081298765432',
      customer_email: 'hendra@example.com',
      barber_id: 'b0000001-0000-0000-0000-000000000002',
      barber_name: 'Dimas Arisandi',
      barber_chair: 2,
      booking_date: date,
      booking_type: 'online',
      status: 'confirmed',
      start_time: '10:00',
      end_time: '10:50',
      service_duration_minutes: 50,
      buffer_minutes: 10,
      service_ids: ['a0000001-0000-0000-0000-000000000002'],
      service_names: ['Executive Precision Fade'],
      total_price_idr: 65000,
      down_payment_idr: 20000,
      remaining_balance_idr: 45000,
      settlement_method: 'none',
      settlement_paid_at: null,
      notes: null,
      created_at: `${date}T02:10:00.000Z`,
      updated_at: `${date}T02:15:00.000Z`
    },
    {
      id: 'mock-bk-003',
      booking_code: `DMZ-${date.replace(/-/g, '')}-003`,
      customer_id: 'cust-003',
      customer_name: 'Reza Pahlevi',
      customer_phone: '081311223344',
      customer_email: 'reza@example.com',
      barber_id: 'b0000001-0000-0000-0000-000000000003',
      barber_name: 'Kevin Sanjaya',
      barber_chair: 3,
      booking_date: date,
      booking_type: 'online',
      status: 'completed',
      start_time: '10:00',
      end_time: '10:30',
      service_duration_minutes: 30,
      buffer_minutes: 10,
      service_ids: ['a0000001-0000-0000-0000-000000000004'],
      service_names: ['Hot Towel Royal Shave'],
      total_price_idr: 35000,
      down_payment_idr: 20000,
      remaining_balance_idr: 15000,
      settlement_method: 'cash',
      settlement_paid_at: `${date}T03:35:00.000Z`,
      cashier_amount_received: 20000,
      cashier_change_given: 5000,
      notes: 'Lunas tunai di kasir',
      created_at: `${date}T01:30:00.000Z`,
      updated_at: `${date}T03:35:00.000Z`
    },
    {
      id: 'mock-bk-004',
      booking_code: `DMZ-${date.replace(/-/g, '')}-004`,
      customer_id: 'cust-004',
      customer_name: 'Aris Munandar',
      customer_phone: '081555667788',
      customer_email: 'aris@example.com',
      barber_id: 'b0000001-0000-0000-0000-000000000001',
      barber_name: 'Rian Pratama',
      barber_chair: 1,
      booking_date: date,
      booking_type: 'online',
      status: 'in_progress',
      start_time: '11:00',
      end_time: '11:45',
      service_duration_minutes: 45,
      buffer_minutes: 10,
      service_ids: ['a0000001-0000-0000-0000-000000000001'],
      service_names: ['Gentlemen Classic Haircut'],
      total_price_idr: 50000,
      down_payment_idr: 20000,
      remaining_balance_idr: 30000,
      settlement_method: 'none',
      settlement_paid_at: null,
      notes: 'Tamu sudah duduk di kursi 1',
      created_at: `${date}T03:00:00.000Z`,
      updated_at: `${date}T04:05:00.000Z`
    },
    {
      id: 'mock-bk-005',
      booking_code: `DMZ-${date.replace(/-/g, '')}-005`,
      customer_id: 'cust-005',
      customer_name: 'Agus Subekti (Walk-In)',
      customer_phone: '081700998811',
      customer_email: null,
      barber_id: 'b0000001-0000-0000-0000-000000000003',
      barber_name: 'Kevin Sanjaya',
      barber_chair: 3,
      booking_date: date,
      booking_type: 'walk_in',
      status: 'in_progress',
      start_time: '11:00',
      end_time: '11:45',
      service_duration_minutes: 45,
      buffer_minutes: 10,
      service_ids: ['a0000001-0000-0000-0000-000000000001'],
      service_names: ['Gentlemen Classic Haircut'],
      total_price_idr: 50000,
      down_payment_idr: 0,
      remaining_balance_idr: 50000,
      settlement_method: 'none',
      settlement_paid_at: null,
      notes: 'Tamu langsung datang di lokasi',
      created_at: `${date}T04:00:00.000Z`,
      updated_at: `${date}T04:00:00.000Z`
    },
    {
      id: 'mock-bk-006',
      booking_code: `DMZ-${date.replace(/-/g, '')}-006`,
      customer_id: 'cust-006',
      customer_name: 'Satria Yudha',
      customer_phone: '081922334455',
      customer_email: 'satria@example.com',
      barber_id: 'b0000001-0000-0000-0000-000000000003',
      barber_name: 'Kevin Sanjaya',
      barber_chair: 3,
      booking_date: date,
      booking_type: 'online',
      status: 'confirmed',
      start_time: '13:00',
      end_time: '14:00',
      service_duration_minutes: 60,
      buffer_minutes: 10,
      service_ids: ['a0000001-0000-0000-0000-000000000008'],
      service_names: ['Damez Signature Full Grooming Combo'],
      total_price_idr: 95000,
      down_payment_idr: 20000,
      remaining_balance_idr: 75000,
      settlement_method: 'none',
      settlement_paid_at: null,
      notes: null,
      created_at: `${date}T05:00:00.000Z`,
      updated_at: `${date}T05:05:00.000Z`
    }
  ];

  mockBlockedSlotsStore = [
    {
      id: 'block-001',
      barber_id: 'b0000001-0000-0000-0000-000000000001',
      booking_date: date,
      start_time: '12:00',
      end_time: '12:55',
      title: 'Istirahat Siang',
      reason: 'Jadwal Istirahat Bergantian Rian',
      is_active: true
    },
    {
      id: 'block-002',
      barber_id: 'b0000001-0000-0000-0000-000000000002',
      booking_date: date,
      start_time: '13:00',
      end_time: '13:55',
      title: 'Istirahat Siang',
      reason: 'Jadwal Istirahat Bergantian Dimas',
      is_active: true
    },
    {
      id: 'block-003',
      barber_id: 'b0000001-0000-0000-0000-000000000003',
      booking_date: date,
      start_time: '14:00',
      end_time: '14:55',
      title: 'Istirahat Siang',
      reason: 'Jadwal Istirahat Bergantian Kevin',
      is_active: true
    }
  ];
}

// Inisialisasi awal
initializeSeedMockData();

export function resetAdminMockStore(targetDate?: string): void {
  initializeSeedMockData(targetDate);
}

export function getMockBookings(): AdminBookingItem[] {
  return [...mockBookingsStore];
}

/**
 * Mengevaluasi keterlambatan tamu berdasarkan jam server WIB
 */
function evaluateLateFlags(booking: AdminBookingItem, now: Date = new Date()): AdminBookingItem {
  if (booking.status !== 'confirmed') {
    return { ...booking, is_late_warning: false, is_past_tolerance: false };
  }

  const currentDate: string = getJakartaDateString(now);
  if (booking.booking_date !== currentDate) {
    return { ...booking, is_late_warning: false, is_past_tolerance: false };
  }

  const currentMinutes: number = timeStringToMinutes(getJakartaTimeString(now));
  const slotMinutes: number = timeStringToMinutes(booking.start_time);
  const diffMinutes: number = currentMinutes - slotMinutes;

  return {
    ...booking,
    is_late_warning: diffMinutes >= 10 && diffMinutes < 15,
    is_past_tolerance: diffMinutes >= 15
  };
}

/**
 * Mengambil daftar reservasi berfilter untuk portal admin
 */
export async function getAdminDailyBookings(
  filters: AdminBookingFilters = {},
  now: Date = new Date()
): Promise<AdminBookingItem[]> {
  const targetDate: string = filters.date || getJakartaDateString(now);
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          id,
          booking_code,
          customer_id,
          customer_name,
          customer_phone,
          customer_email,
          barber_id,
          booking_date,
          booking_type,
          status,
          start_time,
          end_time,
          service_duration_minutes,
          buffer_minutes,
          total_price_idr,
          down_payment_idr,
          remaining_balance_idr,
          settlement_method,
          settlement_paid_at,
          hold_expires_at,
          confirmed_at,
          completed_at,
          cancelled_at,
          cancellation_reason,
          notes,
          created_at,
          updated_at,
          barbers (
            id,
            name,
            chair_number
          ),
          booking_services (
            service_id,
            services (
              id,
              name,
              price_idr
            )
          ),
          payments (
            id,
            payment_type,
            gross_amount,
            status
          )
        `)
        .eq('booking_date', targetDate)
        .order('start_time', { ascending: true });

      if (filters.barberId && filters.barberId !== 'all') {
        query = query.eq('barber_id', filters.barberId);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.bookingType && filters.bookingType !== 'all') {
        query = query.eq('booking_type', filters.bookingType);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        let results: AdminBookingItem[] = data.map((b: any) => {
          const barber = b.barbers || {};
          const serviceNames: string[] = [];
          const serviceIds: string[] = [];

          if (Array.isArray(b.booking_services)) {
            b.booking_services.forEach((bs: any) => {
              if (bs.services) {
                serviceIds.push(bs.services.id);
                serviceNames.push(bs.services.name);
              }
            });
          }

          // Ekstraksi waktu dari start_time format ISO atau HH:mm
          let formattedStartTime = b.start_time;
          let formattedEndTime = b.end_time;
          if (formattedStartTime.includes('T')) {
            const startDate = new Date(formattedStartTime);
            formattedStartTime = getJakartaTimeString(startDate);
          }
          if (formattedEndTime.includes('T')) {
            const endDate = new Date(formattedEndTime);
            formattedEndTime = getJakartaTimeString(endDate);
          }

          const item: AdminBookingItem = {
            id: b.id,
            booking_code: b.booking_code,
            customer_id: b.customer_id,
            customer_name: b.customer_name,
            customer_phone: b.customer_phone,
            customer_email: b.customer_email,
            barber_id: b.barber_id,
            barber_name: barber.name || 'Barber Damez',
            barber_chair: barber.chair_number || 1,
            booking_date: b.booking_date,
            booking_type: b.booking_type,
            status: b.status,
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            service_duration_minutes: b.service_duration_minutes,
            buffer_minutes: b.buffer_minutes,
            service_ids: serviceIds,
            service_names: serviceNames.length > 0 ? serviceNames : ['Gentlemen Classic Haircut'],
            total_price_idr: b.total_price_idr,
            down_payment_idr: b.down_payment_idr,
            remaining_balance_idr: b.remaining_balance_idr,
            settlement_method: b.settlement_method || 'none',
            settlement_paid_at: b.settlement_paid_at,
            hold_expires_at: b.hold_expires_at,
            confirmed_at: b.confirmed_at,
            completed_at: b.completed_at,
            cancelled_at: b.cancelled_at,
            cancellation_reason: b.cancellation_reason,
            notes: b.notes,
            created_at: b.created_at,
            updated_at: b.updated_at
          };

          return evaluateLateFlags(item, now);
        });

        if (filters.searchQuery && filters.searchQuery.trim() !== '') {
          const q = filters.searchQuery.toLowerCase().trim();
          results = results.filter(
            (b) =>
              b.customer_name.toLowerCase().includes(q) ||
              b.booking_code.toLowerCase().includes(q) ||
              b.customer_phone.includes(q)
          );
        }

        return results;
      }
    } catch {
      // Graceful fallback to mock store
    }
  }

  // Fallback In-Memory / Mock Store
  // Merge any active holds from inMemoryHoldsStore for targetDate
  for (const hold of inMemoryHoldsStore.values()) {
    if (hold.booking_date === targetDate && !mockBookingsStore.some((b) => b.id === hold.id)) {
      const barber = SEED_BARBERS.find((b) => b.id === hold.barber_id) || SEED_BARBERS[0];
      const defaultSrvId = 'a0000001-0000-0000-0000-000000000001';
      const serviceName = SEED_SERVICES[defaultSrvId]?.name || 'Gentlemen Classic Haircut';
      mockBookingsStore.push({
        id: hold.id,
        booking_code: hold.booking_code,
        customer_name: hold.customer_name,
        customer_phone: hold.customer_phone,
        customer_email: hold.customer_email || undefined,
        barber_id: hold.barber_id,
        barber_name: barber.name,
        barber_chair: barber.chair_number || 1,
        booking_date: hold.booking_date,
        booking_type: 'online',
        status: hold.status,
        start_time: hold.start_time.includes('T') ? hold.start_time.substring(11, 16) : hold.start_time.substring(0, 5),
        end_time: hold.end_time.includes('T') ? hold.end_time.substring(11, 16) : hold.end_time.substring(0, 5),
        service_duration_minutes: hold.service_duration_minutes,
        buffer_minutes: hold.buffer_minutes,
        service_ids: [defaultSrvId],
        service_names: [serviceName],
        total_price_idr: hold.total_price_idr,
        down_payment_idr: hold.down_payment_idr,
        remaining_balance_idr: hold.remaining_balance_idr,
        settlement_method: 'none',
        hold_expires_at: hold.hold_expires_at,
        created_at: hold.created_at,
        updated_at: hold.created_at
      });
    }
  }

  let results = mockBookingsStore.filter((b) => b.booking_date === targetDate);

  if (filters.barberId && filters.barberId !== 'all') {
    results = results.filter((b) => b.barber_id === filters.barberId);
  }

  if (filters.status && filters.status !== 'all') {
    results = results.filter((b) => b.status === filters.status);
  }

  if (filters.bookingType && filters.bookingType !== 'all') {
    results = results.filter((b) => b.booking_type === filters.bookingType);
  }

  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    const q = filters.searchQuery.toLowerCase().trim();
    results = results.filter(
      (b) =>
        b.customer_name.toLowerCase().includes(q) ||
        b.booking_code.toLowerCase().includes(q) ||
        b.customer_phone.includes(q)
    );
  }

  return results.map((b) => evaluateLateFlags(b, now));
}

/**
 * Menghitung matriks kalender harian 3 kolom barber
 */
export async function getAdminCalendarMatrix(
  date: string,
  now: Date = new Date()
): Promise<AdminBarberColumn[]> {
  const bookings = await getAdminDailyBookings({ date }, now);
  const dayOfWeek = getJakartaDayOfWeek(date);

  // Ambil blocked slots untuk tanggal ini
  const blockedForDate = mockBlockedSlotsStore.filter(
    (b) => (b.booking_date === date || b.day_of_week === dayOfWeek) && b.is_active
  );

  const columns: AdminBarberColumn[] = SEED_BARBERS.map((barber) => {
    const isOffToday = barber.regular_day_off === dayOfWeek;

    const slots: AdminCalendarSlot[] = OPERATING_SLOT_HOURS.map((hourStr) => {
      // 1. Cek jika barber libur hari ini
      if (isOffToday) {
        return {
          slot_time: hourStr,
          barber_id: barber.id,
          chair_number: barber.chair_number,
          status: 'blocked',
          block_title: 'HARI LIBUR RUTIN',
          block_reason: `Barber ${barber.name} libur terjadwal`
        };
      }

      // 2. Cek apakah ada blocked slot / jam istirahat
      const blocked = blockedForDate.find((blk) => {
        if (blk.barber_id && blk.barber_id !== barber.id) return false;
        const slotMin = timeStringToMinutes(hourStr);
        const startMin = timeStringToMinutes(blk.start_time);
        const endMin = timeStringToMinutes(blk.end_time);
        return slotMin >= startMin && slotMin < endMin;
      });

      if (blocked) {
        return {
          slot_time: hourStr,
          barber_id: barber.id,
          chair_number: barber.chair_number,
          status: 'blocked',
          block_title: blocked.title.toUpperCase(),
          block_reason: blocked.reason || 'Istirahat / Pemeliharaan'
        };
      }

      // 3. Cek apakah ada booking aktif pada jam ini untuk barber ini
      const matchingBooking = bookings.find((b) => {
        if (b.barber_id !== barber.id) return false;
        if (['cancelled', 'expired'].includes(b.status)) return false;

        const slotMin = timeStringToMinutes(hourStr);
        const bStartMin = timeStringToMinutes(b.start_time);
        const bEndMin = timeStringToMinutes(b.end_time) + b.buffer_minutes;
        return slotMin >= bStartMin && slotMin < bEndMin;
      });

      if (matchingBooking) {
        let slotStatus: AdminCalendarSlot['status'] = 'confirmed';
        if (matchingBooking.status === 'in_progress') {
          slotStatus = 'in_progress';
        } else if (matchingBooking.status === 'completed') {
          slotStatus = 'completed';
        } else if (matchingBooking.status === 'no_show') {
          slotStatus = 'no_show';
        } else if (matchingBooking.booking_type === 'walk_in') {
          slotStatus = 'walk_in';
        }

        return {
          slot_time: hourStr,
          barber_id: barber.id,
          chair_number: barber.chair_number,
          status: slotStatus,
          booking: matchingBooking,
          is_late_warning: matchingBooking.is_late_warning
        };
      }

      // 4. Slot Kosong Siap Isi
      return {
        slot_time: hourStr,
        barber_id: barber.id,
        chair_number: barber.chair_number,
        status: 'empty'
      };
    });

    return {
      id: barber.id,
      name: barber.name,
      nickname: barber.name.split(' ')[0],
      chair_number: barber.chair_number,
      title: `Kursi ${barber.chair_number}`,
      specialty: barber.name.includes('Rian')
        ? 'The Sculptor'
        : barber.name.includes('Dimas')
        ? 'Fade Master'
        : 'Royal Groomer',
      regular_day_off: barber.regular_day_off,
      is_off_today: isOffToday,
      slots
    };
  });

  return columns;
}

/**
 * SOP 3: Input Tamu Walk-In Cepat (< 15 Detik)
 * Langsung mengunci kursi dan menerbitkan booking walk-in di kasir
 */
export async function createAdminWalkIn(
  params: QuickWalkInParams
): Promise<{ success: boolean; booking?: AdminBookingItem; error?: string }> {
  const date = params.booking_date || getJakartaDateString();
  const customerName = params.customer_name?.trim() || 'Tamu Walk-In';
  const customerPhone = params.customer_phone?.trim() || '080000000000';
  const barberId = params.barber_id;

  const barber = SEED_BARBERS.find((b) => b.id === barberId);
  if (!barber) {
    return { success: false, error: 'Barber yang dipilih tidak valid.' };
  }

  // Hitung total harga & durasi layanan
  const serviceIds = params.service_ids && params.service_ids.length > 0
    ? params.service_ids
    : ['a0000001-0000-0000-0000-000000000001'];

  let totalDurationMinutes = 0;
  let totalPriceIdr = 0;
  const serviceNames: string[] = [];

  for (const sId of serviceIds) {
    const srv = SEED_SERVICES[sId];
    if (srv) {
      totalDurationMinutes += srv.duration_minutes;
      totalPriceIdr += srv.price_idr;
      serviceNames.push(srv.name);
    }
  }

  if (totalDurationMinutes === 0) {
    totalDurationMinutes = 45;
    totalPriceIdr = 50000;
    serviceNames.push('Gentlemen Classic Haircut');
  }

  // Hitung waktu selesai
  const startTime = params.start_time;
  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = startMinutes + totalDurationMinutes;
  const endTime = minutesToTimeString(endMinutes);

  const initialStatus: BookingStatus =
    params.action_mode === 'start_now' ? 'in_progress' : 'confirmed';

  const bookingCode = `DMZ-WALKIN-${Date.now().toString(36).toUpperCase()}`;

  const newBooking: AdminBookingItem = {
    id: `walkin-${Date.now()}`,
    booking_code: bookingCode,
    customer_id: null,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: null,
    barber_id: barber.id,
    barber_name: barber.name,
    barber_chair: barber.chair_number,
    booking_date: date,
    booking_type: 'walk_in',
    status: initialStatus,
    start_time: startTime,
    end_time: endTime,
    service_duration_minutes: totalDurationMinutes,
    buffer_minutes: 10,
    service_ids: serviceIds,
    service_names: serviceNames,
    total_price_idr: totalPriceIdr,
    down_payment_idr: 0, // Walk-in tanpa DP online
    remaining_balance_idr: totalPriceIdr,
    settlement_method: 'none',
    settlement_paid_at: null,
    notes: params.notes || 'Input Cepat Kasir (Walk-In)',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Simpan ke Supabase jika tersedia
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('bookings').insert({
        booking_code: newBooking.booking_code,
        customer_name: newBooking.customer_name,
        customer_phone: newBooking.customer_phone,
        barber_id: newBooking.barber_id,
        booking_date: newBooking.booking_date,
        booking_type: 'walk_in',
        status: newBooking.status,
        start_time: `${date}T${startTime}:00+07:00`,
        end_time: `${date}T${endTime}:00+07:00`,
        service_duration_minutes: newBooking.service_duration_minutes,
        buffer_minutes: 10,
        total_price_idr: newBooking.total_price_idr,
        down_payment_idr: 0,
        remaining_balance_idr: newBooking.total_price_idr,
        notes: newBooking.notes
      });
    } catch {
      // Tetap lanjutkan penyimpanan ke local/mock store
    }
  }

  mockBookingsStore.unshift(newBooking);
  return { success: true, booking: newBooking };
}

function ensureBookingInAdminStore(bookingId: string): number {
  let index = mockBookingsStore.findIndex((b) => b.id === bookingId);
  if (index === -1 && inMemoryHoldsStore.has(bookingId)) {
    const hold = inMemoryHoldsStore.get(bookingId)!;
    const barber = SEED_BARBERS.find((b) => b.id === hold.barber_id) || SEED_BARBERS[0];
    const defaultSrvId = 'a0000001-0000-0000-0000-000000000001';
    const serviceName = SEED_SERVICES[defaultSrvId]?.name || 'Gentlemen Classic Haircut';
    mockBookingsStore.push({
      id: hold.id,
      booking_code: hold.booking_code,
      customer_name: hold.customer_name,
      customer_phone: hold.customer_phone,
      customer_email: hold.customer_email || undefined,
      barber_id: hold.barber_id,
      barber_name: barber.name,
      barber_chair: barber.chair_number || 1,
      booking_date: hold.booking_date,
      booking_type: 'online',
      status: hold.status,
      start_time: hold.start_time.includes('T') ? hold.start_time.substring(11, 16) : hold.start_time.substring(0, 5),
      end_time: hold.end_time.includes('T') ? hold.end_time.substring(11, 16) : hold.end_time.substring(0, 5),
      service_duration_minutes: hold.service_duration_minutes,
      buffer_minutes: hold.buffer_minutes,
      service_ids: [defaultSrvId],
      service_names: [serviceName],
      total_price_idr: hold.total_price_idr,
      down_payment_idr: hold.down_payment_idr,
      remaining_balance_idr: hold.remaining_balance_idr,
      settlement_method: 'none',
      hold_expires_at: hold.hold_expires_at,
      created_at: hold.created_at,
      updated_at: hold.created_at
    });
    index = mockBookingsStore.length - 1;
  }
  return index;
}

/**
 * SOP 1: Memulai Layanan Kursi (confirmed -> in_progress)
 */
export async function startBookingService(
  bookingId: string
): Promise<{ success: boolean; booking?: AdminBookingItem; error?: string }> {
  const index = ensureBookingInAdminStore(bookingId);
  if (index === -1) {
    return { success: false, error: 'Pemesanan tidak ditemukan.' };
  }

  const existing = mockBookingsStore[index];
  if (existing.status !== 'confirmed') {
    return {
      success: false,
      error: `Hanya status 'confirmed' yang dapat dimulai. Status saat ini: ${existing.status}`
    };
  }

  const updated: AdminBookingItem = {
    ...existing,
    status: 'in_progress',
    updated_at: new Date().toISOString()
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('bookings')
        .update({ status: 'in_progress', updated_at: updated.updated_at })
        .eq('id', bookingId);
    } catch {
      // Ignored for offline
    }
  }

  mockBookingsStore[index] = updated;
  if (inMemoryHoldsStore.has(bookingId)) {
    inMemoryHoldsStore.get(bookingId)!.status = 'in_progress';
  }

  // Telemetri: Tamu hadir di kursi
  trackTelemetryEvent({
    event_type: 'customer_arrived',
    barber_id: existing.barber_id,
    booking_code: existing.booking_code
  }).catch(() => {});

  return { success: true, booking: updated };
}

/**
 * SOP 2: Selesaikan Layanan & Pelunasan Kasir
 * Rumus: Sisa Bayar = Total Layanan - DP (Rp 20.000 jika online, 0 jika walk-in)
 */
export async function completeBookingCheckout(
  params: CompleteBookingParams
): Promise<{ success: boolean; booking?: AdminBookingItem; change?: number; error?: string }> {
  const index = ensureBookingInAdminStore(params.booking_id);
  if (index === -1) {
    return { success: false, error: 'Pemesanan tidak ditemukan.' };
  }

  const existing = mockBookingsStore[index];
  const remainingDue = existing.remaining_balance_idr;

  let change = 0;
  if (params.settlement_method === 'cash') {
    const received = params.cash_amount_received ?? remainingDue;
    if (received < remainingDue) {
      return {
        success: false,
        error: `Nominal uang tunai diterima (Rp ${received.toLocaleString()}) kurang dari sisa tagihan (Rp ${remainingDue.toLocaleString()}).`
      };
    }
    change = received - remainingDue;
  }

  const completedAt = params.completed_at || new Date().toISOString();

  const updated: AdminBookingItem = {
    ...existing,
    status: 'completed',
    settlement_method: params.settlement_method,
    settlement_paid_at: completedAt,
    completed_at: completedAt,
    cashier_amount_received: params.settlement_method === 'cash' ? params.cash_amount_received : remainingDue,
    cashier_change_given: change,
    notes: params.notes ? `${existing.notes || ''} | ${params.notes}` : existing.notes,
    updated_at: new Date().toISOString()
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('bookings')
        .update({
          status: 'completed',
          settlement_method: params.settlement_method,
          settlement_paid_at: completedAt,
          completed_at: completedAt,
          remaining_balance_idr: 0,
          updated_at: updated.updated_at
        })
        .eq('id', params.booking_id);
    } catch {
      // Ignored for offline
    }
  }

  mockBookingsStore[index] = updated;
  if (inMemoryHoldsStore.has(params.booking_id)) {
    inMemoryHoldsStore.get(params.booking_id)!.status = 'completed';
  }

  // Telemetri: Layanan cukur selesai & transaksi kasir tuntas
  trackTelemetryEvent({
    event_type: 'service_completed',
    barber_id: existing.barber_id,
    booking_code: existing.booking_code,
    amount: existing.total_price_idr
  }).catch(() => {});

  return { success: true, booking: updated, change };
}

/**
 * SOP 5: Menandai Tamu No-Show & Melepas Kursi
 * Uang Muka DP Rp 20.000 dinyatakan hangus
 */
export async function markBookingNoShow(
  params: MarkNoShowParams
): Promise<{ success: boolean; booking?: AdminBookingItem; error?: string }> {
  const index = ensureBookingInAdminStore(params.booking_id);
  if (index === -1) {
    return { success: false, error: 'Pemesanan tidak ditemukan.' };
  }

  const existing = mockBookingsStore[index];
  const cancelledAt = new Date().toISOString();

  const updated: AdminBookingItem = {
    ...existing,
    status: 'no_show',
    cancelled_at: cancelledAt,
    cancellation_reason: params.reason || 'Toleransi kedatangan 15 menit habis (No-Show). DP Hangus.',
    updated_at: cancelledAt
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('bookings')
        .update({
          status: 'no_show',
          cancelled_at: cancelledAt,
          cancellation_reason: updated.cancellation_reason,
          updated_at: cancelledAt
        })
        .eq('id', params.booking_id);
    } catch {
      // Ignored for offline
    }
  }

  mockBookingsStore[index] = updated;
  if (inMemoryHoldsStore.has(params.booking_id)) {
    inMemoryHoldsStore.get(params.booking_id)!.status = 'no_show';
  }

  // Telemetri: Tamu dinyatakan No-Show, DP hangus
  trackTelemetryEvent({
    event_type: 'booking_no_show',
    barber_id: existing.barber_id,
    booking_code: existing.booking_code,
    amount: existing.down_payment_idr,
    metadata: {
      reason: updated.cancellation_reason
    }
  }).catch(() => {});

  return { success: true, booking: updated };
}

/**
 * SOP 4: Pemblokiran Kursi Darurat / Istirahat
 */
export async function createAdminBlockedSlot(
  params: CreateBlockSlotParams
): Promise<{ success: boolean; error?: string }> {
  if (!params.start_time || !params.end_time || !params.title) {
    return { success: false, error: 'Jam mulai, jam selesai, dan judul wajib diisi.' };
  }

  const newBlock = {
    id: `blk-${Date.now()}`,
    barber_id: params.barber_id,
    day_of_week: params.day_of_week ?? null,
    booking_date: params.booking_date || getJakartaDateString(),
    start_time: params.start_time,
    end_time: params.end_time,
    title: params.title,
    reason: params.reason || null,
    is_active: true
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('blocked_slots').insert({
        barber_id: params.barber_id,
        day_of_week: params.day_of_week,
        start_time: params.start_time,
        end_time: params.end_time,
        title: params.title,
        reason: params.reason,
        slot_type: params.slot_type || 'custom_block',
        is_active: true
      });
    } catch {
      // Ignored for offline
    }
  }

  mockBlockedSlotsStore.push(newBlock);
  return { success: true };
}

/**
 * Menghitung rekapitulasi harian (Daily Stats & Rekonsiliasi Kas 3 Pos)
 */
export async function getDailyStats(
  date: string,
  now: Date = new Date()
): Promise<AdminDailyStats> {
  const bookings = await getAdminDailyBookings({ date }, now);

  const totalSlots = OPERATING_SLOT_HOURS.length * 3; // 11 jam x 3 kursi = 33 slot potensi
  let bookedSlots = 0;
  let totalDpOnline = 0;
  let totalCashierCash = 0;
  let totalCashierQris = 0;
  let totalNoshowForfeitedDp = 0;

  let completedCount = 0;
  let inProgressCount = 0;
  let confirmedCount = 0;
  let noshowCount = 0;
  let walkInCount = 0;

  for (const b of bookings) {
    if (b.status !== 'cancelled' && b.status !== 'expired') {
      bookedSlots++;
    }

    if (b.booking_type === 'walk_in') {
      walkInCount++;
    }

    if (b.status === 'confirmed') {
      confirmedCount++;
      if (b.booking_type === 'online') {
        totalDpOnline += b.down_payment_idr;
      }
    } else if (b.status === 'in_progress') {
      inProgressCount++;
      if (b.booking_type === 'online') {
        totalDpOnline += b.down_payment_idr;
      }
    } else if (b.status === 'completed') {
      completedCount++;
      if (b.booking_type === 'online') {
        totalDpOnline += b.down_payment_idr;
      }

      if (b.settlement_method === 'cash') {
        totalCashierCash += b.remaining_balance_idr;
      } else if (b.settlement_method === 'qris') {
        totalCashierQris += b.remaining_balance_idr;
      }
    } else if (b.status === 'no_show') {
      noshowCount++;
      if (b.booking_type === 'online') {
        totalNoshowForfeitedDp += b.down_payment_idr;
      }
    }
  }

  // Rumus Omzet Bersih Toko (SOP 6 Bab 9.2):
  // Omzet = Total DP Online + Total Kasir Tunai + Total Kasir QRIS + DP No-Show Hangus
  const totalNetRevenue = totalDpOnline + totalCashierCash + totalCashierQris + totalNoshowForfeitedDp;
  const occupancyRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

  return {
    date,
    total_slots: totalSlots,
    booked_slots: bookedSlots,
    occupancy_rate_percent: occupancyRate,
    total_dp_online_idr: totalDpOnline,
    total_cashier_cash_idr: totalCashierCash,
    total_cashier_qris_idr: totalCashierQris,
    total_noshow_forfeited_dp_idr: totalNoshowForfeitedDp,
    total_net_revenue_idr: totalNetRevenue,
    completed_count: completedCount,
    in_progress_count: inProgressCount,
    confirmed_count: confirmedCount,
    noshow_count: noshowCount,
    walk_in_count: walkInCount
  };
}

/**
 * SOP 6: Menghasilkan Laporan Keuangan Harian dalam Format CSV (RFC 4180)
 */
export async function generateDailyRevenueCsv(
  date: string,
  now: Date = new Date()
): Promise<string> {
  const bookings = await getAdminDailyBookings({ date }, now);
  const stats = await getDailyStats(date, now);

  const escapeCsv = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    'Kode Booking',
    'Tanggal',
    'Waktu Mulai',
    'Waktu Selesai',
    'Nama Pelanggan',
    'Nomor WhatsApp',
    'Kursi / Barber',
    'Layanan',
    'Durasi (Menit)',
    'Tipe Booking',
    'Status Booking',
    'DP Online (Rp)',
    'Pelunasan Kasir Tunai (Rp)',
    'Pelunasan Kasir QRIS (Rp)',
    'Sisa Tagihan (Rp)',
    'Total Transaksi (Rp)',
    'Metode Pelunasan',
    'Waktu Selesai',
    'Catatan Operasional'
  ];

  const rows: string[] = [headers.join(',')];

  for (const b of bookings) {
    const cashPaid = b.status === 'completed' && b.settlement_method === 'cash' ? b.remaining_balance_idr : 0;
    const qrisPaid = b.status === 'completed' && b.settlement_method === 'qris' ? b.remaining_balance_idr : 0;

    const row = [
      escapeCsv(b.booking_code),
      escapeCsv(b.booking_date),
      escapeCsv(b.start_time),
      escapeCsv(b.end_time),
      escapeCsv(b.customer_name),
      escapeCsv(b.customer_phone),
      escapeCsv(`Kursi ${b.barber_chair} - ${b.barber_name}`),
      escapeCsv(b.service_names.join(' + ')),
      escapeCsv(b.service_duration_minutes),
      escapeCsv(b.booking_type === 'online' ? 'Online Web' : 'Walk-In Kasir'),
      escapeCsv(b.status.toUpperCase()),
      escapeCsv(b.down_payment_idr),
      escapeCsv(cashPaid),
      escapeCsv(qrisPaid),
      escapeCsv(b.status === 'completed' ? 0 : b.remaining_balance_idr),
      escapeCsv(b.total_price_idr),
      escapeCsv(b.settlement_method.toUpperCase()),
      escapeCsv(b.completed_at ? b.completed_at.substring(11, 16) + ' WIB' : '-'),
      escapeCsv(b.notes || '-')
    ];

    rows.push(row.join(','));
  }

  // Tambahkan Blok Rekonsiliasi 3 Pos Keuangan (SOP 6 Bab 9.2)
  rows.push('');
  rows.push('========================================================================================');
  rows.push(`"RINGKASAN REKONSILIASI KAS HARIAN DAMEZ BARBERSHOP - TANGGAL: ${date}"`);
  rows.push('========================================================================================');
  rows.push('"Pos Keuangan","Deskripsi Bukti Fisik","Total Nominal (Rp)"');
  rows.push(`"1. DP Online (Midtrans QRIS)","Mutasi Rekening Bank / Dashboard Midtrans",${stats.total_dp_online_idr}`);
  rows.push(`"2. Kasir Tunai (Laci Kasir)","Fisik Uang Kertas & Koin Kasir",${stats.total_cashier_cash_idr}`);
  rows.push(`"3. Kasir QRIS Toko","Mutasi Aplikasi QRIS Statis Meja Kasir",${stats.total_cashier_qris_idr}`);
  rows.push(`"4. DP No-Show Hangus","Kompensasi Booking Batas Toleransi Habis",${stats.total_noshow_forfeited_dp_idr}`);
  rows.push(`"TOTAL OMZET BERSIH TOKO","(1 + 2 + 3 + 4)",${stats.total_net_revenue_idr}`);
  rows.push('');
  rows.push('"Statistik Operasional Gerai","Angka Tercatat"');
  rows.push(`"Okupansi Kursi Terisi","${stats.booked_slots} dari ${stats.total_slots} Slot (${stats.occupancy_rate_percent}%)"`);
  rows.push(`"Tamu Selesai Dilayani","${stats.completed_count} Tamu"`);
  rows.push(`"Tamu Sedang Dicukur","${stats.in_progress_count} Tamu"`);
  rows.push(`"Tamu Antrean Datang","${stats.confirmed_count} Tamu"`);
  rows.push(`"Tamu Walk-In Langsung","${stats.walk_in_count} Tamu"`);
  rows.push(`"Tamu No-Show","${stats.noshow_count} Tamu"`);
  rows.push(`"Dicetak pada","${new Date().toISOString()}"`);

  return rows.join('\r\n');
}
