/**
 * DAMEZ BARBERSHOP - MIDTRANS PAYMENT GATEWAY INTEGRATION
 * Core Midtrans Snap API client for Down Payment (Flat Rp 20.000).
 * Supports QRIS, GoPay, ShopeePay, and Virtual Accounts.
 */

import crypto from 'crypto'
import midtransClient from 'midtrans-client'

// Business Constants
export const FLAT_DOWN_PAYMENT_AMOUNT_IDR: number = 20000
export const DEFAULT_HOLD_TTL_MINUTES: number = 15

export const DEFAULT_ENABLED_PAYMENTS: readonly string[] = [
  'qris',
  'gopay',
  'shopeepay',
  'bca_va',
  'bni_va',
  'bri_va',
  'permata_va',
  'other_va'
] as const

// API Endpoints
export const MIDTRANS_SNAP_SANDBOX_BASE_URL: string = 'https://app.sandbox.midtrans.com/snap/v1'
export const MIDTRANS_SNAP_PRODUCTION_BASE_URL: string = 'https://app.midtrans.com/snap/v1'
export const MIDTRANS_CORE_SANDBOX_BASE_URL: string = 'https://api.sandbox.midtrans.com'
export const MIDTRANS_CORE_PRODUCTION_BASE_URL: string = 'https://api.midtrans.com'

/**
 * Midtrans Client Configuration Interface
 */
export interface MidtransConfig {
  serverKey: string
  clientKey: string
  isProduction: boolean
}

/**
 * Midtrans Customer Details
 */
export interface MidtransCustomerDetails {
  first_name: string
  last_name?: string
  email?: string
  phone: string
  billing_address?: {
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    postal_code?: string
    country_code?: string
  }
}

/**
 * Midtrans Item Detail
 */
export interface MidtransItemDetail {
  id: string
  price: number
  quantity: number
  name: string
  brand?: string
  category?: string
  merchant_name?: string
}

/**
 * Midtrans Expiry Configuration
 */
export interface MidtransExpiryConfig {
  start_time?: string
  unit: 'minute' | 'hour' | 'day'
  duration: number
}

/**
 * Midtrans Transaction Details
 */
export interface MidtransTransactionDetails {
  order_id: string
  gross_amount: number
}

/**
 * Full Midtrans Snap Transaction Request Payload
 */
export interface MidtransSnapTransactionRequest {
  transaction_details: MidtransTransactionDetails
  item_details?: MidtransItemDetail[]
  customer_details?: MidtransCustomerDetails
  enabled_payments?: string[]
  custom_field1?: string // booking_id
  custom_field2?: string // customer_phone
  custom_field3?: string // booking_code
  metadata?: Record<string, unknown>
  expiry?: MidtransExpiryConfig
  callbacks?: {
    finish?: string
    error?: string
    pending?: string
  }
}

/**
 * Midtrans Snap Transaction API Response
 */
export interface MidtransSnapTransactionResponse {
  token: string
  redirect_url: string
}

/**
 * Parameters to create a booking down payment checkout session
 */
export interface CreateBookingCheckoutParams {
  booking_id: string
  booking_code: string
  customer_name: string
  customer_phone: string
  customer_email?: string | null
  service_name?: string
  order_id?: string
  enabled_payments?: string[]
  finish_url?: string
}

/**
 * Result of creating a booking checkout session
 */
export interface BookingCheckoutResult {
  token: string
  redirect_url: string
  order_id: string
  gross_amount: number
  booking_id: string
  booking_code: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  expires_at: string
}

/**
 * Notification payload structure from Midtrans Webhook
 */
export interface MidtransNotificationPayload {
  order_id: string
  status_code: string
  gross_amount: string
  signature_key: string
  transaction_status: string
  fraud_status?: string
  payment_type: string
  transaction_id: string
  transaction_time?: string
  custom_field1?: string
  custom_field2?: string
  custom_field3?: string
}

/**
 * Retrieve Midtrans configuration from environment variables.
 */
export function getMidtransConfig(): MidtransConfig {
  const serverKey: string = process.env.MIDTRANS_SERVER_KEY || ''
  const clientKey: string =
    process.env.MIDTRANS_CLIENT_KEY ||
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
    ''
  const isProduction: boolean =
    process.env.MIDTRANS_IS_PRODUCTION === 'true' ||
    (process.env.NODE_ENV === 'production' && process.env.MIDTRANS_IS_PRODUCTION !== 'false')

  return {
    serverKey,
    clientKey,
    isProduction
  }
}

/**
 * Generates a unique, deterministic, and URL-safe order ID for a booking.
 * Format: ORDER-{BOOKING_CODE}-{TIMESTAMP_HEX}
 */
export function generateOrderId(bookingCode: string): string {
  const sanitizedCode: string = bookingCode.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase()
  const timestampHex: string = Date.now().toString(36).toUpperCase()
  const randomSuffix: string = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORDER-${sanitizedCode}-${timestampHex}${randomSuffix}`
}

/**
 * Checks whether the environment is configured with a live Midtrans Server Key
 * or running in simulated/mock mode.
 */
export function isMockMidtransMode(config: MidtransConfig): boolean {
  if (!config.serverKey) {
    return true
  }
  const normalizedKey: string = config.serverKey.trim().toLowerCase()
  return (
    normalizedKey === 'mock' ||
    normalizedKey === 'test' ||
    normalizedKey.startsWith('mock-') ||
    normalizedKey === 'sb-mid-server-mock' ||
    process.env.MOCK_MIDTRANS === 'true'
  )
}

/**
 * Creates a raw Snap transaction by contacting the Midtrans Snap API.
 * Uses official `midtrans-client` with a resilient direct HTTPS fetch fallback.
 */
export async function createSnapTransaction(
  payload: MidtransSnapTransactionRequest,
  configOverride?: Partial<MidtransConfig>
): Promise<MidtransSnapTransactionResponse> {
  const baseConfig: MidtransConfig = getMidtransConfig()
  const config: MidtransConfig = { ...baseConfig, ...configOverride }

  // Defensive validation of transaction details
  if (!payload.transaction_details || !payload.transaction_details.order_id) {
    throw new Error('Midtrans transaction_details.order_id is required.')
  }
  if (!payload.transaction_details.gross_amount || payload.transaction_details.gross_amount <= 0) {
    throw new Error('Midtrans transaction_details.gross_amount must be greater than 0.')
  }

  // Validate item_details sum matches gross_amount if provided
  if (payload.item_details && payload.item_details.length > 0) {
    const totalItemPrice: number = payload.item_details.reduce(
      (sum: number, item: MidtransItemDetail): number => sum + item.price * item.quantity,
      0
    )
    if (totalItemPrice !== payload.transaction_details.gross_amount) {
      throw new Error(
        `Gross amount (${payload.transaction_details.gross_amount}) does not match item details total (${totalItemPrice}).`
      )
    }
  }

  // Handle Mock Mode for local testing, CI/CD, or absent credentials
  if (isMockMidtransMode(config)) {
    const orderId: string = payload.transaction_details.order_id
    const mockToken: string = `mock-snap-${crypto.randomBytes(8).toString('hex')}`
    const mockRedirectUrl: string = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${mockToken}?order_id=${encodeURIComponent(orderId)}`
    return {
      token: mockToken,
      redirect_url: mockRedirectUrl
    }
  }

  // Attempt using official midtrans-client SDK
  try {
    const snapClient = new midtransClient.Snap({
      isProduction: config.isProduction,
      serverKey: config.serverKey,
      clientKey: config.clientKey
    })

    const response = await snapClient.createTransaction(payload as unknown as import('midtrans-client').SnapTransactionParameters)
    if (response && response.token && response.redirect_url) {
      return {
        token: response.token as string,
        redirect_url: response.redirect_url as string
      }
    }
  } catch (sdkError: unknown) {
    const errorMessage: string = sdkError instanceof Error ? sdkError.message : String(sdkError)
    // If the error is network/auth, try direct REST API fallback before failing
    console.warn(`[Midtrans SDK Warning] SDK call failed, falling back to direct REST API: ${errorMessage}`)
  }

  // Direct REST API Fallback
  const snapUrl: string = config.isProduction
    ? `${MIDTRANS_SNAP_PRODUCTION_BASE_URL}/transactions`
    : `${MIDTRANS_SNAP_SANDBOX_BASE_URL}/transactions`

  const authHeader: string = `Basic ${Buffer.from(`${config.serverKey}:`).toString('base64')}`

  const response: globalThis.Response = await fetch(snapUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: authHeader
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errorBody: string = await response.text()
    throw new Error(
      `Midtrans Snap API responded with HTTP ${response.status} (${response.statusText}): ${errorBody}`
    )
  }

  const responseJson = (await response.json()) as { token?: string; redirect_url?: string; error_messages?: string[] }

  if (!responseJson.token || !responseJson.redirect_url) {
    const message: string = responseJson.error_messages ? responseJson.error_messages.join(', ') : 'Unknown response'
    throw new Error(`Invalid response from Midtrans Snap API: ${message}`)
  }

  return {
    token: responseJson.token,
    redirect_url: responseJson.redirect_url
  }
}

/**
 * High-level helper to generate a Midtrans Snap transaction for a booking Down Payment.
 * Enforces the Flat Rp 20.000 nominal and 15-minute hold TTL.
 */
export async function createBookingSnapTransaction(
  params: CreateBookingCheckoutParams,
  configOverride?: Partial<MidtransConfig>
): Promise<BookingCheckoutResult> {
  const orderId: string = params.order_id || generateOrderId(params.booking_code)
  const grossAmount: number = FLAT_DOWN_PAYMENT_AMOUNT_IDR

  // Compute 15-minute hold expiration timestamp in ISO format
  const expiresAt: string = new Date(Date.now() + DEFAULT_HOLD_TTL_MINUTES * 60 * 1000).toISOString()

  // Clean customer phone number and strings
  const sanitizedName: string = params.customer_name.trim()
  const sanitizedPhone: string = params.customer_phone.trim().replace(/[^\d+]/g, '')
  const sanitizedEmail: string | null = params.customer_email ? params.customer_email.trim() : null

  // Build Midtrans Item Details specifically for Down Payment
  const itemName: string = params.service_name
    ? `DP Booking - ${params.service_name.slice(0, 35)}`
    : 'DP Booking - Damez Barbershop'

  const itemDetails: MidtransItemDetail[] = [
    {
      id: 'DP-FLAT-20K',
      price: grossAmount,
      quantity: 1,
      name: itemName,
      category: 'Down Payment'
    }
  ]

  // Build Customer Details
  const customerDetails: MidtransCustomerDetails = {
    first_name: sanitizedName,
    phone: sanitizedPhone,
    ...(sanitizedEmail ? { email: sanitizedEmail } : {})
  }

  // Construct standard Midtrans Snap payload
  const payload: MidtransSnapTransactionRequest = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount
    },
    item_details: itemDetails,
    customer_details: customerDetails,
    enabled_payments: params.enabled_payments ? [...params.enabled_payments] : [...DEFAULT_ENABLED_PAYMENTS],
    custom_field1: params.booking_id,
    custom_field2: sanitizedPhone,
    custom_field3: params.booking_code,
    metadata: {
      booking_id: params.booking_id,
      booking_code: params.booking_code,
      customer_name: sanitizedName,
      customer_phone: sanitizedPhone,
      customer_email: sanitizedEmail,
      payment_type: 'down_payment',
      nominal_dp: grossAmount
    },
    expiry: {
      unit: 'minute',
      duration: DEFAULT_HOLD_TTL_MINUTES
    },
    ...(params.finish_url ? { callbacks: { finish: params.finish_url } } : {})
  }

  // Call Snap API
  const snapResponse: MidtransSnapTransactionResponse = await createSnapTransaction(payload, configOverride)

  return {
    token: snapResponse.token,
    redirect_url: snapResponse.redirect_url,
    order_id: orderId,
    gross_amount: grossAmount,
    booking_id: params.booking_id,
    booking_code: params.booking_code,
    customer_name: sanitizedName,
    customer_phone: sanitizedPhone,
    customer_email: sanitizedEmail,
    expires_at: expiresAt
  }
}

/**
 * Verifies the authenticity of Midtrans HTTP Notification (Webhook)
 * using the SHA-512 signature formula:
 * SHA512(order_id + status_code + gross_amount + server_key)
 */
export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
  serverKeyOverride?: string
): boolean {
  const config: MidtransConfig = getMidtransConfig()
  const serverKey: string = serverKeyOverride || config.serverKey

  if (!serverKey) {
    return false
  }

  // Note: gross_amount must be the exact string format sent by Midtrans (e.g. "20000.00")
  const rawString: string = `${orderId}${statusCode}${grossAmount}${serverKey}`
  const calculatedSignature: string = crypto.createHash('sha512').update(rawString).digest('hex')

  return calculatedSignature.toLowerCase() === signatureKey.toLowerCase()
}

/**
 * Fetches transaction status from Midtrans Core API.
 */
export async function getMidtransTransactionStatus(
  orderId: string,
  configOverride?: Partial<MidtransConfig>
): Promise<Record<string, unknown>> {
  const baseConfig: MidtransConfig = getMidtransConfig()
  const config: MidtransConfig = { ...baseConfig, ...configOverride }

  if (isMockMidtransMode(config)) {
    return {
      order_id: orderId,
      status_code: '200',
      transaction_status: 'settlement',
      gross_amount: '20000.00',
      payment_type: 'qris',
      transaction_time: new Date().toISOString()
    }
  }

  const baseUrl: string = config.isProduction ? MIDTRANS_CORE_PRODUCTION_BASE_URL : MIDTRANS_CORE_SANDBOX_BASE_URL
  const statusUrl: string = `${baseUrl}/v2/${encodeURIComponent(orderId)}/status`
  const authHeader: string = `Basic ${Buffer.from(`${config.serverKey}:`).toString('base64')}`

  const response: globalThis.Response = await fetch(statusUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: authHeader
    }
  })

  if (!response.ok) {
    const errorBody: string = await response.text()
    throw new Error(
      `Failed to fetch Midtrans status for order ${orderId}: HTTP ${response.status} - ${errorBody}`
    )
  }

  return (await response.json()) as Record<string, unknown>
}

// Re-export Webhook Processor & Types
export {
  processMidtransWebhook,
  verifyWebhookSignature,
  mapMidtransStatusToPaymentStatus,
  createWebhookMockStore,
  type MidtransWebhookPayload,
  type WebhookProcessResult,
  type WebhookProcessOptions,
  type WebhookMockStore
} from './webhook.ts'
