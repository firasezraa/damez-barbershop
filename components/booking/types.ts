export type BookingStep = 1 | 2 | 3 | 4 | 5;

export interface BookingService {
  id: string;
  code: string;
  name: string;
  category: "haircut" | "grooming" | "treatment" | "combo";
  durationMinutes: number;
  price: number;
  dpAmount: number;
  badgeLabel?: string;
  isPopular?: boolean;
  description: string;
}

export interface BookingBarber {
  id: string;
  code: string;
  name: string;
  nickname: string;
  title: string;
  chairNumber: number;
  regularDayOff: number; // 0 = Minggu, 1 = Senin, 2 = Selasa
  dayOffName: string;
  specialty: string;
  description: string;
  avatarUrl?: string;
}

export interface SlotItem {
  time: string; // "14:30"
  available: boolean;
  reason?: string;
  barber_id?: string | null;
  chair_number?: number | null;
}

export interface BookingFormData {
  selectedServiceIds: string[];
  barberId: string | null; // null or "any" = Siapa Saja yang Siap
  selectedDate: string; // "YYYY-MM-DD"
  selectedTime: string; // "14:30"
  customerName: string;
  customerPhone: string;
  notes: string;
  agreedToPDP: boolean;
}

export interface BookingCalculation {
  totalServiceMinutes: number;
  bufferMinutes: number;
  totalWindowMinutes: number;
  totalPrice: number;
  downPayment: number;
  remainingPrice: number;
  endTime: string; // calculated end time (e.g. "15:25")
}

export interface SlotApiResponse {
  success: boolean;
  date: string;
  barber_id: string | null;
  total_duration_minutes: number;
  buffer_minutes: number;
  total_window_minutes: number;
  total_slots_count: number;
  slots: SlotItem[];
  error?: string;
}

export interface HoldBookingResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    booking_id: string;
    booking_code: string;
    status: string;
    hold_expires_at: string;
    expires_in_seconds: number;
    barber_id: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    total_price_idr: number;
    down_payment_idr: number;
    remaining_balance_idr: number;
  };
}
