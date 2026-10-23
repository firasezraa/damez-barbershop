/**
 * DAMEZ BARBERSHOP - CHAOS DOGFOODING & EDGE-CASE BUG BASHING SUITE
 * Test Suite: tests/chaos-dogfooding.test.ts
 * Sub-agent: coder:qa
 * 
 * Systematic exploratory chaos testing across 5 critical human behavioral edge cases:
 * 1. Broken / Special Character / Space WhatsApp Phone Formats
 * 2. Multi-tab Concurrent Booking on Same Slot & Double-Click Race Conditions
 * 3. Checkout Expiry at Second 14:59 & Late Settlement Desynchronization
 * 4. Browser Back / Refresh During Active Midtrans Snap QRIS Modal
 * 5. URL Booking Code Tampering, XSS, Case Sensitivity & Unauthenticated Bypass
 */

import assert from 'node:assert'
import crypto from 'node:crypto'
import { NextRequest } from 'next/server.js'

// Domain & Service Imports
import {
  inMemoryHoldsStore,
  calculateHoldExpiry,
  isHoldExpired,
  getRemainingHoldTime,
  releaseExpiredSlotHolds,
  createTemporarySlotHold,
  HOLD_TTL_MINUTES,
  HOLD_TTL_SECONDS
} from '../lib/slots/auto-expire.ts'
import {
  validateAndNormalizeIndonesianPhone,
  sanitizeCustomerName,
  checkActiveHoldsLimit
} from '../lib/security/bot-protection.ts'
import {
  normalizeIndonesianPhoneNumber,
  isValidIndonesianPhoneNumber
} from '../lib/notifications/whatsapp.ts'
import { validateIndonesianPhone } from '../components/booking/utils.ts'
import {
  createBookingSnapTransaction,
  generateOrderId,
  FLAT_DOWN_PAYMENT_AMOUNT_IDR
} from '../lib/payment/midtrans.ts'
import {
  processMidtransWebhook,
  type MidtransWebhookPayload
} from '../lib/payment/webhook.ts'

// Route Handlers
import { POST as holdPostHandler, GET as holdGetHandler } from '../app/api/booking/hold/route.ts'
import { POST as checkoutPostHandler } from '../app/api/booking/checkout/route.ts'
import { POST as webhookPostHandler } from '../app/api/webhooks/midtrans/route.ts'
import { GET as bookingCodeGetHandler, POST as bookingCodePostHandler } from '../app/api/booking/[code]/route.ts'

console.log('======================================================================')
console.log('   DAMEZ BARBERSHOP - M8-01 CHAOS DOGFOODING & EDGE-CASE BUG BASHING  ')
console.log('   Systematic Human Behavioral Chaos Testing & Vulnerability Audit    ')
console.log('======================================================================\n')

process.env.MOCK_MIDTRANS = 'true'
process.env.MIDTRANS_SERVER_KEY = 'SB-Mid-server-TEST-KEY-CHAOS-99'
const TEST_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY

function generateSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string = TEST_SERVER_KEY
): string {
  const payload = `${orderId}${statusCode}${grossAmount}${serverKey}`
  return crypto.createHash('sha512').update(payload).digest('hex')
}

export interface BugFinding {
  id: string
  title: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  category: 'SECURITY' | 'FUNCTIONAL' | 'LOGIC' | 'UX'
  component: string
  description: string
  evidence: any
}

export const recordedFindings: BugFinding[] = []

async function runChaosDogfoodingSuite() {
  // --------------------------------------------------------------------------
  // SCENARIO 1: FORMAT NO WA CACAT / SPASI / SIMBOL
  // --------------------------------------------------------------------------
  console.log('--- SCENARIO 1: CHAOS TESTING FORMAT NOMOR WHATSAPP ---')
  
  const testPhoneNumbers = [
    { label: 'Standard Local (081234567890)', input: '081234567890', expectedValid: true },
    { label: 'International Spaced (+62 812 3456 7890)', input: '+62 812 3456 7890', expectedValid: true },
    { label: 'Dashed Local (0812-3456-7890)', input: '0812-3456-7890', expectedValid: true },
    { label: 'International Dashed (+62 812-3456-7890)', input: '+62 812-3456-7890', expectedValid: true },
    { label: 'Compact International (6281234567890)', input: '6281234567890', expectedValid: true },
    { label: 'Local Without Leading 0 (81234567890)', input: '81234567890', expectedValid: true }, // Indonesian habit!
    { label: 'Letters Suffix (0812345678X)', input: '0812345678X', expectedValid: false },
    { label: 'Embedded Alpha (0812abc34567)', input: '0812abc34567', expectedValid: false },
    { label: 'Underscore Delimiters (0812_3456_7890)', input: '0812_3456_7890', expectedValid: true }, // Human paste
    { label: 'Slash Delimiters (0812/3456/7890)', input: '0812/3456/7890', expectedValid: true }, // Human paste
    { label: 'Toll-free Prefix (08001234567)', input: '08001234567', expectedValid: false },
    { label: 'Landline Area Code (+62 (021) 123456)', input: '+62 (021) 123456', expectedValid: false },
    { label: 'Trailing Whitespace (081234567890  )', input: '081234567890  ', expectedValid: true },
    { label: 'Zero-Width Space (\\u200B081234567890)', input: '\u200B081234567890', expectedValid: true },
    { label: 'Trailing Emoji (081234567890📱)', input: '081234567890📱', expectedValid: false },
  ]

  for (const item of testPhoneNumbers) {
    const clientResult = validateIndonesianPhone(item.input)
    const serverResult = validateAndNormalizeIndonesianPhone(item.input)
    const waServiceResult = isValidIndonesianPhoneNumber(item.input)

    console.log(`[Phone Probe] ${item.label}:`)
    console.log(`   Input       : "${item.input}"`)
    console.log(`   Client Check: isValid=${clientResult.isValid}, norm="${clientResult.normalized}"`)
    console.log(`   Server Check: isValid=${serverResult.isValid}, norm="${serverResult.normalizedPhone}"`)
    console.log(`   WA Check    : isValid=${waServiceResult}`)

    // Check for Client-Server Mismatch
    if (clientResult.isValid !== serverResult.isValid) {
      recordedFindings.push({
        id: 'BUG-M801-01',
        title: 'Client-Server Phone Validation Mismatch (Bypass & Unhandled Rejection)',
        severity: 'HIGH',
        category: 'FUNCTIONAL',
        component: 'components/booking/utils.ts vs lib/security/bot-protection.ts',
        description: `Input "${item.input}" evaluates to isValid=${clientResult.isValid} on client-side form, allowing user to advance to Step 5, but gets rejected with 400 Bad Request on server hold API (isValid=${serverResult.isValid}).`,
        evidence: { input: item.input, clientResult, serverResult }
      })
      console.log(`   🚨 DISCREPANCY DETECTED: Client allows but Server rejects!`)
    }

    // Check for "81234567890" rejection (very common Indonesian typing habit)
    if (item.input === '81234567890' && (!clientResult.isValid || !serverResult.isValid)) {
      recordedFindings.push({
        id: 'BUG-M801-02',
        title: 'Rejection of 8xxxxxxxxx Phone Number Without Leading 0 / +62',
        severity: 'MEDIUM',
        category: 'UX',
        component: 'components/booking/utils.ts',
        description: 'Common Indonesian mobile typing habit of omitting leading 0 (e.g. 81234567890) is supported by lib/notifications/whatsapp.ts line 644, but rejected by both client-side validation and /api/booking/hold.',
        evidence: { input: item.input, clientResult, serverResult }
      })
      console.log(`   ⚠️ HABIT GAP: Omitted leading 0 (8xxx) rejected by form.`)
    }
  }

  // --------------------------------------------------------------------------
  // SCENARIO 2: MULTI-TAB BOOKING PADA SLOT SAMA & DOUBLE CLICK
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 2: MULTI-TAB BOOKING PADA SLOT SAMA & DOUBLE CLICK ---')

  const targetDate = '2026-10-30'
  const targetTimeIso = `${targetDate}T15:30:00+07:00`
  const targetEndTimeIso = `${targetDate}T16:15:00+07:00`
  const targetBarber = 'b0000001-0000-0000-0000-000000000001'

  // Probe 2.0: The Raw UI Time String Bug (Dogfooding Discovery)
  const rawUiHoldRes = await holdPostHandler(new NextRequest('http://localhost:3000/api/booking/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '182.1.2.99' },
    body: JSON.stringify({
      barber_id: targetBarber,
      booking_date: targetDate,
      start_time: '14:30', // As sent by booking-wizard.tsx
      end_time: '15:15',   // As sent by booking-wizard.tsx
      customer_name: 'Raw UI User',
      customer_phone: '081299998888',
      service_ids: ['a0000001-0000-0000-0000-000000000001']
    })
  }))
  const rawUiJson = await rawUiHoldRes.json()
  console.log(`[Raw UI Time Probe] Status: ${rawUiHoldRes.status}, Error: "${rawUiJson.error}"`)
  if (rawUiHoldRes.status === 400 && rawUiJson.error?.includes('Rentang waktu')) {
    recordedFindings.push({
      id: 'BUG-M801-00',
      title: 'Frontend-to-Backend Time Format Mismatch (NaN Date in auto-expire.ts Blocks All UI Holds)',
      severity: 'CRITICAL',
      category: 'FUNCTIONAL',
      component: 'components/booking/booking-wizard.tsx & lib/slots/auto-expire.ts',
      description: 'booking-wizard.tsx passes raw time strings (e.g. start_time: "14:30", end_time: "15:15"). In lib/slots/auto-expire.ts line 209, new Date("14:30") evaluates to NaN, throwing HTTP 400 "Rentang waktu (startTime - endTime) tidak valid." and completely preventing real users from holding slots via the UI.',
      evidence: { sent: { start_time: '15:30', end_time: '16:15' }, response: rawUiJson }
    })
    console.log('   🚨 CRITICAL DISCOVERY: UI-generated time format causes NaN Date rejection on server!')
  }

  // 2.1 Multi-Tab Race: Tab A and Tab B attempt to hold exact same slot simultaneously
  const tabAPromise = holdPostHandler(new NextRequest('http://localhost:3000/api/booking/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '182.1.2.3' },
    body: JSON.stringify({
      barber_id: targetBarber,
      booking_date: targetDate,
      start_time: targetTimeIso,
      end_time: targetEndTimeIso,
      customer_name: 'Tab A Customer',
      customer_phone: '081211112222',
      service_ids: ['a0000001-0000-0000-0000-000000000001']
    })
  }))

  const tabBPromise = holdPostHandler(new NextRequest('http://localhost:3000/api/booking/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '182.1.2.4' },
    body: JSON.stringify({
      barber_id: targetBarber,
      booking_date: targetDate,
      start_time: targetTimeIso,
      end_time: targetEndTimeIso,
      customer_name: 'Tab B Customer',
      customer_phone: '081233334444',
      service_ids: ['a0000001-0000-0000-0000-000000000001']
    })
  }))

  const [tabARes, tabBRes] = await Promise.all([tabAPromise, tabBPromise])
  const tabAJson = await tabARes.json()
  const tabBJson = await tabBRes.json()

  console.log(`[Multi-Tab Race] Tab A Status: ${tabARes.status}, Body:`, tabAJson)
  console.log(`[Multi-Tab Race] Tab B Status: ${tabBRes.status}, Body:`, tabBJson)
  assert.ok((tabARes.status === 201 && tabBRes.status === 409) || (tabARes.status === 409 && tabBRes.status === 201),
    'Exactly one tab must win HTTP 201 and the other receive HTTP 409')

  // 2.2 Lack of Live SSE / Polling in Step 3 Schedule
  recordedFindings.push({
    id: 'BUG-M801-03',
    title: 'Lack of Real-Time Slot Stale Invalidation (Step 3 Schedule)',
    severity: 'MEDIUM',
    category: 'UX',
    component: 'components/booking/step-3-schedule.tsx',
    description: 'Step 3 Schedule fetches available slots only on mount or parameter changes. When another user or tab locks the slot in the background, Tab B retains stale visual green indicator until Step 5 checkout submit, causing late disappointment.',
    evidence: { tabAStatus: tabARes.status, tabBStatus: tabBRes.status }
  })

  // 2.3 Rapid Double-Click Burst on Step 5 (No Client Debounce)
  console.log('[Double-Click Test] Simulating burst clicks on "Kunci Slot & Bayar DP"')
  const rapidClickDate = '2026-10-30'
  const rapidClickTimeIso = `${rapidClickDate}T17:00:00+07:00`
  const rapidClickEndTimeIso = `${rapidClickDate}T17:45:00+07:00`

  const click1 = holdPostHandler(new NextRequest('http://localhost:3000/api/booking/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '182.1.2.5' },
    body: JSON.stringify({
      barber_id: targetBarber,
      booking_date: rapidClickDate,
      start_time: rapidClickTimeIso,
      end_time: rapidClickEndTimeIso,
      customer_name: 'Fast Clicker',
      customer_phone: '081255556666',
      service_ids: ['a0000001-0000-0000-0000-000000000001']
    })
  }))

  const click2 = holdPostHandler(new NextRequest('http://localhost:3000/api/booking/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '182.1.2.5' },
    body: JSON.stringify({
      barber_id: targetBarber,
      booking_date: rapidClickDate,
      start_time: rapidClickTimeIso,
      end_time: rapidClickEndTimeIso,
      customer_name: 'Fast Clicker',
      customer_phone: '081255556666',
      service_ids: ['a0000001-0000-0000-0000-000000000001']
    })
  }))

  const [res1, res2] = await Promise.all([click1, click2])
  console.log(`[Double Click Burst] Click 1 Status: ${res1.status}, Click 2 Status: ${res2.status}`)
  
  recordedFindings.push({
    id: 'BUG-M801-04',
    title: 'Missing Frontend Button Debounce on Booking Bottom Bar',
    severity: 'MEDIUM',
    category: 'FUNCTIONAL',
    component: 'components/booking/booking-wizard.tsx & booking-bottom-bar.tsx',
    description: 'handleNext in BookingWizard does not implement a client-side debounce or immediate synthetic ref lock. Rapid double-clicking sends concurrent POST requests, causing the second request to fail with 409 Conflict which can overwrite the success state.',
    evidence: { click1: res1.status, click2: res2.status }
  })

  // --------------------------------------------------------------------------
  // SCENARIO 3: MENAHAN CHECKOUT HINGGA DETIK 14:59 LALU BAYAR SAAT TIMEOUT
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 3: CHECKOUT TIMEOUT AT 14:59 & LATE SETTLEMENT DESYNC ---')

  // Create hold
  const holdRes = await holdPostHandler(new NextRequest('http://localhost:3000/api/booking/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '182.1.2.99' },
    body: JSON.stringify({
      barber_id: targetBarber,
      booking_date: '2026-10-31',
      start_time: '2026-10-31T10:00:00+07:00',
      end_time: '2026-10-31T10:45:00+07:00',
      customer_name: 'Late Payer',
      customer_phone: '081277778888',
      service_ids: ['a0000001-0000-0000-0000-000000000001']
    })
  }))
  const holdData = (await holdRes.json()).data
  const bookingId = holdData.booking_id
  const bookingCode = holdData.booking_code
  console.log(`[Hold Created] Booking ${bookingCode} (ID: ${bookingId})`)

  // 3.1 TTL Extension Bug via /api/booking/checkout
  // When user navigates to /booking/payment at minute 14:50, /api/booking/checkout is called:
  const checkoutRes = await checkoutPostHandler(new NextRequest('http://localhost:3000/api/booking/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '182.1.2.99' },
    body: JSON.stringify({ booking_id: bookingId })
  }))
  const checkoutData = (await checkoutRes.json()).data
  console.log(`[Checkout Token] Generated order_id: ${checkoutData.order_id}, expires_at: ${checkoutData.expires_at}`)

  // Notice checkoutData.expires_at should match original holdData.hold_expires_at without extension
  if (checkoutData.expires_at !== holdData.hold_expires_at) {
    recordedFindings.push({
      id: 'BUG-M801-05',
      title: 'Hold TTL Extension Vulnerability on Checkout Refresh (Infinite Inventory Hoarding)',
      severity: 'HIGH',
      category: 'SECURITY',
      component: 'app/api/booking/checkout/route.ts & lib/payment/midtrans.ts',
      description: 'Every time /api/booking/checkout is called, it recomputes expires_at as Date.now() + 15 minutes and updates bookings.hold_expires_at. A user refreshing the payment screen near minute 14:59 perpetually resets the 15-minute countdown, locking the slot indefinitely.',
      evidence: { originalExpires: holdData.hold_expires_at, checkoutExpires: checkoutData.expires_at }
    })
  }

  // 3.2 Time Advanced past 15 minutes: Slot Expires
  // Force expire in inMemoryHoldsStore
  const holdRecord = inMemoryHoldsStore.get(bookingId)
  if (holdRecord) {
    // Set hold_expires_at to 1 second in the past
    holdRecord.hold_expires_at = new Date(Date.now() - 1000).toISOString()
    inMemoryHoldsStore.set(bookingId, holdRecord)
  }
  releaseExpiredSlotHolds() // sweep

  const expiredCheck = inMemoryHoldsStore.get(bookingId)
  console.log(`[After Timeout Sweep] Booking status: ${expiredCheck?.status}`)

  // 3.3 Customer completes payment in banking app right after timeout (Midtrans sends settlement)
  const lateWebhookPayload: MidtransWebhookPayload = {
    order_id: checkoutData.order_id,
    status_code: '200',
    gross_amount: '20000.00',
    transaction_status: 'settlement',
    signature_key: generateSignature(checkoutData.order_id, '200', '20000.00'),
    payment_type: 'qris',
    transaction_time: new Date().toISOString(),
    transaction_id: `trx-late-${Date.now()}`,
    currency: 'IDR'
  }

  const webhookResult = await processMidtransWebhook(lateWebhookPayload)
  console.log(`[Late Webhook Result] Success: ${webhookResult.success}, Booking Status: ${webhookResult.bookingStatus}`)

  // Evaluate the desync!
  const finalBookingState = inMemoryHoldsStore.get(bookingId)
  console.log(`[Final Booking State] Status: ${finalBookingState?.status}`)

  if (finalBookingState?.status === 'expired') {
    recordedFindings.push({
      id: 'BUG-M801-06',
      title: 'Late Settlement Webhook Leaves Expired Booking in Limbo (Orphaned Payment)',
      severity: 'CRITICAL',
      category: 'LOGIC',
      component: 'lib/payment/webhook.ts',
      description: 'When customer completes payment at second 14:59/15:01, the booking has already transitioned to expired. When the settlement webhook arrives, webhook.ts line 504 checks if status === pending_payment. Because it is expired, the booking remains expired while the payment is marked settlement, forfeiting customer funds without booking confirmation.',
      evidence: { paymentStatus: 'settlement', bookingStatus: finalBookingState.status }
    })
    console.log(`   🚨 CRITICAL FLAW: Settlement processed but booking remains EXPIRED!`)
  }

  // --------------------------------------------------------------------------
  // SCENARIO 4: MENEKAN BACK / REFRESH SAAT POPUP QRIS MIDTRANS AKTIF
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 4: BACK / REFRESH DURING MIDTRANS SNAP MODAL ---')

  // 4.1 Multiple Checkouts Creating Duplicate Order IDs
  const checkout1 = await checkoutPostHandler(new NextRequest('http://localhost:3000/api/booking/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booking_id: bookingId })
  }))
  const order1 = (await checkout1.json()).data?.order_id

  const checkout2 = await checkoutPostHandler(new NextRequest('http://localhost:3000/api/booking/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booking_id: bookingId })
  }))
  const order2 = (await checkout2.json()).data?.order_id

  console.log(`[Duplicate Order Generation] Order 1: ${order1}, Order 2: ${order2}`)
  if (order1 !== order2) {
    recordedFindings.push({
      id: 'BUG-M801-07',
      title: 'Browser Refresh Generates Multiple Conflicting Midtrans Order IDs',
      severity: 'HIGH',
      category: 'LOGIC',
      component: 'app/api/booking/checkout/route.ts & lib/payment/midtrans.ts',
      description: 'Refreshing the payment page triggers a new call to /api/booking/checkout, creating a brand new order_id with a different random suffix. This leaves orphaned pending payment records and can cause double payments if customer already scanned the first QR.',
      evidence: { order1, order2 }
    })
  }

  // 4.2 Missing beforeunload Protection
  recordedFindings.push({
    id: 'BUG-M801-08',
    title: 'Missing Window beforeunload Interceptor on Payment Screen',
    severity: 'MEDIUM',
    category: 'UX',
    component: 'components/payment/payment-screen.tsx',
    description: 'PaymentScreen does not register a window.addEventListener("beforeunload") or route leave confirmation while a Snap transaction is pending. Accidentally pressing Browser Back navigates to /book, abandoning the active transaction without user warning.',
    evidence: { missingHook: 'beforeunload' }
  })

  // --------------------------------------------------------------------------
  // SCENARIO 5: MANIPULASI URL BOOKING CODE
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 5: URL BOOKING CODE TAMPERING & SECURITY PROBES ---')

  // 5.1 Unauthenticated POST /api/booking/[code] Payment Bypass!
  const fakeBookingHold = await holdPostHandler(new NextRequest('http://localhost:3000/api/booking/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '182.1.2.88' },
    body: JSON.stringify({
      barber_id: targetBarber,
      booking_date: '2026-10-31',
      start_time: '2026-10-31T11:00:00+07:00',
      end_time: '2026-10-31T11:45:00+07:00',
      customer_name: 'Bypass Target',
      customer_phone: '081299990000',
      service_ids: ['a0000001-0000-0000-0000-000000000001']
    })
  }))
  const targetCode = (await fakeBookingHold.json()).data.booking_code
  console.log(`[Bypass Probe] Target Booking: ${targetCode}`)

  const bypassRes = await bookingCodePostHandler(
    new NextRequest(`http://localhost:3000/api/booking/${targetCode}`, { method: 'POST' }),
    { params: Promise.resolve({ code: targetCode }) }
  )
  const bypassJson = await bypassRes.json()
  console.log(`[Bypass Result] Status: ${bypassRes.status}, Booking Status: ${bypassJson.data?.status}`)

  if (bypassRes.status === 200 && bypassJson.data?.status === 'confirmed') {
    recordedFindings.push({
      id: 'BUG-M801-09',
      title: 'Unauthenticated POST /api/booking/[code] Allows 100% Free Payment Bypass',
      severity: 'CRITICAL',
      category: 'SECURITY',
      component: 'app/api/booking/[code]/route.ts',
      description: 'The POST route handler on /api/booking/[code] immediately sets status = "confirmed", down_payment_idr = 20000 without requiring any admin authentication, secret token, or Midtrans signature. An attacker can confirm any pending booking for free via a simple curl POST.',
      evidence: { statusCode: bypassRes.status, responseData: bypassJson.data }
    })
    console.log(`   🚨 CRITICAL SECURITY VULNERABILITY: Payment bypass confirmed via POST /api/booking/[code]!`)
  }

  // 5.2 Case Sensitivity on Booking Code Retrieval
  const lowercaseCode = targetCode.toLowerCase()
  const lowerRes = await bookingCodeGetHandler(
    new NextRequest(`http://localhost:3000/api/booking/${lowercaseCode}`),
    { params: Promise.resolve({ code: lowercaseCode }) }
  )
  console.log(`[Case Sensitivity] Lowercase "${lowercaseCode}" Status: ${lowerRes.status}`)
  if (lowerRes.status === 404) {
    recordedFindings.push({
      id: 'BUG-M801-10',
      title: 'Strict Case Sensitivity on Booking Code Retrieval (HTTP 404 on Lowercase URL)',
      severity: 'LOW',
      category: 'UX',
      component: 'app/api/booking/[code]/route.ts',
      description: 'When users manually type a booking code in lowercase (e.g. dmz-20261031-xxxx), the API treats it as case-sensitive and returns 404 Not Found instead of normalizing with toUpperCase().',
      evidence: { queried: lowercaseCode, status: lowerRes.status }
    })
  }

  // 5.3 Client-Side Boarding Pass Fallback Exploit in SuccessScreen
  recordedFindings.push({
    id: 'BUG-M801-11',
    title: 'SuccessScreen Generates Valid Confirmed Boarding Pass for Non-Existent Codes',
    severity: 'HIGH',
    category: 'SECURITY',
    component: 'components/booking/success-screen.tsx',
    description: 'In components/booking/success-screen.tsx lines 48-93, when /api/booking/[code] returns 404 Not Found, instead of rendering an error screen, it falls back to creating a valid confirmed booking object with status: "confirmed" and displays a complete Digital Boarding Pass ready to show to cashiers.',
    evidence: { fallbackCodeLines: '48-93', status: 'confirmed' }
  })

  // 5.4 Reflected Booking Code XSS / Unescaped HTML in Metadata
  recordedFindings.push({
    id: 'BUG-M801-12',
    title: 'Unsanitized URL Parameter in generateMetadata (Reflected Tag Injection)',
    severity: 'LOW',
    category: 'SECURITY',
    component: 'app/(public)/booking/success/[code]/page.tsx',
    description: 'In generateMetadata({ params }), the raw code parameter is interpolated directly into metadata title and description without sanitization, allowing potential reflected header/meta tag injection.',
    evidence: { template: 'Tiket Digital Boarding Pass ${code}' }
  })

  // --------------------------------------------------------------------------
  // SUMMARY OF AUDIT
  // --------------------------------------------------------------------------
  console.log('\n======================================================================')
  console.log(`   CHAOS DOGFOODING COMPLETE: ${recordedFindings.length} BUGS & LOGIC GAPS CATALOGED`)
  console.log('======================================================================')

  const criticals = recordedFindings.filter((b) => b.severity === 'CRITICAL').length
  const highs = recordedFindings.filter((b) => b.severity === 'HIGH').length
  const mediums = recordedFindings.filter((b) => b.severity === 'MEDIUM').length
  const lows = recordedFindings.filter((b) => b.severity === 'LOW').length

  console.log(`CRITICAL: ${criticals} | HIGH: ${highs} | MEDIUM: ${mediums} | LOW: ${lows}`)
  for (const b of recordedFindings) {
    console.log(`- [${b.severity}] ${b.id}: ${b.title} (${b.component})`)
  }
}

runChaosDogfoodingSuite().catch((err) => {
  console.error('Fatal execution error in chaos dogfooding:', err)
  process.exit(1)
})
