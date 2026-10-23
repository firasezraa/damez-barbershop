export interface PaymentBookingBarber {
  id: string;
  code: string;
  name: string;
  nickname: string;
  title: string;
  chair_number: number;
  avatar_url?: string;
}

export interface PaymentBookingService {
  id: string;
  name: string;
  duration_minutes: number;
  price_idr: number;
}

export interface PaymentBookingDetail {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  barber_id: string;
  barber: PaymentBookingBarber;
  booking_date: string;
  start_time: string;
  end_time: string;
  service_duration_minutes: number;
  services: PaymentBookingService[];
  total_price_idr: number;
  down_payment_idr: number;
  remaining_balance_idr: number;
  status: 'pending_payment' | 'confirmed' | 'in_progress' | 'completed' | 'no_show' | 'cancelled' | 'expired' | string;
  hold_expires_at: string | null;
  is_expired: boolean;
  remaining_seconds: number;
  remaining_formatted: string;
  confirmed_at: string | null;
  notes: string | null;
}

export interface SnapCheckoutData {
  token: string;
  redirect_url: string;
  order_id: string;
  gross_amount: number;
  booking_id: string;
  booking_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  expires_at: string;
}

export interface MidtransSnapResult {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  pdf_url?: string;
  finish_redirect_url?: string;
}
