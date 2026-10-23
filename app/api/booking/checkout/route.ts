/**
 * DAMEZ BARBERSHOP - BOOKING CHECKOUT API ROUTE
 * Next.js App Router Route Handler: /api/booking/checkout
 * 
 * Generates Midtrans Snap payment token for the Flat Rp 20.000 Down Payment (DP),
 * establishes 15-minute hold TTL, and registers pending transaction in payments table.
 */

import {
  createBookingSnapTransaction,
  FLAT_DOWN_PAYMENT_AMOUNT_IDR,
  DEFAULT_HOLD_TTL_MINUTES,
  type BookingCheckoutResult
} from '../../../../lib/payment/midtrans.ts'
import { getSupabaseClient } from '../../../../lib/supabase/client.ts'
import { isHoldExpired } from '../../../../lib/slots/auto-expire.ts'
import type { Database } from '../../../../types/database.types.ts'
import {
  globalRateLimiter,
  CHECKOUT_RATE_LIMIT_CONFIG,
  extractClientIp,
  createRateLimitResponse
} from '../../../../lib/security/rate-limit.ts'

type BookingRow = Database['public']['Tables']['bookings']['Row']

/**
 * Request payload interface for /api/booking/checkout
 */
export interface CheckoutRequestBody {
  booking_id: string
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  service_name?: string
  finish_url?: string
}

/**
 * Standard API JSON response structure
 */
export interface CheckoutApiResponse {
  success: boolean
  message?: string
  error?: string
  data?: {
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
}

/**
 * Helper to construct JSON response with proper headers
 */
function jsonResponse(
  body: CheckoutApiResponse,
  status: number = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
      ...extraHeaders
    }
  })
}

/**
 * Handles CORS Preflight
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Forwarded-For, cf-connecting-ip'
    }
  })
}

/**
 * GET Handler - Provides endpoint metadata and health info
 */
export async function GET(): Promise<Response> {
  return jsonResponse({
    success: true,
    message: 'Damez Barbershop Booking Checkout API. Send POST with booking_id to generate Snap token.',
    data: {
      token: '',
      redirect_url: '',
      order_id: '',
      gross_amount: FLAT_DOWN_PAYMENT_AMOUNT_IDR,
      booking_id: '',
      booking_code: '',
      customer_name: '',
      customer_phone: '',
      customer_email: null,
      expires_at: ''
    }
  })
}

/**
 * POST Handler - Creates Snap payment token for Down Payment
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Rate Limiting Defense (PRD: max 10 requests per minute per IP)
    const clientIp = extractClientIp(request)
    const ipRateLimit = globalRateLimiter.check(clientIp, CHECKOUT_RATE_LIMIT_CONFIG)
    if (!ipRateLimit.isAllowed) {
      return createRateLimitResponse(
        ipRateLimit,
        'Terlalu banyak permintaan checkout pembayaran dari alamat IP ini (Maksimal 10 request/menit). Harap tunggu beberapa saat.'
      )
    }

    let body: CheckoutRequestBody

    try {
      body = (await request.json()) as CheckoutRequestBody
    } catch {
      return jsonResponse(
        {
          success: false,
          error: 'Invalid JSON request payload.'
        },
        400,
        ipRateLimit.headers
      )
    }

    // Validate booking_id presence
    if (!body || !body.booking_id || typeof body.booking_id !== 'string' || body.booking_id.trim() === '') {
      return jsonResponse(
        {
          success: false,
          error: 'Field "booking_id" is required and must be a non-empty string.'
        },
        400
      )
    }

    const bookingId: string = body.booking_id.trim()
    const supabase = getSupabaseClient()

    let bookingCode: string = `DMZ-${Date.now().toString(36).toUpperCase()}`
    let customerName: string = (body.customer_name || 'Damez Customer').trim()
    let customerPhone: string = (body.customer_phone || '081234567890').trim()
    let customerEmail: string | null = body.customer_email ? body.customer_email.trim() : null
    let serviceName: string | undefined = body.service_name

    // If Supabase database connection is configured, fetch booking details & validate state
    if (supabase) {
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_code,
          customer_id,
          customer_name,
          customer_phone,
          customer_email,
          status,
          down_payment_idr,
          total_price_idr,
          hold_expires_at
        `)
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError) {
        return jsonResponse(
          {
            success: false,
            error: `Database query error: ${fetchError.message}`
          },
          500
        )
      }

      if (!booking) {
        return jsonResponse(
          {
            success: false,
            error: `Booking record with ID "${bookingId}" was not found.`
          },
          404
        )
      }

      const bookingRecord = booking as BookingRow

      // Enforce status guards
      if (
        bookingRecord.status === 'confirmed' ||
        bookingRecord.status === 'in_progress' ||
        bookingRecord.status === 'completed'
      ) {
        return jsonResponse(
          {
            success: false,
            error: `Booking "${bookingRecord.booking_code}" is already ${bookingRecord.status}. No down payment required.`
          },
          409
        )
      }

      if (bookingRecord.status === 'cancelled' || bookingRecord.status === 'expired') {
        return jsonResponse(
          {
            success: false,
            error: `Booking "${bookingRecord.booking_code}" is ${bookingRecord.status}. Please make a new reservation.`
          },
          410
        )
      }

      // Check if temporary hold TTL (15 minutes) has elapsed
      if (
        bookingRecord.status === 'pending_payment' &&
        bookingRecord.hold_expires_at &&
        isHoldExpired(bookingRecord.hold_expires_at)
      ) {
        // Mark booking as expired in database
        await supabase
          .from('bookings')
          .update({
            status: 'expired',
            cancelled_at: new Date().toISOString(),
            cancellation_reason: 'Payment hold expired (timeout > 15 minutes)',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId)

        return jsonResponse(
          {
            success: false,
            error: `Booking "${bookingRecord.booking_code}" hold has expired (> 15 minutes). Slot has been released.`
          },
          410
        )
      }

      // Populate verified metadata from database
      bookingCode = bookingRecord.booking_code
      customerName = bookingRecord.customer_name || customerName
      customerPhone = bookingRecord.customer_phone || customerPhone
      customerEmail = bookingRecord.customer_email || customerEmail
    }

    // Generate Snap token via Midtrans integration service
    const checkoutResult: BookingCheckoutResult = await createBookingSnapTransaction({
      booking_id: bookingId,
      booking_code: bookingCode,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      service_name: serviceName,
      finish_url: body.finish_url
    })

    // If Supabase is available, persist the payment record and update booking hold expiration
    if (supabase) {
      const { error: paymentInsertError } = await supabase.from('payments').insert({
        booking_id: bookingId,
        order_id: checkoutResult.order_id,
        snap_token: checkoutResult.token,
        snap_redirect_url: checkoutResult.redirect_url,
        payment_type: 'snap',
        gross_amount: checkoutResult.gross_amount,
        currency: 'IDR',
        transaction_status: 'pending',
        expires_at: checkoutResult.expires_at
      })

      if (paymentInsertError) {
        console.error(`[Checkout API] Failed to record payment in database: ${paymentInsertError.message}`)
      }

      // Update hold expiration time in bookings
      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({
          hold_expires_at: checkoutResult.expires_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (bookingUpdateError) {
        console.error(`[Checkout API] Failed to update booking hold expiration: ${bookingUpdateError.message}`)
      }
    }

    return jsonResponse(
      {
        success: true,
        message: `Snap token successfully generated for DP Flat Rp ${FLAT_DOWN_PAYMENT_AMOUNT_IDR.toLocaleString('id-ID')}.`,
        data: {
          token: checkoutResult.token,
          redirect_url: checkoutResult.redirect_url,
          order_id: checkoutResult.order_id,
          gross_amount: checkoutResult.gross_amount,
          booking_id: checkoutResult.booking_id,
          booking_code: checkoutResult.booking_code,
          customer_name: checkoutResult.customer_name,
          customer_phone: checkoutResult.customer_phone,
          customer_email: checkoutResult.customer_email,
          expires_at: checkoutResult.expires_at
        }
      },
      200,
      ipRateLimit.headers
    )
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : String(error)
    return jsonResponse(
      {
        success: false,
        error: `Checkout processing failed: ${message}`
      },
      500
    )
  }
}
