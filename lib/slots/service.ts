/**
 * DAMEZ BARBERSHOP - SLOT ENGINE REPOSITORY & SERVICE LAYER
 * 
 * Mengintegrasikan database Supabase dengan mesin kalkulasi ketersediaan slot.
 * Menyediakan abstraksi data untuk:
 * - Mengambil profil barber aktif & jam kerja spesifik
 * - Mengambil jam istirahat bergantian & custom blocked slots
 * - Mengambil booking aktif (confirmed, in_progress, pending_payment ber-TTL)
 * - Menghitung durasi layanan dari daftar service_ids
 * - Graceful fallback ke baseline data toko jika Supabase belum terhubung
 */

import { getSupabaseClient } from '../supabase/client.ts';
import {
  calculateAvailableSlotsForDate,
  DEFAULT_TURNAROUND_BUFFER_MINUTES,
  DEFAULT_SLOT_GRID_STEP_MINUTES,
  DEFAULT_MIN_LEAD_TIME_MINUTES,
  DEFAULT_OPERATING_HOURS
} from './engine.ts';
import type {
  BarberProfile,
  BarberBreak,
  ExistingBooking,
  BlockedSlotItem,
  AggregatedSlotResult
} from './engine.ts';
import { getJakartaDayOfWeek } from '../utils/timezone.ts';

// Baseline Master Data Barbers (Fallback untuk offline / testing / development)
export const SEED_BARBERS: BarberProfile[] = [
  {
    id: 'b0000001-0000-0000-0000-000000000001',
    name: 'Rian Pratama',
    chair_number: 1,
    regular_day_off: 0, // Minggu
    is_active: true,
    breaks: [
      { start_time: '12:00', end_time: '12:55', title: 'Istirahat Siang' },
      { start_time: '18:00', end_time: '18:55', title: 'Istirahat Sore' }
    ]
  },
  {
    id: 'b0000001-0000-0000-0000-000000000002',
    name: 'Dimas Arisandi',
    chair_number: 2,
    regular_day_off: 1, // Senin
    is_active: true,
    breaks: [
      { start_time: '13:00', end_time: '13:55', title: 'Istirahat Siang' },
      { start_time: '19:00', end_time: '19:55', title: 'Istirahat Sore' }
    ]
  },
  {
    id: 'b0000001-0000-0000-0000-000000000003',
    name: 'Kevin Sanjaya',
    chair_number: 3,
    regular_day_off: 2, // Selasa
    is_active: true,
    breaks: [
      { start_time: '14:00', end_time: '14:55', title: 'Istirahat Siang' },
      { start_time: '20:00', end_time: '20:55', title: 'Istirahat Sore' }
    ]
  }
];

export const SEED_SERVICES: Record<string, { name: string; duration_minutes: number; price_idr: number }> = {
  'a0000001-0000-0000-0000-000000000001': { name: 'Gentlemen Classic Haircut', duration_minutes: 45, price_idr: 50000 },
  'a0000001-0000-0000-0000-000000000002': { name: 'Executive Precision Fade', duration_minutes: 50, price_idr: 65000 },
  'a0000001-0000-0000-0000-000000000003': { name: 'Kids Junior Grooming', duration_minutes: 35, price_idr: 40000 },
  'a0000001-0000-0000-0000-000000000004': { name: 'Hot Towel Royal Shave', duration_minutes: 30, price_idr: 35000 },
  'a0000001-0000-0000-0000-000000000005': { name: 'Beard Sculpting & Detailing', duration_minutes: 25, price_idr: 30000 },
  'a0000001-0000-0000-0000-000000000006': { name: 'Scalp Therapy Treatment', duration_minutes: 40, price_idr: 60000 },
  'a0000001-0000-0000-0000-000000000007': { name: 'Quick Express Clean Cut', duration_minutes: 30, price_idr: 35000 },
  'a0000001-0000-0000-0000-000000000008': { name: 'Damez Signature Full Grooming Combo', duration_minutes: 60, price_idr: 95000 }
};

export interface GetAvailableSlotsParams {
  date: string; // "YYYY-MM-DD"
  barberId?: string | null;
  serviceIds?: string[];
  durationMinutes?: number;
  now?: Date;
}

/**
 * Service utama yang memanggil database dan mengeksekusi mesin slot
 */
export async function fetchAndCalculateAvailableSlots(
  params: GetAvailableSlotsParams
): Promise<AggregatedSlotResult> {
  const {
    date,
    barberId,
    serviceIds = [],
    durationMinutes,
    now = new Date()
  } = params;

  const supabase = getSupabaseClient();
  const dayOfWeek: number = getJakartaDayOfWeek(date);

  // 1. Tentukan Durasi Layanan
  let totalServiceDuration: number = 45; // Default standar pangkas 45 menit

  if (durationMinutes && durationMinutes > 0) {
    totalServiceDuration = durationMinutes;
  } else if (serviceIds.length > 0) {
    if (supabase) {
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, duration_minutes')
        .in('id', serviceIds);

      if (!servicesError && servicesData && servicesData.length > 0) {
        totalServiceDuration = servicesData.reduce(
          (sum: number, s: { duration_minutes: number }) => sum + s.duration_minutes,
          0
        );
      } else {
        // Fallback hitung dari seed dictionary
        let calculatedSum: number = 0;
        serviceIds.forEach((id: string) => {
          if (SEED_SERVICES[id]) {
            calculatedSum += SEED_SERVICES[id].duration_minutes;
          }
        });
        if (calculatedSum > 0) totalServiceDuration = calculatedSum;
      }
    } else {
      let calculatedSum: number = 0;
      serviceIds.forEach((id: string) => {
        if (SEED_SERVICES[id]) {
          calculatedSum += SEED_SERVICES[id].duration_minutes;
        }
      });
      if (calculatedSum > 0) totalServiceDuration = calculatedSum;
    }
  }

  // 2. Ambil Profil Barbers, Jam Kerja, dan Breaks
  let barbers: BarberProfile[] = SEED_BARBERS;
  let customBlockedSlots: BlockedSlotItem[] = [];
  let existingBookings: ExistingBooking[] = [];
  let operatingHours: { open: string; close: string } = DEFAULT_OPERATING_HOURS;
  let bufferMinutes: number = DEFAULT_TURNAROUND_BUFFER_MINUTES;
  let minLeadTimeMinutes: number = DEFAULT_MIN_LEAD_TIME_MINUTES;
  let gridStepMinutes: number = DEFAULT_SLOT_GRID_STEP_MINUTES;

  if (supabase) {
    try {
      // A. Query Settings Toko
      const { data: settingsData } = await supabase
        .from('settings')
        .select('key, value');

      if (settingsData) {
        settingsData.forEach((setting: { key: string; value: unknown }) => {
          if (setting.key === 'shop_operational_hours') {
            const val = setting.value as { open?: string; close?: string };
            if (val.open && val.close) {
              operatingHours = { open: val.open, close: val.close };
            }
          } else if (setting.key === 'booking_policy') {
            const val = setting.value as {
              sanitation_buffer_minutes?: number;
              min_lead_time_minutes?: number;
              slot_grid_step_minutes?: number;
            };
            if (val.sanitation_buffer_minutes !== undefined) {
              bufferMinutes = val.sanitation_buffer_minutes;
            }
            if (val.min_lead_time_minutes !== undefined) {
              minLeadTimeMinutes = val.min_lead_time_minutes;
            }
            if (val.slot_grid_step_minutes !== undefined) {
              gridStepMinutes = val.slot_grid_step_minutes;
            }
          }
        });
      }

      // B. Query Barbers Aktif
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('id, name, chair_number, regular_day_off, is_active')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!barbersError && barbersData && barbersData.length > 0) {
        // C. Query Working Hours untuk hari ini
        const barberIds: string[] = barbersData.map((b: { id: string }) => b.id);
        const { data: whData } = await supabase
          .from('working_hours')
          .select('barber_id, day_of_week, open_time, close_time, is_day_off')
          .in('barber_id', barberIds)
          .eq('day_of_week', dayOfWeek);

        // D. Query Blocked Slots (breaks dan custom blocks)
        const { data: blocksData } = await supabase
          .from('blocked_slots')
          .select('id, barber_id, title, slot_type, day_of_week, start_time, end_time, start_datetime, end_datetime, is_active')
          .eq('is_active', true);

        const loadedBarbers: BarberProfile[] = barbersData.map((b) => {
          // Cari working hours barber
          const barberWh = whData?.find((w) => w.barber_id === b.id);
          
          // Cari breaks rutin untuk barber ini pada hari ini
          const barberBreaks: BarberBreak[] = [];
          if (blocksData) {
            blocksData.forEach((bl) => {
              if (
                bl.barber_id === b.id &&
                bl.slot_type === 'recurring_break' &&
                (bl.day_of_week === null || bl.day_of_week === dayOfWeek)
              ) {
                barberBreaks.push({
                  start_time: bl.start_time.slice(0, 5),
                  end_time: bl.end_time.slice(0, 5),
                  title: bl.title
                });
              }
            });
          }

          return {
            id: b.id,
            name: b.name,
            chair_number: b.chair_number,
            regular_day_off: b.regular_day_off,
            is_active: b.is_active,
            breaks: barberBreaks.length > 0 ? barberBreaks : (SEED_BARBERS.find(sb => sb.id === b.id)?.breaks || []),
            working_hours: barberWh ? {
              open_time: barberWh.open_time.slice(0, 5),
              close_time: barberWh.close_time.slice(0, 5),
              is_day_off: barberWh.is_day_off
            } : undefined
          };
        });

        barbers = loadedBarbers;

        // Kumpulkan non-recurring custom blocks
        if (blocksData) {
          customBlockedSlots = blocksData
            .filter((bl) => bl.slot_type !== 'recurring_break')
            .map((bl) => ({
              id: bl.id,
              barber_id: bl.barber_id,
              title: bl.title,
              day_of_week: bl.day_of_week,
              start_time: bl.start_time.slice(0, 5),
              end_time: bl.end_time.slice(0, 5),
              start_datetime: bl.start_datetime,
              end_datetime: bl.end_datetime,
              is_active: bl.is_active
            }));
        }
      }

      // E. Query Active Bookings pada Tanggal Tersebut (Query Index Optimization < 5ms)
      let bookingsQuery = supabase
        .from('bookings')
        .select('id, barber_id, start_time, end_time, status, hold_expires_at')
        .eq('booking_date', date)
        .in('status', ['confirmed', 'in_progress', 'pending_payment']);

      if (barberId) {
        bookingsQuery = bookingsQuery.eq('barber_id', barberId);
      }

      const { data: bookingsData } = await bookingsQuery;

      if (bookingsData) {
        existingBookings = bookingsData.map((b) => ({
          id: b.id,
          barber_id: b.barber_id,
          start_time: b.start_time,
          end_time: b.end_time,
          status: b.status as ExistingBooking['status'],
          hold_expires_at: b.hold_expires_at
        }));
      }
    } catch (dbErr: unknown) {
      console.warn('Supabase query error in slot service (using baseline seeds):', dbErr);
    }
  }

  // 3. Eksekusi Engine Kalkulasi Slot
  return calculateAvailableSlotsForDate({
    targetDate: date,
    totalDurationMinutes: totalServiceDuration,
    barbers,
    existingBookings,
    customBlockedSlots,
    selectedBarberId: barberId,
    turnaroundBufferMinutes: bufferMinutes,
    gridStepMinutes,
    minLeadTimeMinutes,
    operatingHours,
    currentTime: now
  });
}
