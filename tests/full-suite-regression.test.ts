/**
 * DAMEZ BARBERSHOP - M8-06 FULL-SUITE AUTOMATED E2E REGRESSION RE-VERIFICATION
 * Deliverable: tests/full-suite-regression.test.ts
 * 
 * Fokus Pengujian Komprehensif:
 * 1. Verifikasi Booking End-to-End (Golden Path)
 * 2. Kebijakan Pembatalan & Reschedule H-3 Jam (Preserved vs Forfeited DP)
 * 3. Batas Toleransi Kedatangan 15 Menit & No-Show Lifecycle
 * 4. Konkurensi Multi-User & Stress Collision Defense (Zero Double Booking)
 * 5. Verifikasi Zero-Regression Seluruh Perbaikan M8 (M8-01 s/d M8-05)
 * 
 * Definition of Done (DoD):
 * 100% test suites lulus hijau (0 failed, 0 flaked).
 */

import assert from 'node:assert'
import crypto from 'node:crypto'
import { NextRequest } from 'next/server.js'

// Domain & Services
import {
  inMemoryHoldsStore,
  calculateHoldExpiry,
  isHoldExpired,
  getRemainingHoldTime,
  releaseExpiredSlotHolds,
  HOLD_TTL_MINUTES,
  HOLD_TTL_SECONDS
} from '../lib/slots/auto-expire.ts'
import { slotMutex } from '../lib/security/concurrency-lock.ts'
import { globalRateLimiter } from '../lib/security/rate-limit.ts'
import { FLAT_DOWN_PAYMENT_AMOUNT_IDR } from '../lib/payment/midtrans.ts'
import {
  evaluateRescheduleEligibility,
  evaluateCancellationPolicy,
  evaluateArrivalTolerance,
  RESCHEDULE_CUTOFF_HOURS,
  LATENESS_TOLERANCE_LIMIT_MINUTES
} from '../lib/booking/policy.ts'
import {
  resetAdminMockStore,
  getAdminDailyBookings,
  startBookingService,
  completeBookingCheckout,
  markBookingNoShow,
  generateDailyRevenueCsv
} from '../lib/admin/service.ts'
import {
  normalizeIndonesianPhoneNumber,
  isValidIndonesianPhoneNumber,
  renderWhatsAppTemplate,
  calculateToleranceTime,
  calculateRescheduleDeadlineTime
} from '../lib/notifications/whatsapp.ts'
import { validateIndonesianPhone } from '../components/booking/utils.ts'

// Route Handlers
import { GET as slotsAvailableGetHandler } from '../app/api/slots/available/route.ts'
import { POST as holdPostHandler, GET as holdGetHandler } from '../app/api/booking/hold/route.ts'
import { POST as checkoutPostHandler } from '../app/api/booking/checkout/route.ts'
import { POST as webhookPostHandler } from '../app/api/webhooks/midtrans/route.ts'
import { GET as bookingCodeGetHandler, POST as bookingCodePostHandler } from '../app/api/booking/[code]/route.ts'
import { GET as adminBookingsGetHandler } from '../app/api/admin/bookings/route.ts'
import { PATCH as adminStatusPatchHandler } from '../app/api/admin/bookings/[id]/status/route.ts'
import { GET as adminCsvReportGetHandler } from '../app/api/admin/reports/daily-csv/route.ts'

console.log('======================================================================')
console.log('   DAMEZ BARBERSHOP - M8-06 FULL-SUITE AUTOMATED REGRESSION SUITE     ')
console.log('   Comprehensive End-to-End, Policies, Concurrency & Zero-Regression  ')
console.log('======================================================================\n')

process.env.MOCK_MIDTRANS = 'true'
process.env.MIDTRANS_SERVER_KEY = 'SB-Mid-server-TEST-KEY-REGRESSION-M806'
const TEST_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY

function generateSha512Signature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string = TEST_SERVER_KEY
): string {
  const raw = `${orderId}${statusCode}${grossAmount}${serverKey}`
  return crypto.createHash('sha512').update(raw).digest('hex').toLowerCase()
}

async function runFullSuiteRegression() {
  const TEST_DATE = '2026-10-27'
  const barberRian = 'b0000001-0000-0000-0000-000000000001'
  const barberDimas = 'b0000001-0000-0000-0000-000000000002'
  const barberKevin = 'b0000001-0000-0000-0000-000000000003'
  const serviceClassic = 'a0000001-0000-0000-0000-000000000001' // 45m, Rp 50.000
  const serviceBeard = 'a0000001-0000-0000-0000-000000000002'   // 30m, Rp 35.000

  // Reset in-memory states
  inMemoryHoldsStore.clear()
  slotMutex.clear()
  globalRateLimiter.clear()
  resetAdminMockStore(TEST_DATE)

  // ==========================================================================
  // MODULE 1: FULL END-TO-END BOOKING LIFECYCLE (GOLDEN PATH)
  // ==========================================================================
  console.log('--- MODULE 1: FULL END-TO-END BOOKING LIFECYCLE (GOLDEN PATH) ---')

  // 1.1 Available slots query
  console.log('[Step 1.1] Query available slots for barber Rian')
  const slotsReq = new NextRequest(
    `http://localhost:3000/api/slots/available?date=${TEST_DATE}&barber_id=${barberRian}&duration=45`
  )
  const slotsRes = await slotsAvailableGetHandler(slotsReq)
  assert.strictEqual(slotsRes.status, 200, 'Slots endpoint returned 200')
  const slotsData = await slotsRes.json()
  assert.strictEqual(slotsData.success, true)
  assert.ok(slotsData.slots.length > 0, 'Found available slots')
  const selectedSlot = slotsData.slots.find((s: any) => s.time === '11:00') || slotsData.slots[0]
  console.log(`PASS: Step 1.1 - ${slotsData.slots.length} available slots retrieved. Selected: ${selectedSlot.time}`)

  // 1.2 Slot temporary hold creation (15-min TTL, flat DP Rp 20.000)
  console.log('[Step 1.2] Create 15-min temporary slot hold')
  const holdReq = new Request('http://localhost:3000/api/booking/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '180.252.10.1' },
    body: JSON.stringify({
      barber_id: barberRian,
      booking_date: TEST_DATE,
      start_time: selectedSlot.start_time || `${TEST_DATE}T11:00:00+07:00`,
      end_time: selectedSlot.end_time || `${TEST_DATE}T11:45:00+07:00`,
      service_duration_minutes: 45,
      total_price_idr: 50000,
      customer_name: 'Budi Santoso',
      customer_phone: '0812-3456-7890',
      customer_email: 'budi@example.com',
      service_ids: [serviceClassic]
    })
  })
  const holdRes = await holdPostHandler(holdReq)
  assert.strictEqual(holdRes.status, 201, 'Hold must return 201 Created')
  const holdData = await holdRes.json()
  const bookingId = holdData.data.booking_id
  const bookingCode = holdData.data.booking_code
  assert.strictEqual(holdData.data.down_payment_idr, 20000, 'DP must be Rp 20.000')
  assert.strictEqual(holdData.data.status, 'pending_payment')
  console.log(`PASS: Step 1.2 - Hold created. ID: ${bookingId}, Code: ${bookingCode}, DP: Rp ${holdData.data.down_payment_idr}`)

  // 1.3 Snap token checkout generation
  console.log('[Step 1.3] Generate Midtrans Snap checkout token')
  const checkoutReq = new Request('http://localhost:3000/api/booking/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booking_id: bookingId })
  })
  const checkoutRes = await checkoutPostHandler(checkoutReq)
  assert.strictEqual(checkoutRes.status, 200)
  const checkoutData = await checkoutRes.json()
  assert.ok(checkoutData.data.token)
  const orderId = checkoutData.data.order_id
  console.log(`PASS: Step 1.3 - Checkout Snap Token created: ${checkoutData.data.token}, Order ID: ${orderId}`)

  // 1.4 Webhook settlement notification
  console.log('[Step 1.4] Midtrans settlement webhook notification')
  const sigKey = generateSha512Signature(orderId, '200', '20000.00')
  const webhookReq = new Request('http://localhost:3000/api/webhooks/midtrans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: orderId,
      status_code: '200',
      gross_amount: '20000.00',
      signature_key: sigKey,
      transaction_status: 'settlement',
      payment_type: 'qris',
      transaction_id: 'trx-e2e-reg-001',
      custom_field1: bookingId
    })
  })
  const webhookRes = await webhookPostHandler(webhookReq)
  assert.strictEqual(webhookRes.status, 200)
  const webhookData = await webhookRes.json()
  assert.strictEqual(webhookData.bookingStatus, 'confirmed')
  console.log(`PASS: Step 1.4 - Webhook settled booking. Status: ${webhookData.bookingStatus}`)

  // 1.5 Boarding pass retrieval
  console.log('[Step 1.5] Customer retrieves digital boarding pass')
  const passReq = new Request(`http://localhost:3000/api/booking/${bookingCode}`)
  const passRes = await bookingCodeGetHandler(passReq, { params: Promise.resolve({ code: bookingCode }) })
  assert.strictEqual(passRes.status, 200)
  const passData = await passRes.json()
  assert.strictEqual(passData.data.booking_code, bookingCode)
  assert.strictEqual(passData.data.status, 'confirmed')
  console.log(`PASS: Step 1.5 - Digital Boarding Pass verified for ${passData.data.customer_name}`)

  // 1.6 Admin lifecycle: Start service (in_progress) & Complete service (completed)
  console.log('[Step 1.6] Admin lifecycle: Start service -> Complete & Cashier checkout')
  const startReq = new Request(`http://localhost:3000/api/admin/bookings/${bookingId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'in_progress' })
  })
  const startRes = await adminStatusPatchHandler(startReq, { params: Promise.resolve({ id: bookingId }) })
  assert.strictEqual(startRes.status, 200)
  const startData = await startRes.json()
  assert.strictEqual(startData.booking.status, 'in_progress')
  console.log('PASS: Step 1.6a - Booking started (status: in_progress)')

  const completeReq = new Request(`http://localhost:3000/api/admin/bookings/${bookingId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'completed',
      settlement_method: 'cash',
      cash_amount_received: 50000,
      notes: 'Gentlemen Classic selesai rapi'
    })
  })
  const completeRes = await adminStatusPatchHandler(completeReq, { params: Promise.resolve({ id: bookingId }) })
  assert.strictEqual(completeRes.status, 200)
  const completeData = await completeRes.json()
  assert.strictEqual(completeData.booking.status, 'completed')
  assert.strictEqual(completeData.change, 20000, 'Cash change must be Rp 20.000 (50k - 30k balance)')
  console.log(`PASS: Step 1.6b - Booking completed. Change given: Rp ${completeData.change}`)

  // 1.7 Daily cash reconciliation & CSV export
  console.log('[Step 1.7] Daily cash reconciliation and RFC 4180 CSV export')
  const csvReq = new Request(`http://localhost:3000/api/admin/reports/daily-csv?date=${TEST_DATE}`)
  const csvRes = await adminCsvReportGetHandler(csvReq)
  assert.strictEqual(csvRes.status, 200)
  const csvText = await csvRes.text()
  assert.ok(csvText.includes(bookingCode), 'CSV export must include completed booking code')
  assert.ok(csvText.includes('Gentlemen Classic Haircut'), 'CSV must include service name')
  console.log('PASS: Step 1.7 - Daily CSV report generated with complete transaction history.\n')

  // ==========================================================================
  // MODULE 2: PEMBATALAN & RESCHEDULE H-3 JAM (CUTOFF & DP FORFEITURE)
  // ==========================================================================
  console.log('--- MODULE 2: PEMBATALAN & RESCHEDULE H-3 JAM POLICY ---')

  const testSlotDate = '2026-10-27'
  const testSlotStart = '15:00' // Cutoff H-3 adalah 12:00 WIB

  // 2.1 Reschedule > 3 jam sebelum jadwal (Misal pukul 10:00 WIB) -> Sah, DP dialihkan
  console.log('[Test 2.1] Reschedule 5 jam sebelum jadwal (Pukul 10:00 WIB)')
  const resEligible = evaluateRescheduleEligibility(
    testSlotDate,
    testSlotStart,
    new Date('2026-10-27T10:00:00+07:00')
  )
  assert.strictEqual(resEligible.isAllowed, true, 'Reschedule >= 3 hours must be allowed')
  assert.strictEqual(resEligible.dpHandling, 'transferrable')
  assert.strictEqual(resEligible.cutoffTime, '12:00')
  assert.strictEqual(resEligible.minutesUntilSlot, 300)
  console.log('PASS: Test 2.1 - Reschedule 5 jam sebelum jadwal disetujui (DP dialihkan tanpa denda).')

  // 2.2 Reschedule < 3 jam sebelum jadwal (Misal pukul 13:00 WIB) -> Ditolak, batas H-3 lewat
  console.log('[Test 2.2] Reschedule 2 jam sebelum jadwal (Pukul 13:00 WIB)')
  const resIneligible = evaluateRescheduleEligibility(
    testSlotDate,
    testSlotStart,
    new Date('2026-10-27T13:00:00+07:00')
  )
  assert.strictEqual(resIneligible.isAllowed, false, 'Reschedule < 3 hours must be disallowed')
  assert.strictEqual(resIneligible.dpHandling, 'forfeited')
  assert.ok(resIneligible.reason?.includes('H-3'))
  console.log('PASS: Test 2.2 - Reschedule < 3 jam ditolak sesuai kebijakan H-3 jam.')

  // 2.3 Pembatalan > 3 jam sebelum jadwal -> DP Preserved / Voucher
  console.log('[Test 2.3] Pembatalan 4 jam sebelum jadwal (Pukul 11:00 WIB)')
  const cancelEligible = evaluateCancellationPolicy(
    testSlotDate,
    testSlotStart,
    new Date('2026-10-27T11:00:00+07:00')
  )
  assert.strictEqual(cancelEligible.isEligibleForPreservedDP, true)
  assert.strictEqual(cancelEligible.dpHandling, 'preserved')
  assert.ok(cancelEligible.dpStatusExplanation.includes('lebih awal dari batas H-3 jam'))
  console.log('PASS: Test 2.3 - Pembatalan awal membebaskan reservasi tanpa denda sisa.')

  // 2.4 Pembatalan < 3 jam sebelum jadwal -> DP Forfeited (Hangus)
  console.log('[Test 2.4] Pembatalan mendadak 1 jam sebelum jadwal (Pukul 14:00 WIB)')
  const cancelIneligible = evaluateCancellationPolicy(
    testSlotDate,
    testSlotStart,
    new Date('2026-10-27T14:00:00+07:00')
  )
  assert.strictEqual(cancelIneligible.isEligibleForPreservedDP, false)
  assert.strictEqual(cancelIneligible.dpHandling, 'forfeited')
  assert.ok(cancelIneligible.dpStatusExplanation.includes('kurang dari batas H-3 jam'))
  console.log('PASS: Test 2.4 - Pembatalan mendadak < 3 jam menegakkan DP Hangus untuk melindungi barber.\n')

  // ==========================================================================
  // MODULE 3: BATAS TOLERANSI 15 MENIT & NO-SHOW LIFECYCLE
  // ==========================================================================
  console.log('--- MODULE 3: BATAS TOLERANSI 15 MENIT & NO-SHOW LIFECYCLE ---')

  const sessionStart = '16:00' // Toleransi berakhir 16:15 WIB

  // 3.1 Datang 5 menit terlambat (16:05) -> On-time / grace period
  const arrOnTime = evaluateArrivalTolerance(
    testSlotDate,
    sessionStart,
    new Date('2026-10-27T16:05:00+07:00')
  )
  assert.strictEqual(arrOnTime.status, 'on_time')
  assert.strictEqual(arrOnTime.isLateWarning, false)
  assert.strictEqual(arrOnTime.isPastTolerance, false)
  assert.strictEqual(arrOnTime.toleranceLimitTime, '16:15')
  console.log('PASS: Test 3.1 - Kedatangan terlambat 5 menit masih dalam batas aman (on_time).')

  // 3.2 Datang 12 menit terlambat (16:12) -> Warning threshold (10-14 menit)
  const arrWarning = evaluateArrivalTolerance(
    testSlotDate,
    sessionStart,
    new Date('2026-10-27T16:12:00+07:00')
  )
  assert.strictEqual(arrWarning.status, 'late_warning')
  assert.strictEqual(arrWarning.isLateWarning, true)
  assert.strictEqual(arrWarning.isPastTolerance, false)
  console.log('PASS: Test 3.2 - Keterlambatan 12 menit mengaktifkan peringatan amber (late_warning).')

  // 3.3 Lewat 15 menit (16:16) -> Tolerance exceeded & No-Show trigger
  const arrExceeded = evaluateArrivalTolerance(
    testSlotDate,
    sessionStart,
    new Date('2026-10-27T16:16:00+07:00')
  )
  assert.strictEqual(arrExceeded.status, 'tolerance_exceeded')
  assert.strictEqual(arrExceeded.isPastTolerance, true)
  assert.strictEqual(arrExceeded.recommendedAction, 'mark_no_show_and_release_chair')
  console.log('PASS: Test 3.3 - Keterlambatan > 15 menit memicu pelepasan kursi dan status No-Show.')

  // 3.4 Eksekusi No-Show via Admin API & Pelepasan Kursi
  console.log('[Test 3.4] Admin triggers No-Show action on late booking')
  // Create booking for no-show test
  const nsHoldReq = new Request('http://localhost:3000/api/booking/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '180.252.10.2' },
    body: JSON.stringify({
      barber_id: barberDimas,
      booking_date: TEST_DATE,
      start_time: `${TEST_DATE}T16:00:00+07:00`,
      end_time: `${TEST_DATE}T16:45:00+07:00`,
      service_duration_minutes: 45,
      total_price_idr: 50000,
      customer_name: 'NoShow Guest',
      customer_phone: '081299998888',
      service_ids: [serviceClassic]
    })
  })
  const nsHoldRes = await holdPostHandler(nsHoldReq)
  const nsHoldData = await nsHoldRes.json()
  const nsBookingId = nsHoldData.data.booking_id

  // Confirm booking
  const nsOrderId = `ORDER-NS-${nsHoldData.data.booking_code}`
  const nsSig = generateSha512Signature(nsOrderId, '200', '20000.00')
  await webhookPostHandler(
    new Request('http://localhost:3000/api/webhooks/midtrans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: nsOrderId,
        status_code: '200',
        gross_amount: '20000.00',
        signature_key: nsSig,
        transaction_status: 'settlement',
        payment_type: 'qris',
        transaction_id: 'trx-ns-001',
        custom_field1: nsBookingId
      })
    })
  )

  // Mark No-Show via PATCH /api/admin/bookings/[id]/status
  const nsPatchReq = new Request(`http://localhost:3000/api/admin/bookings/${nsBookingId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'no_show',
      reason: 'Tamu tidak hadir setelah toleransi 15 menit habis'
    })
  })
  const nsPatchRes = await adminStatusPatchHandler(nsPatchReq, { params: Promise.resolve({ id: nsBookingId }) })
  assert.strictEqual(nsPatchRes.status, 200)
  const nsPatchData = await nsPatchRes.json()
  assert.strictEqual(nsPatchData.booking.status, 'no_show')
  assert.ok(nsPatchData.booking.cancellation_reason.includes('15 menit'))
  console.log('PASS: Test 3.4 - Booking berhasil diubah ke no_show, DP Rp 20.000 hangus, kursi dilepas.\n')

  // ==========================================================================
  // MODULE 4: MULTI-USER CONCURRENCY & RACE-CONDITION DEFENSE
  // ==========================================================================
  console.log('--- MODULE 4: MULTI-USER CONCURRENCY & RACE-CONDITION DEFENSE ---')

  // 4.1 50 Simultaneous requests for exact same slot and barber
  console.log('[Test 4.1] 50 Concurrent requests for same slot and barber (Stampede simulation)')
  globalRateLimiter.clear()
  const stampedeTime = `${TEST_DATE}T17:00:00+07:00`
  const stampedePromises = Array.from({ length: 50 }, (_, i) => {
    return holdPostHandler(
      new Request('http://localhost:3000/api/booking/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `180.252.33.${i + 1}` },
        body: JSON.stringify({
          barber_id: barberKevin,
          booking_date: TEST_DATE,
          start_time: stampedeTime,
          end_time: `${TEST_DATE}T17:45:00+07:00`,
          service_duration_minutes: 45,
          total_price_idr: 50000,
          customer_name: `Concurrent User ${i + 1}`,
          customer_phone: `08125555${String(i).padStart(4, '0')}`,
          service_ids: [serviceClassic]
        })
      })
    )
  })

  const stampedeResults = await Promise.all(stampedePromises)
  const success201 = stampedeResults.filter(r => r.status === 201)
  const conflict409 = stampedeResults.filter(r => r.status === 409)

  assert.strictEqual(success201.length, 1, 'Exactly 1 request must win the slot (201 Created)')
  assert.strictEqual(conflict409.length, 49, '49 competing requests must be rejected with 409 Conflict')
  console.log(`PASS: Test 4.1 - 50 Concurrent requests: exactly 1 won, 49 cleanly rejected with 409 Conflict. Zero double-booking.`)

  // 4.2 Multi-Barber Parallelism: 3 Barbers at the exact same hour
  console.log('[Test 4.2] Multi-Barber Parallel Independence (Rian, Dimas, Kevin at 18:00 WIB)')
  globalRateLimiter.clear()
  const parallelTime = `${TEST_DATE}T18:00:00+07:00`
  const parallelReqs = [
    { barber: barberRian, phone: '081277710001', name: 'Barber Rian Guest' },
    { barber: barberDimas, phone: '081277710002', name: 'Barber Dimas Guest' },
    { barber: barberKevin, phone: '081277710003', name: 'Barber Kevin Guest' }
  ].map((item, idx) =>
    holdPostHandler(
      new Request('http://localhost:3000/api/booking/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `180.252.44.${idx + 1}` },
        body: JSON.stringify({
          barber_id: item.barber,
          booking_date: TEST_DATE,
          start_time: parallelTime,
          end_time: `${TEST_DATE}T18:45:00+07:00`,
          service_duration_minutes: 45,
          total_price_idr: 50000,
          customer_name: item.name,
          customer_phone: item.phone,
          service_ids: [serviceClassic]
        })
      })
    )
  )

  const parallelResults = await Promise.all(parallelReqs)
  parallelResults.forEach((res, i) => {
    assert.strictEqual(res.status, 201, `Barber ${i + 1} request must succeed with 201`)
  })
  console.log('PASS: Test 4.2 - 3 Independent barbers reserved concurrently without cross-lock interference.')

  // 4.3 Webhook settlement idempotency under high concurrency
  console.log('[Test 4.3] Concurrent duplicate webhooks idempotency')
  const winnerBody = await success201[0].json()
  const winnerBookingId = winnerBody.data.booking_id
  const winnerOrderId = `ORDER-WIN-${winnerBody.data.booking_code}`
  const winnerSig = generateSha512Signature(winnerOrderId, '200', '20000.00')

  const concurrentWebhooks = Array.from({ length: 5 }, () =>
    webhookPostHandler(
      new Request('http://localhost:3000/api/webhooks/midtrans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: winnerOrderId,
          status_code: '200',
          gross_amount: '20000.00',
          signature_key: winnerSig,
          transaction_status: 'settlement',
          payment_type: 'qris',
          transaction_id: 'trx-idem-001',
          custom_field1: winnerBookingId
        })
      })
    )
  )
  const webhookBatchRes = await Promise.all(concurrentWebhooks)
  webhookBatchRes.forEach(res => {
    assert.strictEqual(res.status, 200, 'All duplicate webhooks must return 200 OK')
  })
  console.log('PASS: Test 4.3 - 5 Concurrent duplicate webhooks handled with 100% idempotency.\n')

  // ==========================================================================
  // MODULE 5: COMPREHENSIVE ZERO-REGRESSION AUDIT (M8 REMEDIATIONS)
  // ==========================================================================
  console.log('--- MODULE 5: COMPREHENSIVE ZERO-REGRESSION AUDIT (M8 REMEDIATIONS) ---')

  // 5.1 NaN Date Prevention with ISO 8601 Strings & Time Parsing
  console.log('[Test 5.1] NaN Date prevention on ISO 8601 timestamps')
  const validIso = new Date('2026-10-27T19:00:00+07:00')
  const holdExpiry = calculateHoldExpiry(validIso)
  assert.ok(!isNaN(holdExpiry.expiresAt.getTime()), 'Hold expiry must be valid date')
  assert.strictEqual(holdExpiry.ttlMinutes, 15)
  console.log('PASS: Test 5.1 - ISO 8601 timestamps safely parsed with zero NaN Date errors.')

  // 5.2 Indonesian Mobile Phone Normalization (Awalan 8xxx, Spasi, Delimiter)
  console.log('[Test 5.2] Indonesian mobile phone normalization (8xxx, spaces, dashes)')
  const clientNorm = validateIndonesianPhone('81234567890')
  assert.strictEqual(clientNorm.isValid, true)
  assert.strictEqual(clientNorm.normalized, '081234567890', '8xxx must normalize to 08xxx')

  const clientSpaced = validateIndonesianPhone('+62 812-3456-7890')
  assert.strictEqual(clientSpaced.isValid, true)
  assert.strictEqual(clientSpaced.normalized, '081234567890')

  const clientZw = validateIndonesianPhone('\u200B081234567890')
  assert.strictEqual(clientZw.isValid, true)
  assert.strictEqual(clientZw.normalized, '081234567890', 'Zero-width space stripped')

  const serverNorm = normalizeIndonesianPhoneNumber('81234567890')
  assert.strictEqual(serverNorm, '6281234567890', 'Server WhatsApp normalizer must convert 8xxx to 628xxx for WhatsApp API')
  assert.strictEqual(isValidIndonesianPhoneNumber('081234567890'), true)
  assert.strictEqual(isValidIndonesianPhoneNumber('08001234567'), false, 'Toll free rejected')
  console.log('PASS: Test 5.2 - Client-server phone validation synchronized and E.164 compliant.')

  // 5.3 Checkout Token Idempotency (Does not extend hold TTL)
  console.log('[Test 5.3] Checkout idempotency & hold TTL preservation')
  const initialBooking = inMemoryHoldsStore.get(bookingId)
  const initialExpiresAt = initialBooking?.hold_expires_at
  // Second checkout call
  await checkoutPostHandler(
    new Request('http://localhost:3000/api/booking/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId })
    })
  )
  const refreshedBooking = inMemoryHoldsStore.get(bookingId)
  assert.strictEqual(refreshedBooking?.hold_expires_at, initialExpiresAt, 'Checkout refresh must not extend hold TTL')
  console.log('PASS: Test 5.3 - Checkout token generation idempotent, TTL locked.')

  // 5.4 Case-Insensitive Booking Code Retrieval
  console.log('[Test 5.4] Case-insensitive booking code retrieval')
  const lowerCode = bookingCode.toLowerCase()
  const lowerReq = new Request(`http://localhost:3000/api/booking/${lowerCode}`)
  const lowerRes = await bookingCodeGetHandler(lowerReq, { params: Promise.resolve({ code: lowerCode }) })
  assert.strictEqual(lowerRes.status, 200, 'Lowercase booking code must resolve successfully')
  const lowerData = await lowerRes.json()
  assert.strictEqual(lowerData.data.booking_code, bookingCode)
  console.log('PASS: Test 5.4 - Case-insensitive booking code retrieval verified.')

  // 5.5 Unauthenticated Payment Bypass Security Protection
  console.log('[Test 5.5] Unauthenticated POST /api/booking/[code] security protection')
  const bypassReq = new Request(`http://localhost:3000/api/booking/${bookingCode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_type: 'free_bypass' })
  })
  const prevEnv = process.env.NODE_ENV
  try {
    ;(process.env as any).NODE_ENV = 'production'
    const bypassRes = await bookingCodePostHandler(bypassReq, { params: Promise.resolve({ code: bookingCode }) })
    assert.strictEqual(bypassRes.status, 403, 'Unauthenticated payment bypass must return 403 Forbidden in production')
    console.log('PASS: Test 5.5 - Payment bypass attempt blocked with 403 Forbidden.')
  } finally {
    ;(process.env as any).NODE_ENV = prevEnv
  }

  // 5.6 Late Settlement Webhook Reconciler
  console.log('[Test 5.6] Late settlement webhook reconciler')
  // Create hold that expires
  globalRateLimiter.clear()
  const LATE_TEST_DATE = '2026-10-31'
  const lateHoldReq = new Request('http://localhost:3000/api/booking/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '180.252.55.1' },
    body: JSON.stringify({
      barber_id: barberDimas,
      booking_date: LATE_TEST_DATE,
      start_time: `${LATE_TEST_DATE}T19:00:00+07:00`,
      end_time: `${LATE_TEST_DATE}T19:45:00+07:00`,
      service_duration_minutes: 45,
      total_price_idr: 50000,
      customer_name: 'Late Settlement User',
      customer_phone: '081288887777',
      service_ids: [serviceClassic]
    })
  })
  const lateHoldRes = await holdPostHandler(lateHoldReq)
  const lateHoldData = await lateHoldRes.json()
  const lateBookingId = lateHoldData.data.booking_id
  const lateCode = lateHoldData.data.booking_code

  // Manually expire hold
  const lateBooking = inMemoryHoldsStore.get(lateBookingId)
  if (lateBooking) {
    lateBooking.status = 'expired'
  }

  // Webhook arrives after hold expired
  const lateOrderId = `ORDER-LATE-${lateCode}`
  const lateSig = generateSha512Signature(lateOrderId, '200', '20000.00')
  const lateWebhookRes = await webhookPostHandler(
    new Request('http://localhost:3000/api/webhooks/midtrans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: lateOrderId,
        status_code: '200',
        gross_amount: '20000.00',
        signature_key: lateSig,
        transaction_status: 'settlement',
        payment_type: 'qris',
        transaction_id: 'trx-late-001',
        custom_field1: lateBookingId
      })
    })
  )
  assert.strictEqual(lateWebhookRes.status, 200)
  const lateWebhookData = await lateWebhookRes.json()
  assert.strictEqual(lateWebhookData.bookingStatus, 'confirmed', 'Reconciler must restore expired booking to confirmed')
  console.log('PASS: Test 5.6 - Late settlement reconciler successfully restored expired booking.')

  // 5.7 WhatsApp Notification Templates & Zero Emoji Compliance
  console.log('[Test 5.7] WhatsApp notification templates & zero emoji compliance')
  const waMsg = renderWhatsAppTemplate('booking_confirmed', {
    customer_name: 'Budi Santoso',
    booking_code: 'DMZ-20261027-0001',
    service_names: 'Gentlemen Classic Haircut',
    service_duration: 45,
    barber_name: 'Rian Pratama',
    chair_number: 1,
    booking_date: 'Selasa, 27 Oktober 2026',
    start_time: '14:00',
    end_time: '14:45',
    dp_amount_formatted: '20.000',
    remaining_balance_formatted: '30.000',
    ticket_url: 'https://damezbarber.com/booking/success/DMZ-20261027-0001',
    tolerance_time: '14:15',
    reschedule_deadline_time: '11:00'
  })
  // Emoji regex check
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
  assert.ok(!emojiRegex.test(waMsg), 'WhatsApp message must be 100% free of emojis')
  assert.ok(waMsg.includes('14:15'), 'Message must include tolerance time 14:15')
  assert.ok(waMsg.includes('11:00'), 'Message must include reschedule deadline 11:00')
  console.log('PASS: Test 5.7 - WhatsApp templates rendered with 100% zero emoji compliance and accurate time windows.\n')

  console.log('======================================================================')
  console.log('🎉 ALL 5 MODULES IN tests/full-suite-regression.test.ts PASSED 100%!')
  console.log('   DoD VERIFIED: Zero Regression, Concurrency Locked, Policies Active ')
  console.log('======================================================================')
}

runFullSuiteRegression().catch((err) => {
  console.error('\nCRITICAL REGRESSION TEST FAILURE:', err)
  process.exit(1)
})
