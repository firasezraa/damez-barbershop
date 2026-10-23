/**
 * DAMEZ BARBERSHOP - ADMIN PORTAL TYPES & CONTRACTS
 * 
 * Mendefinisikan tipe data untuk:
 * - Kalender matriks slot harian per barber
 * - Daftar reservasi dan filter kueri
 * - Operasi aksi cepat kasir (Selesai, No-Show, Walk-In, Blokir)
 * - Rekonsiliasi kas dan unduh laporan harian CSV
 */

import type { BookingStatus, BookingType, SettlementMethod } from '../../types/database.types.ts';

export interface AdminBookingItem {
  id: string;
  booking_code: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  barber_id: string;
  barber_name: string;
  barber_chair: number;
  booking_date: string; // YYYY-MM-DD
  booking_type: BookingType;
  status: BookingStatus;
  start_time: string; // HH:mm or ISO
  end_time: string;   // HH:mm or ISO
  service_duration_minutes: number;
  buffer_minutes: number;
  service_ids: string[];
  service_names: string[];
  total_price_idr: number;
  down_payment_idr: number;
  remaining_balance_idr: number;
  settlement_method: SettlementMethod;
  settlement_paid_at?: string | null;
  cashier_amount_received?: number | null;
  cashier_change_given?: number | null;
  hold_expires_at?: string | null;
  confirmed_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  is_late_warning?: boolean; // True jika > 10 menit dari jadwal dan belum seated
  is_past_tolerance?: boolean; // True jika > 15 menit dari jadwal
}

export interface AdminBookingFilters {
  date?: string; // YYYY-MM-DD (defaults to today WIB)
  barberId?: string; // specific barber ID or 'all'
  status?: BookingStatus | 'all';
  searchQuery?: string; // Search by name, phone, or booking_code
  bookingType?: BookingType | 'all';
}

export interface AdminDailyStats {
  date: string;
  total_slots: number;
  booked_slots: number;
  occupancy_rate_percent: number;
  total_dp_online_idr: number;
  total_cashier_cash_idr: number;
  total_cashier_qris_idr: number;
  total_noshow_forfeited_dp_idr: number;
  total_net_revenue_idr: number;
  completed_count: number;
  in_progress_count: number;
  confirmed_count: number;
  noshow_count: number;
  walk_in_count: number;
}

export interface QuickWalkInParams {
  customer_name: string;
  customer_phone?: string;
  barber_id: string;
  service_ids: string[];
  start_time: string; // HH:mm (e.g. "14:00")
  booking_date?: string; // defaults to today YYYY-MM-DD
  action_mode: 'start_now' | 'queue_wait'; // 'start_now' -> in_progress, 'queue_wait' -> confirmed
  notes?: string;
}

export interface CompleteBookingParams {
  booking_id: string;
  settlement_method: 'cash' | 'qris' | 'transfer';
  cash_amount_received?: number;
  notes?: string;
  completed_at?: string;
}

export interface MarkNoShowParams {
  booking_id: string;
  reason?: string;
}

export interface CreateBlockSlotParams {
  barber_id: string | null; // null for all barbers
  day_of_week?: number | null;
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  booking_date?: string; // YYYY-MM-DD
  title: string;
  reason?: string;
  slot_type?: 'recurring_break' | 'custom_block' | 'maintenance' | 'holiday';
}

export interface AdminBarberColumn {
  id: string;
  name: string;
  nickname: string;
  chair_number: number;
  title: string;
  specialty: string;
  regular_day_off: number;
  is_off_today: boolean;
  slots: AdminCalendarSlot[];
}

export interface AdminCalendarSlot {
  slot_time: string; // "10:00"
  barber_id: string;
  chair_number: number;
  status: 'empty' | 'confirmed' | 'in_progress' | 'completed' | 'no_show' | 'walk_in' | 'blocked';
  booking?: AdminBookingItem;
  block_title?: string;
  block_reason?: string;
  is_late_warning?: boolean;
}
