/**
 * DAMEZ BARBERSHOP - SCHEDULED ARRIVAL REMINDERS CRON ROUTE HANDLER
 * Next.js App Router Route: /api/cron/reminders
 * 
 * Dipanggil secara berkala (misal setiap 5 atau 10 menit via Vercel Cron,
 * pg_cron, GitHub Actions, atau internal scheduler) untuk memicu pengiriman
 * otomatis pengingat kedatangan H-2 Jam dan H-30 Menit ke WhatsApp pelanggan.
 */

import {
  dispatchUpcomingReminders,
  type ReminderDispatchResult
} from '../../../../lib/notifications/whatsapp.ts'

interface RemindersCronResponse {
  success: boolean
  timestamp: string
  scanned_count: number
  h2_dispatched: number
  h30m_dispatched: number
  latency_ms: number
  message: string
  errors?: string[]
}

function jsonResponse(body: RemindersCronResponse, status: number = 200): Response {
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
  const configuredSecret: string | undefined = process.env.CRON_SECRET

  // Di environment development atau testing dan secret belum di-set, izinkan
  if (!configuredSecret) {
    return true
  }

  // 1. Periksa Authorization: Bearer ***
  const authHeader: string | null = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token: string = authHeader.slice(7).trim()
    if (token === configuredSecret) {
      return true
    }
  }

  // 2. Periksa x-cron-secret header
  const customHeader: string | null = request.headers.get('x-cron-secret')
  if (customHeader && customHeader.trim() === configuredSecret) {
    return true
  }

  // 3. Periksa query parameter ?secret=
  try {
    const url: URL = new URL(request.url)
    const querySecret: string | null = url.searchParams.get('secret')
    if (querySecret && querySecret === configuredSecret) {
      return true
    }
  } catch {
    // Abaikan error parsing URL
  }

  return false
}

/**
 * POST /api/cron/reminders
 * Mengeksekusi penyisiran jadwal kedatangan H-2 dan H-30m
 */
export async function POST(request: Request): Promise<Response> {
  if (!isAuthorizedCronRequest(request)) {
    return jsonResponse(
      {
        success: false,
        timestamp: new Date().toISOString(),
        scanned_count: 0,
        h2_dispatched: 0,
        h30m_dispatched: 0,
        latency_ms: 0,
        message: 'Unauthorized: Invalid or missing cron secret authorization.'
      },
      401
    )
  }

  try {
    const result: ReminderDispatchResult = await dispatchUpcomingReminders()

    return jsonResponse({
      success: result.errors.length === 0,
      timestamp: result.timestamp,
      scanned_count: result.scannedCount,
      h2_dispatched: result.h2Dispatched,
      h30m_dispatched: result.h30mDispatched,
      latency_ms: result.latencyMs,
      message: `Penyisiran pengingat jadwal selesai: ${result.h2Dispatched} H-2 terkirim, ${result.h30mDispatched} H-30m terkirim.`,
      errors: result.errors.length > 0 ? result.errors : undefined
    })
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : String(error)
    return jsonResponse(
      {
        success: false,
        timestamp: new Date().toISOString(),
        scanned_count: 0,
        h2_dispatched: 0,
        h30m_dispatched: 0,
        latency_ms: 0,
        message: `Gagal mengeksekusi cron reminders: ${errorMessage}`,
        errors: [errorMessage]
      },
      500
    )
  }
}

/**
 * GET /api/cron/reminders
 * Dokumentasi endpoint & health check
 */
export async function GET(request: Request): Promise<Response> {
  const isAuthorized: boolean = isAuthorizedCronRequest(request)

  return new Response(
    JSON.stringify({
      service: 'Damez Barbershop WhatsApp Arrival Reminder Cron Worker',
      endpoint: '/api/cron/reminders',
      status: 'active',
      method_supported: ['GET', 'POST'],
      auth_required: Boolean(process.env.CRON_SECRET),
      caller_authorized: isAuthorized,
      description: 'Penyisiran terjadwal pengingat kedatangan H-2 Jam dan H-30 Menit ke WhatsApp pelanggan.',
      definition_of_done: 'Notifikasi otomatis terkirim pada jendela waktu kedatangan yang ditentukan.'
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
