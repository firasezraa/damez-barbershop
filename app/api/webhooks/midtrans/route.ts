/**
 * DAMEZ BARBERSHOP - MIDTRANS WEBHOOK ROUTE HANDLER
 * Next.js App Router Route Handler: /api/webhooks/midtrans
 * 
 * Verifies Midtrans SHA-512 cryptographic signature, provides idempotency protection
 * for repeated settlement notifications, and executes atomic booking confirmation.
 */

import {
  processMidtransWebhook,
  type MidtransWebhookPayload,
  type WebhookProcessResult
} from '../../../../lib/payment/webhook.ts'
import { dispatchBookingConfirmedWhatsApp } from '../../../../lib/notifications/whatsapp.ts'
import { trackTelemetryEvent } from '../../../../lib/analytics/telemetry.ts'
import {
  globalRateLimiter,
  WEBHOOK_RATE_LIMIT_CONFIG,
  extractClientIp,
  createRateLimitResponse
} from '../../../../lib/security/rate-limit.ts'

/**
 * Handles CORS Preflight
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Signature'
    }
  })
}

/**
 * GET Handler - Endpoint Health Check & Documentation
 */
export async function GET(): Promise<Response> {
  return new Response(
    JSON.stringify({
      success: true,
      service: 'Damez Barbershop Midtrans Webhook Listener',
      endpoint: '/api/webhooks/midtrans',
      status: 'active',
      security: 'SHA-512 Signature Verification Enforced',
      idempotency: 'Full Idempotency Protection for Settlement & Replay Notifications',
      definition_of_done: 'Verifikasi signature lolos; webhook berulang tidak menduplikasi data.'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    }
  )
}

/**
 * POST Handler - Midtrans Notification Webhook Consumer
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Webhook Flooding Bot Protection (RFC 6585 Rate Limiting)
    const clientIp = extractClientIp(request)
    const ipRateLimit = globalRateLimiter.check(clientIp, WEBHOOK_RATE_LIMIT_CONFIG)
    if (!ipRateLimit.isAllowed) {
      return createRateLimitResponse(
        ipRateLimit,
        'Terlalu banyak permintaan webhook dari alamat IP ini. Harap kurangi frekuensi pengiriman.'
      )
    }

    let payload: MidtransWebhookPayload

    // Parse JSON safely
    try {
      payload = (await request.json()) as MidtransWebhookPayload
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          statusCode: 400,
          error: 'INVALID_JSON',
          message: 'Malformed request body: JSON parsing failed.'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      )
    }

    // Process notification through idempotent webhook engine
    const result: WebhookProcessResult = await processMidtransWebhook(payload)

    // Dispatch instant WhatsApp notification (< 5s SLA) for newly settled booking
    if (result.success && result.paymentStatus === 'settlement' && !result.isIdempotent && result.bookingId) {
      try {
        await dispatchBookingConfirmedWhatsApp(result.bookingId)
      } catch (waError: unknown) {
        console.error('[Webhook] WhatsApp notification dispatch warning:', waError)
      }

      // Telemetri: Pembayaran DP sukses diverifikasi
      trackTelemetryEvent({
        event_type: 'payment_settled',
        amount: 20000
      }).catch(() => {});
    }

    return new Response(JSON.stringify(result), {
      status: result.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : String(error)
    console.error(`[Webhook Handler Error] Unhandled exception: ${errorMessage}`)

    return new Response(
      JSON.stringify({
        success: false,
        statusCode: 500,
        error: 'INTERNAL_SERVER_ERROR',
        message: `Unhandled server error in Midtrans webhook: ${errorMessage}`
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  }
}
