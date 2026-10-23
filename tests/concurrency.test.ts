/**
 * DAMEZ BARBERSHOP - AUTOMATED CONCURRENCY, TIMEOUT & WEBHOOK TEST SUITE
 * Deliverable: tests/concurrency.test.ts
 * 
 * Verifikasi:
 * Part 1: Simulasi Pemesanan Konkuren Multi-User (Stampede, Multi-Barber, Partial Overlap, HTTP Route)
 * Part 2: Uji Timeout Kedaluwarsa 15 Menit (Presisi TTL, Sweeper, Instant Slot Re-availability)
 * Part 3: Verifikasi Respon Webhook Midtrans Sukses & Gagal (Settlement, Capture, Expire, Cancel, Deny, Idempotency)
 */

import assert from 'node:assert'
import crypto from 'node:crypto'
import {
  createTemporarySlotHold,
  releaseExpiredSlotHolds,
  calculateHoldExpiry,
  isHoldExpired,
  getRemainingHoldTime,
  inMemoryHoldsStore,
  HOLD_TTL_MINUTES,
  HOLD_TTL_SECONDS,
  type SlotHoldRecord
} from '../lib/slots/auto-expire.ts'
import { slotMutex } from '../lib/security/concurrency-lock.ts'
import { globalRateLimiter } from '../lib/security/rate-limit.ts'
import { POST as holdPostHandler } from '../app/api/booking/hold/route.ts'
import { POST as webhookPostHandler } from '../app/api/webhooks/midtrans/route.ts'
import {
  processMidtransWebhook,
  verifyWebhookSignature,
  createWebhookMockStore,
  type MidtransWebhookPayload,
  type WebhookMockStore,
  type BookingRow,
  type WebhookProcessResult
} from '../lib/payment/webhook.ts'

console.log('=== RUNNING AUTOMATED CONCURRENCY, TIMEOUT & WEBHOOK TEST SUITE ===\n')

const TEST_SERVER_KEY: string = 'SB-Mid-server-TEST-KEY-CONCURRENCY-99'

function generateSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string = TEST_SERVER_KEY
): string {
  const raw: string = `${orderId}${statusCode}${grossAmount}${serverKey}`
  return crypto.createHash('sha512').update(raw).digest('hex').toLowerCase()
}

function createMockBookingRow(overrides?: Partial<BookingRow>): BookingRow {
  return {
    id: 'b-mock-' + Math.random().toString(36).substring(2, 9),
    booking_code: 'DMZ-20261025-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    customer_id: 'c-mock-001',
    customer_name: 'Pelanggan Uji Konkuren',
    customer_phone: '081234567890',
    customer_email: 'uji_konkuren@example.com',
    barber_id: 'b0000001-0000-0000-0000-000000000001',
    booking_date: '2026-10-25',
    start_time: '14:00:00',
    end_time: '14:45:00',
    booking_type: 'online',
    status: 'pending_payment',
    service_duration_minutes: 45,
    buffer_minutes: 10,
    booking_range: null,
    total_price_idr: 70000,
    down_payment_idr: 20000,
    remaining_balance_idr: 50000,
    settlement_method: 'none',
    settlement_paid_at: null,
    hold_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    confirmed_at: null,
    completed_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    rescheduled_from_id: null,
    rescheduled_at: null,
    notes: 'Uji otomatis concurrency',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

async function runTestSuite() {
  // Reset state
  inMemoryHoldsStore.clear()
  slotMutex.clear()
  globalRateLimiter.clear()

  // --------------------------------------------------------------------------
  // PART 1: MULTI-USER CONCURRENT BOOKING SIMULATION
  // --------------------------------------------------------------------------
  console.log('[Test 1.1] Multi-User Concurrent Booking Stampede (50 Simultaneous Users)')
  const barberRian = 'b0000001-0000-0000-0000-000000000001'
  const bookingDate = '2026-10-25'
  const startTime = '2026-10-25T11:00:00+07:00'
  const endTime = '2026-10-25T11:45:00+07:00'
  const concurrentCount = 50

  const stampedeRequests = Array.from({ length: concurrentCount }).map((_, i) =>
    createTemporarySlotHold({
      barberId: barberRian,
      bookingDate,
      startTime,
      endTime,
      serviceDurationMinutes: 45,
      totalPriceIdr: 50000,
      downPaymentIdr: 20000,
      customerName: `Concurrent User ${i + 1}`,
      customerPhone: `0812345678${String(i).padStart(2, '0')}`,
      customerEmail: `user_${i + 1}@example.com`,
      serviceIds: ['a0000001-0000-0000-0000-000000000001']
    })
  )

  const stampedeResults = await Promise.all(stampedeRequests)
  const winners = stampedeResults.filter((r) => r.success)
  const losers = stampedeResults.filter((r) => !r.success)

  assert.strictEqual(
    winners.length,
    1,
    `CRITICAL CONCURRENCY BUG: Expected exactly 1 winner out of ${concurrentCount}, got ${winners.length}`
  )
  assert.strictEqual(
    losers.length,
    concurrentCount - 1,
    `Expected ${concurrentCount - 1} losers, got ${losers.length}`
  )

  for (const loser of losers) {
    assert.strictEqual(
      loser.errorCode,
      'SLOT_ALREADY_LOCKED',
      'All losing concurrent requests must receive SLOT_ALREADY_LOCKED'
    )
  }

  const storedHolds = Array.from(inMemoryHoldsStore.values()).filter(
    (h) => h.barber_id === barberRian && h.start_time === startTime && h.status === 'pending_payment'
  )
  assert.strictEqual(storedHolds.length, 1, 'In-memory store must hold exactly 1 active hold record')

  console.log(
    `PASS: Test 1.1 - 50 concurrent requests handled with 100% precision: 1 winner (${winners[0].booking?.booking_code}) and 49 rejected.\n`
  )

  // [Test 1.2] Multi-Barber Independent Concurrency (Zero False Conflict)
  console.log('[Test 1.2] Multi-Barber Independent Concurrency (Rian, Dimas, Kevin at 14:00 WIB)')
  const barberDimas = 'b0000001-0000-0000-0000-000000000002'
  const barberKevin = 'b0000001-0000-0000-0000-000000000003'
  const multiBarberTimeStart = '2026-10-25T14:00:00+07:00'
  const multiBarberTimeEnd = '2026-10-25T14:45:00+07:00'

  const multiBarberRequests = [
    createTemporarySlotHold({
      barberId: barberRian,
      bookingDate,
      startTime: multiBarberTimeStart,
      endTime: multiBarberTimeEnd,
      serviceDurationMinutes: 45,
      totalPriceIdr: 50000,
      customerName: 'Pelanggan Rian',
      customerPhone: '081211111111'
    }),
    createTemporarySlotHold({
      barberId: barberDimas,
      bookingDate,
      startTime: multiBarberTimeStart,
      endTime: multiBarberTimeEnd,
      serviceDurationMinutes: 45,
      totalPriceIdr: 50000,
      customerName: 'Pelanggan Dimas',
      customerPhone: '081222222222'
    }),
    createTemporarySlotHold({
      barberId: barberKevin,
      bookingDate,
      startTime: multiBarberTimeStart,
      endTime: multiBarberTimeEnd,
      serviceDurationMinutes: 45,
      totalPriceIdr: 50000,
      customerName: 'Pelanggan Kevin',
      customerPhone: '081233333333'
    })
  ]

  const multiBarberResults = await Promise.all(multiBarberRequests)
  const allSucceeded = multiBarberResults.every((r) => r.success)
  assert.strictEqual(allSucceeded, true, 'All 3 independent barbers must succeed at the same time')
  console.log('PASS: Test 1.2 - 3 master barber dapat dipesan serentak di slot jam yang sama tanpa false-conflict.\n')

  // [Test 1.3] Partial Overlap Range Collision Under Concurrent Load
  console.log('[Test 1.3] Partial Overlap Range Collision (16:00-16:45 vs 16:15-17:00)')
  // Booking 1: 16:00 - 16:45 pada barber Dimas
  const baseBooking = await createTemporarySlotHold({
    barberId: barberDimas,
    bookingDate,
    startTime: '2026-10-25T16:00:00+07:00',
    endTime: '2026-10-25T16:45:00+07:00',
    serviceDurationMinutes: 45,
    totalPriceIdr: 50000,
    customerName: 'Pelanggan Jam 16:00',
    customerPhone: '081244444444'
  })
  assert.strictEqual(baseBooking.success, true, 'Base booking must succeed')

  // Booking 2 mencoba mengambil 16:15 - 17:00 (overlap 30 menit)
  const overlappingBooking = await createTemporarySlotHold({
    barberId: barberDimas,
    bookingDate,
    startTime: '2026-10-25T16:15:00+07:00',
    endTime: '2026-10-25T17:00:00+07:00',
    serviceDurationMinutes: 45,
    totalPriceIdr: 50000,
    customerName: 'Pelanggan Overlap',
    customerPhone: '081255555555'
  })
  assert.strictEqual(overlappingBooking.success, false, 'Overlapping booking must be blocked')
  assert.strictEqual(overlappingBooking.errorCode, 'SLOT_ALREADY_LOCKED')
  console.log('PASS: Test 1.3 - Partial overlap rentang waktu 16:15 - 17:00 berhasil dicegah 100%.\n')

  // [Test 1.4] HTTP Route Handler Concurrency (/api/booking/hold)
  console.log('[Test 1.4] HTTP Route Handler Concurrent POST /api/booking/hold')
  globalRateLimiter.clear()

  const httpTimeStart = '2026-10-25T17:30:00+07:00'
  const httpTimeEnd = '2026-10-25T18:15:00+07:00'
  const httpRequests = Array.from({ length: 6 }).map((_, i) => {
    return new Request('http://localhost:3000/api/booking/hold', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.10.15'
      },
      body: JSON.stringify({
        barber_id: barberKevin,
        booking_date: bookingDate,
        start_time: httpTimeStart,
        end_time: httpTimeEnd,
        service_duration_minutes: 45,
        total_price_idr: 60000,
        customer_name: `HTTP Customer ${i + 1}`,
        customer_phone: `08127777880${i}`,
        customer_email: `http_${i + 1}@example.com`,
        service_ids: ['a0000001-0000-0000-0000-000000000001']
      })
    })
  })

  const httpResponses = await Promise.all(httpRequests.map((req) => holdPostHandler(req)))
  const httpStatuses = httpResponses.map((res) => res.status)

  const createdCount = httpStatuses.filter((s) => s === 201).length
  const conflictCount = httpStatuses.filter((s) => s === 409).length

  assert.strictEqual(createdCount, 1, 'HTTP handler must yield exactly one 201 Created response')
  assert.strictEqual(conflictCount, 5, 'HTTP handler must reject concurrent collisions with 409 Conflict')
  console.log('PASS: Test 1.4 - HTTP Route Handler /api/booking/hold mengembalikan tepat 1 HTTP 201 dan 5 HTTP 409.\n')

  // ==========================================================================
  // PART 2: UJI TIMEOUT KEDALUWARSA 15 MENIT
  // ==========================================================================
  console.log('--- PART 2: 15-MINUTE TIMEOUT & AUTO-EXPIRATION SYSTEMATIC VERIFICATION ---')

  // [Test 2.1] Precision 15-Minute TTL (900 seconds) & countdown calculation
  console.log('[Test 2.1] Precision 15-Minute TTL (900 seconds) & MM:SS Countdown')
  const baseTimestamp = new Date('2026-10-25T10:00:00.000Z')
  const ttlCalc = calculateHoldExpiry(baseTimestamp)

  assert.strictEqual(ttlCalc.ttlMinutes, 15, 'TTL minutes must be 15')
  assert.strictEqual(ttlCalc.ttlSeconds, 900, 'TTL seconds must be 900')
  const deltaMs = ttlCalc.expiresAt.getTime() - baseTimestamp.getTime()
  assert.strictEqual(deltaMs, 900000, 'Delta must be exactly 900,000 milliseconds (15 minutes)')

  // Formatter verification
  const t0 = getRemainingHoldTime(ttlCalc.expiresAtIso, baseTimestamp)
  assert.strictEqual(t0.formatted, '15:00')
  assert.strictEqual(t0.isExpired, false)

  const tHalf = getRemainingHoldTime(
    ttlCalc.expiresAtIso,
    new Date(baseTimestamp.getTime() + 7.5 * 60 * 1000)
  )
  assert.strictEqual(tHalf.formatted, '07:30')
  assert.strictEqual(tHalf.isExpired, false)

  const tAlmost = getRemainingHoldTime(
    ttlCalc.expiresAtIso,
    new Date(baseTimestamp.getTime() + 899 * 1000)
  )
  assert.strictEqual(tAlmost.formatted, '00:01')
  assert.strictEqual(tAlmost.isExpired, false)

  console.log('PASS: Test 2.1 - Presisi TTL 15 menit dan formatting MM:SS terverifikasi 100%.\n')

  // [Test 2.2] Slot Lock Retention during active TTL
  console.log('[Test 2.2] Slot Lock Retention at t = 14m00s (Still Locked)')
  const expirySlotDate = '2026-10-26'
  const expirySlotStart = '2026-10-26T09:00:00+07:00'
  const expirySlotEnd = '2026-10-26T09:45:00+07:00'
  const lockCreationTime = new Date('2026-10-26T08:00:00.000Z')

  const initialHold = await createTemporarySlotHold({
    barberId: barberRian,
    bookingDate: expirySlotDate,
    startTime: expirySlotStart,
    endTime: expirySlotEnd,
    serviceDurationMinutes: 45,
    totalPriceIdr: 50000,
    customerName: 'User Menit 0',
    customerPhone: '081200000001',
    now: lockCreationTime
  })
  assert.strictEqual(initialHold.success, true, 'Initial hold must succeed')

  // Simulate attempt at 14 minutes
  const at14Minutes = new Date(lockCreationTime.getTime() + 14 * 60 * 1000)
  const attemptAt14m = await createTemporarySlotHold({
    barberId: barberRian,
    bookingDate: expirySlotDate,
    startTime: expirySlotStart,
    endTime: expirySlotEnd,
    serviceDurationMinutes: 45,
    totalPriceIdr: 50000,
    customerName: 'User Menit 14',
    customerPhone: '081200000002',
    now: at14Minutes
  })
  assert.strictEqual(attemptAt14m.success, false, 'Slot must remain locked at minute 14')
  assert.strictEqual(attemptAt14m.errorCode, 'SLOT_ALREADY_LOCKED')
  console.log('PASS: Test 2.2 - Slot terbukti tetap terkunci aman pada menit ke-14.\n')

  // [Test 2.3] Boundary Condition at Exact 15th Minute
  console.log('[Test 2.3] Boundary Condition at Exact 15th Minute (isHoldExpired)')
  const holdExpiryDate = new Date(initialHold.holdExpiresAt!)
  assert.strictEqual(isHoldExpired(holdExpiryDate, new Date(holdExpiryDate.getTime() - 1000)), false)
  assert.strictEqual(isHoldExpired(holdExpiryDate, holdExpiryDate), true)
  assert.strictEqual(isHoldExpired(holdExpiryDate, new Date(holdExpiryDate.getTime() + 1000)), true)
  console.log('PASS: Test 2.3 - Batas ambang kedaluwarsa terbukti presisi tepat pada milidetik ke-15m:00s.\n')

  // [Test 2.4] Auto-Expire Sweeper Execution
  console.log('[Test 2.4] Auto-Expire Sweeper Execution (releaseExpiredSlotHolds)')
  const at15m01s = new Date(lockCreationTime.getTime() + 15 * 60 * 1000 + 1000)
  const sweepResult = await releaseExpiredSlotHolds({ now: at15m01s })

  assert.strictEqual(sweepResult.success, true)
  assert.ok(sweepResult.expired_count >= 1, 'At least 1 hold must be expired by sweeper')
  assert.ok(sweepResult.released_booking_codes.includes(initialHold.booking!.booking_code))

  const expiredBooking = inMemoryHoldsStore.get(initialHold.booking!.id)
  assert.strictEqual(expiredBooking?.status, 'expired', 'Booking status must be marked as expired')
  console.log(
    `PASS: Test 2.4 - Auto-expire sweeper berhasil membebaskan booking ${initialHold.booking!.booking_code} ke status expired.\n`
  )

  // [Test 2.5] Instant Slot Re-availability After 15-Minute Expiration (DoD)
  console.log('[Test 2.5] Instant Slot Re-availability: New Customer Claims Slot at t = 15m02s (DoD)')
  const at15m02s = new Date(lockCreationTime.getTime() + 15 * 60 * 1000 + 2000)
  const newCustomerHold = await createTemporarySlotHold({
    barberId: barberRian,
    bookingDate: expirySlotDate,
    startTime: expirySlotStart,
    endTime: expirySlotEnd,
    serviceDurationMinutes: 45,
    totalPriceIdr: 50000,
    customerName: 'User Baru Pengganti',
    customerPhone: '081299990001',
    now: at15m02s
  })

  assert.strictEqual(newCustomerHold.success, true, 'New customer must be able to claim expired slot')
  assert.strictEqual(newCustomerHold.booking?.status, 'pending_payment')
  console.log(
    `PASS: Test 2.5 - DoD Terpenuhi 100%! Slot expired dapat langsung dipesan oleh pelanggan baru (${newCustomerHold.booking?.booking_code}).\n`
  )

  // ==========================================================================
  // PART 3: VERIFIKASI RESPON WEBHOOK MIDTRANS SUKSES & GAGAL
  // ==========================================================================
  console.log('--- PART 3: MIDTRANS WEBHOOK SUCCESS & FAILURE VERIFICATION ---')

  // [Test 3.1] Cryptographic SHA-512 Signature & Tamper Resistance
  console.log('[Test 3.1] SHA-512 Signature Verification & Tampering Protection')
  const orderId1 = 'ORDER-DMZ-CONCUR-001'
  const validSig1 = generateSignature(orderId1, '200', '20000.00', TEST_SERVER_KEY)

  const testPayload1: MidtransWebhookPayload = {
    order_id: orderId1,
    status_code: '200',
    gross_amount: '20000.00',
    signature_key: validSig1,
    transaction_status: 'settlement',
    payment_type: 'qris',
    transaction_id: 'trx-test-001'
  }

  assert.strictEqual(verifyWebhookSignature(testPayload1, TEST_SERVER_KEY), true)

  // Tampered Amount
  const tamperedPayload = { ...testPayload1, gross_amount: '10000.00' }
  assert.strictEqual(verifyWebhookSignature(tamperedPayload, TEST_SERVER_KEY), false)

  // Tampered Status Code
  const tamperedStatus = { ...testPayload1, status_code: '201' }
  assert.strictEqual(verifyWebhookSignature(tamperedStatus, TEST_SERVER_KEY), false)
  console.log('PASS: Test 3.1 - Verifikasi tanda tangan kriptografis SHA-512 dan proteksi manipulasi valid 100%.\n')

  // [Test 3.2] Webhook Success: settlement & capture
  console.log('[Test 3.2] Webhook Success Transitions (settlement & capture accept)')
  const mockBookingA = createMockBookingRow({
    id: 'b-succ-001',
    booking_code: 'DMZ-SUCC-001',
    status: 'pending_payment',
    total_price_idr: 70000,
    down_payment_idr: 20000,
    remaining_balance_idr: 50000
  })

  const mockBookingB = createMockBookingRow({
    id: 'b-succ-002',
    booking_code: 'DMZ-SUCC-002',
    status: 'pending_payment',
    total_price_idr: 80000,
    down_payment_idr: 20000,
    remaining_balance_idr: 60000
  })

  const mockStore: WebhookMockStore = createWebhookMockStore({
    bookings: [mockBookingA, mockBookingB]
  })

  // 3.2a: Settlement
  const orderIdA = 'ORDER-SUCC-001'
  const sigA = generateSignature(orderIdA, '200', '20000.00', TEST_SERVER_KEY)
  const resA = await processMidtransWebhook(
    {
      order_id: orderIdA,
      status_code: '200',
      gross_amount: '20000.00',
      signature_key: sigA,
      transaction_status: 'settlement',
      payment_type: 'qris',
      transaction_id: 'trx-qris-settle',
      custom_field1: mockBookingA.id,
      custom_field3: mockBookingA.booking_code
    },
    { serverKeyOverride: TEST_SERVER_KEY, mockStore }
  )

  assert.strictEqual(resA.success, true)
  assert.strictEqual(resA.bookingStatus, 'confirmed')
  assert.strictEqual(resA.paymentStatus, 'settlement')
  assert.strictEqual(mockStore.bookings.get(mockBookingA.id)?.status, 'confirmed')

  // 3.2b: Capture with Accept
  const orderIdB = 'ORDER-SUCC-002'
  const sigB = generateSignature(orderIdB, '200', '20000.00', TEST_SERVER_KEY)
  const resB = await processMidtransWebhook(
    {
      order_id: orderIdB,
      status_code: '200',
      gross_amount: '20000.00',
      signature_key: sigB,
      transaction_status: 'capture',
      fraud_status: 'accept',
      payment_type: 'credit_card',
      transaction_id: 'trx-cc-capture',
      custom_field1: mockBookingB.id,
      custom_field3: mockBookingB.booking_code
    },
    { serverKeyOverride: TEST_SERVER_KEY, mockStore }
  )

  assert.strictEqual(resB.success, true)
  assert.strictEqual(resB.bookingStatus, 'confirmed')
  assert.strictEqual(mockStore.bookings.get(mockBookingB.id)?.status, 'confirmed')
  console.log('PASS: Test 3.2 - Transisi sukses settlement dan capture(accept) terkonfirmasi 100%.\n')

  // [Test 3.3] Webhook Failures: expire, cancel, deny
  console.log('[Test 3.3] Webhook Failure Transitions (expire, cancel, deny)')
  const mockBookingExpire = createMockBookingRow({ id: 'b-fail-exp', status: 'pending_payment' })
  const mockBookingCancel = createMockBookingRow({ id: 'b-fail-cnc', status: 'pending_payment' })
  const mockBookingDeny = createMockBookingRow({ id: 'b-fail-dny', status: 'pending_payment' })

  const failureStore: WebhookMockStore = createWebhookMockStore({
    bookings: [mockBookingExpire, mockBookingCancel, mockBookingDeny]
  })

  // 3.3a: Expire
  const orderExp = 'ORDER-EXP-001'
  const resExp = await processMidtransWebhook(
    {
      order_id: orderExp,
      status_code: '202',
      gross_amount: '20000.00',
      signature_key: generateSignature(orderExp, '202', '20000.00', TEST_SERVER_KEY),
      transaction_status: 'expire',
      payment_type: 'qris',
      transaction_id: 'trx-exp-001',
      custom_field1: mockBookingExpire.id
    },
    { serverKeyOverride: TEST_SERVER_KEY, mockStore: failureStore }
  )
  assert.strictEqual(resExp.bookingStatus, 'expired')
  assert.strictEqual(failureStore.bookings.get(mockBookingExpire.id)?.status, 'expired')

  // 3.3b: Cancel
  const orderCnc = 'ORDER-CNC-001'
  const resCnc = await processMidtransWebhook(
    {
      order_id: orderCnc,
      status_code: '202',
      gross_amount: '20000.00',
      signature_key: generateSignature(orderCnc, '202', '20000.00', TEST_SERVER_KEY),
      transaction_status: 'cancel',
      payment_type: 'gopay',
      transaction_id: 'trx-cnc-001',
      custom_field1: mockBookingCancel.id
    },
    { serverKeyOverride: TEST_SERVER_KEY, mockStore: failureStore }
  )
  assert.strictEqual(resCnc.bookingStatus, 'cancelled')
  assert.strictEqual(failureStore.bookings.get(mockBookingCancel.id)?.status, 'cancelled')

  // 3.3c: Deny
  const orderDny = 'ORDER-DNY-001'
  const resDny = await processMidtransWebhook(
    {
      order_id: orderDny,
      status_code: '202',
      gross_amount: '20000.00',
      signature_key: generateSignature(orderDny, '202', '20000.00', TEST_SERVER_KEY),
      transaction_status: 'deny',
      payment_type: 'credit_card',
      transaction_id: 'trx-dny-001',
      custom_field1: mockBookingDeny.id
    },
    { serverKeyOverride: TEST_SERVER_KEY, mockStore: failureStore }
  )
  assert.strictEqual(resDny.bookingStatus, 'cancelled')
  assert.strictEqual(failureStore.bookings.get(mockBookingDeny.id)?.status, 'cancelled')
  console.log('PASS: Test 3.3 - Respon webhook kegagalan (expire, cancel, deny) memperbarui status secara tepat.\n')

  // [Test 3.4] Webhook Non-Terminal: pending
  console.log('[Test 3.4] Webhook Non-Terminal Status: pending')
  const mockBookingPending = createMockBookingRow({ id: 'b-pend-001', status: 'pending_payment' })
  const pendingStore: WebhookMockStore = createWebhookMockStore({
    bookings: [mockBookingPending]
  })

  const orderPend = 'ORDER-PEND-001'
  const resPend = await processMidtransWebhook(
    {
      order_id: orderPend,
      status_code: '201',
      gross_amount: '20000.00',
      signature_key: generateSignature(orderPend, '201', '20000.00', TEST_SERVER_KEY),
      transaction_status: 'pending',
      payment_type: 'bca_va',
      transaction_id: 'trx-pend-001',
      custom_field1: mockBookingPending.id
    },
    { serverKeyOverride: TEST_SERVER_KEY, mockStore: pendingStore }
  )
  assert.strictEqual(resPend.bookingStatus, 'pending_payment')
  assert.strictEqual(pendingStore.bookings.get(mockBookingPending.id)?.status, 'pending_payment')
  console.log('PASS: Test 3.4 - Status pending tidak mengubah status booking yang belum selesai.\n')

  // [Test 3.5] Idempotency & Duplicate Webhook Resilience (DoD)
  console.log('[Test 3.5] Strict Idempotency: 5 Repeated Duplicate Webhooks (DoD Verified)')
  const mockBookingIdem = createMockBookingRow({
    id: 'b-idem-001',
    booking_code: 'DMZ-IDEM-001',
    status: 'pending_payment'
  })
  const idemStore: WebhookMockStore = createWebhookMockStore({
    bookings: [mockBookingIdem]
  })

  const orderIdem = 'ORDER-IDEM-001'
  const sigIdem = generateSignature(orderIdem, '200', '20000.00', TEST_SERVER_KEY)
  const idemPayload: MidtransWebhookPayload = {
    order_id: orderIdem,
    status_code: '200',
    gross_amount: '20000.00',
    signature_key: sigIdem,
    transaction_status: 'settlement',
    payment_type: 'qris',
    transaction_id: 'trx-idem-001',
    custom_field1: mockBookingIdem.id,
    custom_field3: mockBookingIdem.booking_code
  }

  // First delivery
  const firstRun = await processMidtransWebhook(idemPayload, {
    serverKeyOverride: TEST_SERVER_KEY,
    mockStore: idemStore
  })
  assert.strictEqual(firstRun.isIdempotent, false)
  assert.strictEqual(firstRun.statusCode, 200)

  // 4 subsequent duplicate deliveries
  const duplicateRuns = await Promise.all(
    Array.from({ length: 4 }).map(() =>
      processMidtransWebhook(idemPayload, {
        serverKeyOverride: TEST_SERVER_KEY,
        mockStore: idemStore
      })
    )
  )

  for (const dup of duplicateRuns) {
    assert.strictEqual(dup.isIdempotent, true, 'Subsequent webhooks must be flagged idempotent')
    assert.strictEqual(dup.statusCode, 200, 'Must still return 200 OK')
  }

  // Assert zero duplicate records
  const paymentRecords = Array.from(idemStore.payments.values()).filter(
    (p) => p.booking_id === mockBookingIdem.id
  )
  assert.strictEqual(
    paymentRecords.length,
    1,
    `DoD Violation: Expected exactly 1 payment record, found ${paymentRecords.length}`
  )
  console.log(
    'PASS: Test 3.5 - DoD Terpenuhi! 5 kali webhook duplikat direspons 200 OK dengan tepat 1 data tersimpan tanpa duplikasi.\n'
  )

  // [Test 3.6] Out-of-Order Webhook Protection (delayed expire after settlement)
  console.log('[Test 3.6] Out-of-Order Defense: Delayed expire after settlement')
  const outOfOrderExpirePayload: MidtransWebhookPayload = {
    order_id: orderIdem,
    status_code: '202',
    gross_amount: '20000.00',
    signature_key: generateSignature(orderIdem, '202', '20000.00', TEST_SERVER_KEY),
    transaction_status: 'expire',
    payment_type: 'qris',
    transaction_id: 'trx-delayed-exp',
    custom_field1: mockBookingIdem.id
  }

  const outOfOrderRes = await processMidtransWebhook(outOfOrderExpirePayload, {
    serverKeyOverride: TEST_SERVER_KEY,
    mockStore: idemStore
  })

  assert.strictEqual(outOfOrderRes.isIdempotent, true, 'Delayed notification should be flagged idempotent')
  assert.strictEqual(outOfOrderRes.paymentStatus, 'settlement', 'Payment status must stay settlement')
  assert.strictEqual(idemStore.bookings.get(mockBookingIdem.id)?.status, 'confirmed', 'Booking must stay confirmed')
  console.log('PASS: Test 3.6 - Notifikasi expire yang terlambat tidak dapat membatalkan booking yang sudah confirmed.\n')

  console.log('======================================================================')
  console.log('CONGRATULATIONS: ALL TESTS IN tests/concurrency.test.ts PASSED 100%!')
  console.log('DoD VERIFIED: Zero double bookings under concurrent stampede,')
  console.log('15-min auto-expire precision, and idempotent Midtrans webhook processing.')
  console.log('======================================================================')
}

runTestSuite().catch((err) => {
  console.error('\nCRITICAL TEST FAILURE in tests/concurrency.test.ts:', err)
  process.exit(1)
})
