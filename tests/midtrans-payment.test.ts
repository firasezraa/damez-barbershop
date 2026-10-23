/**
 * DAMEZ BARBERSHOP - TEST SUITE: MIDTRANS INTEGRATION & CHECKOUT ROUTE
 * Tests for:
 * 1. lib/payment/midtrans.ts
 * 2. app/api/booking/checkout/route.ts
 */

import assert from 'node:assert'
import crypto from 'node:crypto'
import {
  FLAT_DOWN_PAYMENT_AMOUNT_IDR,
  DEFAULT_HOLD_TTL_MINUTES,
  DEFAULT_ENABLED_PAYMENTS,
  getMidtransConfig,
  generateOrderId,
  isMockMidtransMode,
  createSnapTransaction,
  createBookingSnapTransaction,
  verifyMidtransSignature,
  getMidtransTransactionStatus,
  type MidtransConfig,
  type MidtransSnapTransactionRequest,
  type BookingCheckoutResult
} from '../lib/payment/midtrans.ts'
import { POST, GET, OPTIONS } from '../app/api/booking/checkout/route.ts'

console.log('=== RUNNING MIDTRANS PAYMENT & CHECKOUT ROUTE TESTS ===\n')

// ----------------------------------------------------------------------------
// TEST 1: Business Constants & Config
// ----------------------------------------------------------------------------
console.log('[Test 1] Verifying Business Rules Constants')
assert.strictEqual(FLAT_DOWN_PAYMENT_AMOUNT_IDR, 20000, 'DP must be Flat Rp 20.000')
assert.strictEqual(DEFAULT_HOLD_TTL_MINUTES, 15, 'Hold TTL must be 15 minutes')
assert.ok(DEFAULT_ENABLED_PAYMENTS.includes('qris'), 'QRIS must be enabled by default')
assert.ok(DEFAULT_ENABLED_PAYMENTS.includes('gopay'), 'GoPay must be enabled by default')
assert.ok(DEFAULT_ENABLED_PAYMENTS.includes('bca_va'), 'Virtual Account must be enabled')
console.log('PASS: Business constants correctly enforced.\n')

// ----------------------------------------------------------------------------
// TEST 2: Order ID Generation
// ----------------------------------------------------------------------------
console.log('[Test 2] Order ID Generation')
const orderId1: string = generateOrderId('DMZ-20261023-0001')
const orderId2: string = generateOrderId('DMZ-20261023-0001')
assert.ok(orderId1.startsWith('ORDER-DMZ-20261023-0001-'), 'Order ID must have ORDER- prefix and booking code')
assert.notStrictEqual(orderId1, orderId2, 'Consecutive generated order IDs must be unique')
assert.match(orderId1, /^[A-Z0-9_-]+$/, 'Order ID must be URL-safe alphanumeric')
console.log(`PASS: Unique Order ID generated: ${orderId1}\n`)

// ----------------------------------------------------------------------------
// TEST 3: Mock Mode Detection
// ----------------------------------------------------------------------------
console.log('[Test 3] Mock Mode Detection')
assert.strictEqual(isMockMidtransMode({ serverKey: '', clientKey: '', isProduction: false }), true, 'Empty key must trigger mock mode')
assert.strictEqual(isMockMidtransMode({ serverKey: 'mock', clientKey: '', isProduction: false }), true, '"mock" must trigger mock mode')
assert.strictEqual(isMockMidtransMode({ serverKey: 'SB-Mid-server-REALKEY', clientKey: '', isProduction: false }), false, 'Real key must not trigger mock mode')
console.log('PASS: Mock mode detection verified.\n')

// ----------------------------------------------------------------------------
// TEST 4: SHA-512 Signature Verification Logic
// ----------------------------------------------------------------------------
console.log('[Test 4] Midtrans SHA-512 Signature Verification')
const testOrderId: string = 'ORDER-DMZ-TEST-001'
const testStatusCode: string = '200'
const testGrossAmount: string = '20000.00' // Midtrans format
const testServerKey: string = 'SB-Mid-server-TESTKEY123'

// Formula: SHA512(order_id + status_code + gross_amount + server_key)
const expectedRaw: string = `${testOrderId}${testStatusCode}${testGrossAmount}${testServerKey}`
const expectedSignature: string = crypto.createHash('sha512').update(expectedRaw).digest('hex')

// Test valid signature
const isValid: boolean = verifyMidtransSignature(
  testOrderId,
  testStatusCode,
  testGrossAmount,
  expectedSignature,
  testServerKey
)
assert.strictEqual(isValid, true, 'Signature should be valid when parameters match')

// Test invalid signature due to altered gross_amount (tampering attempt)
const isTamperedAmount: boolean = verifyMidtransSignature(
  testOrderId,
  testStatusCode,
  '50000.00',
  expectedSignature,
  testServerKey
)
assert.strictEqual(isTamperedAmount, false, 'Tampered gross_amount must fail signature verification')

// Test invalid signature due to altered order_id
const isTamperedOrder: boolean = verifyMidtransSignature(
  'ORDER-TAMPERED-002',
  testStatusCode,
  testGrossAmount,
  expectedSignature,
  testServerKey
)
assert.strictEqual(isTamperedOrder, false, 'Tampered order_id must fail signature verification')
console.log('PASS: SHA-512 Signature verification functions accurately against Midtrans specs.\n')

// ----------------------------------------------------------------------------
// TEST 5: Create Snap Transaction Validation
// ----------------------------------------------------------------------------
console.log('[Test 5] Snap Transaction Request Validation & Mock Token Generation')

// Should reject payload without order_id
await assert.rejects(
  async () => {
    await createSnapTransaction({
      transaction_details: { order_id: '', gross_amount: 20000 }
    })
  },
  /order_id is required/,
  'Must reject empty order_id'
)

// Should reject payload with negative or zero gross_amount
await assert.rejects(
  async () => {
    await createSnapTransaction({
      transaction_details: { order_id: 'TEST-1', gross_amount: 0 }
    })
  },
  /must be greater than 0/,
  'Must reject zero gross_amount'
)

// Should reject item details mismatch with gross_amount
await assert.rejects(
  async () => {
    await createSnapTransaction({
      transaction_details: { order_id: 'TEST-1', gross_amount: 20000 },
      item_details: [{ id: 'ITEM-1', name: 'Service', price: 15000, quantity: 1 }]
    })
  },
  /does not match item details total/,
  'Must reject mismatch between gross_amount and items sum'
)

// In mock mode: generate Snap token and redirect URL
const mockRequest: MidtransSnapTransactionRequest = {
  transaction_details: {
    order_id: 'ORDER-TEST-MOCK-001',
    gross_amount: 20000
  },
  item_details: [
    {
      id: 'DP-FLAT',
      name: 'DP Booking - Damez Barbershop',
      price: 20000,
      quantity: 1
    }
  ],
  customer_details: {
    first_name: 'Budi Santoso',
    phone: '081234567890'
  }
}

const mockResponse = await createSnapTransaction(mockRequest, { serverKey: 'mock' })
assert.ok(mockResponse.token.startsWith('mock-snap-'), 'Mock token should be generated')
assert.ok(mockResponse.redirect_url.includes('app.sandbox.midtrans.com'), 'Sandbox redirect URL should be present')
console.log(`PASS: Snap transaction created in mock mode: ${mockResponse.token}\n`)

// ----------------------------------------------------------------------------
// TEST 6: createBookingSnapTransaction Enforcing DP Flat Rp 20.000
// ----------------------------------------------------------------------------
console.log('[Test 6] createBookingSnapTransaction Enforcing DP Flat Rp 20.000 & Metadata')
const bookingCheckoutResult: BookingCheckoutResult = await createBookingSnapTransaction(
  {
    booking_id: 'b1111111-2222-3333-4444-555555555555',
    booking_code: 'DMZ-20261023-0001',
    customer_name: 'Ahmad Faiz',
    customer_phone: '081298765432',
    customer_email: 'faiz@example.com',
    service_name: 'Gentlemen Classic Haircut'
  },
  { serverKey: 'mock' }
)

assert.strictEqual(bookingCheckoutResult.gross_amount, 20000, 'Nominal must be exactly Rp 20.000')
assert.strictEqual(bookingCheckoutResult.booking_id, 'b1111111-2222-3333-4444-555555555555')
assert.strictEqual(bookingCheckoutResult.booking_code, 'DMZ-20261023-0001')
assert.strictEqual(bookingCheckoutResult.customer_name, 'Ahmad Faiz')
assert.strictEqual(bookingCheckoutResult.customer_phone, '081298765432')
assert.strictEqual(bookingCheckoutResult.customer_email, 'faiz@example.com')
assert.ok(bookingCheckoutResult.token.length > 0, 'Snap token must not be empty')
assert.ok(bookingCheckoutResult.redirect_url.startsWith('https://'), 'Redirect URL must be https')

// Check expiration timestamp is roughly 15 minutes ahead
const expiresAtTime: number = new Date(bookingCheckoutResult.expires_at).getTime()
const currentTime: number = Date.now()
const diffMinutes: number = (expiresAtTime - currentTime) / (60 * 1000)
assert.ok(diffMinutes >= 14 && diffMinutes <= 16, `Expiration should be ~15 minutes (actual: ${diffMinutes.toFixed(1)} mins)`)
console.log(`PASS: Booking Snap transaction verified: token=${bookingCheckoutResult.token}, amount=Rp ${bookingCheckoutResult.gross_amount}\n`)

// ----------------------------------------------------------------------------
// TEST 7: Route Handler /api/booking/checkout (GET, OPTIONS, POST)
// ----------------------------------------------------------------------------
console.log('[Test 7] Route Handler /api/booking/checkout')

// GET handler
const getRes: Response = await GET()
assert.strictEqual(getRes.status, 200)
const getJson = await getRes.json()
assert.strictEqual(getJson.success, true)
console.log('PASS: GET /api/booking/checkout returned 200 OK')

// OPTIONS handler
const optRes: Response = await OPTIONS()
assert.strictEqual(optRes.status, 204)
console.log('PASS: OPTIONS /api/booking/checkout returned 204 No Content')

// POST handler - Invalid JSON
const badJsonReq = new Request('http://localhost:3000/api/booking/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: 'not a json{'
})
const badJsonRes: Response = await POST(badJsonReq)
assert.strictEqual(badJsonRes.status, 400)
const badJsonData = await badJsonRes.json()
assert.strictEqual(badJsonData.success, false)
console.log('PASS: POST with invalid JSON returned 400 Bad Request')

// POST handler - Missing booking_id
const missingIdReq = new Request('http://localhost:3000/api/booking/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ customer_name: 'No Booking ID' })
})
const missingIdRes: Response = await POST(missingIdReq)
assert.strictEqual(missingIdRes.status, 400)
const missingIdData = await missingIdRes.json()
assert.ok(missingIdData.error.includes('booking_id'), 'Error message must specify booking_id')
console.log('PASS: POST with missing booking_id returned 400 Bad Request')

// POST handler - Valid request (standalone / mock mode)
process.env.MOCK_MIDTRANS = 'true'
const validReq = new Request('http://localhost:3000/api/booking/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    booking_id: 'b9999999-8888-7777-6666-555555555555',
    customer_name: 'Hendra Gunawan',
    customer_phone: '085712345678',
    customer_email: 'hendra@example.com',
    service_name: 'Gentlemen Classic Haircut'
  })
})

const validRes: Response = await POST(validReq)
assert.strictEqual(validRes.status, 200)
const validData = await validRes.json()

assert.strictEqual(validData.success, true)
assert.ok(validData.data.token, 'Response must include Snap token')
assert.ok(validData.data.redirect_url, 'Response must include redirect_url')
assert.strictEqual(validData.data.gross_amount, 20000, 'Response gross_amount must be 20000')
assert.strictEqual(validData.data.booking_id, 'b9999999-8888-7777-6666-555555555555')
assert.strictEqual(validData.data.customer_name, 'Hendra Gunawan')
assert.strictEqual(validData.data.customer_phone, '085712345678')
assert.ok(validData.data.order_id.startsWith('ORDER-'), 'Order ID must have ORDER- prefix')
assert.ok(validData.data.expires_at, 'Response must include expires_at TTL')
console.log('PASS: POST with valid booking_id successfully returned Snap Token and nominal Rp 20.000!')

// ----------------------------------------------------------------------------
// TEST 8: getMidtransTransactionStatus
// ----------------------------------------------------------------------------
console.log('[Test 8] getMidtransTransactionStatus Query')
const statusRes = await getMidtransTransactionStatus('ORDER-DMZ-TEST-001', { serverKey: 'mock' })
assert.strictEqual(statusRes.order_id, 'ORDER-DMZ-TEST-001')
assert.strictEqual(statusRes.transaction_status, 'settlement')
assert.strictEqual(statusRes.gross_amount, '20000.00')
console.log('PASS: getMidtransTransactionStatus returned expected transaction status.\n')

// ----------------------------------------------------------------------------
// TEST 9: Edge Case - Sanitizing Special Characters in Phone & Customer Name
// ----------------------------------------------------------------------------
console.log('[Test 9] Edge Cases - Input Sanitization & Expiry')
const edgeCheckout = await createBookingSnapTransaction(
  {
    booking_id: 'b-edge-001',
    booking_code: 'DMZ-20261023-EDGE',
    customer_name: '  Riko "The Rock" Simanjuntak  ',
    customer_phone: '+62 812-3456-7890 (WA)',
    customer_email: '  riko@example.com  ',
    service_name: 'Gentlemen Classic Haircut + Beard Grooming'
  },
  { serverKey: 'mock' }
)

assert.strictEqual(edgeCheckout.customer_name, 'Riko "The Rock" Simanjuntak')
assert.strictEqual(edgeCheckout.customer_phone, '+6281234567890')
assert.strictEqual(edgeCheckout.customer_email, 'riko@example.com')
assert.strictEqual(edgeCheckout.gross_amount, 20000)
console.log('PASS: Input sanitization correctly cleaned customer phone and strings.\n')

console.log('=== ALL 9 MIDTRANS & CHECKOUT TESTS PASSED 100% ===')
