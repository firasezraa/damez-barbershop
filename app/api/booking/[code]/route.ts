/**
 * DAMEZ BARBERSHOP - BOOKING DETAILS API ROUTE
 * Next.js App Router Route Handler: /api/booking/[code]
 * 
 * Mengambil detail lengkap reservasi berdasarkan kode booking unik atau UUID,
 * termasuk data master barber, rincian layanan, status pembayaran, countdown hold,
 * dan kalkulasi sisa pelunasan di tempat.
 */

import { getSupabaseClient } from '../../../../lib/supabase/client.ts'
import {
  checkBookingHoldStatus,
  inMemoryHoldsStore,
  getRemainingHoldTime,
  isHoldExpired,
  type SlotHoldRecord
} from '../../../../lib/slots/auto-expire.ts'
import { BOOKING_BARBERS, BOOKING_SERVICES } from '../../../../components/booking/constants.ts'
import type { Database } from '../../../../types/database.types.ts'

type BookingRow = Database['public']['Tables']['bookings']['Row']

export interface BookingDetailResponse {
  success: boolean
  message?: string
  error?: string
  data?: {
    id: string
    booking_code: string
    customer_name: string
    customer_phone: string
    customer_email: string | null
    barber_id: string
    barber: {
      id: string
      code: string
      name: string
      nickname: string
      title: string
      chair_number: number
      avatar_url?: string
    }
    booking_date: string
    start_time: string
    end_time: string
    service_duration_minutes: number
    services: Array<{
      id: string
      name: string
      duration_minutes: number
      price_idr: number
    }>
    total_price_idr: number
    down_payment_idr: number
    remaining_balance_idr: number
    status: string
    hold_expires_at: string | null
    is_expired: boolean
    remaining_seconds: number
    remaining_formatted: string
    confirmed_at: string | null
    notes: string | null
  }
}

function jsonResponse(
  body: BookingDetailResponse,
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
 * GET Handler - Mengambil detail lengkap reservasi
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
): Promise<Response> {
  try {
    const { code } = await params
    const identifier = (code || '').trim()

    if (!identifier) {
      return jsonResponse(
        {
          success: false,
          error: 'Parameter kode booking atau ID wajib disertakan.'
        },
        400
      )
    }

    const supabase = getSupabaseClient()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)

    let foundBooking: BookingRow | SlotHoldRecord | null = null
    let fetchedServices: Array<{ id: string; name: string; duration_minutes: number; price_idr: number }> = []

    // 1. Cek di Supabase jika klien aktif
    if (supabase) {
      try {
        const query = supabase
          .from('bookings')
          .select(`
            *,
            barbers (*),
            booking_services (
              service_id,
              services (*)
            )
          `)

        const { data, error } = await (isUuid
          ? query.eq('id', identifier)
          : query.eq('booking_code', identifier)
        ).maybeSingle()

        if (!error && data) {
          const rawBooking = data as any
          foundBooking = rawBooking as BookingRow

          if (rawBooking.booking_services && Array.isArray(rawBooking.booking_services)) {
            fetchedServices = rawBooking.booking_services
              .map((bs: any) => {
                const s = bs.services
                if (!s) return null
                return {
                  id: s.id,
                  name: s.name,
                  duration_minutes: s.duration_minutes,
                  price_idr: s.price_idr
                }
              })
              .filter(Boolean)
          }
        }
      } catch (dbErr) {
        console.warn('[API Booking] Supabase query fallback:', dbErr)
      }
    }

    // 2. Cek di In-Memory Store jika belum ditemukan
    if (!foundBooking) {
      for (const [_, record] of inMemoryHoldsStore.entries()) {
        if (record.id === identifier || record.booking_code === identifier) {
          foundBooking = record
          break
        }
      }
    }

    // 3. Fallback jika masih belum ada
    if (!foundBooking) {
      return jsonResponse(
        {
          success: false,
          error: `Reservasi dengan kode "${identifier}" tidak ditemukan.`
        },
        404
      )
    }

    // 4. Resolve Barber Details
    const targetBarberId = foundBooking.barber_id
    const matchedBarber = BOOKING_BARBERS.find((b) => b.id === targetBarberId) || {
      id: targetBarberId || 'b0000001-0000-0000-0000-000000000001',
      code: 'BBR-01',
      name: 'Rian Pratama',
      nickname: 'The Sculptor',
      title: 'Senior Master Barber',
      chairNumber: 1,
      avatarUrl: '/images/barbers/rian-pratama.webp'
    }

    // 5. Fallback Services jika tidak terisi dari DB
    if (fetchedServices.length === 0) {
      fetchedServices = [
        {
          id: BOOKING_SERVICES[0].id,
          name: BOOKING_SERVICES[0].name,
          duration_minutes: BOOKING_SERVICES[0].durationMinutes,
          price_idr: BOOKING_SERVICES[0].price
        }
      ]
    }

    // 6. Evaluasi Countdown dan Status Expired
    const now = new Date()
    const holdRemaining = getRemainingHoldTime(foundBooking.hold_expires_at, now)
    const isExpired =
      foundBooking.status === 'expired' ||
      (foundBooking.status === 'pending_payment' && isHoldExpired(foundBooking.hold_expires_at, now))

    return jsonResponse({
      success: true,
      data: {
        id: foundBooking.id,
        booking_code: foundBooking.booking_code,
        customer_name: foundBooking.customer_name,
        customer_phone: foundBooking.customer_phone,
        customer_email: foundBooking.customer_email || null,
        barber_id: foundBooking.barber_id,
        barber: {
          id: matchedBarber.id,
          code: matchedBarber.code,
          name: matchedBarber.name,
          nickname: matchedBarber.nickname,
          title: matchedBarber.title,
          chair_number: matchedBarber.chairNumber,
          avatar_url: matchedBarber.avatarUrl
        },
        booking_date: foundBooking.booking_date,
        start_time: foundBooking.start_time,
        end_time: foundBooking.end_time,
        service_duration_minutes: foundBooking.service_duration_minutes,
        services: fetchedServices,
        total_price_idr: foundBooking.total_price_idr,
        down_payment_idr: foundBooking.down_payment_idr,
        remaining_balance_idr: foundBooking.remaining_balance_idr,
        status: isExpired ? 'expired' : foundBooking.status,
        hold_expires_at: foundBooking.hold_expires_at,
        is_expired: isExpired,
        remaining_seconds: isExpired ? 0 : holdRemaining.seconds,
        remaining_formatted: isExpired ? '00:00' : holdRemaining.formatted,
        confirmed_at: (foundBooking as any).confirmed_at || null,
        notes: (foundBooking as any).notes || null
      }
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return jsonResponse(
      {
        success: false,
        error: `Gagal memuat detail reservasi: ${msg}`
      },
      500
    )
  }
}

/**
 * POST Handler - Simulasi Pembayaran / Dev Demo Confirm
 * Berguna untuk testing alur pembayaran Snap/QRIS di lingkungan lokal atau automated tests.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
): Promise<Response> {
  try {
    const { code } = await params
    const identifier = (code || '').trim()

    if (!identifier) {
      return jsonResponse(
        {
          success: false,
          error: 'Parameter kode booking wajib disertakan.'
        },
        400
      )
    }

    const nowIso = new Date().toISOString()
    const supabase = getSupabaseClient()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)

    // Update in Supabase if connected
    if (supabase) {
      const query = supabase.from('bookings').update({
        status: 'confirmed',
        confirmed_at: nowIso,
        down_payment_idr: 20000,
        hold_expires_at: null,
        updated_at: nowIso
      })

      const { data, error } = await (isUuid
        ? query.eq('id', identifier)
        : query.eq('booking_code', identifier)
      ).select().maybeSingle()

      if (!error && data) {
        return jsonResponse({
          success: true,
          message: 'Simulasi pembayaran sukses. Reservasi terkonfirmasi.',
          data: {
            id: data.id,
            booking_code: data.booking_code,
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            customer_email: data.customer_email,
            barber_id: data.barber_id,
            barber: {
              id: data.barber_id,
              code: 'BBR-01',
              name: 'Rian Pratama',
              nickname: 'The Sculptor',
              title: 'Senior Master Barber',
              chair_number: 1
            },
            booking_date: data.booking_date,
            start_time: data.start_time,
            end_time: data.end_time,
            service_duration_minutes: data.service_duration_minutes,
            services: [
              {
                id: BOOKING_SERVICES[0].id,
                name: BOOKING_SERVICES[0].name,
                duration_minutes: BOOKING_SERVICES[0].durationMinutes,
                price_idr: BOOKING_SERVICES[0].price
              }
            ],
            total_price_idr: data.total_price_idr,
            down_payment_idr: 20000,
            remaining_balance_idr: data.total_price_idr - 20000,
            status: 'confirmed',
            hold_expires_at: null,
            is_expired: false,
            remaining_seconds: 0,
            remaining_formatted: '00:00',
            confirmed_at: nowIso,
            notes: data.notes
          }
        })
      }
    }

    // Update in inMemoryHoldsStore
    for (const [id, record] of inMemoryHoldsStore.entries()) {
      if (record.id === identifier || record.booking_code === identifier) {
        const updatedRecord: SlotHoldRecord = {
          ...record,
          status: 'confirmed',
          down_payment_idr: 20000,
          remaining_balance_idr: Math.max(0, record.total_price_idr - 20000),
          hold_expires_at: ''
        }
        inMemoryHoldsStore.set(id, updatedRecord)

        const matchedBarber = BOOKING_BARBERS.find((b) => b.id === record.barber_id) || {
          id: record.barber_id,
          code: 'BBR-01',
          name: 'Rian Pratama',
          nickname: 'The Sculptor',
          title: 'Senior Master Barber',
          chairNumber: 1
        }

        return jsonResponse({
          success: true,
          message: 'Simulasi pembayaran sukses. Reservasi terkonfirmasi.',
          data: {
            id: updatedRecord.id,
            booking_code: updatedRecord.booking_code,
            customer_name: updatedRecord.customer_name,
            customer_phone: updatedRecord.customer_phone,
            customer_email: updatedRecord.customer_email,
            barber_id: updatedRecord.barber_id,
            barber: {
              id: matchedBarber.id,
              code: matchedBarber.code,
              name: matchedBarber.name,
              nickname: matchedBarber.nickname,
              title: matchedBarber.title,
              chair_number: matchedBarber.chairNumber
            },
            booking_date: updatedRecord.booking_date,
            start_time: updatedRecord.start_time,
            end_time: updatedRecord.end_time,
            service_duration_minutes: updatedRecord.service_duration_minutes,
            services: [
              {
                id: BOOKING_SERVICES[0].id,
                name: BOOKING_SERVICES[0].name,
                duration_minutes: BOOKING_SERVICES[0].durationMinutes,
                price_idr: BOOKING_SERVICES[0].price
              }
            ],
            total_price_idr: updatedRecord.total_price_idr,
            down_payment_idr: 20000,
            remaining_balance_idr: updatedRecord.remaining_balance_idr,
            status: 'confirmed',
            hold_expires_at: null,
            is_expired: false,
            remaining_seconds: 0,
            remaining_formatted: '00:00',
            confirmed_at: nowIso,
            notes: null
          }
        })
      }
    }

    return jsonResponse(
      {
        success: false,
        error: `Reservasi dengan kode "${identifier}" tidak ditemukan untuk konfirmasi pembayaran.`
      },
      404
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return jsonResponse(
      {
        success: false,
        error: `Gagal memproses konfirmasi simulasi: ${msg}`
      },
      500
    )
  }
}
