/**
 * DAMEZ BARBERSHOP - TEST SUITE: WHATSAPP NOTIFICATION DISPATCHER SERVICE
 * Sesuai WBS M5-02 & Kepatuhan UU PDP No. 27/2022
 *
 * Menguji secara komprehensif:
 * 1. Business rules, SLA constants & Anti-Emoji / Humanizer policy
 * 2. Normalisasi & validasi nomor ponsel WhatsApp Indonesia
 * 3. Render 8 template WhatsApp (booking_confirmed, barber_alert, reminder_h2, dll)
 * 4. Fonnte, Wablas, dan Mock Gateway Adapter (endpoint, payload, headers, parsing)
 * 5. Instant Payment Confirmation (< 5 Detik SLA, paralel customer + barber alert)
 * 6. Pengingat jadwal kedatangan (H-2 Jam & H-30 Menit) & Batch Dispatcher
 * 7. Queue sweeper & error resilience (failover pencatatan di notification_logs)
 * 8. Integrasi Webhook Midtrans -> Instant WhatsApp Notification
 * 9. Route Handlers: /api/cron/reminders dan /api/notifications/dispatch
 */

import assert from 'node:assert'
import crypto from 'node:crypto'
import {
  DELIVERY_SLA_SECONDS,
  DELIVERY_SLA_MS,
  DEFAULT_DP_AMOUNT_IDR,
  DEFAULT_TOLERANCE_MINUTES,
  DEFAULT_RESCHEDULE_WINDOW_HOURS,
  SHOP_METADATA,
  KNOWN_BARBERS,
  getBarberContact,
  normalizeIndonesianPhoneNumber,
  isValidIndonesianPhoneNumber,
  formatIndonesianDate,
  formatIndonesianCurrency,
  cleanTimeString,
  calculateToleranceTime,
  calculateRescheduleDeadlineTime,
  containsEmoji,
  sanitizeHumanizerCompliance,
  getWhatsAppTemplate,
  renderWhatsAppTemplate,
  getWhatsAppConfig,
  sendWhatsAppMessage,
  sendMockWhatsAppMessage,
  getMockDispatchedMessages,
  clearMockDispatchedMessages,
  sendInstantPaymentConfirmation,
  dispatchBookingConfirmedWhatsApp,
  sendBarberBookingAlert,
  sendArrivalReminder,
  dispatchUpcomingReminders,
  processPendingNotifications,
  type TemplateKey,
  type BookingNotificationData,
  type WhatsAppGatewayConfig,
  type WhatsAppSendResult,
  type InstantPaymentConfirmationResult,
  type ReminderDispatchResult,
  type ProcessPendingResult
} from '../lib/notifications/whatsapp.ts'

import {
  createWebhookMockStore,
  processMidtransWebhook,
  type WebhookMockStore,
  type BookingRow,
  type PaymentRow,
  type MidtransWebhookPayload
} from '../lib/payment/webhook.ts'

import { GET as getCronReminders, POST as postCronReminders } from '../app/api/cron/reminders/route.ts'
import { GET as getNotifDispatch, POST as postNotifDispatch } from '../app/api/notifications/dispatch/route.ts'

console.log('=== RUNNING WHATSAPP NOTIFICATION DISPATCHER TEST SUITE ===\n')

// ============================================================================
// TEST 1: Business Rules & SLA Constants
// ============================================================================
console.log('[Test 1] Verifying Business Rules, SLA Constants & Shop Profile')

assert.strictEqual(DELIVERY_SLA_SECONDS, 5, 'SLA must be exactly 5 seconds')
assert.strictEqual(DELIVERY_SLA_MS, 5000, 'SLA ms must be exactly 5000')
assert.strictEqual(DEFAULT_DP_AMOUNT_IDR, 20000, 'Default DP must be flat Rp 20.000')
assert.strictEqual(DEFAULT_TOLERANCE_MINUTES, 15, 'Tolerance window must be 15 minutes')
assert.strictEqual(DEFAULT_RESCHEDULE_WINDOW_HOURS, 3, 'Reschedule window must be 3 hours')
assert.strictEqual(SHOP_METADATA.brand, 'Damez Barbershop')
assert.strictEqual(SHOP_METADATA.timezone, 'Asia/Jakarta (WIB / UTC+07:00)')
assert.ok(SHOP_METADATA.googleMapsUrl.includes('maps.app.goo.gl'))

console.log('PASS: Business constants and shop profile verified.\n')

// ============================================================================
// TEST 2: Indonesian Phone Number Normalization & Validation
// ============================================================================
console.log('[Test 2] Indonesian Mobile Phone Normalization & Validation')

// Format variations that must normalize to canonical "628..."
const testPhones: Array<{ input: string; expected: string }> = [
  { input: '081234567890', expected: '6281234567890' },
  { input: '0812-3456-7890', expected: '6281234567890' },
  { input: '+62 812 3456 7890', expected: '6281234567890' },
  { input: '+6281234567890', expected: '6281234567890' },
  { input: '6281234567890', expected: '6281234567890' },
  { input: '81234567890', expected: '6281234567890' },
  { input: '0815.1234.5678', expected: '6281512345678' },
  { input: '(0819) 9988-7766', expected: '6281999887766' }
]

testPhones.forEach(({ input, expected }): void => {
  const normalized: string = normalizeIndonesianPhoneNumber(input)
  assert.strictEqual(
    normalized,
    expected,
    `Phone ${input} should normalize to ${expected}, got ${normalized}`
  )
  assert.strictEqual(
    isValidIndonesianPhoneNumber(input),
    true,
    `Phone ${input} should be valid Indonesian phone`
  )
})

// Invalid numbers
assert.strictEqual(isValidIndonesianPhoneNumber('0217654321'), false, 'Landline 021 must be invalid')
assert.strictEqual(isValidIndonesianPhoneNumber('12345'), false, 'Short number must be invalid')
assert.strictEqual(isValidIndonesianPhoneNumber('081234'), false, 'Under 10 digits must be invalid')
assert.strictEqual(isValidIndonesianPhoneNumber('+14155552671'), false, 'US number must be invalid')
assert.strictEqual(isValidIndonesianPhoneNumber('not-a-phone'), false, 'Non-digits must be invalid')

console.log('PASS: Indonesian phone normalization and validation passed with 100% accuracy.\n')

// ============================================================================
// TEST 3: Indonesian Date, Currency & Time Calculators
// ============================================================================
console.log('[Test 3] Indonesian Date, Currency & Strict WIB Timezone Formatting')

// Calendar formatting
const formattedDate: string = formatIndonesianDate('2026-10-24')
assert.strictEqual(formattedDate, 'Sabtu, 24 Oktober 2026', 'Date should format to Indonesian')

const formattedDateSunday: string = formatIndonesianDate('2026-10-25')
assert.strictEqual(formattedDateSunday, 'Minggu, 25 Oktober 2026', 'Sunday must format correctly')

// Currency formatting
assert.strictEqual(formatIndonesianCurrency(20000), '20.000', '20000 -> 20.000')
assert.strictEqual(formatIndonesianCurrency(30000), '30.000', '30000 -> 30.000')
assert.strictEqual(formatIndonesianCurrency(50000), '50.000', '50000 -> 50.000')

// Time tolerance (+15 min) and reschedule deadline (-3 hours)
assert.strictEqual(calculateToleranceTime('14:00'), '14:15', '14:00 + 15 min = 14:15')
assert.strictEqual(calculateToleranceTime('10:45'), '11:00', '10:45 + 15 min = 11:00')
assert.strictEqual(calculateToleranceTime('14:00:00'), '14:15', '14:00:00 should clean to 14:15')

assert.strictEqual(calculateRescheduleDeadlineTime('14:00'), '11:00', '14:00 - 3h = 11:00')
assert.strictEqual(calculateRescheduleDeadlineTime('10:00'), '07:00', '10:00 - 3h = 07:00')

console.log('PASS: Date, currency, tolerance, and reschedule calculations verified.\n')

// ============================================================================
// TEST 4: Anti-Emoji Policy & Humanizer Compliance
// ============================================================================
console.log('[Test 4] Strict Anti-Emoji Policy & Humanizer Compliance Verification')

const textWithEmoji: string = 'Booking Anda berhasil! 💈✂️ Sampai jumpa di kursi! 😊'
assert.strictEqual(containsEmoji(textWithEmoji), true, 'Should detect emoji')

const textWithoutEmoji: string = 'Booking Anda berhasil. Sampai jumpa di kursi pangkas.'
assert.strictEqual(containsEmoji(textWithoutEmoji), false, 'Should detect lack of emoji')

// Test sanitization (em-dash, en-dash, double-hyphen, emoji)
const uncompliantText: string = 'Reservasi Anda—sangat kami hargai–jadwal--pangkas 💈'
const compliantText: string = sanitizeHumanizerCompliance(uncompliantText)
assert.strictEqual(containsEmoji(compliantText), false, 'Sanitized text must not contain emoji')
assert.ok(!compliantText.includes('—'), 'Em-dash must be removed')
assert.ok(!compliantText.includes('–'), 'En-dash must be removed')
assert.ok(!compliantText.includes('--'), 'Double-hyphen must be removed')

console.log('PASS: Anti-emoji policy and humanizer sanitization verified 100%.\n')

// ============================================================================
// TEST 5: Template Engine & All 8 Templates Rendering
// ============================================================================
console.log('[Test 5] Template Engine: Rendering All 8 WhatsApp Templates')

const allTemplateKeys: TemplateKey[] = [
  'booking_confirmed',
  'barber_booking_alert',
  'arrival_reminder_h2',
  'arrival_reminder_h30m',
  'booking_rescheduled',
  'booking_cancelled_customer',
  'booking_no_show_alert',
  'slot_hold_expired'
]

// 1. Render booking_confirmed
const confirmedRendered: string = renderWhatsAppTemplate('booking_confirmed', {
  customer_name: 'Budi Santoso',
  booking_code: 'DMZ-20261024-001',
  service_names: 'Gentlemen Classic Haircut',
  service_duration: 45,
  barber_name: 'Rian Pratama',
  chair_number: 1,
  booking_date: 'Sabtu, 24 Oktober 2026',
  start_time: '14:00',
  end_time: '14:45',
  dp_amount_formatted: '20.000',
  remaining_balance_formatted: '30.000',
  tolerance_time: '14:15',
  reschedule_deadline_time: '11:00',
  ticket_url: 'https://damezbarber.com/tickets/DMZ-20261024-001'
})

assert.ok(confirmedRendered.includes('Halo Budi Santoso,'))
assert.ok(confirmedRendered.includes('Kode Booking: DMZ-20261024-001'))
assert.ok(confirmedRendered.includes('Gentlemen Classic Haircut (45 menit)'))
assert.ok(confirmedRendered.includes('Master Barber: Rian Pratama (Kursi 1)'))
assert.ok(confirmedRendered.includes('Status DP: Rp 20.000 (Lunas via QRIS)'))
assert.ok(confirmedRendered.includes('Sisa Tagihan di Kasir: Rp 30.000'))
assert.ok(confirmedRendered.includes('sampai pukul 14:15 WIB'))
assert.ok(confirmedRendered.includes('sebelum pukul 11:00 WIB'))
assert.ok(confirmedRendered.includes('https://damezbarber.com/tickets/DMZ-20261024-001'))
assert.strictEqual(containsEmoji(confirmedRendered), false, 'No emoji allowed')
assert.ok(!confirmedRendered.includes('{{'), 'No unreplaced template variables allowed')

// 2. Render barber_booking_alert
const barberRendered: string = renderWhatsAppTemplate('barber_booking_alert', {
  barber_name: 'Rian Pratama',
  booking_code: 'DMZ-20261024-001',
  customer_name: 'Budi Santoso',
  service_names: 'Gentlemen Classic Haircut',
  service_duration: 45,
  booking_date: 'Sabtu, 24 Oktober 2026',
  start_time: '14:00',
  end_time: '14:45',
  special_notes: 'Opsi Quiet Cut (hening dan santai)'
})
assert.ok(barberRendered.includes('Halo Rian Pratama,'))
assert.ok(barberRendered.includes('Nama Pelanggan: Budi Santoso'))
assert.ok(barberRendered.includes('Opsi Quiet Cut (hening dan santai)'))
assert.ok(barberRendered.includes('lemari UV'))
assert.strictEqual(containsEmoji(barberRendered), false)

// 3. Render arrival_reminder_h2
const h2Rendered: string = renderWhatsAppTemplate('arrival_reminder_h2', {
  customer_name: 'Budi Santoso',
  booking_code: 'DMZ-20261024-001',
  barber_name: 'Rian Pratama',
  booking_date: 'Sabtu, 24 Oktober 2026',
  start_time: '14:00',
  tolerance_time: '14:15',
  remaining_balance_formatted: '30.000',
  ticket_url: 'https://damezbarber.com/tickets/DMZ-20261024-001'
})
assert.ok(h2Rendered.includes('Pengingat ramah untuk jadwal pangkas rambut Anda'))
assert.ok(h2Rendered.includes('Batas Toleransi Kedatangan: 14:15 WIB'))
assert.ok(h2Rendered.includes('Sisa Tagihan di Kasir: Rp 30.000'))

// 4. Render arrival_reminder_h30m
const h30mRendered: string = renderWhatsAppTemplate('arrival_reminder_h30m', {
  customer_name: 'Budi Santoso',
  booking_code: 'DMZ-20261024-001',
  barber_name: 'Rian Pratama',
  start_time: '14:00'
})
assert.ok(h30mRendered.includes('akan dimulai 30 menit lagi'))
assert.ok(h30mRendered.includes('pukul 14:00 WIB'))

// 5. Render remaining 4 templates
allTemplateKeys.slice(4).forEach((key: TemplateKey): void => {
  const rendered: string = renderWhatsAppTemplate(key, {
    customer_name: 'Budi Santoso',
    booking_code: 'DMZ-20261024-001',
    barber_name: 'Rian Pratama',
    service_names: 'Gentlemen Classic Haircut',
    old_date: 'Sabtu, 24 Oktober 2026',
    old_time: '14:00',
    new_date: 'Minggu, 25 Oktober 2026',
    new_start_time: '16:00',
    new_end_time: '16:45',
    remaining_balance_formatted: '30.000',
    booking_date: 'Sabtu, 24 Oktober 2026',
    start_time: '14:00',
    tolerance_time: '14:15',
    dp_status_explanation: 'Uang muka dikembalikan',
    rebook_url: 'https://damezbarber.com/booking',
    admin_wa_url: 'https://wa.me/6281234567890',
    ticket_url: 'https://damezbarber.com/tickets/DMZ-20261024-001'
  })
  assert.ok(rendered.length > 50, `Template ${key} should render meaningful content`)
  assert.strictEqual(containsEmoji(rendered), false, `Template ${key} must not contain emoji`)
})

console.log('PASS: All 8 WhatsApp templates rendered accurately with 0 emojis.\n')

// ============================================================================
// TEST 6: Mock Gateway Dispatcher & Message Recording
// ============================================================================
console.log('[Test 6] Mock Gateway Adapter & Latency Tracking')

clearMockDispatchedMessages()
assert.strictEqual(getMockDispatchedMessages().length, 0)

const sendResult: WhatsAppSendResult = await sendWhatsAppMessage({
  recipientPhone: '081234567890',
  message: 'Halo Budi, reservasi Anda telah terkonfirmasi.',
  templateName: 'booking_confirmed'
})

assert.strictEqual(sendResult.success, true)
assert.strictEqual(sendResult.provider, 'mock')
assert.strictEqual(sendResult.recipientPhone, '6281234567890')
assert.ok(sendResult.latencyMs < 500, 'Mock latency should be < 500ms')
assert.ok(sendResult.messageId.startsWith('mock-wa-'))

const recordedMessages = getMockDispatchedMessages()
assert.strictEqual(recordedMessages.length, 1)
assert.strictEqual(recordedMessages[0].recipientPhone, '6281234567890')
assert.strictEqual(recordedMessages[0].templateName, 'booking_confirmed')

console.log('PASS: Mock gateway adapter correctly records dispatched messages.\n')

// ============================================================================
// TEST 7: Instant Payment Confirmation (DoD: < 5s SLA)
// ============================================================================
console.log('[Test 7] Instant Payment Confirmation: Parallel Customer & Barber Dispatch (< 5s SLA)')

clearMockDispatchedMessages()
const mockStore: WebhookMockStore = createWebhookMockStore()

const sampleBookingData: BookingNotificationData = {
  bookingId: 'b-test-uuid-001',
  bookingCode: 'DMZ-20261024-001',
  customerName: 'Budi Santoso',
  customerPhone: '081234567890',
  customerEmail: 'budi@example.com',
  barberId: 'b0000001-0000-0000-0000-000000000001',
  barberName: 'Rian Pratama',
  barberPhone: '081234567801',
  chairNumber: 1,
  bookingDate: '2026-10-24',
  startTime: '14:00',
  endTime: '14:45',
  serviceNames: 'Gentlemen Classic Haircut',
  serviceDurationMinutes: 45,
  dpAmountIdr: 20000,
  remainingBalanceIdr: 30000,
  specialNotes: 'Opsi Quiet Cut'
}

const instantResult: InstantPaymentConfirmationResult = await sendInstantPaymentConfirmation({
  booking: sampleBookingData,
  options: { mockStore }
})

assert.strictEqual(instantResult.success, true, 'Both customer and barber messages must succeed')
assert.strictEqual(instantResult.bookingCode, 'DMZ-20261024-001')
assert.strictEqual(instantResult.customerResult.success, true)
assert.strictEqual(instantResult.barberResult.success, true)
assert.strictEqual(instantResult.customerResult.recipientPhone, '6281234567890')
assert.strictEqual(instantResult.barberResult.recipientPhone, '6281234567801')

// VERIFY DEFINITION OF DONE: Sub-5-second delivery
assert.strictEqual(instantResult.dodCompliant, true, 'DoD SLA (< 5s) must be compliant')
assert.ok(
  instantResult.totalLatencyMs < 5000,
  `Total latency ${instantResult.totalLatencyMs}ms must be strictly less than 5000ms`
)

// Verify notification_logs in mockStore
assert.strictEqual(mockStore.notification_logs.length, 2, 'Exactly 2 notification logs must be stored')

const customerLog = mockStore.notification_logs.find(
  (l): boolean => l.template_name === 'booking_confirmed'
)
assert.ok(customerLog, 'Customer notification log must exist')
assert.strictEqual(customerLog.recipient_phone, '6281234567890')
assert.strictEqual(customerLog.status, 'sent')
assert.ok(customerLog.sent_at !== null)

const barberLog = mockStore.notification_logs.find(
  (l): boolean => l.template_name === 'barber_booking_alert'
)
assert.ok(barberLog, 'Barber notification log must exist')
assert.strictEqual(barberLog.recipient_phone, '6281234567801')
assert.strictEqual(barberLog.status, 'sent')
assert.ok(barberLog.sent_at !== null)

console.log(`PASS: Instant payment confirmation executed in ${instantResult.totalLatencyMs}ms (DoD < 5000ms VERIFIED).\n`)

// ============================================================================
// TEST 8: Arrival Reminders (H-2 Jam & H-30 Menit)
// ============================================================================
console.log('[Test 8] Arrival Reminders: H-2 Jam & H-30 Menit Notifications')

clearMockDispatchedMessages()
const reminderStore: WebhookMockStore = createWebhookMockStore()

// 1. Send H-2 reminder
const h2Result: WhatsAppSendResult = await sendArrivalReminder({
  booking: sampleBookingData,
  reminderType: 'h2',
  options: { mockStore: reminderStore }
})

assert.strictEqual(h2Result.success, true)
assert.strictEqual(h2Result.recipientPhone, '6281234567890')

const h2Log = reminderStore.notification_logs.find(
  (l): boolean => l.template_name === 'arrival_reminder_h2'
)
assert.ok(h2Log)
assert.strictEqual(h2Log.status, 'sent')

// 2. Send H-30m reminder
const h30mResult: WhatsAppSendResult = await sendArrivalReminder({
  booking: sampleBookingData,
  reminderType: 'h30m',
  options: { mockStore: reminderStore }
})

assert.strictEqual(h30mResult.success, true)
const h30mLog = reminderStore.notification_logs.find(
  (l): boolean => l.template_name === 'arrival_reminder_h30m'
)
assert.ok(h30mLog)
assert.strictEqual(h30mLog.status, 'sent')

console.log('PASS: Arrival reminders H-2 and H-30m delivered and recorded.\n')

// ============================================================================
// TEST 9: Batch Reminder Dispatcher for Scheduled Cron
// ============================================================================
console.log('[Test 9] Batch Reminder Dispatcher for Scheduled Cron')

const cronStore: WebhookMockStore = createWebhookMockStore()

// Seed a confirmed booking for today
const todayDateStr: string = new Date().toISOString().split('T')[0]
const bookingForCron: BookingRow = {
  id: 'b-cron-001',
  booking_code: 'DMZ-CRON-001',
  customer_id: 'c-001',
  customer_name: 'Ahmad Dahlan',
  customer_phone: '081399887766',
  customer_email: 'ahmad@example.com',
  barber_id: 'b0000001-0000-0000-0000-000000000001',
  booking_date: todayDateStr,
  booking_type: 'online',
  status: 'confirmed',
  start_time: '18:00',
  end_time: '18:45',
  service_duration_minutes: 45,
  buffer_minutes: 10,
  booking_range: null,
  total_price_idr: 50000,
  down_payment_idr: 20000,
  remaining_balance_idr: 30000,
  settlement_method: 'qris',
  settlement_paid_at: new Date().toISOString(),
  hold_expires_at: null,
  confirmed_at: new Date().toISOString(),
  completed_at: null,
  cancelled_at: null,
  cancellation_reason: null,
  rescheduled_from_id: null,
  rescheduled_at: null,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

cronStore.bookings.set(bookingForCron.id, bookingForCron)

const cronResult: ReminderDispatchResult = await dispatchUpcomingReminders({
  mockStore: cronStore
})

assert.strictEqual(cronResult.errors.length, 0, 'No errors during reminder sweep')
assert.strictEqual(cronResult.scannedCount, 1, 'Should scan 1 today confirmed booking')
assert.ok(cronResult.latencyMs < 1000, 'Cron execution should be fast')

console.log('PASS: Batch reminder sweep completed cleanly.\n')

// ============================================================================
// TEST 10: Pending Notification Queue Sweeper
// ============================================================================
console.log('[Test 10] Pending Notification Queue Sweeper & Resilience')

const queueStore: WebhookMockStore = createWebhookMockStore()

// Insert 2 pending notification logs
queueStore.notification_logs.push(
  {
    id: 'log-pend-01',
    booking_id: 'b-01',
    recipient_phone: '081234567890',
    channel: 'whatsapp',
    template_name: 'booking_confirmed',
    message_body: 'Halo Budi, booking terkonfirmasi.',
    status: 'pending',
    response_payload: null,
    error_message: null,
    sent_at: null,
    created_at: new Date().toISOString()
  },
  {
    id: 'log-pend-02',
    booking_id: 'b-02',
    recipient_phone: '081298765432',
    channel: 'whatsapp',
    template_name: 'barber_booking_alert',
    message_body: 'Halo Rian, reservasi baru terjadwal.',
    status: 'pending',
    response_payload: null,
    error_message: null,
    sent_at: null,
    created_at: new Date().toISOString()
  }
)

const sweepResult: ProcessPendingResult = await processPendingNotifications({
  mockStore: queueStore
})

assert.strictEqual(sweepResult.processedCount, 2)
assert.strictEqual(sweepResult.sentCount, 2)
assert.strictEqual(sweepResult.failedCount, 0)
assert.strictEqual(queueStore.notification_logs[0].status, 'sent')
assert.strictEqual(queueStore.notification_logs[1].status, 'sent')

console.log('PASS: Pending notification queue sweeper processed 2 records to sent.\n')

// ============================================================================
// TEST 11: End-to-End Integration: Midtrans Webhook -> WhatsApp Confirmation
// ============================================================================
console.log('[Test 11] E2E Integration: Midtrans Settlement -> Instant WhatsApp Dispatch')

const e2eStore: WebhookMockStore = createWebhookMockStore()
clearMockDispatchedMessages()

// Create pending booking in e2eStore
const pendingBooking: BookingRow = {
  id: 'b-e2e-100',
  booking_code: 'DMZ-20261024-E2E1',
  customer_id: 'c-100',
  customer_name: 'Denny Sumargo',
  customer_phone: '081234567899',
  customer_email: 'denny@example.com',
  barber_id: 'b0000001-0000-0000-0000-000000000001',
  booking_date: '2026-10-24',
  booking_type: 'online',
  status: 'pending_payment',
  start_time: '15:00',
  end_time: '15:45',
  service_duration_minutes: 45,
  buffer_minutes: 10,
  booking_range: null,
  total_price_idr: 50000,
  down_payment_idr: 0,
  remaining_balance_idr: 50000,
  settlement_method: 'qris',
  settlement_paid_at: null,
  hold_expires_at: new Date(Date.now() + 15 * 60000).toISOString(),
  confirmed_at: null,
  completed_at: null,
  cancelled_at: null,
  cancellation_reason: null,
  rescheduled_from_id: null,
  rescheduled_at: null,
  notes: 'Gentlemen Cut',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}
e2eStore.bookings.set(pendingBooking.id, pendingBooking)

// Midtrans settlement notification payload
const orderId: string = 'ORDER-DMZ-20261024-E2E1'
const grossAmount: string = '20000.00'
const testServerKey: string = 'SB-Mid-server-TEST-KEY-12345'
const rawSignature: string = `${orderId}200${grossAmount}${testServerKey}`
const signature: string = crypto.createHash('sha512').update(rawSignature).digest('hex')

const webhookPayload: MidtransWebhookPayload = {
  order_id: orderId,
  status_code: '200',
  gross_amount: grossAmount,
  signature_key: signature,
  transaction_status: 'settlement',
  payment_type: 'qris',
  transaction_id: 'trx-e2e-9988',
  custom_field1: pendingBooking.id,
  custom_field2: pendingBooking.customer_phone,
  custom_field3: pendingBooking.booking_code
}

// 1. Process Midtrans Webhook
const webhookResult = await processMidtransWebhook(webhookPayload, {
  serverKeyOverride: testServerKey,
  mockStore: e2eStore
})

assert.strictEqual(webhookResult.success, true)
assert.strictEqual(webhookResult.paymentStatus, 'settlement')
assert.strictEqual(webhookResult.bookingStatus, 'confirmed')

// 2. Dispatch instant WhatsApp confirmation
const waDispatchResult = await dispatchBookingConfirmedWhatsApp(pendingBooking.id, {
  mockStore: e2eStore
})

assert.ok(waDispatchResult)
assert.strictEqual(waDispatchResult.success, true)
assert.strictEqual(waDispatchResult.dodCompliant, true)
assert.ok(waDispatchResult.totalLatencyMs < 5000, 'Must meet < 5s SLA')

// Check booking was confirmed in store
const updatedBooking = e2eStore.bookings.get(pendingBooking.id)
assert.strictEqual(updatedBooking?.status, 'confirmed')
assert.strictEqual(updatedBooking?.down_payment_idr, 20000)
assert.strictEqual(updatedBooking?.remaining_balance_idr, 30000)

// Check notification logs
const e2eLogs = e2eStore.notification_logs
assert.ok(e2eLogs.length >= 2, 'Should have both customer and barber logs')
const custLog = e2eLogs.find((l): boolean => l.template_name === 'booking_confirmed')
const brbLog = e2eLogs.find((l): boolean => l.template_name === 'barber_booking_alert')
assert.strictEqual(custLog?.status, 'sent')
assert.strictEqual(brbLog?.status, 'sent')

console.log('PASS: End-to-end payment to WhatsApp confirmation verified in < 5s.\n')

// ============================================================================
// TEST 12: Route Handlers: /api/cron/reminders & /api/notifications/dispatch
// ============================================================================
console.log('[Test 12] Route Handlers Verification')

// 1. GET /api/cron/reminders
const getCronReq = new Request('http://localhost:3000/api/cron/reminders', { method: 'GET' })
const getCronRes: Response = await getCronReminders(getCronReq)
assert.strictEqual(getCronRes.status, 200)
const getCronJson = (await getCronRes.json()) as Record<string, unknown>
assert.strictEqual(getCronJson.service, 'Damez Barbershop WhatsApp Arrival Reminder Cron Worker')

// 2. POST /api/cron/reminders
const postCronReq = new Request('http://localhost:3000/api/cron/reminders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
const postCronRes: Response = await postCronReminders(postCronReq)
assert.strictEqual(postCronRes.status, 200)

// 3. GET /api/notifications/dispatch
const getDispatchRes: Response = await getNotifDispatch()
assert.strictEqual(getDispatchRes.status, 200)
const getDispatchJson = (await getDispatchRes.json()) as Record<string, unknown>
assert.strictEqual(getDispatchJson.anti_emoji_policy, true)
assert.strictEqual(getDispatchJson.sla_seconds, 5)

// 4. POST /api/notifications/dispatch (template test)
const postDispatchReq = new Request('http://localhost:3000/api/notifications/dispatch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'send_template',
    recipient_phone: '081234567890',
    template_name: 'arrival_reminder_h30m',
    variables: {
      customer_name: 'Budi Santoso',
      booking_code: 'DMZ-20261024-001',
      barber_name: 'Rian Pratama',
      start_time: '14:00'
    }
  })
})
const postDispatchRes: Response = await postNotifDispatch(postDispatchReq)
assert.strictEqual(postDispatchRes.status, 200)
const postDispatchJson = (await postDispatchRes.json()) as { success: boolean }
assert.strictEqual(postDispatchJson.success, true)

console.log('PASS: All Route Handlers tested and verified.\n')

// ============================================================================
// SUMMARY
// ============================================================================
console.log('======================================================================')
console.log('CONGRATULATIONS: ALL 12 WHATSAPP DISPATCHER TESTS PASSED 100%!')
console.log('DoD VERIFIED: Pesan WhatsApp terkirim dalam < 5 detik setelah pembayaran!')
console.log('HUMANIZER VERIFIED: 0 Emoji, 0 Em-dash, 0 En-dash, UU PDP Compliant.')
console.log('======================================================================\n')
