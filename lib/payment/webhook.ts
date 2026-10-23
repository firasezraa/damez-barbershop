/**
 * DAMEZ BARBERSHOP - MIDTRANS WEBHOOK LISTENER & IDEMPOTENT PROCESSOR
 * Module: lib/payment/webhook.ts
 * 
 * Verifies Midtrans SHA-512 signature key, enforces strict idempotency on repeated notifications,
 * and executes atomic status transitions on bookings, payments, and notification logs.
 */

import crypto from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getMidtransConfig,
  isMockMidtransMode,
  FLAT_DOWN_PAYMENT_AMOUNT_IDR,
  type MidtransConfig
} from './midtrans.ts'
import { getSupabaseClient } from '../supabase/client.ts'
import type { Database } from '../../types/database.types.ts'
import { inMemoryHoldsStore } from '../slots/auto-expire.ts'

export type BookingRow = Database['public']['Tables']['bookings']['Row']
export type BookingUpdate = Database['public']['Tables']['bookings']['Update']
export type PaymentRow = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']
export type NotificationLogInsert = Database['public']['Tables']['notification_logs']['Insert']
export type NotificationLogRow = Database['public']['Tables']['notification_logs']['Row']
export type PaymentStatus = Database['public']['Enums']['payment_status_enum']
export type BookingStatus = Database['public']['Enums']['booking_status_enum']

/**
 * Midtrans Webhook Notification payload interface
 */
export interface MidtransWebhookPayload {
  order_id: string
  status_code: string
  gross_amount: string | number
  signature_key: string
  transaction_status: string
  fraud_status?: string
  payment_type: string
  transaction_id: string
  transaction_time?: string
  settlement_time?: string
  status_message?: string
  custom_field1?: string // booking_id
  custom_field2?: string // customer_phone
  custom_field3?: string // booking_code
  currency?: string
  payment_amounts?: Array<{ amount: string; paid_at: string }> | null
  va_numbers?: Array<{ bank: string; va_number: string }>
  raw_response?: Record<string, unknown>
}

/**
 * In-memory Mock Store interface for deterministic testing without external database
 */
export interface WebhookMockStore {
  bookings: Map<string, BookingRow>
  payments: Map<string, PaymentRow>
  notification_logs: Array<NotificationLogRow>
}

/**
 * Configuration options for processing a webhook notification
 */
export interface WebhookProcessOptions {
  serverKeyOverride?: string
  skipSignatureVerification?: boolean
  supabaseClientOverride?: SupabaseClient<Database> | null
  mockStore?: WebhookMockStore
}

/**
 * Structured response from webhook processor
 */
export interface WebhookProcessResult {
  success: boolean
  statusCode: number
  message: string
  error?: string
  isIdempotent?: boolean
  orderId?: string
  bookingId?: string
  bookingCode?: string
  paymentStatus?: PaymentStatus
  bookingStatus?: BookingStatus
  downPaymentIdr?: number
  remainingBalanceIdr?: number
  transactionId?: string
  notificationLogged?: boolean
}

/**
 * Default internal in-memory fallback store (used when Supabase client is not configured)
 */
const defaultMockStore: WebhookMockStore = {
  bookings: new Map<string, BookingRow>(),
  payments: new Map<string, PaymentRow>(),
  notification_logs: []
}

/**
 * Resets the in-memory mock store (used for test isolation).
 */
export function resetDefaultMockStore(): void {
  defaultMockStore.bookings.clear()
  defaultMockStore.payments.clear()
  defaultMockStore.notification_logs.length = 0
}

/**
 * Creates a fresh, isolated in-memory mock store for unit and integration testing.
 */
export function createWebhookMockStore(initialData?: {
  bookings?: BookingRow[]
  payments?: PaymentRow[]
  notification_logs?: NotificationLogRow[]
}): WebhookMockStore {
  const store: WebhookMockStore = {
    bookings: new Map<string, BookingRow>(),
    payments: new Map<string, PaymentRow>(),
    notification_logs: []
  }

  if (initialData?.bookings) {
    initialData.bookings.forEach((b: BookingRow): void => {
      store.bookings.set(b.id, { ...b })
    })
  }

  if (initialData?.payments) {
    initialData.payments.forEach((p: PaymentRow): void => {
      store.payments.set(p.order_id, { ...p })
    })
  }

  if (initialData?.notification_logs) {
    store.notification_logs.push(...initialData.notification_logs.map((l: NotificationLogRow): NotificationLogRow => ({ ...l })))
  }

  return store
}

/**
 * Computes SHA-512 hash string for given input.
 */
export function computeSha512Hash(input: string): string {
  return crypto.createHash('sha512').update(input).digest('hex').toLowerCase()
}

/**
 * Timing-safe string comparison helper using crypto.timingSafeEqual.
 * Prevents side-channel timing attacks on cryptographic hashes.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Verifies Midtrans SHA-512 Signature Key:
 * Formula: SHA512(order_id + status_code + gross_amount + server_key)
 * Supports variations in gross_amount formatting (e.g. "20000.00" vs "20000").
 * Hardened with constant-time comparison to prevent timing attacks.
 */
export function verifyWebhookSignature(
  payload: MidtransWebhookPayload,
  serverKeyOverride?: string
): boolean {
  const config: MidtransConfig = getMidtransConfig()
  const serverKey: string = serverKeyOverride || config.serverKey || ''

  if (!payload.signature_key || typeof payload.signature_key !== 'string') {
    return false
  }

  const incomingSignature: string = payload.signature_key.trim().toLowerCase()

  // Handle mock mode: strictly forbidden in production!
  if (isMockMidtransMode(config) && !serverKeyOverride) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Security Critical] Mock Midtrans signature accepted is strictly forbidden in production mode!')
      return false
    }
    if (incomingSignature === 'mock-signature' || incomingSignature === 'valid-mock-signature') {
      return true
    }
  }

  const effectiveServerKey: string = serverKey || 'mock'

  const rawGross: string = String(payload.gross_amount).trim()
  const numGross: number = parseFloat(rawGross)

  // Test multiple valid string representations of the gross amount
  const candidateAmounts: string[] = [
    rawGross,
    !isNaN(numGross) ? numGross.toFixed(2) : rawGross,
    !isNaN(numGross) && numGross % 1 === 0 ? numGross.toFixed(0) : rawGross
  ]

  // Remove duplicates
  const uniqueCandidateAmounts: string[] = Array.from(new Set<string>(candidateAmounts))

  for (const amountStr of uniqueCandidateAmounts) {
    const rawString: string = `${payload.order_id}${payload.status_code}${amountStr}${effectiveServerKey}`
    const calculatedHash: string = computeSha512Hash(rawString)
    if (timingSafeEqualString(calculatedHash, incomingSignature)) {
      return true
    }
  }

  return false
}

/**
 * Maps Midtrans transaction_status and fraud_status to internal PaymentStatus
 */
export function mapMidtransStatusToPaymentStatus(
  transactionStatus: string,
  fraudStatus?: string
): PaymentStatus {
  const status: string = transactionStatus.toLowerCase().trim()

  switch (status) {
    case 'capture':
      // For credit cards: check fraud status
      if (fraudStatus && fraudStatus.toLowerCase() === 'challenge') {
        return 'pending'
      }
      return 'settlement'

    case 'settlement':
      return 'settlement'

    case 'pending':
      return 'pending'

    case 'deny':
      return 'deny'

    case 'cancel':
      return 'cancel'

    case 'expire':
      return 'expire'

    case 'failure':
      return 'failure'

    case 'refund':
      return 'refund'

    default:
      return 'pending'
  }
}

/**
 * Extracts booking_code from order_id format: ORDER-{BOOKING_CODE}-{TIMESTAMP}
 */
export function extractBookingCodeFromOrderId(orderId: string): string | null {
  const match: RegExpMatchArray | null = orderId.match(/^ORDER-([A-Z0-9_-]+)-[A-Z0-9]+$/i)
  if (match && match[1]) {
    return match[1]
  }
  return null
}

/**
 * Formats WhatsApp confirmation notification message body.
 */
export function generateBookingConfirmedMessage(
  bookingCode: string,
  customerName: string,
  bookingDate: string,
  startTime: string,
  dpPaidIdr: number,
  remainingBalanceIdr: number
): string {
  const formattedDp: string = dpPaidIdr.toLocaleString('id-ID')
  const formattedRemaining: string = remainingBalanceIdr.toLocaleString('id-ID')

  return `Halo ${customerName}! Pembayaran Down Payment (DP) sebesar Rp ${formattedDp} untuk reservasi #${bookingCode} di Damez Barbershop telah berhasil diverifikasi. Jadwal kedatangan Anda: ${bookingDate} pukul ${startTime} WIB. Sisa pembayaran di kasir: Rp ${formattedRemaining}. Mohon hadir 5 menit sebelum jadwal. Terima kasih!`
}

/**
 * Core Webhook Processor Function:
 * 1. Validates required payload fields
 * 2. Cryptographically verifies SHA-512 signature
 * 3. Enforces idempotency (detects duplicate settlement calls and out-of-order notifications)
 * 4. Atomically updates payments and bookings tables
 * 5. Logs WhatsApp notification without creating duplicates
 */
export async function processMidtransWebhook(
  payload: MidtransWebhookPayload,
  options?: WebhookProcessOptions
): Promise<WebhookProcessResult> {
  // 1. Validate payload presence and mandatory fields
  if (!payload || typeof payload !== 'object') {
    return {
      success: false,
      statusCode: 400,
      message: 'Invalid payload: request body must be a valid JSON object.',
      error: 'INVALID_PAYLOAD'
    }
  }

  const {
    order_id: orderId,
    status_code: statusCode,
    gross_amount: rawGrossAmount,
    signature_key: signatureKey,
    transaction_status: rawTransactionStatus,
    fraud_status: fraudStatus,
    payment_type: paymentType,
    transaction_id: transactionId
  } = payload

  if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
    return {
      success: false,
      statusCode: 400,
      message: 'Missing required field: order_id is mandatory.',
      error: 'MISSING_ORDER_ID'
    }
  }

  if (!statusCode || typeof statusCode !== 'string') {
    return {
      success: false,
      statusCode: 400,
      message: 'Missing required field: status_code is mandatory.',
      error: 'MISSING_STATUS_CODE'
    }
  }

  if (rawGrossAmount === undefined || rawGrossAmount === null) {
    return {
      success: false,
      statusCode: 400,
      message: 'Missing required field: gross_amount is mandatory.',
      error: 'MISSING_GROSS_AMOUNT'
    }
  }

  if (!signatureKey || typeof signatureKey !== 'string') {
    return {
      success: false,
      statusCode: 400,
      message: 'Missing required field: signature_key is mandatory.',
      error: 'MISSING_SIGNATURE_KEY'
    }
  }

  if (!rawTransactionStatus || typeof rawTransactionStatus !== 'string') {
    return {
      success: false,
      statusCode: 400,
      message: 'Missing required field: transaction_status is mandatory.',
      error: 'MISSING_TRANSACTION_STATUS'
    }
  }

  // 2. Cryptographic SHA-512 Signature Verification
  if (!options?.skipSignatureVerification) {
    const isSignatureValid: boolean = verifyWebhookSignature(payload, options?.serverKeyOverride)
    if (!isSignatureValid) {
      console.warn(`[Security Alert] Invalid Midtrans SHA-512 signature for order_id=${orderId}`)
      return {
        success: false,
        statusCode: 401,
        message: 'Signature verification failed: invalid Midtrans signature_key.',
        error: 'INVALID_SIGNATURE',
        orderId
      }
    }
  }

  // 3. Resolve Target Payment & Booking Status
  const targetPaymentStatus: PaymentStatus = mapMidtransStatusToPaymentStatus(
    rawTransactionStatus,
    fraudStatus
  )

  const grossAmountNum: number = typeof rawGrossAmount === 'number'
    ? rawGrossAmount
    : parseFloat(String(rawGrossAmount)) || FLAT_DOWN_PAYMENT_AMOUNT_IDR

  const currentTimeIso: string = new Date().toISOString()
  const paidAtTimestamp: string = payload.settlement_time || payload.transaction_time || currentTimeIso

  // Determine storage provider (Supabase Client or Mock Store)
  const supabase = options?.supabaseClientOverride !== undefined
    ? options.supabaseClientOverride
    : getSupabaseClient()

  const store: WebhookMockStore = options?.mockStore || defaultMockStore

  // --------------------------------------------------------------------------
  // PATH A: Supabase Client Connected
  // --------------------------------------------------------------------------
  if (supabase) {
    // 4. Idempotency Check against payments table
    const { data: existingPayment, error: fetchPaymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle()

    if (fetchPaymentError) {
      return {
        success: false,
        statusCode: 500,
        message: `Database error querying payment: ${fetchPaymentError.message}`,
        error: 'DB_ERROR'
      }
    }

    // IDEMPOTENCY GUARD 1: If payment is ALREADY settled and incoming is also settlement
    if (
      existingPayment &&
      existingPayment.transaction_status === 'settlement' &&
      targetPaymentStatus === 'settlement'
    ) {
      // Query associated booking to return accurate current state
      const { data: currentBooking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', existingPayment.booking_id)
        .maybeSingle()

      return {
        success: true,
        statusCode: 200,
        message: 'Notification already processed (idempotent duplicate acknowledged).',
        isIdempotent: true,
        orderId,
        bookingId: existingPayment.booking_id,
        bookingCode: currentBooking?.booking_code,
        paymentStatus: 'settlement',
        bookingStatus: currentBooking?.status || 'confirmed',
        downPaymentIdr: Number(existingPayment.gross_amount),
        remainingBalanceIdr: currentBooking?.remaining_balance_idr,
        transactionId: existingPayment.transaction_id || transactionId,
        notificationLogged: false
      }
    }

    // IDEMPOTENCY GUARD 2: Guard against delayed out-of-order notification (e.g. expire received after settlement)
    if (
      existingPayment &&
      existingPayment.transaction_status === 'settlement' &&
      (targetPaymentStatus === 'expire' || targetPaymentStatus === 'cancel' || targetPaymentStatus === 'deny')
    ) {
      return {
        success: true,
        statusCode: 200,
        message: `Ignored out-of-order notification (${targetPaymentStatus}): payment already settled.`,
        isIdempotent: true,
        orderId,
        bookingId: existingPayment.booking_id,
        paymentStatus: 'settlement'
      }
    }

    // 5. Resolve Booking ID
    let targetBookingId: string | null = payload.custom_field1 || existingPayment?.booking_id || null

    let bookingRecord: BookingRow | null = null

    if (targetBookingId) {
      const { data: b } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', targetBookingId)
        .maybeSingle()
      bookingRecord = (b as BookingRow) || null
    }

    // Fallback: search booking by booking_code from custom_field3 or order_id
    if (!bookingRecord) {
      const bookingCodeCandidate: string | null = payload.custom_field3 || extractBookingCodeFromOrderId(orderId)
      if (bookingCodeCandidate) {
        const { data: b } = await supabase
          .from('bookings')
          .select('*')
          .eq('booking_code', bookingCodeCandidate)
          .maybeSingle()
        if (b) {
          bookingRecord = b as BookingRow
          targetBookingId = bookingRecord.id
        }
      }
    }

    if (!targetBookingId || !bookingRecord) {
      return {
        success: false,
        statusCode: 404,
        message: `Associated booking record not found for order_id "${orderId}".`,
        error: 'BOOKING_NOT_FOUND',
        orderId
      }
    }

    // 6. Execute Atomic Updates based on Target Status
    let updatedBookingStatus: BookingStatus = bookingRecord.status
    let remainingBalance: number = bookingRecord.remaining_balance_idr
    let notificationInserted: boolean = false

    if (targetPaymentStatus === 'settlement') {
      // Security Guard: Verify gross_amount matches the authoritative Down Payment amount!
      const expectedDpAmount = bookingRecord.down_payment_idr || FLAT_DOWN_PAYMENT_AMOUNT_IDR
      if (Math.round(grossAmountNum) !== expectedDpAmount) {
        console.warn(`[Security Alert] Webhook gross_amount tampering detected for order_id=${orderId}! Received: ${grossAmountNum}, Expected DP: ${expectedDpAmount}`)
        return {
          success: false,
          statusCode: 400,
          message: `Gross amount mismatch: expected Down Payment of Rp ${expectedDpAmount}, received Rp ${grossAmountNum}.`,
          error: 'PAYMENT_AMOUNT_MISMATCH',
          orderId
        }
      }

      // Calculate remaining balance with exact constraint protection
      remainingBalance = Math.max(0, bookingRecord.total_price_idr - grossAmountNum)

      // Late Settlement Reconciler: Periksa apakah slot masih kosong jika booking sempat berstatus expired
      let isSlotStillFree: boolean = true
      if (bookingRecord.status === 'expired') {
        const { data: conflicts } = await supabase
          .from('bookings')
          .select('id, status, hold_expires_at')
          .eq('barber_id', bookingRecord.barber_id)
          .eq('booking_date', bookingRecord.booking_date)
          .neq('id', targetBookingId)
          .in('status', ['confirmed', 'in_progress', 'pending_payment'])

        if (conflicts && conflicts.length > 0) {
          isSlotStillFree = false
        }
      }

      // Atomically update booking if currently in pending_payment or expired with slot still available
      if (bookingRecord.status === 'pending_payment' || (bookingRecord.status === 'expired' && isSlotStillFree)) {
        const { error: bookingUpdateError } = await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            confirmed_at: currentTimeIso,
            down_payment_idr: Math.round(grossAmountNum),
            remaining_balance_idr: remainingBalance,
            hold_expires_at: null,
            cancelled_at: null,
            cancellation_reason: null,
            updated_at: currentTimeIso
          })
          .eq('id', targetBookingId)

        if (bookingUpdateError) {
          return {
            success: false,
            statusCode: 500,
            message: `Failed to update booking status to confirmed: ${bookingUpdateError.message}`,
            error: 'BOOKING_UPDATE_FAILED'
          }
        }
        updatedBookingStatus = 'confirmed'

        // Sinkronisasi status di inMemoryHoldsStore
        if (inMemoryHoldsStore.has(targetBookingId)) {
          const hold = inMemoryHoldsStore.get(targetBookingId)!
          hold.status = 'confirmed'
          hold.down_payment_idr = Math.round(grossAmountNum)
          hold.remaining_balance_idr = remainingBalance
          inMemoryHoldsStore.set(targetBookingId, hold)
        }
      } else if (bookingRecord.status === 'expired' && !isSlotStillFree) {
        // Late settlement saat kursi sudah dipesan orang lain -> tandai refund
        updatedBookingStatus = 'cancelled'
        await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            cancellation_reason: 'Late settlement: slot was re-booked by another customer. Flagged for refund.',
            updated_at: currentTimeIso
          })
          .eq('id', targetBookingId)
      } else {
        updatedBookingStatus = bookingRecord.status
      }

      // Upsert payment record
      if (existingPayment) {
        await supabase
          .from('payments')
          .update({
            transaction_status: 'settlement',
            status_code: statusCode,
            status_message: payload.status_message || 'Settlement processed successfully',
            transaction_id: transactionId,
            payment_type: paymentType,
            gross_amount: grossAmountNum,
            signature_key: signatureKey,
            paid_at: paidAtTimestamp,
            raw_response: payload as unknown as Database['public']['Tables']['payments']['Row']['raw_response'],
            updated_at: currentTimeIso
          })
          .eq('id', existingPayment.id)
      } else {
        await supabase
          .from('payments')
          .insert({
            booking_id: targetBookingId,
            order_id: orderId,
            payment_type: paymentType,
            gross_amount: grossAmountNum,
            currency: payload.currency || 'IDR',
            transaction_status: 'settlement',
            fraud_status: fraudStatus || null,
            status_code: statusCode,
            status_message: payload.status_message || 'Settlement processed successfully',
            transaction_id: transactionId,
            payment_amounts: (payload.payment_amounts || null) as unknown as Database['public']['Tables']['payments']['Row']['payment_amounts'],
            raw_response: payload as unknown as Database['public']['Tables']['payments']['Row']['raw_response'],
            signature_key: signatureKey,
            paid_at: paidAtTimestamp,
            created_at: currentTimeIso,
            updated_at: currentTimeIso
          })
      }

      // Log notification entry if not already logged (WhatsApp Dispatcher Hand-off)
      const { data: existingNotification } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('booking_id', targetBookingId)
        .eq('template_name', 'booking_confirmed')
        .maybeSingle()

      if (!existingNotification) {
        const messageBody: string = generateBookingConfirmedMessage(
          bookingRecord.booking_code,
          bookingRecord.customer_name,
          bookingRecord.booking_date,
          bookingRecord.start_time,
          Math.round(grossAmountNum),
          remainingBalance
        )

        const { error: notifError } = await supabase
          .from('notification_logs')
          .insert({
            booking_id: targetBookingId,
            recipient_phone: bookingRecord.customer_phone,
            channel: 'whatsapp',
            template_name: 'booking_confirmed',
            message_body: messageBody,
            status: 'pending',
            created_at: currentTimeIso
          })

        if (!notifError) {
          notificationInserted = true
        }
      }
    } else if (targetPaymentStatus === 'expire') {
      // Payment expired: release hold by transitioning status to expired
      if (bookingRecord.status === 'pending_payment') {
        await supabase
          .from('bookings')
          .update({
            status: 'expired',
            cancelled_at: currentTimeIso,
            cancellation_reason: 'Payment hold expired (15 minutes TTL exceeded)',
            updated_at: currentTimeIso
          })
          .eq('id', targetBookingId)
          .eq('status', 'pending_payment')

        updatedBookingStatus = 'expired'
      }

      // Record/Update payment record
      if (existingPayment) {
        await supabase
          .from('payments')
          .update({
            transaction_status: 'expire',
            status_code: statusCode,
            status_message: payload.status_message || 'Transaction expired',
            updated_at: currentTimeIso
          })
          .eq('id', existingPayment.id)
      } else {
        await supabase
          .from('payments')
          .insert({
            booking_id: targetBookingId,
            order_id: orderId,
            payment_type: paymentType,
            gross_amount: grossAmountNum,
            currency: payload.currency || 'IDR',
            transaction_status: 'expire',
            status_code: statusCode,
            status_message: payload.status_message || 'Transaction expired',
            transaction_id: transactionId,
            raw_response: payload as unknown as Database['public']['Tables']['payments']['Row']['raw_response'],
            signature_key: signatureKey,
            created_at: currentTimeIso,
            updated_at: currentTimeIso
          })
      }
    } else if (
      targetPaymentStatus === 'cancel' ||
      targetPaymentStatus === 'deny' ||
      targetPaymentStatus === 'failure'
    ) {
      // Payment cancelled or denied: release hold by transitioning status to cancelled
      if (bookingRecord.status === 'pending_payment') {
        await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            cancelled_at: currentTimeIso,
            cancellation_reason: payload.status_message || `Payment ${targetPaymentStatus}`,
            updated_at: currentTimeIso
          })
          .eq('id', targetBookingId)
          .eq('status', 'pending_payment')

        updatedBookingStatus = 'cancelled'
      }

      // Record/Update payment record
      if (existingPayment) {
        await supabase
          .from('payments')
          .update({
            transaction_status: targetPaymentStatus,
            status_code: statusCode,
            status_message: payload.status_message || `Payment ${targetPaymentStatus}`,
            updated_at: currentTimeIso
          })
          .eq('id', existingPayment.id)
      } else {
        await supabase
          .from('payments')
          .insert({
            booking_id: targetBookingId,
            order_id: orderId,
            payment_type: paymentType,
            gross_amount: grossAmountNum,
            currency: payload.currency || 'IDR',
            transaction_status: targetPaymentStatus,
            status_code: statusCode,
            status_message: payload.status_message || `Payment ${targetPaymentStatus}`,
            transaction_id: transactionId,
            raw_response: payload as unknown as Database['public']['Tables']['payments']['Row']['raw_response'],
            signature_key: signatureKey,
            created_at: currentTimeIso,
            updated_at: currentTimeIso
          })
      }
    } else {
      // Pending status
      if (existingPayment) {
        await supabase
          .from('payments')
          .update({
            transaction_status: 'pending',
            status_code: statusCode,
            status_message: payload.status_message || 'Pending payment',
            updated_at: currentTimeIso
          })
          .eq('id', existingPayment.id)
      }
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Payment notification processed successfully.',
      isIdempotent: false,
      orderId,
      bookingId: targetBookingId,
      bookingCode: bookingRecord.booking_code,
      paymentStatus: targetPaymentStatus,
      bookingStatus: updatedBookingStatus,
      downPaymentIdr: Math.round(grossAmountNum),
      remainingBalanceIdr: remainingBalance,
      transactionId,
      notificationLogged: notificationInserted
    }
  }

  // --------------------------------------------------------------------------
  // PATH B: Mock Store Adapter (For Unit Tests & Environments without Supabase)
  // --------------------------------------------------------------------------
  const existingMockPayment: PaymentRow | undefined = store.payments.get(orderId)

  // IDEMPOTENCY GUARD 1 on Mock Store:
  if (
    existingMockPayment &&
    existingMockPayment.transaction_status === 'settlement' &&
    targetPaymentStatus === 'settlement'
  ) {
    const mockBooking: BookingRow | undefined = store.bookings.get(existingMockPayment.booking_id)
    return {
      success: true,
      statusCode: 200,
      message: 'Notification already processed (idempotent duplicate acknowledged).',
      isIdempotent: true,
      orderId,
      bookingId: existingMockPayment.booking_id,
      bookingCode: mockBooking?.booking_code,
      paymentStatus: 'settlement',
      bookingStatus: mockBooking?.status || 'confirmed',
      downPaymentIdr: Number(existingMockPayment.gross_amount),
      remainingBalanceIdr: mockBooking?.remaining_balance_idr,
      transactionId: existingMockPayment.transaction_id || transactionId,
      notificationLogged: false
    }
  }

  // IDEMPOTENCY GUARD 2 on Mock Store: Guard against delayed out-of-order notification
  if (
    existingMockPayment &&
    existingMockPayment.transaction_status === 'settlement' &&
    (targetPaymentStatus === 'expire' || targetPaymentStatus === 'cancel' || targetPaymentStatus === 'deny')
  ) {
    return {
      success: true,
      statusCode: 200,
      message: `Ignored out-of-order notification (${targetPaymentStatus}): payment already settled.`,
      isIdempotent: true,
      orderId,
      bookingId: existingMockPayment.booking_id,
      paymentStatus: 'settlement'
    }
  }

  // Resolve Booking from Mock Store
  let targetBookingId: string | null = payload.custom_field1 || existingMockPayment?.booking_id || null
  let mockBookingRecord: BookingRow | undefined = targetBookingId ? store.bookings.get(targetBookingId) : undefined

  if (!mockBookingRecord) {
    const bookingCodeCandidate: string | null = payload.custom_field3 || extractBookingCodeFromOrderId(orderId)
    if (bookingCodeCandidate) {
      for (const b of store.bookings.values()) {
        if (b.booking_code === bookingCodeCandidate) {
          mockBookingRecord = b
          targetBookingId = b.id
          break
        }
      }
    }
  }

  // Fallback to inMemoryHoldsStore from auto-expire service
  if (!mockBookingRecord && targetBookingId && inMemoryHoldsStore.has(targetBookingId)) {
    const hold = inMemoryHoldsStore.get(targetBookingId)!
    mockBookingRecord = {
      id: hold.id,
      booking_code: hold.booking_code,
      customer_id: 'c-mock-hold',
      customer_name: hold.customer_name,
      customer_phone: hold.customer_phone,
      customer_email: hold.customer_email,
      barber_id: hold.barber_id,
      booking_date: hold.booking_date,
      start_time: hold.start_time,
      end_time: hold.end_time,
      booking_type: 'online',
      status: hold.status,
      service_duration_minutes: hold.service_duration_minutes,
      buffer_minutes: hold.buffer_minutes,
      booking_range: null,
      total_price_idr: hold.total_price_idr,
      down_payment_idr: hold.down_payment_idr,
      remaining_balance_idr: hold.remaining_balance_idr,
      settlement_method: 'none',
      settlement_paid_at: null,
      hold_expires_at: hold.hold_expires_at,
      confirmed_at: null,
      completed_at: null,
      cancelled_at: null,
      cancellation_reason: null,
      rescheduled_from_id: null,
      rescheduled_at: null,
      notes: null,
      created_at: hold.created_at,
      updated_at: hold.created_at
    }
    store.bookings.set(hold.id, mockBookingRecord)
  } else if (!mockBookingRecord) {
    const bookingCodeCandidate: string | null = payload.custom_field3 || extractBookingCodeFromOrderId(orderId)
    if (bookingCodeCandidate) {
      for (const hold of inMemoryHoldsStore.values()) {
        if (hold.booking_code === bookingCodeCandidate) {
          targetBookingId = hold.id
          mockBookingRecord = {
            id: hold.id,
            booking_code: hold.booking_code,
            customer_id: 'c-mock-hold',
            customer_name: hold.customer_name,
            customer_phone: hold.customer_phone,
            customer_email: hold.customer_email,
            barber_id: hold.barber_id,
            booking_date: hold.booking_date,
            start_time: hold.start_time,
            end_time: hold.end_time,
            booking_type: 'online',
            status: hold.status,
            service_duration_minutes: hold.service_duration_minutes,
            buffer_minutes: hold.buffer_minutes,
            booking_range: null,
            total_price_idr: hold.total_price_idr,
            down_payment_idr: hold.down_payment_idr,
            remaining_balance_idr: hold.remaining_balance_idr,
            settlement_method: 'none',
            settlement_paid_at: null,
            hold_expires_at: hold.hold_expires_at,
            confirmed_at: null,
            completed_at: null,
            cancelled_at: null,
            cancellation_reason: null,
            rescheduled_from_id: null,
            rescheduled_at: null,
            notes: null,
            created_at: hold.created_at,
            updated_at: hold.created_at
          }
          store.bookings.set(hold.id, mockBookingRecord)
          break
        }
      }
    }
  }

  if (!targetBookingId || !mockBookingRecord) {
    return {
      success: false,
      statusCode: 404,
      message: `Associated booking record not found for order_id "${orderId}".`,
      error: 'BOOKING_NOT_FOUND',
      orderId
    }
  }

  let updatedBookingStatus: BookingStatus = mockBookingRecord.status
  let remainingBalance: number = mockBookingRecord.remaining_balance_idr
  let notificationInserted: boolean = false

  if (targetPaymentStatus === 'settlement') {
    // Security Guard: Verify gross_amount matches the authoritative Down Payment amount!
    const expectedDpAmount = mockBookingRecord.down_payment_idr || FLAT_DOWN_PAYMENT_AMOUNT_IDR
    if (Math.round(grossAmountNum) !== expectedDpAmount) {
      console.warn(`[Security Alert] Webhook gross_amount tampering detected for order_id=${orderId}! Received: ${grossAmountNum}, Expected DP: ${expectedDpAmount}`)
      return {
        success: false,
        statusCode: 400,
        message: `Gross amount mismatch: expected Down Payment of Rp ${expectedDpAmount}, received Rp ${grossAmountNum}.`,
        error: 'PAYMENT_AMOUNT_MISMATCH',
        orderId
      }
    }

    remainingBalance = Math.max(0, mockBookingRecord.total_price_idr - grossAmountNum)

    // Late Settlement Reconciler: Periksa apakah slot masih kosong jika booking sempat berstatus expired
    let isMockSlotFree: boolean = true
    if (mockBookingRecord.status === 'expired') {
      for (const [_, b] of store.bookings) {
        if (b.id !== targetBookingId && b.barber_id === mockBookingRecord.barber_id && b.booking_date === mockBookingRecord.booking_date) {
          if (b.status === 'confirmed' || b.status === 'in_progress') {
            isMockSlotFree = false
            break
          }
        }
      }
    }

    if (mockBookingRecord.status === 'pending_payment' || (mockBookingRecord.status === 'expired' && isMockSlotFree)) {
      mockBookingRecord.status = 'confirmed'
      mockBookingRecord.confirmed_at = currentTimeIso
      mockBookingRecord.down_payment_idr = Math.round(grossAmountNum)
      mockBookingRecord.remaining_balance_idr = remainingBalance
      mockBookingRecord.hold_expires_at = null
      mockBookingRecord.cancelled_at = null
      mockBookingRecord.cancellation_reason = null
      mockBookingRecord.updated_at = currentTimeIso
      updatedBookingStatus = 'confirmed'

      // Sinkronisasi status di inMemoryHoldsStore
      if (inMemoryHoldsStore.has(targetBookingId)) {
        const hold = inMemoryHoldsStore.get(targetBookingId)!
        hold.status = 'confirmed'
        hold.down_payment_idr = Math.round(grossAmountNum)
        hold.remaining_balance_idr = remainingBalance
        inMemoryHoldsStore.set(targetBookingId, hold)
      }
    } else if (mockBookingRecord.status === 'expired' && !isMockSlotFree) {
      updatedBookingStatus = 'cancelled'
      mockBookingRecord.status = 'cancelled'
      mockBookingRecord.cancellation_reason = 'Late settlement: slot was re-booked by another customer. Flagged for refund.'
      mockBookingRecord.updated_at = currentTimeIso
    } else {
      updatedBookingStatus = mockBookingRecord.status
    }

    // Upsert payment into mock store
    const updatedPayment: PaymentRow = {
      id: existingMockPayment?.id || `pay-mock-${Date.now()}`,
      booking_id: targetBookingId,
      order_id: orderId,
      snap_token: existingMockPayment?.snap_token || null,
      snap_redirect_url: existingMockPayment?.snap_redirect_url || null,
      payment_type: paymentType,
      gross_amount: grossAmountNum,
      currency: payload.currency || 'IDR',
      transaction_status: 'settlement',
      fraud_status: fraudStatus || null,
      status_code: statusCode,
      status_message: payload.status_message || 'Settlement processed successfully',
      transaction_id: transactionId,
      payment_amounts: (payload.payment_amounts || null) as unknown as Database['public']['Tables']['payments']['Row']['payment_amounts'],
      raw_response: payload as unknown as Database['public']['Tables']['payments']['Row']['raw_response'],
      signature_key: signatureKey,
      paid_at: paidAtTimestamp,
      expires_at: existingMockPayment?.expires_at || null,
      created_at: existingMockPayment?.created_at || currentTimeIso,
      updated_at: currentTimeIso
    }
    store.payments.set(orderId, updatedPayment)

    // Notification check on mock store
    const alreadyLogged: boolean = store.notification_logs.some(
      (l: NotificationLogRow): boolean => l.booking_id === targetBookingId && l.template_name === 'booking_confirmed'
    )

    if (!alreadyLogged) {
      const messageBody: string = generateBookingConfirmedMessage(
        mockBookingRecord.booking_code,
        mockBookingRecord.customer_name,
        mockBookingRecord.booking_date,
        mockBookingRecord.start_time,
        Math.round(grossAmountNum),
        remainingBalance
      )

      store.notification_logs.push({
        id: `notif-mock-${Date.now()}`,
        booking_id: targetBookingId,
        recipient_phone: mockBookingRecord.customer_phone,
        channel: 'whatsapp',
        template_name: 'booking_confirmed',
        message_body: messageBody,
        status: 'pending',
        response_payload: null,
        error_message: null,
        sent_at: null,
        created_at: currentTimeIso
      })
      notificationInserted = true
    }
  } else if (targetPaymentStatus === 'expire') {
    if (mockBookingRecord.status === 'pending_payment') {
      mockBookingRecord.status = 'expired'
      mockBookingRecord.cancelled_at = currentTimeIso
      mockBookingRecord.cancellation_reason = 'Payment hold expired (15 minutes TTL exceeded)'
      mockBookingRecord.updated_at = currentTimeIso
      updatedBookingStatus = 'expired'
    }

    const updatedPayment: PaymentRow = {
      id: existingMockPayment?.id || `pay-mock-${Date.now()}`,
      booking_id: targetBookingId,
      order_id: orderId,
      snap_token: existingMockPayment?.snap_token || null,
      snap_redirect_url: existingMockPayment?.snap_redirect_url || null,
      payment_type: paymentType,
      gross_amount: grossAmountNum,
      currency: payload.currency || 'IDR',
      transaction_status: 'expire',
      fraud_status: fraudStatus || null,
      status_code: statusCode,
      status_message: payload.status_message || 'Transaction expired',
      transaction_id: transactionId,
      payment_amounts: null,
      raw_response: payload as unknown as Database['public']['Tables']['payments']['Row']['raw_response'],
      signature_key: signatureKey,
      paid_at: null,
      expires_at: null,
      created_at: existingMockPayment?.created_at || currentTimeIso,
      updated_at: currentTimeIso
    }
    store.payments.set(orderId, updatedPayment)
  } else if (
    targetPaymentStatus === 'cancel' ||
    targetPaymentStatus === 'deny' ||
    targetPaymentStatus === 'failure'
  ) {
    if (mockBookingRecord.status === 'pending_payment') {
      mockBookingRecord.status = 'cancelled'
      mockBookingRecord.cancelled_at = currentTimeIso
      mockBookingRecord.cancellation_reason = payload.status_message || `Payment ${targetPaymentStatus}`
      mockBookingRecord.updated_at = currentTimeIso
      updatedBookingStatus = 'cancelled'
    }

    const updatedPayment: PaymentRow = {
      id: existingMockPayment?.id || `pay-mock-${Date.now()}`,
      booking_id: targetBookingId,
      order_id: orderId,
      snap_token: existingMockPayment?.snap_token || null,
      snap_redirect_url: existingMockPayment?.snap_redirect_url || null,
      payment_type: paymentType,
      gross_amount: grossAmountNum,
      currency: payload.currency || 'IDR',
      transaction_status: targetPaymentStatus,
      fraud_status: fraudStatus || null,
      status_code: statusCode,
      status_message: payload.status_message || `Payment ${targetPaymentStatus}`,
      transaction_id: transactionId,
      payment_amounts: null,
      raw_response: payload as unknown as Database['public']['Tables']['payments']['Row']['raw_response'],
      signature_key: signatureKey,
      paid_at: null,
      expires_at: null,
      created_at: existingMockPayment?.created_at || currentTimeIso,
      updated_at: currentTimeIso
    }
    store.payments.set(orderId, updatedPayment)
  }

  // Sync status back to inMemoryHoldsStore
  if (targetBookingId && inMemoryHoldsStore.has(targetBookingId)) {
    const hold = inMemoryHoldsStore.get(targetBookingId)!
    hold.status = updatedBookingStatus
    if (targetPaymentStatus === 'settlement') {
      hold.down_payment_idr = Math.round(grossAmountNum)
      hold.remaining_balance_idr = remainingBalance
      hold.hold_expires_at = ''
    }
  }

  return {
    success: true,
    statusCode: 200,
    message: 'Payment notification processed successfully.',
    isIdempotent: false,
    orderId,
    bookingId: targetBookingId,
    bookingCode: mockBookingRecord.booking_code,
    paymentStatus: targetPaymentStatus,
    bookingStatus: updatedBookingStatus,
    downPaymentIdr: Math.round(grossAmountNum),
    remainingBalanceIdr: remainingBalance,
    transactionId,
    notificationLogged: notificationInserted
  }
}
