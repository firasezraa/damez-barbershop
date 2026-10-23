/**
 * DAMEZ BARBERSHOP - BOOKING SLOT HOLD API ROUTE
 * Next.js App Router Route Handler: /api/booking/hold
 * 
 * Mengunci slot reservasi sementara (temporary hold) dengan status pending_payment
 * dan TTL presisi 15 menit. Mencegah race condition dan double booking.
 */

import {
  createTemporarySlotHold,
  checkBookingHoldStatus,
  HOLD_TTL_MINUTES,
  HOLD_TTL_SECONDS,
  type CreateSlotHoldParams
} from '../../../../lib/slots/auto-expire.ts'
import {
  globalRateLimiter,
  BOOKING_RATE_LIMIT_CONFIG,
  PHONE_RATE_LIMIT_CONFIG,
  extractClientIp,
  createRateLimitResponse
} from '../../../../lib/security/rate-limit.ts'
import {
  detectSpamBot,
  validateAndNormalizeIndonesianPhone,
  sanitizeCustomerName,
  checkActiveHoldsLimit
} from '../../../../lib/security/bot-protection.ts'
import {
  verifyAndCalculateBookingPrice,
  FLAT_DOWN_PAYMENT_AMOUNT_IDR
} from '../../../../lib/security/price-calculator.ts'
import { trackTelemetryEvent } from '../../../../lib/analytics/telemetry.ts'

interface HoldApiResponse {
  success: boolean
  message?: string
  error?: string
  data?: any
}

function jsonResponse(
  body: HoldApiResponse,
  status: number = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
      ...extraHeaders
    }
  })
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}

/**
 * GET Handler - Memeriksa status dan sisa waktu hold booking
 * Usage: /api/booking/hold?code=DMZ-20261024-XXXX atau ?id=UUID
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code') || url.searchParams.get('id')

    if (!code) {
      return jsonResponse(
        {
          success: false,
          error: 'Parameter "code" atau "id" wajib disertakan.'
        },
        400
      )
    }

    const statusResult = await checkBookingHoldStatus(code)

    if (!statusResult.found) {
      return jsonResponse(
        {
          success: false,
          error: `Booking dengan ID atau kode "${code}" tidak ditemukan.`
        },
        404
      )
    }

    return jsonResponse({
      success: true,
      data: {
        status: statusResult.status,
        is_expired: statusResult.isExpired,
        remaining_seconds: statusResult.remainingSeconds,
        remaining_formatted: statusResult.remainingFormatted,
        hold_expires_at: statusResult.booking?.hold_expires_at,
        booking_code: statusResult.booking?.booking_code,
        booking_id: statusResult.booking?.id,
        booking: statusResult.booking || null
      }
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return jsonResponse(
      {
        success: false,
        error: `Gagal memeriksa status hold: ${msg}`
      },
      500
    )
  }
}

/**
 * POST Handler - Mengunci slot secara sementara dengan TTL 15 menit & Proteksi Keamanan Penuh
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // 1. IP RATE LIMITING DEFENSE (PRD: max 10 requests per minute per IP)
    const clientIp = extractClientIp(request)
    const ipRateLimit = globalRateLimiter.check(clientIp, BOOKING_RATE_LIMIT_CONFIG)
    if (!ipRateLimit.isAllowed) {
      return createRateLimitResponse(
        ipRateLimit,
        'Terlalu banyak permintaan reservasi dari alamat IP ini (Maksimal 10 request/menit). Harap tunggu beberapa saat.'
      )
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return jsonResponse(
        {
          success: false,
          error: 'Payload JSON tidak valid.'
        },
        400,
        ipRateLimit.headers
      )
    }

    // 2. BOT & SPAM HONEYPOT PROTECTION
    const botCheck = detectSpamBot(body)
    if (botCheck.isBot) {
      return jsonResponse(
        {
          success: false,
          error: 'Permintaan ditolak oleh filter keamanan (Bot/Spam detected).'
        },
        400,
        ipRateLimit.headers
      )
    }

    // 3. PARAMETER EXISTENCE VALIDATION
    const {
      barber_id,
      booking_date,
      start_time,
      end_time,
      service_duration_minutes,
      total_price_idr,
      down_payment_idr,
      customer_name,
      customer_phone,
      customer_email,
      service_ids,
      notes
    } = body

    if (!barber_id || !booking_date || !start_time || !end_time || !customer_name || !customer_phone) {
      return jsonResponse(
        {
          success: false,
          error: 'Field barber_id, booking_date, start_time, end_time, customer_name, dan customer_phone wajib diisi.'
        },
        400,
        ipRateLimit.headers
      )
    }

    // 4. PHONE NUMBER FORMAT VALIDATION & NORMALIZATION (Strict Indonesian Mobile)
    const phoneCheck = validateAndNormalizeIndonesianPhone(String(customer_phone))
    if (!phoneCheck.isValid) {
      return jsonResponse(
        {
          success: false,
          error: phoneCheck.error || 'Format nomor WhatsApp tidak valid.'
        },
        400,
        ipRateLimit.headers
      )
    }
    const normalizedPhone = phoneCheck.normalizedPhone

    // 5. PHONE-BASED RATE LIMITING (Max 5 holds per 5 minutes per phone)
    const phoneRateLimit = globalRateLimiter.check(normalizedPhone, PHONE_RATE_LIMIT_CONFIG)
    if (!phoneRateLimit.isAllowed) {
      return createRateLimitResponse(
        phoneRateLimit,
        'Terlalu banyak permintaan reservasi dari nomor WhatsApp ini. Silakan tunggu 5 menit sebelum memesan kembali.'
      )
    }

    // 6. ANTI-HOARDING / DENIAL-OF-INVENTORY DEFENSE (Max 2 simultaneous unpaid holds)
    const hoardingCheck = await checkActiveHoldsLimit(normalizedPhone, 2)
    if (!hoardingCheck.allowed) {
      return jsonResponse(
        {
          success: false,
          error: hoardingCheck.message || 'Batas maksimal hold aktif tercapai.'
        },
        429,
        ipRateLimit.headers
      )
    }

    // 7. CUSTOMER NAME SANITIZATION
    const nameCheck = sanitizeCustomerName(String(customer_name))
    if (!nameCheck.isValid) {
      return jsonResponse(
        {
          success: false,
          error: nameCheck.error || 'Nama pelanggan tidak valid.'
        },
        400,
        ipRateLimit.headers
      )
    }
    const sanitizedCustomerName = nameCheck.sanitizedName

    // 8. AUTHORITATIVE PRICE & DOWN PAYMENT CALCULATION (Anti-Tampering)
    const priceCalculation = await verifyAndCalculateBookingPrice({
      serviceIds: Array.isArray(service_ids) ? service_ids : [],
      clientTotalPrice: typeof total_price_idr === 'number' ? total_price_idr : null,
      clientDownPayment: typeof down_payment_idr === 'number' ? down_payment_idr : null,
      defaultDurationMinutes: typeof service_duration_minutes === 'number' ? service_duration_minutes : 45
    })

    // 9. ATOMIC TEMPORARY SLOT HOLD (With Application Concurrency Lock & DB Constraints)
    const holdParams: CreateSlotHoldParams = {
      barberId: barber_id,
      bookingDate: booking_date,
      startTime: start_time,
      endTime: end_time,
      serviceDurationMinutes: priceCalculation.authoritativeDurationMinutes,
      totalPriceIdr: priceCalculation.authoritativeTotalPrice,
      downPaymentIdr: FLAT_DOWN_PAYMENT_AMOUNT_IDR, // Strictly locked to Rp 20.000
      customerName: sanitizedCustomerName,
      customerPhone: normalizedPhone,
      customerEmail: customer_email ? String(customer_email).trim() : null,
      serviceIds: Array.isArray(service_ids) ? service_ids : [],
      notes: notes ? String(notes).trim().slice(0, 500) : undefined
    }

    const result = await createTemporarySlotHold(holdParams)

    if (!result.success) {
      const statusCode = result.errorCode === 'SLOT_ALREADY_LOCKED' ? 409 : 400
      return jsonResponse(
        {
          success: false,
          error: result.error || 'Gagal mengunci slot.'
        },
        statusCode,
        ipRateLimit.headers
      )
    }

    // Dispatch telemetri booking hold
    trackTelemetryEvent({
      event_type: 'booking_hold_created',
      barber_id: result.booking?.barber_id,
      booking_code: result.booking?.booking_code,
      amount: result.booking?.down_payment_idr
    }).catch(() => {});

    return jsonResponse(
      {
        success: true,
        message: `Slot berhasil dikunci sementara selama ${HOLD_TTL_MINUTES} menit (pending_payment).`,
        data: {
          booking_id: result.booking?.id,
          booking_code: result.booking?.booking_code,
          status: result.booking?.status,
          hold_expires_at: result.holdExpiresAt,
          expires_in_seconds: result.expiresInSeconds || HOLD_TTL_SECONDS,
          barber_id: result.booking?.barber_id,
          booking_date: result.booking?.booking_date,
          start_time: result.booking?.start_time,
          end_time: result.booking?.end_time,
          total_price_idr: result.booking?.total_price_idr,
          down_payment_idr: result.booking?.down_payment_idr,
          remaining_balance_idr: result.booking?.remaining_balance_idr,
          customer_name: result.booking?.customer_name,
          customer_phone: result.booking?.customer_phone
        }
      },
      201,
      ipRateLimit.headers
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return jsonResponse(
      {
        success: false,
        error: `Pemrosesan hold gagal: ${msg}`
      },
      500
    )
  }
}
