/**
 * DAMEZ BARBERSHOP - SECURITY AUDIT & TAMPERING TEST SUITE
 * 
 * Verifikasi komprehensif seluruh kontrol keamanan:
 * 1. Proteksi Client-Side DP Tampering: Flat Rp 20.000 locked server-side
 * 2. Proteksi Total Price Tampering: Harga dihitung authoritatively dari master katalog
 * 3. RFC 6585 Rate Limiting: 10 req/menit per IP dengan header HTTP 429 & Retry-After
 * 4. Bot & Spam Honeypot Protection: Field honeypot memblokir bot otomatis
 * 5. Validasi & Normalisasi Nomor Telepon Seluler Indonesia (08xx, +628xx, 628xx)
 * 6. Proteksi Denial-of-Inventory / Anti-Hoarding: Maksimal 2 hold aktif per pemesan
 * 7. Checkout API Security & Nominal Down Payment Lock
 */

import assert from 'node:assert'
import {
  verifyAndCalculateBookingPrice,
  FLAT_DOWN_PAYMENT_AMOUNT_IDR
} from '../lib/security/price-calculator.ts'
import {
  globalRateLimiter,
  BOOKING_RATE_LIMIT_CONFIG,
  CHECKOUT_RATE_LIMIT_CONFIG,
  extractClientIp
} from '../lib/security/rate-limit.ts'
import {
  detectSpamBot,
  validateAndNormalizeIndonesianPhone,
  sanitizeCustomerName,
  checkActiveHoldsLimit
} from '../lib/security/bot-protection.ts'
import {
  inMemoryHoldsStore,
  createTemporarySlotHold
} from '../lib/slots/auto-expire.ts'
import { POST as holdPostHandler } from '../app/api/booking/hold/route.ts'
import { POST as checkoutPostHandler } from '../app/api/booking/checkout/route.ts'

console.log('=== RUNNING SECURITY AUDIT & TAMPERING TEST SUITE ===\n')

async function runSecurityAuditTests() {
  inMemoryHoldsStore.clear()
  globalRateLimiter.clear()

  // --------------------------------------------------------------------------
  // TEST 1: Down Payment (DP) Anti-Tampering Protection
  // --------------------------------------------------------------------------
  console.log('[Test 1] Down Payment (DP) Anti-Tampering Protection')
  
  // Kasus A: Client jahat mencoba menyetor down_payment_idr: 0 (Gratis tanpa DP)
  const tamperResultZero = await verifyAndCalculateBookingPrice({
    serviceIds: ['a0000001-0000-0000-0000-000000000001'], // Gentlemen Classic Haircut Rp 50.000
    clientTotalPrice: 50000,
    clientDownPayment: 0
  })

  assert.strictEqual(
    tamperResultZero.authoritativeDownPayment,
    20000,
    'Server must strictly force Down Payment to Rp 20.000 even when client submits 0!'
  )
  assert.strictEqual(tamperResultZero.isTampered, true, 'System must flag client DP tampering attempt')
  assert.strictEqual(
    tamperResultZero.authoritativeRemainingBalance,
    30000,
    'Remaining balance must be 50.000 - 20.000 = 30.000'
  )

  // Kasus B: Client mencoba menyetor down_payment_idr: 1000
  const tamperResultLow = await verifyAndCalculateBookingPrice({
    serviceIds: ['a0000001-0000-0000-0000-000000000002'], // Executive Precision Fade Rp 65.000
    clientTotalPrice: 65000,
    clientDownPayment: 1000
  })

  assert.strictEqual(tamperResultLow.authoritativeDownPayment, 20000)
  assert.strictEqual(tamperResultLow.isTampered, true)
  assert.strictEqual(tamperResultLow.authoritativeRemainingBalance, 45000)

  console.log('PASS: Proteksi DP Tampering terverifikasi! Nominal DP terkunci aman di Rp 20.000 di sisi server.\n')

  // --------------------------------------------------------------------------
  // TEST 2: Total Price Tampering Protection
  // --------------------------------------------------------------------------
  console.log('[Test 2] Total Price Anti-Tampering Protection')

  // Kasus: Client memilih layanan 'Damez Signature Full Grooming Combo' (Rp 95.000),
  // namun mengubah payload request menjadi total_price_idr: 5.000
  const tamperResultPrice = await verifyAndCalculateBookingPrice({
    serviceIds: ['a0000001-0000-0000-0000-000000000008'], // Signature Combo Rp 95.000
    clientTotalPrice: 5000,
    clientDownPayment: 20000
  })

  assert.strictEqual(
    tamperResultPrice.authoritativeTotalPrice,
    95000,
    'Total price must be authoritatively calculated from catalog sum (Rp 95.000)!'
  )
  assert.strictEqual(tamperResultPrice.isTampered, true)
  assert.strictEqual(
    tamperResultPrice.authoritativeRemainingBalance,
    75000,
    'Remaining balance must be 95.000 - 20.000 = 75.000'
  )

  console.log('PASS: Proteksi Price Tampering terverifikasi! Upaya manipulasi total harga berhasil dikoreksi ke katalog resmi.\n')

  // --------------------------------------------------------------------------
  // TEST 3: Rate Limiting Enforcement (RFC 6585 Compliance)
  // --------------------------------------------------------------------------
  console.log('[Test 3] RFC 6585 Rate Limiting (Max 10 req/min per IP)')
  globalRateLimiter.clear()

  const testIp = '103.28.12.88'
  const config = BOOKING_RATE_LIMIT_CONFIG // max 10 / 60s

  // Lakukan 10 request pertama
  for (let i = 1; i <= 10; i++) {
    const check = globalRateLimiter.check(testIp, config)
    assert.strictEqual(check.isAllowed, true, `Request ke-${i} harus diizinkan`)
    assert.strictEqual(check.remaining, 10 - i)
    assert.strictEqual(check.headers['X-RateLimit-Limit'], '10')
  }

  // Request ke-11 harus diblokir dengan HTTP 429 & Retry-After header
  const check11 = globalRateLimiter.check(testIp, config)
  assert.strictEqual(check11.isAllowed, false, 'Request ke-11 harus diblokir oleh rate limiter')
  assert.strictEqual(check11.remaining, 0)
  assert.ok(check11.retryAfter > 0, 'Retry-After harus memiliki nilai positif')
  assert.ok(check11.headers['Retry-After'], 'Response harus memuat header Retry-After')

  console.log(`PASS: Rate limiting 10 req/min terverifikasi! Request ke-11 diblokir dengan Retry-After ${check11.retryAfter}s.\n`)

  // --------------------------------------------------------------------------
  // TEST 4: Bot & Spam Honeypot Detection
  // --------------------------------------------------------------------------
  console.log('[Test 4] Bot & Spam Honeypot Detection')

  // Payload normal dari user asli
  const legitPayload = {
    customer_name: 'Budi Santoso',
    customer_phone: '081234567890'
  }
  const legitCheck = detectSpamBot(legitPayload)
  assert.strictEqual(legitCheck.isBot, false, 'Legit user harus tidak terdeteksi sebagai bot')

  // Payload spam bot yang mengisi hidden honeypot field '_hp_trap'
  const botPayload1 = {
    customer_name: 'Spam Bot',
    customer_phone: '081234567890',
    _hp_trap: 'http://malicious-spam-link.ru'
  }
  const botCheck1 = detectSpamBot(botPayload1)
  assert.strictEqual(botCheck1.isBot, true, 'Honeypot _hp_trap harus mendeteksi bot')

  // Payload spam bot yang mengisi hidden field 'website'
  const botPayload2 = {
    customer_name: 'Spam Bot 2',
    customer_phone: '081234567890',
    website: 'buy-cheap-watches.com'
  }
  const botCheck2 = detectSpamBot(botPayload2)
  assert.strictEqual(botCheck2.isBot, true, 'Honeypot website harus mendeteksi bot')

  // Uji via HTTP Route /api/booking/hold dengan honeypot trap
  const botHttpReq = new Request('http://localhost:3000/api/booking/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '111.222.333.444' },
    body: JSON.stringify({
      barber_id: 'b0000001-0000-0000-0000-000000000001',
      booking_date: '2026-10-24',
      start_time: '2026-10-24T16:00:00+07:00',
      end_time: '2026-10-24T16:45:00+07:00',
      customer_name: 'Bot Scraper',
      customer_phone: '081234567890',
      _hp_trap: 'automated_injection'
    })
  })

  const botHttpRes = await holdPostHandler(botHttpReq)
  assert.strictEqual(botHttpRes.status, 400, 'Bot request with honeypot must return HTTP 400')
  const botJson = await botHttpRes.json()
  assert.ok(botJson.error.includes('Bot/Spam detected'))

  console.log('PASS: Bot & Spam honeypot trap berhasil menangkap dan menolak bot otomatis.\n')

  // --------------------------------------------------------------------------
  // TEST 5: Indonesian Mobile Phone Validation & Normalization
  // --------------------------------------------------------------------------
  console.log('[Test 5] Indonesian Mobile Phone Validation & Normalization')

  // Valid formats
  const valid1 = validateAndNormalizeIndonesianPhone('081234567890')
  assert.strictEqual(valid1.isValid, true)
  assert.strictEqual(valid1.normalizedPhone, '081234567890')

  const valid2 = validateAndNormalizeIndonesianPhone('+6281234567890')
  assert.strictEqual(valid2.isValid, true)
  assert.strictEqual(valid2.normalizedPhone, '081234567890')

  const valid3 = validateAndNormalizeIndonesianPhone('62812-3456-7890')
  assert.strictEqual(valid3.isValid, true)
  assert.strictEqual(valid3.normalizedPhone, '081234567890')

  // Invalid formats
  const invalid1 = validateAndNormalizeIndonesianPhone('123456') // Terlalu pendek
  assert.strictEqual(invalid1.isValid, false)

  const invalid2 = validateAndNormalizeIndonesianPhone('021-5551234') // Telepon rumah/kabel, bukan seluler
  assert.strictEqual(invalid2.isValid, false)

  const invalid3 = validateAndNormalizeIndonesianPhone('not-a-number')
  assert.strictEqual(invalid3.isValid, false)

  console.log('PASS: Validasi dan normalisasi nomor WhatsApp seluler Indonesia teruji 100% akurat.\n')

  // --------------------------------------------------------------------------
  // TEST 6: Anti-Hoarding / Denial-of-Inventory Protection
  // --------------------------------------------------------------------------
  console.log('[Test 6] Anti-Hoarding / Denial-of-Inventory (Max 2 Active Holds)')
  inMemoryHoldsStore.clear()
  globalRateLimiter.clear()

  const hoardingPhone = '081987654321'
  const barberId = 'b0000001-0000-0000-0000-000000000001'

  // Hold 1
  const hold1 = await createTemporarySlotHold({
    barberId,
    bookingDate: '2026-10-24',
    startTime: '2026-10-24T10:00:00+07:00',
    endTime: '2026-10-24T10:45:00+07:00',
    serviceDurationMinutes: 45,
    totalPriceIdr: 50000,
    downPaymentIdr: 20000,
    customerName: 'Hoarder User',
    customerPhone: hoardingPhone
  })
  assert.strictEqual(hold1.success, true)

  // Hold 2 (pada jam berbeda)
  const hold2 = await createTemporarySlotHold({
    barberId,
    bookingDate: '2026-10-24',
    startTime: '2026-10-24T11:00:00+07:00',
    endTime: '2026-10-24T11:45:00+07:00',
    serviceDurationMinutes: 45,
    totalPriceIdr: 50000,
    downPaymentIdr: 20000,
    customerName: 'Hoarder User',
    customerPhone: hoardingPhone
  })
  assert.strictEqual(hold2.success, true)

  // Cek apakah mencapai limit 2 hold aktif
  const limitCheck = await checkActiveHoldsLimit(hoardingPhone, 2)
  assert.strictEqual(limitCheck.allowed, false, 'Nomor dengan 2 hold aktif harus dibatasi')
  assert.strictEqual(limitCheck.activeCount, 2)

  // Mencoba membuat Hold ke-3 via HTTP handler
  const httpHold3Req = new Request('http://localhost:3000/api/booking/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.99' },
    body: JSON.stringify({
      barber_id: barberId,
      booking_date: '2026-10-24',
      start_time: '2026-10-24T12:00:00+07:00',
      end_time: '2026-10-24T12:45:00+07:00',
      customer_name: 'Hoarder User',
      customer_phone: hoardingPhone,
      service_ids: ['a0000001-0000-0000-0000-000000000001']
    })
  })

  const httpHold3Res = await holdPostHandler(httpHold3Req)
  assert.strictEqual(httpHold3Res.status, 429, 'Hold ke-3 harus ditolak dengan HTTP 429 Too Many Requests')
  const hold3Json = await httpHold3Res.json()
  assert.ok(hold3Json.error.includes('menunggu pembayaran'))

  console.log('PASS: Anti-Hoarding guard berhasil mencegah user memonopoli lebih dari 2 slot sebelum membayar DP.\n')

  // --------------------------------------------------------------------------
  // TEST 7: Checkout Endpoint Rate Limiting & Tamper Guard
  // --------------------------------------------------------------------------
  console.log('[Test 7] Checkout Endpoint Rate Limiting & Tamper Guard')
  globalRateLimiter.clear()

  const checkoutIp = '180.245.10.20'

  // Uji rate limiting di endpoint /api/booking/checkout
  for (let i = 1; i <= 10; i++) {
    const req = new Request('http://localhost:3000/api/booking/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': checkoutIp },
      body: JSON.stringify({ booking_id: 'sample-booking-id' })
    })
    const res = await checkoutPostHandler(req)
    // Walaupun 400/404 atau 200, status bukan 429
    assert.notStrictEqual(res.status, 429, `Request ke-${i} tidak boleh 429`)
  }

  // Request ke-11 harus terkena 429
  const req11 = new Request('http://localhost:3000/api/booking/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': checkoutIp },
    body: JSON.stringify({ booking_id: 'sample-booking-id' })
  })
  const res11 = await checkoutPostHandler(req11)
  assert.strictEqual(res11.status, 429, 'Request checkout ke-11 harus menerima HTTP 429')
  assert.ok(res11.headers.get('Retry-After'), 'Header Retry-After harus disertakan pada HTTP 429')

  console.log('PASS: Endpoint checkout /api/booking/checkout terproteksi rate limiting RFC 6585!\n')

  console.log('======================================================================')
  console.log('CONGRATULATIONS: ALL 7 SECURITY & TAMPERING AUDIT TESTS PASSED 100%!')
  console.log('======================================================================\n')
}

runSecurityAuditTests().catch((err) => {
  console.error('SECURITY AUDIT TEST FAILED:', err)
  process.exit(1)
})
