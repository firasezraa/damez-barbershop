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
 * Regex validasi nomor ponsel seluler Indonesia:
 * Awalan 08[1-9] dengan total 10 s/d 14 digit angka murni.
 * (Mencegah nomor bebas pulsa 0800, fixed line kabel, dan karakter non-digit).
 */
const INDONESIA_PHONE_REGEX = /^08[1-9][0-9]{7,11}$/

export interface PhoneValidationResult {
  isValid: boolean
  normalizedPhone: string
  e164Phone?: string
  error?: string
}

/**
 * Memvalidasi dan menormalisasi nomor telepon Indonesia ke format standar 08xxxxxxxxxx
 * dan standar internasional E.164 (+628xxxxxxxxxx).
 * Mendukung kebiasaan input pengguna Indonesia:
 * - Standar lokal: 081234567890
 * - Internasional: +62 812 3456 7890, 6281234567890
 * - Tanpa awalan 0: 81234567890 (kebiasaan umum pengguna Indonesia)
 * - Delimiter ramah input: spasi, tanda hubung (-), titik (.), kurung, garis bawah (_), garis miring (/), zero-width space (\u200B)
 */
export function validateAndNormalizeIndonesianPhone(rawPhone: string): PhoneValidationResult {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { isValid: false, normalizedPhone: '', error: 'Nomor WhatsApp wajib diisi.' }
  }

  // 1. Bersihkan zero-width space dan delimiter umum yang sering dipaste pengguna
  const cleaned = rawPhone.trim().replace(/[\u200B-\u200D\uFEFF\s\-\(\)\._\/]/g, '')

  if (!cleaned) {
    return { isValid: false, normalizedPhone: '', error: 'Nomor WhatsApp wajib diisi.' }
  }

  // 2. Normalisasi awalan nomor ke format lokal standar 08xxxxxxxx
  let normalized = cleaned
  if (normalized.startsWith('+62')) {
    normalized = '0' + normalized.slice(3)
  } else if (normalized.startsWith('62')) {
    normalized = '0' + normalized.slice(2)
  } else if (normalized.startsWith('8')) {
    normalized = '0' + normalized
  }

  // 3. Validasi ketat format seluler Indonesia
  if (!INDONESIA_PHONE_REGEX.test(normalized)) {
    let errorMsg = 'Format nomor WhatsApp tidak valid. Gunakan nomor seluler Indonesia aktif (contoh: 081234567890).'
    if (normalized.startsWith('0800')) {
      errorMsg = 'Nomor bebas pulsa (0800) tidak dapat digunakan. Gunakan nomor seluler aktif.'
    } else if (!/^\d+$/.test(normalized)) {
      errorMsg = 'Nomor WhatsApp hanya boleh berisi digit angka.'
    } else if (normalized.length < 10 || normalized.length > 14) {
      errorMsg = 'Nomor WhatsApp harus terdiri dari 10 hingga 14 digit angka.'
    }

    return {
      isValid: false,
      normalizedPhone: '',
      error: errorMsg
    }
  }

  // 4. Bangun format E.164 internasional (+628xxxxxxxxxx)
  const e164 = '+62' + normalized.slice(1)

  return {
    isValid: true,
    normalizedPhone: normalized,
    e164Phone: e164
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

  // 1. Hapus null bytes dan control characters berbahaya
  let cleaned = rawName.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // 2. Hapus seluruh blok script dan style beserta isinya (Stored XSS Defense)
  cleaned = cleaned
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // 3. Hapus tag HTML, script, dan karakter di luar unicode alphabet
  cleaned = cleaned
    .replace(/<[^>]*>?/gm, '')
    .replace(/[^\p{L}\p{N}\s.,'-]/gu, '')
    .trim()

  // 3. Mitigasi Formula Injection (OWASP CSV Injection Defense):
  // Jika diawali dengan simbol formula, bersihkan karakter awal tersebut
  if (/^[=+\-@\t\r]/.test(cleaned)) {
    cleaned = cleaned.replace(/^[=+\-@\t\r]+/, '').trim()
  }

  if (cleaned.length < 2) {
    return { isValid: false, sanitizedName: '', error: 'Nama pemesan minimal 2 karakter.' }
  }

  if (cleaned.length > 100) {
    return { isValid: false, sanitizedName: '', error: 'Nama pemesan maksimal 100 karakter.' }
  }

  return {
    isValid: true,
    sanitizedName: cleaned
  }
}

/**
 * Membersihkan input catatan pemesanan (notes) dari ancaman Stored XSS,
 * dangerous HTML tags, dangerous URI protocols, dan CSV Formula Injection.
 */
export function sanitizeBookingNotes(rawNotes: string | null | undefined): {
  isValid: boolean
  sanitizedNotes: string
  error?: string
} {
  if (rawNotes === null || rawNotes === undefined || rawNotes === '') {
    return { isValid: true, sanitizedNotes: '' }
  }

  if (typeof rawNotes !== 'string') {
    return { isValid: false, sanitizedNotes: '', error: 'Catatan harus berupa teks string.' }
  }

  // 1. Hapus null bytes dan control characters
  let cleaned = rawNotes.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // 2. Hapus seluruh blok script dan style beserta isinya (Stored XSS Defense)
  cleaned = cleaned
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // 3. Hapus skema protokol URI berbahaya (javascript:, data:, vbscript:)
  cleaned = cleaned.replace(/(javascript|vbscript|data):/gi, '')

  // 4. Hapus seluruh HTML/XML/SVG tags dan scripts secara tuntas
  cleaned = cleaned.replace(/<[^>]*>?/gm, '')

  // 5. Hapus karakter kurung sudut yang tersisa untuk mencegah bypass parser
  cleaned = cleaned.replace(/[<>]/g, '')

  // 5. Mitigasi Formula Injection untuk ekspor laporan CSV / Excel
  if (/^[=+\-@\t\r]/.test(cleaned)) {
    cleaned = cleaned.replace(/^[=+\-@\t\r]+/, '').trim()
  }

  cleaned = cleaned.trim()

  if (cleaned.length > 500) {
    cleaned = cleaned.slice(0, 500)
  }

  return {
    isValid: true,
    sanitizedNotes: cleaned
  }
}

/**
 * Regex validasi email standar RFC 5322
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

/**
 * Memvalidasi format alamat email pelanggan (opsional).
 * Mencegah injection string dan karakter berbahaya di email.
 */
export function validateCustomerEmail(rawEmail: string | null | undefined): {
  isValid: boolean
  normalizedEmail: string | null
  error?: string
} {
  if (rawEmail === null || rawEmail === undefined || String(rawEmail).trim() === '') {
    return { isValid: true, normalizedEmail: null }
  }

  if (typeof rawEmail !== 'string') {
    return { isValid: false, normalizedEmail: null, error: 'Email harus berupa teks string.' }
  }

  const cleaned = rawEmail.trim().toLowerCase()

  if (cleaned.length > 254) {
    return { isValid: false, normalizedEmail: null, error: 'Alamat email terlalu panjang (maksimal 254 karakter).' }
  }

  // Cek karakter injeksi berbahaya
  if (/[<>'"`;\\]/.test(cleaned)) {
    return { isValid: false, normalizedEmail: null, error: 'Alamat email memuat karakter tidak valid.' }
  }

  if (!EMAIL_REGEX.test(cleaned)) {
    return { isValid: false, normalizedEmail: null, error: 'Format alamat email tidak valid (contoh: budi@example.com).' }
  }

  return {
    isValid: true,
    normalizedEmail: cleaned
  }
}

/**
 * Memvalidasi apakah identifier (UUID atau kode slug) aman dari SQLi
 */
export function isValidSafeIdentifier(id: string): boolean {
  if (!id || typeof id !== 'string') return false
  // Format UUID v4 atau alphanumeric slug (misal: b0000001-..., a0000001-..., barber-001)
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id)
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
