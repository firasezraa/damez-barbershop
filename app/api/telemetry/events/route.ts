/**
 * DAMEZ BARBERSHOP - API ROUTE: TELEMETRY & CONVERSION FUNNEL
 * 
 * Endpoint:
 * - GET /api/telemetry/events: Mengembalikan data funnel, rasio no-show, dan analitik performa
 * - POST /api/telemetry/events: Menerima event telemetri client/server secara idempoten & aman
 */

import {
  trackTelemetryEvent,
  getFunnelMetrics,
  type TelemetryEventType
} from '../../../../lib/analytics/telemetry.ts';

function jsonResponse(body: any, status: number = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
      ...extraHeaders
    }
  });
}

const VALID_EVENT_TYPES: Set<string> = new Set([
  'page_view',
  'booking_cta_click',
  'step_service_selected',
  'step_barber_selected',
  'step_time_selected',
  'step_contact_filled',
  'booking_hold_created',
  'payment_initiated',
  'payment_settled',
  'booking_confirmed',
  'customer_arrived',
  'service_completed',
  'booking_no_show',
  'booking_cancelled',
  'booking_expired',
  'walk_in_created'
]);

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const timeRangeParam = searchParams.get('timeRange');
    const barberId = searchParams.get('barberId') || 'all';
    const date = searchParams.get('date') || undefined;

    let timeRange: 'today' | '7d' | '30d' | 'all' = '7d';
    if (timeRangeParam === 'today' || timeRangeParam === '7d' || timeRangeParam === '30d' || timeRangeParam === 'all') {
      timeRange = timeRangeParam;
    }

    const data = await getFunnelMetrics({
      timeRange,
      barberId,
      referenceDate: date
    });

    return jsonResponse({
      success: true,
      data
    }, 200);
  } catch (error: any) {
    return jsonResponse(
      { success: false, error: error.message || 'Gagal memproses kueri telemetri' },
      500
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        { success: false, error: 'Invalid JSON body payload' },
        400
      );
    }

    if (!body || typeof body !== 'object') {
      return jsonResponse(
        { success: false, error: 'Payload body must be a valid object' },
        400
      );
    }

    const { event_type, session_id, channel, device_type, barber_id, service_id, booking_code, amount, metadata } = body;

    if (!event_type || typeof event_type !== 'string' || !VALID_EVENT_TYPES.has(event_type)) {
      return jsonResponse(
        {
          success: false,
          error: `Invalid or missing event_type. Allowed: ${Array.from(VALID_EVENT_TYPES).join(', ')}`
        },
        400
      );
    }

    const recordedEvent = await trackTelemetryEvent({
      event_type: event_type as TelemetryEventType,
      session_id: session_id || 'anonymous-session',
      channel: channel || 'direct',
      device_type: device_type || 'mobile',
      barber_id,
      service_id,
      booking_code,
      amount: typeof amount === 'number' ? amount : undefined,
      metadata: typeof metadata === 'object' ? metadata : undefined
    });

    return jsonResponse(
      {
        success: true,
        message: 'Telemetry event recorded successfully',
        event_id: recordedEvent.id
      },
      201
    );
  } catch (error: any) {
    return jsonResponse(
      { success: false, error: error.message || 'Gagal menyimpan event telemetri' },
      500
    );
  }
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
