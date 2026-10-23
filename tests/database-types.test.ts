import type {
  Database,
  Barber,
  Service,
  Booking,
  Payment,
  BookingStatus,
  PaymentStatus,
  AvailableSlot,
  BookingPolicySetting
} from '../types/database.types'

// Test Barber Row Shape
const sampleBarber: Barber = {
  id: 'b0000001-0000-0000-0000-000000000001',
  barber_code: 'BBR-01',
  name: 'Rian Pratama',
  nickname: 'The Sculptor',
  title: 'Senior Master Barber',
  chair_number: 1,
  experience_years: 6,
  specialty: 'Classic Cuts & Pompadour',
  bio: 'Spesialis dalam model rambut formal belah samping klasik.',
  avatar_url: '/images/barbers/rian-pratama.webp',
  regular_day_off: 0,
  is_active: true,
  display_order: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// Test Service Row Shape
const sampleService: Service = {
  id: 's0000001-0000-0000-0000-000000000001',
  service_code: 'SRV-01',
  name: 'Gentlemen Classic Haircut',
  slug: 'gentlemen-classic-haircut',
  category: 'Core Haircut',
  duration_minutes: 45,
  price_idr: 50000,
  down_payment_idr: 20000,
  description: 'Konsultasi gaya rambut, potong rambut presisi, cuci rambut segar.',
  is_recommended: true,
  is_active: true,
  display_order: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// Test Booking Row Shape
const sampleBooking: Booking = {
  id: 'c1111111-0000-0000-0000-000000000001',
  booking_code: 'DMZ-20261023-0001',
  customer_id: null,
  customer_name: 'Budi Santoso',
  customer_phone: '081234567890',
  customer_email: 'budi@example.com',
  barber_id: sampleBarber.id,
  booking_date: '2026-10-23',
  booking_type: 'online',
  status: 'confirmed' as BookingStatus,
  start_time: '2026-10-23T14:00:00+07:00',
  end_time: '2026-10-23T14:55:00+07:00',
  service_duration_minutes: 45,
  buffer_minutes: 10,
  booking_range: '[2026-10-23 07:00:00+00, 2026-10-23 07:55:00+00)',
  total_price_idr: 50000,
  down_payment_idr: 20000,
  remaining_balance_idr: 30000,
  settlement_method: 'none',
  settlement_paid_at: null,
  hold_expires_at: null,
  confirmed_at: '2026-10-23T13:45:00+07:00',
  completed_at: null,
  cancelled_at: null,
  cancellation_reason: null,
  rescheduled_from_id: null,
  rescheduled_at: null,
  notes: 'First time visit',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// Test Payment Row Shape
const samplePayment: Payment = {
  id: 'p1111111-0000-0000-0000-000000000001',
  booking_id: sampleBooking.id,
  order_id: 'DMZ-PAY-202610230001-9988',
  snap_token: 'snap-token-abc-123',
  snap_redirect_url: 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-abc-123',
  payment_type: 'qris',
  gross_amount: 20000,
  currency: 'IDR',
  transaction_status: 'settlement' as PaymentStatus,
  fraud_status: 'accept',
  status_code: '200',
  status_message: 'Success, transaction is found',
  transaction_id: 'trx-midtrans-12345',
  payment_amounts: null,
  raw_response: { issuer: 'gopay' },
  signature_key: 'sha512-test-hash',
  paid_at: '2026-10-23T13:45:00+07:00',
  expires_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// Test AvailableSlot Shape
const sampleSlot: AvailableSlot = {
  slot_id: 'SLT-b0000001-20261023-1400',
  barber_id: sampleBarber.id,
  barber_name: sampleBarber.name,
  chair_number: sampleBarber.chair_number,
  start_time: '2026-10-23T14:00:00+07:00',
  end_time: '2026-10-23T14:55:00+07:00',
  service_duration: 45,
  buffer_duration: 10,
  total_window: 55,
  formatted_time: '14:00 WIB'
}

// Test Policy Setting Shape
const samplePolicy: BookingPolicySetting = {
  dp_amount_idr: 20000,
  hold_ttl_minutes: 15,
  sanitation_buffer_minutes: 10,
  slot_grid_step_minutes: 15,
  min_lead_time_minutes: 60,
  reschedule_cutoff_hours: 3,
  late_tolerance_minutes: 15
}

console.log('TypeScript Types verification passed for sample objects:');
console.log({
  barber: sampleBarber.barber_code,
  service: sampleService.service_code,
  booking: sampleBooking.booking_code,
  payment: samplePayment.order_id,
  slot: sampleSlot.slot_id,
  policyDP: samplePolicy.dp_amount_idr
});
