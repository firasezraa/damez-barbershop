/**
 * DAMEZ BARBERSHOP - SLOT TEMPORARY LOCKING & AUTO-EXPIRE ENGINE
 * 
 * Modul inti untuk:
 * 1. Penguncian slot sementara (temporary hold) saat customer memilih slot
 * 2. Penetapan TTL presisi 15 menit (900 detik) untuk status 'pending_payment'
 * 3. Mesin pemeriksa dan pelepasan otomatis slot expired jika pembayaran tidak tuntas
 * 4. Integrasi dengan Supabase RPC, Cron Route Handler, dan background worker
 */

import { getSupabaseClient } from '../supabase/client.ts'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database.types.ts'
import { slotMutex, buildSlotLockKey } from '../security/concurrency-lock.ts'

// Konstanta Kebijakan Bisnis Damez Barbershop
export const HOLD_TTL_MINUTES: number = 15
export const HOLD_TTL_SECONDS: number = HOLD_TTL_MINUTES * 60 // 900 detik

export interface HoldCalculationResult {
  expiresAt: Date
  expiresAtIso: string
  ttlMinutes: number
  ttlSeconds: number
}

export interface RemainingHoldTimeResult {
  seconds: number
  formatted: string
  isExpired: boolean
}

export interface CreateSlotHoldParams {
  barberId: string
  bookingDate: string // YYYY-MM-DD
  startTime: string   // ISO 8601 string
  endTime: string     // ISO 8601 string
  serviceDurationMinutes: number
  bufferMinutes?: number
  totalPriceIdr: number
  downPaymentIdr?: number
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  serviceIds?: string[]
  notes?: string
  now?: Date
}

export interface SlotHoldRecord {
  id: string
  booking_code: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  barber_id: string
  booking_date: string
  start_time: string
  end_time: string
  service_duration_minutes: number
  buffer_minutes: number
  total_price_idr: number
  down_payment_idr: number
  remaining_balance_idr: number
  status: 'pending_payment' | 'confirmed' | 'in_progress' | 'completed' | 'no_show' | 'rescheduled' | 'cancelled' | 'expired'
  hold_expires_at: string
  created_at: string
}

export interface CreateSlotHoldResult {
  success: boolean
  booking?: SlotHoldRecord
  holdExpiresAt?: string
  expiresInSeconds?: number
  error?: string
  errorCode?: 'SLOT_ALREADY_LOCKED' | 'INVALID_TIME' | 'DATABASE_ERROR' | 'VALIDATION_ERROR'
}

export interface ReleaseExpiredHoldsResult {
  success: boolean
  expired_count: number
  released_booking_codes: string[]
  released_booking_ids: string[]
  error?: string
}

// In-memory store untuk lingkungan offline, testing & mocking
export const inMemoryHoldsStore: Map<string, SlotHoldRecord> = new Map()

/**
 * Menghitung batas waktu kedaluwarsa 15 menit dari waktu acuan.
 */
export function calculateHoldExpiry(currentTime?: Date): HoldCalculationResult {
  const baseTime: Date = currentTime ? new Date(currentTime) : new Date()
  const expiresAt: Date = new Date(baseTime.getTime() + HOLD_TTL_SECONDS * 1000)

  return {
    expiresAt,
    expiresAtIso: expiresAt.toISOString(),
    ttlMinutes: HOLD_TTL_MINUTES,
    ttlSeconds: HOLD_TTL_SECONDS
  }
}

/**
 * Mengecek apakah suatu hold telah kedaluwarsa berdasarkan timestamp ISO.
 */
export function isHoldExpired(
  holdExpiresAt: string | Date | null | undefined,
  currentTime?: Date
): boolean {
  if (!holdExpiresAt) {
    return true
  }

  const expireTimeMs: number = new Date(holdExpiresAt).getTime()
  if (isNaN(expireTimeMs)) {
    return true
  }

  const nowMs: number = (currentTime ? new Date(currentTime) : new Date()).getTime()
  return nowMs >= expireTimeMs
}

/**
 * Menghitung sisa waktu hold dalam detik dan format menit:detik ("MM:SS").
 */
export function getRemainingHoldTime(
  holdExpiresAt: string | Date | null | undefined,
  currentTime?: Date
): RemainingHoldTimeResult {
  if (!holdExpiresAt) {
    return { seconds: 0, formatted: '00:00', isExpired: true }
  }

  const expireTimeMs: number = new Date(holdExpiresAt).getTime()
  if (isNaN(expireTimeMs)) {
    return { seconds: 0, formatted: '00:00', isExpired: true }
  }

  const nowMs: number = (currentTime ? new Date(currentTime) : new Date()).getTime()
  const diffSeconds: number = Math.round((expireTimeMs - nowMs) / 1000)

  if (diffSeconds <= 0) {
    return { seconds: 0, formatted: '00:00', isExpired: true }
  }

  const mins: number = Math.floor(diffSeconds / 60)
  const secs: number = diffSeconds % 60
  const formatted: string = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return {
    seconds: diffSeconds,
    formatted,
    isExpired: false
  }
}

function parseTimeToEpoch(val: string | Date): number {
  if (val instanceof Date) return val.getTime()
  if (typeof val === 'string') {
    if (val.includes('T') || val.includes('-')) {
      const d = new Date(val)
      if (!isNaN(d.getTime())) return d.getTime()
    }
    const match = val.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
    if (match) {
      return new Date(`2000-01-01T${match[1].padStart(2, '0')}:${match[2]}:${match[3] || '00'}+07:00`).getTime()
    }
  }
  return new Date(val).getTime()
}

/**
 * Memeriksa apakah interval waktu [startA, endA) tumpang tindih dengan [startB, endB).
 */
function areTimeRangesOverlapping(
  startA: string | Date,
  endA: string | Date,
  startB: string | Date,
  endB: string | Date
): boolean {
  const aStart: number = parseTimeToEpoch(startA)
  const aEnd: number = parseTimeToEpoch(endA)
  const bStart: number = parseTimeToEpoch(startB)
  const bEnd: number = parseTimeToEpoch(endB)

  return aStart < bEnd && aEnd > bStart
}

/**
 * Mengunci slot reservasi sementara (temporary hold) dengan status pending_payment & TTL 15 menit.
 */
export async function createTemporarySlotHold(
  params: CreateSlotHoldParams,
  customSupabaseClient?: SupabaseClient<Database> | null
): Promise<CreateSlotHoldResult> {
  const {
    barberId,
    bookingDate,
    startTime,
    endTime,
    serviceDurationMinutes,
    bufferMinutes = 10,
    totalPriceIdr,
    downPaymentIdr = 20000,
    customerName,
    customerPhone,
    customerEmail = null,
    serviceIds = [],
    notes,
    now = new Date()
  } = params

  // 1. Validasi Input Dasar
  if (!barberId || !bookingDate || !startTime || !endTime) {
    return {
      success: false,
      error: 'Parameter barberId, bookingDate, startTime, dan endTime wajib diisi.',
      errorCode: 'VALIDATION_ERROR'
    }
  }

  // Normalisasi string waktu (mendukung baik format raw "15:30" maupun full ISO berzona waktu)
  let normalizedStartTime = startTime
  let normalizedEndTime = endTime

  if (!startTime.includes('T') && !startTime.includes('-')) {
    const match = startTime.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
    if (match) {
      normalizedStartTime = `${bookingDate}T${match[1].padStart(2, '0')}:${match[2]}:${match[3] || '00'}+07:00`
    }
  }

  if (!endTime.includes('T') && !endTime.includes('-')) {
    const match = endTime.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
    if (match) {
      normalizedEndTime = `${bookingDate}T${match[1].padStart(2, '0')}:${match[2]}:${match[3] || '00'}+07:00`
    }
  }

  const startTimeDate = new Date(normalizedStartTime)
  const endTimeDate = new Date(normalizedEndTime)
  if (isNaN(startTimeDate.getTime()) || isNaN(endTimeDate.getTime()) || endTimeDate <= startTimeDate) {
    return {
      success: false,
      error: 'Rentang waktu (startTime - endTime) tidak valid.',
      errorCode: 'INVALID_TIME'
    }
  }

  const slotLockKey = buildSlotLockKey(barberId, bookingDate, normalizedStartTime)
  return await slotMutex.withLock(slotLockKey, async () => {
    const client = customSupabaseClient !== undefined ? customSupabaseClient : getSupabaseClient()
    const { expiresAtIso } = calculateHoldExpiry(now)
    const remainingBalanceIdr: number = Math.max(0, totalPriceIdr - downPaymentIdr)

    // 2. Jika Supabase terkonfigurasi, eksekusi melalui database
    if (client) {
    try {
      // Panggil RPC atomic fn_create_booking_hold jika tersedia
      const { data: rpcData, error: rpcError } = await client.rpc(
        'fn_create_booking_hold' as any,
        {
          p_customer_name: customerName,
          p_customer_phone: customerPhone,
          p_customer_email: customerEmail,
          p_barber_id: barberId,
          p_booking_date: bookingDate,
          p_start_time: normalizedStartTime,
          p_end_time: normalizedEndTime,
          p_service_duration_minutes: serviceDurationMinutes,
          p_service_ids: serviceIds,
          p_total_price_idr: totalPriceIdr,
          p_down_payment_idr: downPaymentIdr,
          p_notes: notes || null
        } as any
      )

      if (!rpcError && rpcData) {
        const responseObj = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData
        if (responseObj.success) {
          const bookingRecord: SlotHoldRecord = {
            id: responseObj.booking_id,
            booking_code: responseObj.booking_code,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail,
            barber_id: barberId,
            booking_date: bookingDate,
            start_time: normalizedStartTime,
            end_time: normalizedEndTime,
            service_duration_minutes: serviceDurationMinutes,
            buffer_minutes: bufferMinutes,
            total_price_idr: totalPriceIdr,
            down_payment_idr: downPaymentIdr,
            remaining_balance_idr: remainingBalanceIdr,
            status: 'pending_payment',
            hold_expires_at: responseObj.hold_expires_at || expiresAtIso,
            created_at: now.toISOString()
          }

          inMemoryHoldsStore.set(bookingRecord.id, bookingRecord)
          return {
            success: true,
            booking: bookingRecord,
            holdExpiresAt: bookingRecord.hold_expires_at,
            expiresInSeconds: HOLD_TTL_SECONDS
          }
        } else if (responseObj.error === 'SLOT_ALREADY_LOCKED') {
          return {
            success: false,
            error: responseObj.message || 'Slot pada jam dan barber ini sedang ditahan pemesan lain atau sudah terisi.',
            errorCode: 'SLOT_ALREADY_LOCKED'
          }
        }
      }

      // Fallback: Query tabel langsung via Supabase Client
      // A. Bersihkan expired holds terlebih dahulu
      await releaseExpiredSlotHolds({ supabaseClient: client, now })

      // B. Cek apakah ada booking aktif yang overlapping
      const { data: overlappingBookings, error: checkError } = await client
        .from('bookings')
        .select('id, status, hold_expires_at, start_time, end_time')
        .eq('barber_id', barberId)
        .eq('booking_date', bookingDate)
        .in('status', ['confirmed', 'in_progress', 'pending_payment'])

      if (checkError) {
        throw new Error(checkError.message)
      }

      const hasConflict = (overlappingBookings || []).some((b: any) => {
        if (b.status === 'pending_payment' && isHoldExpired(b.hold_expires_at, now)) {
          return false // Expired hold diabaikan
        }
        return areTimeRangesOverlapping(startTime, endTime, b.start_time, b.end_time)
      })

      if (hasConflict) {
        return {
          success: false,
          error: 'Slot pada jam dan barber ini sedang ditahan pemesan lain atau sudah terisi.',
          errorCode: 'SLOT_ALREADY_LOCKED'
        }
      }

      // C. Insert booking baru dengan status pending_payment & hold_expires_at
      const bookingCode = `DMZ-${Date.now().toString(36).toUpperCase()}`
      const { data: insertedBooking, error: insertError } = await client
        .from('bookings')
        .insert({
          booking_code: bookingCode,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          barber_id: barberId,
          booking_date: bookingDate,
          booking_type: 'online',
          status: 'pending_payment',
          start_time: startTime,
          end_time: endTime,
          service_duration_minutes: serviceDurationMinutes,
          buffer_minutes: bufferMinutes,
          total_price_idr: totalPriceIdr,
          down_payment_idr: downPaymentIdr,
          remaining_balance_idr: remainingBalanceIdr,
          hold_expires_at: expiresAtIso,
          notes: notes || null
        })
        .select()
        .single()

      if (insertError) {
        if (insertError.code === '23P01' || insertError.message.includes('exclusion')) {
          return {
            success: false,
            error: 'Slot pada jam dan barber ini sedang ditahan pemesan lain atau sudah terisi.',
            errorCode: 'SLOT_ALREADY_LOCKED'
          }
        }
        throw new Error(insertError.message)
      }

      const savedRecord = insertedBooking as unknown as SlotHoldRecord
      inMemoryHoldsStore.set(savedRecord.id, savedRecord)

      return {
        success: true,
        booking: savedRecord,
        holdExpiresAt: expiresAtIso,
        expiresInSeconds: HOLD_TTL_SECONDS
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[Hold Engine] Supabase operation fell back to memory store: ${msg}`)
    }
  }

  // 3. In-Memory Engine Fallback (Offline / Test / Zero-Dependency Mode)
  // A. Bersihkan expired holds di memori terlebih dahulu
  await releaseExpiredSlotHolds({ now })

  // B. Cek tabrakan di memori
  for (const [_, existing] of inMemoryHoldsStore) {
    if (existing.barber_id !== barberId || existing.booking_date !== bookingDate) {
      continue
    }

    if (
      existing.status === 'confirmed' ||
      existing.status === 'in_progress' ||
      (existing.status === 'pending_payment' && !isHoldExpired(existing.hold_expires_at, now))
    ) {
      if (areTimeRangesOverlapping(normalizedStartTime, normalizedEndTime, existing.start_time, existing.end_time)) {
        return {
          success: false,
          error: 'Slot pada jam dan barber ini sedang ditahan pemesan lain atau sudah terisi.',
          errorCode: 'SLOT_ALREADY_LOCKED'
        }
      }
    }
  }

  // C. Daftarkan hold baru
  const randomSuffix: string = Math.random().toString(36).substring(2, 8).toUpperCase()
  const generatedCode: string = `DMZ-${bookingDate.replace(/-/g, '')}-${randomSuffix}`
  const newBookingId: string = `b${Date.now().toString(16)}-0000-0000-0000-${Math.floor(Math.random() * 1e12).toString(16).padStart(12, '0')}`

  const newRecord: SlotHoldRecord = {
    id: newBookingId,
    booking_code: generatedCode,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail,
    barber_id: barberId,
    booking_date: bookingDate,
    start_time: normalizedStartTime,
    end_time: normalizedEndTime,
    service_duration_minutes: serviceDurationMinutes,
    buffer_minutes: bufferMinutes,
    total_price_idr: totalPriceIdr,
    down_payment_idr: downPaymentIdr,
    remaining_balance_idr: remainingBalanceIdr,
    status: 'pending_payment',
    hold_expires_at: expiresAtIso,
    created_at: now.toISOString()
  }

  inMemoryHoldsStore.set(newBookingId, newRecord)

  return {
    success: true,
    booking: newRecord,
    holdExpiresAt: expiresAtIso,
    expiresInSeconds: HOLD_TTL_SECONDS
  }
  })
}

/**
 * Menyapu dan melepaskan seluruh slot hold pending_payment yang telah melewati batas 15 menit.
 */
export async function releaseExpiredSlotHolds(options?: {
  supabaseClient?: SupabaseClient<Database> | null
  now?: Date
}): Promise<ReleaseExpiredHoldsResult> {
  const referenceTime: Date = options?.now ? new Date(options.now) : new Date()
  const nowIso: string = referenceTime.toISOString()
  const client: SupabaseClient<Database> | null =
    options?.supabaseClient !== undefined ? options.supabaseClient : getSupabaseClient()

  let totalExpiredCount: number = 0
  const releasedBookingCodes: string[] = []
  const releasedBookingIds: string[] = []

  // 1. Eksekusi via Supabase Database jika client tersedia
  if (client) {
    try {
      // Coba panggil RPC public.fn_cleanup_expired_holds()
      const { data: rpcResult, error: rpcError } = await client.rpc('fn_cleanup_expired_holds' as any)

      if (!rpcError && rpcResult && Array.isArray(rpcResult) && rpcResult.length > 0) {
        const row = rpcResult[0] as { expired_count?: number; released_booking_codes?: string[] }
        totalExpiredCount += row.expired_count || 0
        if (row.released_booking_codes && Array.isArray(row.released_booking_codes)) {
          releasedBookingCodes.push(...row.released_booking_codes)
        }
      } else {
        // Fallback: Query tabel langsung
        const { data: overdueBookings, error: fetchError } = await client
          .from('bookings')
          .select('id, booking_code')
          .eq('status', 'pending_payment')
          .lte('hold_expires_at', nowIso)

        if (!fetchError && overdueBookings && overdueBookings.length > 0) {
          const overdueIds: string[] = overdueBookings.map((b: any) => b.id)
          const overdueCodes: string[] = overdueBookings.map((b: any) => b.booking_code)

          const { error: updateError } = await client
            .from('bookings')
            .update({
              status: 'expired',
              cancelled_at: nowIso,
              cancellation_reason: 'Payment hold expired (timeout > 15 minutes)',
              updated_at: nowIso
            })
            .in('id', overdueIds)

          if (!updateError) {
            totalExpiredCount += overdueIds.length
            releasedBookingCodes.push(...overdueCodes)
            releasedBookingIds.push(...overdueIds)

            // Update pembayaran pending terkait
            await client
              .from('payments')
              .update({
                transaction_status: 'expire',
                status_message: 'Booking hold timed out (> 15 minutes). Payment cancelled.',
                updated_at: nowIso
              })
              .in('booking_id', overdueIds)
              .eq('transaction_status', 'pending')
          }
        }
      }
    } catch (dbErr: unknown) {
      console.warn(`[Auto-Expire Engine] Supabase database sweep warning:`, dbErr)
    }
  }

  // 2. Eksekusi pembersihan pada in-memory store
  for (const [id, record] of inMemoryHoldsStore.entries()) {
    if (record.status === 'pending_payment' && isHoldExpired(record.hold_expires_at, referenceTime)) {
      record.status = 'expired'
      inMemoryHoldsStore.set(id, record)

      if (!releasedBookingIds.includes(id)) {
        releasedBookingIds.push(id)
        releasedBookingCodes.push(record.booking_code)
        totalExpiredCount++
      }
    }
  }

  return {
    success: true,
    expired_count: totalExpiredCount,
    released_booking_codes: releasedBookingCodes,
    released_booking_ids: releasedBookingIds
  }
}

/**
 * Mengecek status hold reservasi berdasarkan ID atau kode booking.
 */
export async function checkBookingHoldStatus(
  bookingIdOrCode: string,
  options?: {
    supabaseClient?: SupabaseClient<Database> | null
    now?: Date
  }
): Promise<{
  found: boolean
  booking?: SlotHoldRecord
  isExpired: boolean
  remainingSeconds: number
  remainingFormatted: string
  status: string
}> {
  const referenceTime: Date = options?.now ? new Date(options.now) : new Date()
  const client: SupabaseClient<Database> | null =
    options?.supabaseClient !== undefined ? options.supabaseClient : getSupabaseClient()

  // 1. Cek di Supabase jika ada
  if (client) {
    try {
      const isUuid: boolean = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingIdOrCode)
      const query = client.from('bookings').select('*')
      const { data, error } = await (isUuid ? query.eq('id', bookingIdOrCode) : query.eq('booking_code', bookingIdOrCode)).maybeSingle()

      if (!error && data) {
        const record = data as unknown as SlotHoldRecord
        const remaining = getRemainingHoldTime(record.hold_expires_at, referenceTime)
        return {
          found: true,
          booking: record,
          isExpired: record.status === 'expired' || remaining.isExpired,
          remainingSeconds: remaining.seconds,
          remainingFormatted: remaining.formatted,
          status: record.status
        }
      }
    } catch {
      // Fallback ke memori
    }
  }

  // 2. Cek di In-Memory Store
  for (const [_, record] of inMemoryHoldsStore.entries()) {
    if (record.id === bookingIdOrCode || record.booking_code === bookingIdOrCode) {
      const remaining = getRemainingHoldTime(record.hold_expires_at, referenceTime)
      return {
        found: true,
        booking: record,
        isExpired: record.status === 'expired' || remaining.isExpired,
        remainingSeconds: remaining.seconds,
        remainingFormatted: remaining.formatted,
        status: record.status
      }
    }
  }

  return {
    found: false,
    isExpired: true,
    remainingSeconds: 0,
    remainingFormatted: '00:00',
    status: 'not_found'
  }
}

/**
 * Mereset in-memory store (khusus testing).
 */
export function resetInMemoryHoldsStore(): void {
  inMemoryHoldsStore.clear()
}
