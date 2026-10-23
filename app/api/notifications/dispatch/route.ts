/**
 * DAMEZ BARBERSHOP - NOTIFICATION DISPATCH ROUTE HANDLER
 * Next.js App Router Route: /api/notifications/dispatch
 * 
 * Endpoint untuk memicu pengiriman pesan WhatsApp secara programmatic
 * (misal dari admin dashboard atau integrasi modul internal).
 */

import {
  sendWhatsAppMessage,
  renderWhatsAppTemplate,
  dispatchBookingConfirmedWhatsApp,
  getWhatsAppConfig,
  type TemplateKey,
  type WhatsAppSendResult,
  type WhatsAppGatewayConfig
} from '../../../../lib/notifications/whatsapp.ts'

export interface NotificationDispatchRequest {
  action?: 'instant_confirm' | 'send_template' | 'direct_message'
  booking_id?: string
  recipient_phone?: string
  template_name?: TemplateKey
  variables?: Record<string, string | number>
  message?: string
}

export async function POST(request: Request): Promise<Response> {
  try {
    let body: NotificationDispatchRequest
    try {
      body = (await request.json()) as NotificationDispatchRequest
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          statusCode: 400,
          error: 'INVALID_JSON',
          message: 'Malformed request body: JSON parsing failed.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 1. Action: instant_confirm (dispatches customer & barber notifications for booking)
    if (body.action === 'instant_confirm' || (body.booking_id && !body.action)) {
      if (!body.booking_id) {
        return new Response(
          JSON.stringify({
            success: false,
            statusCode: 400,
            error: 'MISSING_BOOKING_ID',
            message: 'booking_id is required for instant_confirm action.'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const result = await dispatchBookingConfirmedWhatsApp(body.booking_id)
      if (!result) {
        return new Response(
          JSON.stringify({
            success: false,
            statusCode: 404,
            error: 'BOOKING_NOT_FOUND',
            message: `Booking with ID ${body.booking_id} not found or could not be processed.`
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: result.success,
          statusCode: result.success ? 200 : 502,
          data: result
        }),
        {
          status: result.success ? 200 : 502,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 2. Action: send_template
    if (body.action === 'send_template') {
      if (!body.recipient_phone || !body.template_name) {
        return new Response(
          JSON.stringify({
            success: false,
            statusCode: 400,
            error: 'MISSING_FIELDS',
            message: 'recipient_phone and template_name are required.'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const renderedMessage: string = renderWhatsAppTemplate(
        body.template_name,
        body.variables || {}
      )

      const result: WhatsAppSendResult = await sendWhatsAppMessage({
        recipientPhone: body.recipient_phone,
        message: renderedMessage,
        templateName: body.template_name,
        bookingId: body.booking_id
      })

      return new Response(
        JSON.stringify({
          success: result.success,
          statusCode: result.success ? 200 : 502,
          data: result
        }),
        {
          status: result.success ? 200 : 502,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 3. Action: direct_message
    if (body.action === 'direct_message') {
      if (!body.recipient_phone || !body.message) {
        return new Response(
          JSON.stringify({
            success: false,
            statusCode: 400,
            error: 'MISSING_FIELDS',
            message: 'recipient_phone and message are required.'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const result: WhatsAppSendResult = await sendWhatsAppMessage({
        recipientPhone: body.recipient_phone,
        message: body.message,
        bookingId: body.booking_id
      })

      return new Response(
        JSON.stringify({
          success: result.success,
          statusCode: result.success ? 200 : 502,
          data: result
        }),
        {
          status: result.success ? 200 : 502,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        statusCode: 400,
        error: 'INVALID_ACTION',
        message: 'Unknown or unsupported action. Supported: instant_confirm, send_template, direct_message.'
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const errorMsg: string = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({
        success: false,
        statusCode: 500,
        error: 'INTERNAL_SERVER_ERROR',
        message: errorMsg
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function GET(): Promise<Response> {
  const config: WhatsAppGatewayConfig = getWhatsAppConfig()

  return new Response(
    JSON.stringify({
      service: 'Damez Barbershop WhatsApp Notification Dispatcher',
      endpoint: '/api/notifications/dispatch',
      status: 'active',
      provider: config.provider,
      is_mock: config.isMock,
      timeout_ms: config.timeoutMs,
      supported_gateways: ['fonnte', 'wablas', 'mock'],
      anti_emoji_policy: true,
      sla_seconds: 5
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
