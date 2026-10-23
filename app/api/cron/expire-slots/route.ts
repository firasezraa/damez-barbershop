/**
 * DAMEZ BARBERSHOP - SCHEDULED AUTO-EXPIRE CRON ROUTE HANDLER
 * Next.js App Router Route: /api/cron/expire-slots
 * 
 * Endpoint ini dipanggil secara berkala (misal setiap 1 menit via Vercel Cron,
 * pg_cron, GitHub Actions, atau external monitoring ping) untuk menyapu dan
 * melepaskan slot hold 'pending_payment' yang telah melewati TTL 15 menit.
 */

import { releaseExpiredSlotHolds } from '../../../../lib/slots/auto-expire.ts'
import { timingSafeEqualString } from '../../../../lib/payment/webhook.ts'

interface CronApiResponse {
  success: boolean
  timestamp: string
  expired_count: number
  released_booking_codes?: string[]
  message: string
  error?: string
}

function jsonResponse(body: CronApiResponse, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    }
  })
}

/**
 * Memvalidasi otorisasi request cron melalui header atau query parameter
 */
function isAuthorizedCronRequest(request: Request): boolean {
  const configuredSecret = process.env.CRON_SECRET

  // Di environment production, CRON_SECRET wajib dikonfigurasi
  if (!configuredSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Security Alert] CRON_SECRET is required in production mode!')
      return false
    }
    return true
  }

  // 1. Periksa Authorization: Bearer ***
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    if (timingSafeEqualString(token, configuredSecret)) {
      return true
    }
  }

  // 2. Periksa x-cron-secret header
  const customHeader = request.headers.get('x-cron-secret')
  if (customHeader && timingSafeEqualString(customHeader.trim(), configuredSecret)) {
    return true
  }

  // 3. Periksa query parameter ?secret=
  try {
    const url = new URL(request.url)
    const querySecret = url.searchParams.get('secret')
    if (querySecret && timingSafeEqualString(querySecret, configuredSecret)) {
      return true
    }
  } catch {
    // Ignore URL parse failure
  }

  return false
}

/**
 * GET Handler - Mendukung trigger cron berbasis HTTP GET (misal Vercel Cron default)
 */
export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCronRequest(request)) {
    return jsonResponse(
      {
        success: false,
        timestamp: new Date().toISOString(),
        expired_count: 0,
        message: 'Unauthorized cron request. Invalid or missing CRON_SECRET.',
        error: 'UNAUTHORIZED'
      },
      401
    )
  }

  try {
    const sweepResult = await releaseExpiredSlotHolds()

    return jsonResponse({
      success: true,
      timestamp: new Date().toISOString(),
      expired_count: sweepResult.expired_count,
      released_booking_codes: sweepResult.released_booking_codes,
      message: `Auto-expire sweep completed. ${sweepResult.expired_count} expired hold(s) released.`
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return jsonResponse(
      {
        success: false,
        timestamp: new Date().toISOString(),
        expired_count: 0,
        message: `Failed to execute slot auto-expire sweep: ${msg}`,
        error: 'INTERNAL_SERVER_ERROR'
      },
      500
    )
  }
}

/**
 * POST Handler - Mendukung trigger webhook / worker manual via HTTP POST
 */
export async function POST(request: Request): Promise<Response> {
  return GET(request)
}
