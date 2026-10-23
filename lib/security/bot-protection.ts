/**
 * DAMEZ BARBERSHOP - SPAM, BOT & INVENTORY HOARDING PROTECTION
 * 
 * Modul proteksi tingkat lanjut untuk mencegah:
 * 1. Bot spamming & automated crawler attacks (Honeypot trap & Turnstile)
 * 2. Denial-of-Inventory / Slot Hoarding (Maksimal 2 hold aktif per nomor HP/IP)
 * 3. Nomor telepon palsu/invalid (Strict validasi format operator seluler Indonesia)
 * 4. Input sanitization (XSS & injection defense)
 */

import { getSupabaseClient } from '../supabase/client.ts'
import { inMemoryHoldsStore, isHoldExpired } from '../slots/auto-expire.ts'

export interface BotValidationResult {
  isValid: boolean
  isBot: boolean
  error?: string
  normalizedPhone?: string
  sanitizedName?: string
}

/**
 * Daftar field perangkap honeypot yang sering diisi oleh bot otomatis
 */
export const HONEYPOT_FIELDS: readonly string[] = [
  '_hp_trap',
  'website',
  'fax_number',
  'company_tax_id',
  'b_dummy_field'
] as const

/**
 * Regex validasi nomor ponsel Indonesia:
 * Mendukung format: 08xx, +628xx, 628xx (panjang 10 s/d 14 digit)
 */
const INDONESIA_PHONE_REGEX = /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/

/**
 * Memvalidasi dan menormalisasi nomor telepon Indonesia ke format standar 08xxxxxxxxxx
 */
export function validateAndNormalizeIndonesianPhone(rawPhone: string): {
  isValid: boolean
  normalizedPhone: string
  error?: string
} {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { isValid: false, normalizedPhone: '', error: 'Nomor WhatsApp wajib diisi.' }
  }

  // Bersihkan karakter non-digit kecuali tanda plus di awal
  const cleaned = rawPhone.trim().replace(/[\s\-\(\)\.]/g, '')

  if (!INDONESIA_PHONE_REGEX.test(cleaned)) {
    return {
      isValid: false,
      normalizedPhone: '',
      error: 'Format nomor WhatsApp tidak valid. Gunakan nomor seluler Indonesia aktif (contoh: 081234567890).'
    }
  }

  // Normalisasi ke format standar 08xxxxxxxxxx
  let normalized = cleaned
  if (normalized.startsWith('+62')) {
    normalized = '0' + normalized.slice(3)
  } else if (normalized.startsWith('62')) {
    normalized = '0' + normalized.slice(2)
  }

  return {
    isValid: true,
    normalizedPhone: normalized
  }
}

/**
 * Membersihkan input nama dari potensi XSS, tag HTML, dan karakter kontrol
 */
export function sanitizeCustomerName(rawName: string): {
  isValid: boolean
  sanitizedName: string
  error?: string
} {
  if (!rawName || typeof rawName !== 'string') {
    return { isValid: false, sanitizedName: '', error: 'Nama pemesan wajib diisi.' }
  }

  // Hapus tag HTML dan script
  const sanitized = rawName
    .replace(/<[^>]*>?/gm, '')
    .replace(/[^\p{L}\p{N}\s.,'-]/gu, '')
    .trim()

  if (sanitized.length < 2) {
    return { isValid: false, sanitizedName: '', error: 'Nama pemesan minimal 2 karakter.' }
  }

  if (sanitized.length > 100) {
    return { isValid: false, sanitizedName: '', error: 'Nama pemesan maksimal 100 karakter.' }
  }

  return {
    isValid: true,
    sanitizedName: sanitized
  }
}

/**
 * Mengecek apakah request terindikasi sebagai spam bot otomatis
 */
export function detectSpamBot(payload: Record<string, any>): {
  isBot: boolean
  reason?: string
} {
  if (!payload || typeof payload !== 'object') {
    return { isBot: false }
  }

  // 1. Periksa field honeypot
  for (const field of HONEYPOT_FIELDS) {
    if (payload[field] !== undefined && payload[field] !== null && String(payload[field]).trim() !== '') {
      return {
        isBot: true,
        reason: `Honeypot field "${field}" was filled with value: "${payload[field]}"`
      }
    }
  }

  // 2. Periksa submission timing jika ada client timestamp
  if (payload._submission_start_time) {
    const startTime = Number(payload._submission_start_time)
    const elapsedMs = Date.now() - startTime
    // Jika formulir disubmit dalam waktu < 400 milidetik sejak dimuat, terindikasi bot instan
    if (!isNaN(startTime) && elapsedMs > 0 && elapsedMs < 400) {
      return {
        isBot: true,
        reason: `Form submitted unnaturally fast (${elapsedMs} ms), bot behavior suspected.`
      }
    }
  }

  return { isBot: false }
}

/**
 * Memeriksa apakah nomor telepon telah mencapai batas maksimal penahanan slot aktif (Anti-Hoarding).
 * Maksimal 2 hold aktif yang belum dibayar dalam jendela 15 menit.
 */
export async function checkActiveHoldsLimit(
  phone: string,
  maxAllowedActive: number = 2,
  currentTime?: Date
): Promise<{ allowed: boolean; activeCount: number; message?: string }> {
  const now = currentTime || new Date()
  const supabase = getSupabaseClient()

  let activeCount = 0

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, hold_expires_at, status')
        .eq('customer_phone', phone)
        .eq('status', 'pending_payment')
        .gt('hold_expires_at', now.toISOString())

      if (!error && data) {
        activeCount = data.length
      }
    } catch (err) {
      console.warn('[Bot Protection] Supabase query fallback to in-memory check:', err)
    }
  }

  // Cek juga di in-memory store
  let memoryActiveCount = 0
  for (const [_, record] of inMemoryHoldsStore.entries()) {
    if (
      record.customer_phone === phone &&
      record.status === 'pending_payment' &&
      !isHoldExpired(record.hold_expires_at, now)
    ) {
      memoryActiveCount++
    }
  }

  activeCount = Math.max(activeCount, memoryActiveCount)

  if (activeCount >= maxAllowedActive) {
    return {
      allowed: false,
      activeCount,
      message: `Anda telah memiliki ${activeCount} slot yang sedang menunggu pembayaran. Harap selesaikan pembayaran terlebih dahulu atau tunggu hingga waktu hold berakhir.`
    }
  }

  return {
    allowed: true,
    activeCount
  }
}
