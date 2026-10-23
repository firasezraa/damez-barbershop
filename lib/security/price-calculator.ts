/**
 * DAMEZ BARBERSHOP - PRICE & DOWN PAYMENT SECURITY CALCULATOR
 * 
 * Modul proteksi anti-tampering harga & nominal Down Payment.
 * Menjamin 100% integritas finansial:
 * 1. DP flat Rp 20.000 terkunci di sisi server (zero client-side tampering)
 * 2. Total harga dihitung langsung dari katalog master layanan (services)
 * 3. Sisa pelunasan kasir (remaining balance) = total_harga - 20.000
 */

import { getSupabaseClient } from '../supabase/client.ts'
import { SEED_SERVICES } from '../slots/service.ts'

export const FLAT_DOWN_PAYMENT_AMOUNT_IDR: number = 20000

export interface PriceVerificationResult {
  authoritativeTotalPrice: number
  authoritativeDownPayment: number
  authoritativeRemainingBalance: number
  authoritativeDurationMinutes: number
  isTampered: boolean
  tamperReason?: string
  serviceDetails: Array<{
    id: string
    name: string
    price: number
    duration: number
  }>
}

/**
 * Menghitung dan memverifikasi integritas harga layanan dan nominal Down Payment.
 * Menolak atau mengoreksi seluruh percobaan modifikasi harga dari client payload.
 */
export async function verifyAndCalculateBookingPrice(params: {
  serviceIds?: string[]
  clientTotalPrice?: number | null
  clientDownPayment?: number | null
  defaultDurationMinutes?: number
}): Promise<PriceVerificationResult> {
  const {
    serviceIds = [],
    clientTotalPrice,
    clientDownPayment,
    defaultDurationMinutes = 45
  } = params

  const supabase = getSupabaseClient()
  let computedTotalPrice = 0
  let computedDurationMinutes = 0
  const serviceDetails: Array<{ id: string; name: string; price: number; duration: number }> = []

  // 1. Ambil data layanan dari database Supabase jika aktif
  if (supabase && serviceIds.length > 0) {
    try {
      const { data: dbServices, error: dbError } = await supabase
        .from('services')
        .select('id, name, price_idr, duration_minutes')
        .in('id', serviceIds)

      if (!dbError && dbServices && dbServices.length > 0) {
        for (const srv of dbServices) {
          computedTotalPrice += srv.price_idr
          computedDurationMinutes += srv.duration_minutes
          serviceDetails.push({
            id: srv.id,
            name: srv.name,
            price: srv.price_idr,
            duration: srv.duration_minutes
          })
        }
      }
    } catch (err) {
      console.warn('[Price Security] Gagal fetch services dari Supabase, beralih ke catalog fallback:', err)
    }
  }

  // 2. Jika database tidak mengembalikan layanan, gunakan master catalog fallback
  if (serviceDetails.length === 0 && serviceIds.length > 0) {
    for (const id of serviceIds) {
      const fallbackSrv = SEED_SERVICES[id]
      if (fallbackSrv) {
        computedTotalPrice += fallbackSrv.price_idr
        computedDurationMinutes += fallbackSrv.duration_minutes
        serviceDetails.push({
          id,
          name: fallbackSrv.name,
          price: fallbackSrv.price_idr,
          duration: fallbackSrv.duration_minutes
        })
      }
    }
  }

  // Jika tidak ada service_ids terdaftar, gunakan default layanan potong rambut standar
  if (computedTotalPrice === 0) {
    computedTotalPrice = 50000 // Standar Gentlemen Classic Haircut Rp 50.000
    computedDurationMinutes = defaultDurationMinutes
    serviceDetails.push({
      id: 'a0000001-0000-0000-0000-000000000001',
      name: 'Gentlemen Classic Haircut',
      price: 50000,
      duration: defaultDurationMinutes
    })
  }

  // 3. Evaluasi Tampering
  let isTampered = false
  const tamperReasons: string[] = []

  // A. Cek tampering Down Payment
  if (clientDownPayment !== undefined && clientDownPayment !== null && clientDownPayment !== FLAT_DOWN_PAYMENT_AMOUNT_IDR) {
    isTampered = true
    tamperReasons.push(
      `Client attempted DP tampering: submitted Rp ${clientDownPayment}, forced to locked Rp ${FLAT_DOWN_PAYMENT_AMOUNT_IDR}.`
    )
  }

  // B. Cek tampering Total Price
  if (clientTotalPrice !== undefined && clientTotalPrice !== null && clientTotalPrice !== computedTotalPrice) {
    isTampered = true
    tamperReasons.push(
      `Client attempted total price tampering: submitted Rp ${clientTotalPrice}, authoritative catalog sum is Rp ${computedTotalPrice}.`
    )
  }

  const authoritativeDownPayment = FLAT_DOWN_PAYMENT_AMOUNT_IDR
  const authoritativeRemainingBalance = Math.max(0, computedTotalPrice - authoritativeDownPayment)

  return {
    authoritativeTotalPrice: computedTotalPrice,
    authoritativeDownPayment,
    authoritativeRemainingBalance,
    authoritativeDurationMinutes: computedDurationMinutes > 0 ? computedDurationMinutes : defaultDurationMinutes,
    isTampered,
    tamperReason: isTampered ? tamperReasons.join(' ') : undefined,
    serviceDetails
  }
}
