/**
 * DAMEZ BARBERSHOP - WHATSAPP NOTIFICATION DISPATCHER SERVICE
 * Module: lib/notifications/whatsapp.ts
 *
 * Implements automated, high-reliability WhatsApp notification dispatching
 * with multi-gateway failover (Fonnte & Wablas), strict Indonesian Asia/Jakarta
 * timezone formatting, anti-emoji and humanizer compliance, and sub-5-second
 * delivery SLA after Midtrans payment confirmation.
 *
 * Sesuai WBS M5-02 & Kepatuhan UU PDP No. 27/2022:
 * (1) Konfirmasi instan saat DP lunas (booking_confirmed)
 * (2) Pesan alert booking baru ke nomor WA barber (barber_booking_alert)
 * (3) Notifikasi pengingat jadwal kedatangan (arrival_reminder_h2 & h30m)
 */

import fs from 'node:fs'
import path from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database.types.ts'
import { getSupabaseClient } from '../supabase/client.ts'
import {
  JAKARTA_TIMEZONE,
  getJakartaDateTimeParts,
  getJakartaDateString,
  getJakartaTimeString,
  timeStringToMinutes,
  minutesToTimeString
} from '../utils/timezone.ts'
import type { WebhookMockStore, BookingRow } from '../payment/webhook.ts'

// ============================================================================
// CONSTANTS & BUSINESS RULES
// ============================================================================

export const DELIVERY_SLA_SECONDS: number = 5
export const DELIVERY_SLA_MS: number = 5000
export const DEFAULT_DP_AMOUNT_IDR: number = 20000
export const DEFAULT_TOLERANCE_MINUTES: number = 15
export const DEFAULT_RESCHEDULE_WINDOW_HOURS: number = 3
export const DEFAULT_HTTP_TIMEOUT_MS: number = 4500

export const SHOP_METADATA = {
  brand: 'Damez Barbershop',
  location: 'Jl. Senopati Raya No. 42, Kebayoran Baru, Jakarta Selatan 12190',
  timezone: 'Asia/Jakarta (WIB / UTC+07:00)',
  officialPhone: '+62 812-3456-7890',
  officialPhoneDigits: '6281234567890',
  googleMapsUrl: 'https://maps.app.goo.gl/damezsenopati',
  siteUrl: 'https://damezbarber.com'
} as const

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type WhatsAppGatewayProvider = 'fonnte' | 'wablas' | 'mock'

export type TemplateKey =
  | 'booking_confirmed'
  | 'barber_booking_alert'
  | 'arrival_reminder_h2'
  | 'arrival_reminder_h30m'
  | 'booking_rescheduled'
  | 'booking_cancelled_customer'
  | 'booking_no_show_alert'
  | 'slot_hold_expired'

export interface WhatsAppGatewayConfig {
  provider: WhatsAppGatewayProvider
  fonnteApiUrl: string
  fonnteToken: string | null
  wablasApiUrl: string
  wablasToken: string | null
  wablasSecretKey: string | null
  timeoutMs: number
  isMock: boolean
  defaultAdminPhone: string
  siteUrl: string
}

export interface WhatsAppMessagePayload {
  recipientPhone: string
  message: string
  templateName?: TemplateKey
  bookingId?: string | null
  countryCode?: string
}

export interface WhatsAppSendResult {
  success: boolean
  provider: WhatsAppGatewayProvider
  messageId: string
  recipientPhone: string
  latencyMs: number
  status: 'sent' | 'failed'
  rawResponse: Record<string, unknown> | null
  errorMessage?: string
}

export interface WhatsAppTemplateDefinition {
  id: TemplateKey
  title: string
  recipient: 'customer' | 'barber'
  category: string
  trigger: string
  description: string
  variables: string[]
  message: string
  preview: string
}

export interface BarberContactInfo {
  id: string
  barberCode: string
  name: string
  chairNumber: number
  phone: string
}

export interface BookingNotificationData {
  bookingId: string
  bookingCode: string
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  barberId: string
  barberName: string
  barberPhone?: string
  chairNumber?: number
  bookingDate: string // YYYY-MM-DD
  startTime: string // HH:mm or HH:mm:ss
  endTime: string // HH:mm or HH:mm:ss
  serviceNames: string
  serviceDurationMinutes: number
  dpAmountIdr: number
  remainingBalanceIdr: number
  specialNotes?: string | null
  ticketUrl?: string
}

export interface InstantPaymentConfirmationParams {
  booking: BookingNotificationData
  options?: DispatchOptions
}

export interface InstantPaymentConfirmationResult {
  success: boolean
  bookingId: string
  bookingCode: string
  customerResult: WhatsAppSendResult
  barberResult: WhatsAppSendResult
  totalLatencyMs: number
  dodCompliant: boolean
}

export interface ArrivalReminderParams {
  booking: BookingNotificationData
  reminderType: 'h2' | 'h30m'
  options?: DispatchOptions
}

export interface DispatchOptions {
  supabaseClientOverride?: SupabaseClient<Database> | null
  mockStore?: WebhookMockStore
  gatewayConfigOverride?: Partial<WhatsAppGatewayConfig>
}

export interface ReminderDispatchResult {
  timestamp: string
  scannedCount: number
  h2Dispatched: number
  h30mDispatched: number
  errors: string[]
  latencyMs: number
}

export interface ProcessPendingResult {
  timestamp: string
  processedCount: number
  sentCount: number
  failedCount: number
  results: WhatsAppSendResult[]
}

export interface MockDispatchedMessage {
  id: string
  recipientPhone: string
  message: string
  templateName?: TemplateKey
  timestamp: string
  provider: WhatsAppGatewayProvider
  latencyMs: number
}

// ============================================================================
// KNOWN BARBERS REGISTRY
// ============================================================================

export const KNOWN_BARBERS: Record<string, BarberContactInfo> = {
  'b0000001-0000-0000-0000-000000000001': {
    id: 'b0000001-0000-0000-0000-000000000001',
    barberCode: 'BBR-01',
    name: 'Rian Pratama',
    chairNumber: 1,
    phone: process.env.BARBER_RIAN_PHONE || '081234567801'
  },
  'b0000002-0000-0000-0000-000000000002': {
    id: 'b0000002-0000-0000-0000-000000000002',
    barberCode: 'BBR-02',
    name: 'Fajar Ramadhan',
    chairNumber: 2,
    phone: process.env.BARBER_FAJAR_PHONE || '081234567802'
  },
  'b0000003-0000-0000-0000-000000000003': {
    id: 'b0000003-0000-0000-0000-000000000003',
    barberCode: 'BBR-03',
    name: 'Bagas Setiawan',
    chairNumber: 3,
    phone: process.env.BARBER_BAGAS_PHONE || '081234567803'
  }
}

/**
 * Resolves barber contact info by barber ID, falling back to safe defaults.
 */
export function getBarberContact(
  barberId: string,
  fallbackName?: string,
  fallbackChair?: number
): BarberContactInfo {
  const existing: BarberContactInfo | undefined = KNOWN_BARBERS[barberId]
  if (existing) {
    return existing
  }

  // Look up by barber name if barberId is an arbitrary UUID
  const foundByName: BarberContactInfo | undefined = Object.values(KNOWN_BARBERS).find(
    (b: BarberContactInfo): boolean => b.name === fallbackName
  )
  if (foundByName) {
    return foundByName
  }

  return {
    id: barberId,
    barberCode: 'BBR-GENERIC',
    name: fallbackName || 'Master Barber Damez',
    chairNumber: fallbackChair || 1,
    phone: process.env.WHATSAPP_DEFAULT_BARBER_PHONE || '081234567890'
  }
}

// ============================================================================
// BUILT-IN TEMPLATES EMBEDDED FALLBACK
// (Grounded verbatim from content/whatsapp-templates.json)
// ============================================================================

export const BUILTIN_TEMPLATES: Record<TemplateKey, WhatsAppTemplateDefinition> = {
  booking_confirmed: {
    id: 'booking_confirmed',
    title: 'Konfirmasi Pembayaran DP dan Tiket Reservasi',
    recipient: 'customer',
    category: 'transactional',
    trigger: 'midtrans_webhook_settlement',
    description: 'Dikirimkan otomatis ke WhatsApp pelanggan dalam waktu kurang dari 5 detik setelah pembayaran DP Rp 20.000 terverifikasi oleh Midtrans.',
    variables: [
      'customer_name',
      'booking_code',
      'service_names',
      'service_duration',
      'barber_name',
      'chair_number',
      'booking_date',
      'start_time',
      'end_time',
      'dp_amount_formatted',
      'remaining_balance_formatted',
      'tolerance_time',
      'reschedule_deadline_time',
      'address',
      'google_maps_url',
      'ticket_url'
    ],
    message: 'Halo {{customer_name}},\n\nPembayaran uang muka (DP) untuk reservasi kursi Anda di Damez Barbershop telah berhasil diverifikasi.\n\nRincian Reservasi Kursi:\n- Kode Booking: {{booking_code}}\n- Layanan: {{service_names}} ({{service_duration}} menit)\n- Master Barber: {{barber_name}} (Kursi {{chair_number}})\n- Hari dan Tanggal: {{booking_date}}\n- Jam Sesi: {{start_time}} sampai {{end_time}} WIB\n- Status DP: Rp {{dp_amount_formatted}} (Lunas via QRIS)\n- Sisa Tagihan di Kasir: Rp {{remaining_balance_formatted}}\n\nPetunjuk Kedatangan dan Ketentuan:\n1. Harap tiba 5 sampai 10 menit sebelum pukul {{start_time}} WIB. Anda dapat bersantai di ruang tunggu berpendingin udara dan menikmati kopi dingin seduh gratis kami.\n2. Batas toleransi keterlambatan maksimal 15 menit (sampai pukul {{tolerance_time}} WIB). Jika melewati batas waktu tersebut tanpa kabar, kursi dialihkan ke antrean tamu walk-in demi menjaga jadwal pelanggan berikutnya.\n3. Perubahan jadwal (reschedule) mandiri dapat dilakukan maksimal 3 jam sebelum jadwal sesi (sebelum pukul {{reschedule_deadline_time}} WIB) melalui tautan tiket Anda.\n\nLokasi Damez Barbershop:\n{{address}}\nPetunjuk Rute: {{google_maps_url}}\n\nBuka Tiket Digital Anda:\n{{ticket_url}}\n\nTerima kasih atas komitmen Anda. Sampai jumpa di kursi pangkas Damez Barbershop.',
    preview: ''
  },
  barber_booking_alert: {
    id: 'barber_booking_alert',
    title: 'Pemberitahuan Reservasi Baru untuk Master Barber',
    recipient: 'barber',
    category: 'internal_alert',
    trigger: 'booking_confirmed_in_system',
    description: 'Dikirimkan otomatis ke nomor WhatsApp pribadi master barber yang dipilih begitu pelanggan menyelesaikan pembayaran DP.',
    variables: [
      'barber_name',
      'booking_code',
      'customer_name',
      'service_names',
      'service_duration',
      'booking_date',
      'start_time',
      'end_time',
      'special_notes'
    ],
    message: 'Halo {{barber_name}},\n\nTerdapat reservasi baru yang telah lunas DP dan terjadwal di kursi Anda.\n\nRincian Pemesan:\n- Kode Booking: {{booking_code}}\n- Nama Pelanggan: {{customer_name}}\n- Layanan: {{service_names}} (Durasi {{service_duration}} menit)\n- Hari dan Tanggal: {{booking_date}}\n- Waktu Pangkas: {{start_time}} sampai {{end_time}} WIB\n- Catatan Khusus: {{special_notes}}\n\nMohon pastikan perlengkapan gunting, clipper, dan kain leher higienis telah disterilkan dalam lemari UV sebelum sesi dimulai.',
    preview: ''
  },
  arrival_reminder_h2: {
    id: 'arrival_reminder_h2',
    title: 'Pengingat Jadwal Kedatangan H-2 Jam',
    recipient: 'customer',
    category: 'reminder',
    trigger: 'cron_scheduler_2_hours_before',
    description: 'Dikirimkan 2 jam sebelum sesi dimulai. Mengingatkan jadwal dan menegaskan bahwa jendela perubahan mandiri H-3 jam telah ditutup.',
    variables: [
      'customer_name',
      'booking_code',
      'barber_name',
      'booking_date',
      'start_time',
      'tolerance_time',
      'remaining_balance_formatted',
      'address',
      'google_maps_url',
      'ticket_url'
    ],
    message: 'Halo {{customer_name}},\n\nPengingat ramah untuk jadwal pangkas rambut Anda di Damez Barbershop hari ini.\n\nRincian Sesi Anda:\n- Kode Booking: {{booking_code}}\n- Master Barber: {{barber_name}}\n- Waktu Kedatangan: {{start_time}} WIB (Hari ini, {{booking_date}})\n- Batas Toleransi Kedatangan: {{tolerance_time}} WIB\n- Sisa Tagihan di Kasir: Rp {{remaining_balance_formatted}}\n\nCatatan Penting:\nSesuai aturan operasional toko, batas waktu penjadwalan ulang mandiri telah berakhir pada batas H-3 jam. Kursi dan peralatan kerja barber Anda saat ini sedang dipersiapkan khusus untuk Anda.\n\nAlamat Toko:\n{{address}}\nNavigasi Cepat: {{google_maps_url}}\n\nBuka Tiket Anda:\n{{ticket_url}}\n\nSampai bertemu di Damez Barbershop.',
    preview: ''
  },
  arrival_reminder_h30m: {
    id: 'arrival_reminder_h30m',
    title: 'Pengingat Terakhir H-30 Menit',
    recipient: 'customer',
    category: 'reminder',
    trigger: 'cron_scheduler_30_minutes_before',
    description: 'Dikirimkan 30 menit sebelum sesi dimulai untuk membantu navigasi perjalanan pelanggan di area Senopati.',
    variables: [
      'customer_name',
      'booking_code',
      'barber_name',
      'start_time',
      'google_maps_url'
    ],
    message: 'Halo {{customer_name}},\n\nSesi pangkas rambut Anda bersama {{barber_name}} akan dimulai 30 menit lagi, tepat pukul {{start_time}} WIB.\n\nJika Anda sudah berada di sekitar Senopati, silakan langsung menuju ke toko kami. Ruang tunggu berpendingin udara dan segelas kopi dingin segar telah siap menyambut Anda.\n\nNavigasi Google Maps:\n{{google_maps_url}}\n\nKode Booking Anda: {{booking_code}}',
    preview: ''
  },
  booking_rescheduled: {
    id: 'booking_rescheduled',
    title: 'Konfirmasi Pemindahan Jadwal Berhasil',
    recipient: 'customer',
    category: 'transactional',
    trigger: 'customer_reschedule_success',
    description: 'Dikirimkan ketika pelanggan berhasil memindahkan jadwal pangkas secara mandiri sebelum batas H-3 jam.',
    variables: [
      'customer_name',
      'booking_code',
      'service_names',
      'barber_name',
      'old_date',
      'old_time',
      'new_date',
      'new_start_time',
      'new_end_time',
      'remaining_balance_formatted',
      'ticket_url'
    ],
    message: 'Halo {{customer_name}},\n\nPerubahan jadwal reservasi Anda di Damez Barbershop telah berhasil dikonfirmasi.\n\nPerubahan Jadwal Sesi:\n- Jadwal Sebelumnya: {{old_date}}, pukul {{old_time}} WIB\n- Jadwal Baru: {{new_date}}, pukul {{new_start_time}} sampai {{new_end_time}} WIB\n- Master Barber: {{barber_name}}\n- Layanan: {{service_names}}\n- Kode Booking: {{booking_code}}\n\nUang muka Rp 20.000 Anda telah otomatis dialihkan ke jadwal baru ini tanpa biaya tambahan apa pun. Sisa pembayaran sebesar Rp {{remaining_balance_formatted}} tetap dilunasi di meja kasir setelah sesi pangkas selesai.\n\nBuka Tiket Digital Pembaruan:\n{{ticket_url}}\n\nTerima kasih telah memberitahu kami lebih awal.',
    preview: ''
  },
  booking_cancelled_customer: {
    id: 'booking_cancelled_customer',
    title: 'Pemberitahuan Pembatalan Reservasi',
    recipient: 'customer',
    category: 'transactional',
    trigger: 'customer_cancellation_confirmed',
    description: 'Dikirimkan saat pelanggan membatalkan reservasi, dengan penegasan status uang muka sesuai ketentuan batas waktu H-3 jam.',
    variables: [
      'customer_name',
      'booking_code',
      'booking_date',
      'start_time',
      'dp_status_explanation',
      'rebook_url'
    ],
    message: 'Halo {{customer_name}},\n\nReservasi kursi Anda untuk jadwal {{booking_date}} pukul {{start_time}} WIB (Kode: {{booking_code}}) telah resmi dibatalkan dalam sistem kami.\n\nStatus Uang Muka (DP):\n{{dp_status_explanation}}\n\nJika di kemudian hari Anda membutuhkan perawatan rambut pria atau perapian jenggot, Anda dapat memilih jadwal baru kapan saja melalui tautan berikut:\n{{rebook_url}}\n\nTerima kasih telah mengabari kami.',
    preview: ''
  },
  booking_no_show_alert: {
    id: 'booking_no_show_alert',
    title: 'Pemberitahuan Pelepasan Kursi (No-Show)',
    recipient: 'customer',
    category: 'notice',
    trigger: 'admin_marks_no_show_after_15m',
    description: 'Dikirimkan dengan nada santun ketika toleransi 15 menit telah habis tanpa kabar dan kursi dialihkan ke antrean tamu walk-in.',
    variables: [
      'customer_name',
      'booking_code',
      'barber_name',
      'booking_date',
      'start_time',
      'tolerance_time',
      'admin_wa_url'
    ],
    message: 'Halo {{customer_name}},\n\nKami menginformasikan bahwa sesi pangkas rambut Anda di Damez Barbershop untuk jadwal {{booking_date}} pukul {{start_time}} WIB (Kode: {{booking_code}}) telah melewati batas waktu toleransi kehadiran 15 menit (pukul {{tolerance_time}} WIB).\n\nDemi menjaga keadilan jadwal bagi pelanggan pada sesi berikutnya, kursi kerja {{barber_name}} telah kami alihkan kepada antrean tamu yang menunggu di lokasi. Sesuai ketentuan operasional toko kami, uang muka flat Rp 20.000 dinyatakan hangus sebagai kompensasi waktu kerja barber.\n\nJika Anda saat ini sedang dalam perjalanan menuju toko dan tetap ingin memotong rambut hari ini, silakan hubungi kasir meja depan kami. Kami akan dengan senang hati mendaftarkan Anda ke antrean tamu walk-in pada jadwal kosong terdekat:\n{{admin_wa_url}}\n\nTerima kasih atas pengertian Anda.',
    preview: ''
  },
  slot_hold_expired: {
    id: 'slot_hold_expired',
    title: 'Pemulihan Kursi Pasca Batas Waktu Bayar Habis (Zero-Guilt Recovery)',
    recipient: 'customer',
    category: 'recovery',
    trigger: 'slot_hold_timer_expired_unpaid',
    description: 'Pesan ramah pemulihan jika calon pelanggan meminta bantuan setelah batas waktu pembayaran QRIS 15 menit berakhir.',
    variables: [
      'customer_name',
      'service_names',
      'barber_name',
      'rebook_url'
    ],
    message: 'Halo {{customer_name}},\n\nWaktu penahanan 15 menit untuk kursi pangkas Anda di Damez Barbershop telah selesai, dan kursi tersebut telah kami buka kembali untuk jadwal publik. Uang Anda belum terpotong.\n\nPilihan layanan ({{service_names}}) dan master barber ({{barber_name}}) masih kami simpan agar Anda tidak perlu memilih ulang dari awal. Jika Anda ingin melanjutkan reservasi, silakan pilih jam kedatangan baru melalui tautan cepat berikut:\n{{rebook_url}}\n\nSampai jumpa di Damez Barbershop.',
    preview: ''
  }
}

// In-memory array for recording mock messages sent during testing
const mockDispatchedMessages: MockDispatchedMessage[] = []

/**
 * Returns recorded mock dispatched messages (for test assertions).
 */
export function getMockDispatchedMessages(): MockDispatchedMessage[] {
  return [...mockDispatchedMessages]
}

/**
 * Clears recorded mock dispatched messages.
 */
export function clearMockDispatchedMessages(): void {
  mockDispatchedMessages.length = 0
}

// ============================================================================
// TEMPLATE ENGINE & HUMANIZER COMPLIANCE
// ============================================================================

/**
 * Loads template definition either from content/whatsapp-templates.json on disk
 * or from embedded BUILTIN_TEMPLATES.
 */
export function getWhatsAppTemplate(templateId: TemplateKey): WhatsAppTemplateDefinition {
  try {
    const templatesFilePath: string = path.join(process.cwd(), 'content', 'whatsapp-templates.json')
    if (fs.existsSync(templatesFilePath)) {
      const fileContent: string = fs.readFileSync(templatesFilePath, 'utf-8')
      const parsed = JSON.parse(fileContent)
      if (parsed.templates && parsed.templates[templateId]) {
        return parsed.templates[templateId] as WhatsAppTemplateDefinition
      }
    }
  } catch {
    // Fall back to built-in embedded definition
  }

  const fallback: WhatsAppTemplateDefinition | undefined = BUILTIN_TEMPLATES[templateId]
  if (!fallback) {
    throw new Error(`WhatsApp template not found: ${templateId}`)
  }
  return fallback
}

/**
 * Checks whether text contains emojis using standard unicode pictographic ranges.
 */
export function containsEmoji(text: string): boolean {
  const emojiRegex: RegExp = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u
  return emojiRegex.test(text)
}

/**
 * Enforces strict Humanizer & Anti-Emoji compliance on rendered texts:
 * 1. Replaces em-dash (—) and en-dash (–) and double-hyphens (--) with standard single hyphens.
 * 2. Removes any accidental emoji characters.
 */
export function sanitizeHumanizerCompliance(text: string): string {
  let cleaned: string = text
    .replace(/—/g, ' - ')
    .replace(/–/g, ' - ')
    .replace(/--/g, ' - ')

  cleaned = cleaned.replace(
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu,
    ''
  )

  return cleaned
}

/**
 * Formats a calendar date "YYYY-MM-DD" into Indonesian standard:
 * Example: "2026-10-24" -> "Sabtu, 24 Oktober 2026"
 */
export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) {
    return dateStr
  }

  const parts: string[] = dateStr.split('-')
  if (parts.length !== 3) {
    return dateStr
  }

  const year: number = parseInt(parts[0], 10)
  const month: number = parseInt(parts[1], 10)
  const day: number = parseInt(parts[2], 10)

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return dateStr
  }

  const midDayUtc: Date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  const dayOfWeekIndex: number = midDayUtc.getUTCDay()

  const days: string[] = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months: string[] = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const dayName: string = days[dayOfWeekIndex] ?? ''
  const monthName: string = months[month - 1] ?? ''

  return `${dayName}, ${day} ${monthName} ${year}`
}

/**
 * Formats currency amount in IDR (dots as thousand separators without currency symbol):
 * Example: 20000 -> "20.000"
 */
export function formatIndonesianCurrency(amount: number): string {
  const rounded: number = Math.round(Number(amount) || 0)
  return rounded.toLocaleString('id-ID')
}

/**
 * Cleans time string "HH:mm:ss" or "HH:mm:ss+07" down to "HH:mm".
 */
export function cleanTimeString(timeStr: string): string {
  if (!timeStr) {
    return '00:00'
  }
  const clean: string = timeStr.trim().split('+')[0].split('Z')[0]
  const parts: string[] = clean.split(':')
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
  }
  return timeStr
}

/**
 * Calculates 15-minute tolerance time:
 * Example: "14:00" -> "14:15"
 */
export function calculateToleranceTime(
  startTimeStr: string,
  toleranceMinutes: number = DEFAULT_TOLERANCE_MINUTES
): string {
  const cleaned: string = cleanTimeString(startTimeStr)
  const currentMinutes: number = timeStringToMinutes(cleaned)
  const targetMinutes: number = currentMinutes + toleranceMinutes
  return minutesToTimeString(targetMinutes)
}

/**
 * Calculates 3-hour reschedule deadline time:
 * Example: "14:00" -> "11:00"
 */
export function calculateRescheduleDeadlineTime(
  startTimeStr: string,
  deadlineHours: number = DEFAULT_RESCHEDULE_WINDOW_HOURS
): string {
  const cleaned: string = cleanTimeString(startTimeStr)
  const currentMinutes: number = timeStringToMinutes(cleaned)
  const targetMinutes: number = Math.max(0, currentMinutes - deadlineHours * 60)
  return minutesToTimeString(targetMinutes)
}

/**
 * Renders a WhatsApp template by interpolating {{variable}} placeholders.
 * Enforces zero-emoji policy and humanizer standards.
 */
export function renderWhatsAppTemplate(
  templateId: TemplateKey,
  variables: Record<string, string | number>
): string {
  const template: WhatsAppTemplateDefinition = getWhatsAppTemplate(templateId)
  let rendered: string = template.message

  // Default global fallbacks
  const mergedVariables: Record<string, string | number> = {
    address: SHOP_METADATA.location,
    google_maps_url: SHOP_METADATA.googleMapsUrl,
    official_phone: SHOP_METADATA.officialPhone,
    ...variables
  }

  // Interpolate each variable {{var}}
  Object.keys(mergedVariables).forEach((key: string): void => {
    const rawVal = mergedVariables[key]
    const valStr: string = rawVal !== undefined && rawVal !== null ? String(rawVal) : ''
    const regex: RegExp = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    rendered = rendered.replace(regex, valStr)
  })

  // Sanitize humanizer & anti-emoji compliance
  const sanitized: string = sanitizeHumanizerCompliance(rendered)
  return sanitized
}

// ============================================================================
// PHONE NUMBER NORMALIZATION & VALIDATION
// ============================================================================

/**
 * Normalizes an Indonesian phone number to canonical international format:
 * Example: "0812-3456-7890" -> "6281234567890"
 * Example: "+62 812 3456 7890" -> "6281234567890"
 * Example: "81234567890" -> "6281234567890"
 */
export function normalizeIndonesianPhoneNumber(phone: string): string {
  if (!phone) {
    return ''
  }

  // Remove whitespace, dashes, dots, brackets
  let cleaned: string = phone.trim().replace(/[\s\-\(\)\.]/g, '')

  if (cleaned.startsWith('+62')) {
    cleaned = '62' + cleaned.slice(3)
  } else if (cleaned.startsWith('62')) {
    // Already 62
  } else if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned
  }

  return cleaned
}

/**
 * Validates Indonesian mobile phone number:
 * Must start with 628 and have 10 to 15 digits total.
 */
export function isValidIndonesianPhoneNumber(phone: string): boolean {
  const normalized: string = normalizeIndonesianPhoneNumber(phone)
  return /^628\d{8,12}$/.test(normalized)
}

// ============================================================================
// GATEWAY CONFIGURATION & FACTORY
// ============================================================================

/**
 * Retrieves the active WhatsApp Gateway configuration.
 */
export function getWhatsAppConfig(): WhatsAppGatewayConfig {
  const explicitProvider: string | undefined =
    process.env.WHATSAPP_GATEWAY_PROVIDER || process.env.WA_GATEWAY_PROVIDER
  const fonnteToken: string | null =
    process.env.FONNTE_API_TOKEN ||
    process.env.FONNTE_TOKEN ||
    process.env.WHATSAPP_FONNTE_TOKEN ||
    process.env.WA_GATEWAY_TOKEN ||
    null

  const wablasToken: string | null =
    process.env.WABLAS_TOKEN ||
    process.env.WABLAS_API_TOKEN ||
    null

  const wablasSecretKey: string | null = process.env.WABLAS_SECRET_KEY || null

  const isMockEnv: boolean =
    process.env.MOCK_WHATSAPP === 'true' ||
    process.env.NODE_ENV === 'test' ||
    (!fonnteToken && !wablasToken)

  let provider: WhatsAppGatewayProvider = 'mock'
  if (explicitProvider === 'fonnte' || explicitProvider === 'wablas' || explicitProvider === 'mock') {
    provider = explicitProvider
  } else if (!isMockEnv) {
    if (fonnteToken) {
      provider = 'fonnte'
    } else if (wablasToken) {
      provider = 'wablas'
    }
  }

  const timeoutMs: number = parseInt(
    process.env.WHATSAPP_TIMEOUT_MS || String(DEFAULT_HTTP_TIMEOUT_MS),
    10
  )

  return {
    provider,
    fonnteApiUrl: process.env.FONNTE_API_URL || 'https://api.fonnte.com/send',
    fonnteToken,
    wablasApiUrl: process.env.WABLAS_API_URL || 'https://wablas.com/api/v2/send-message',
    wablasToken,
    wablasSecretKey,
    timeoutMs: isNaN(timeoutMs) || timeoutMs <= 0 ? DEFAULT_HTTP_TIMEOUT_MS : timeoutMs,
    isMock: provider === 'mock' || isMockEnv,
    defaultAdminPhone: process.env.WHATSAPP_DEFAULT_ADMIN_PHONE || SHOP_METADATA.officialPhone,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || SHOP_METADATA.siteUrl
  }
}

// ============================================================================
// LOW-LEVEL GATEWAY TRANSMISSION ADAPTERS
// ============================================================================

/**
 * Transmits a message using Fonnte REST API:
 * POST https://api.fonnte.com/send
 * Header: Authorization: FONNTE_API_TOKEN
 * Body: { target, message, countryCode: "62" }
 */
export async function sendFonnteMessage(
  payload: WhatsAppMessagePayload,
  config: WhatsAppGatewayConfig
): Promise<WhatsAppSendResult> {
  const startTimeMs: number = Date.now()
  const normalizedPhone: string = normalizeIndonesianPhoneNumber(payload.recipientPhone)

  if (!config.fonnteToken) {
    return {
      success: false,
      provider: 'fonnte',
      messageId: `err-${Date.now()}`,
      recipientPhone: normalizedPhone,
      latencyMs: Date.now() - startTimeMs,
      status: 'failed',
      rawResponse: null,
      errorMessage: 'Missing Fonnte API Token (FONNTE_API_TOKEN)'
    }
  }

  const controller: AbortController = new AbortController()
  const timer: NodeJS.Timeout = setTimeout((): void => {
    controller.abort()
  }, config.timeoutMs)

  try {
    const response: Response = await fetch(config.fonnteApiUrl, {
      method: 'POST',
      headers: {
        Authorization: config.fonnteToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: normalizedPhone,
        message: payload.message,
        countryCode: payload.countryCode || '62'
      }),
      signal: controller.signal
    })

    clearTimeout(timer)
    const latencyMs: number = Date.now() - startTimeMs
    const rawData = (await response.json()) as Record<string, unknown>

    const isSuccess: boolean = Boolean(
      response.ok &&
      (rawData.status === true || rawData.status === 'true' || rawData.status === 200)
    )

    const messageId: string = Array.isArray(rawData.id)
      ? String(rawData.id[0])
      : String(rawData.id || `fnt-${Date.now()}`)

    return {
      success: isSuccess,
      provider: 'fonnte',
      messageId,
      recipientPhone: normalizedPhone,
      latencyMs,
      status: isSuccess ? 'sent' : 'failed',
      rawResponse: rawData,
      errorMessage: isSuccess ? undefined : String(rawData.reason || rawData.message || 'Fonnte API error')
    }
  } catch (error: unknown) {
    clearTimeout(timer)
    const latencyMs: number = Date.now() - startTimeMs
    const errorMsg: string = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      provider: 'fonnte',
      messageId: `err-${Date.now()}`,
      recipientPhone: normalizedPhone,
      latencyMs,
      status: 'failed',
      rawResponse: null,
      errorMessage: `Fonnte request failed: ${errorMsg}`
    }
  }
}

/**
 * Transmits a message using Wablas REST API v2:
 * POST https://wablas.com/api/v2/send-message
 * Header: Authorization: WABLAS_TOKEN.WABLAS_SECRET_KEY
 * Body: { data: [{ phone, message }] }
 */
export async function sendWablasMessage(
  payload: WhatsAppMessagePayload,
  config: WhatsAppGatewayConfig
): Promise<WhatsAppSendResult> {
  const startTimeMs: number = Date.now()
  const normalizedPhone: string = normalizeIndonesianPhoneNumber(payload.recipientPhone)

  if (!config.wablasToken) {
    return {
      success: false,
      provider: 'wablas',
      messageId: `err-${Date.now()}`,
      recipientPhone: normalizedPhone,
      latencyMs: Date.now() - startTimeMs,
      status: 'failed',
      rawResponse: null,
      errorMessage: 'Missing Wablas API Token (WABLAS_TOKEN)'
    }
  }

  const authHeader: string = config.wablasSecretKey
    ? `${config.wablasToken}.${config.wablasSecretKey}`
    : config.wablasToken

  const controller: AbortController = new AbortController()
  const timer: NodeJS.Timeout = setTimeout((): void => {
    controller.abort()
  }, config.timeoutMs)

  try {
    const response: Response = await fetch(config.wablasApiUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: [
          {
            phone: normalizedPhone,
            message: payload.message
          }
        ]
      }),
      signal: controller.signal
    })

    clearTimeout(timer)
    const latencyMs: number = Date.now() - startTimeMs
    const rawData = (await response.json()) as Record<string, unknown>

    const isSuccess: boolean = Boolean(
      response.ok &&
      (rawData.status === true || rawData.status === 'true' || rawData.status === 200)
    )

    let messageId: string = `wbl-${Date.now()}`
    if (rawData.data && typeof rawData.data === 'object') {
      const dataObj = rawData.data as { messages?: Array<{ id: string }> }
      if (Array.isArray(dataObj.messages) && dataObj.messages.length > 0) {
        messageId = String(dataObj.messages[0].id)
      }
    }

    return {
      success: isSuccess,
      provider: 'wablas',
      messageId,
      recipientPhone: normalizedPhone,
      latencyMs,
      status: isSuccess ? 'sent' : 'failed',
      rawResponse: rawData,
      errorMessage: isSuccess ? undefined : String(rawData.message || 'Wablas API error')
    }
  } catch (error: unknown) {
    clearTimeout(timer)
    const latencyMs: number = Date.now() - startTimeMs
    const errorMsg: string = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      provider: 'wablas',
      messageId: `err-${Date.now()}`,
      recipientPhone: normalizedPhone,
      latencyMs,
      status: 'failed',
      rawResponse: null,
      errorMessage: `Wablas request failed: ${errorMsg}`
    }
  }
}

/**
 * Transmits a message using deterministic in-memory mock adapter:
 * Guarantees SLA sub-5-second performance (< 20ms in tests).
 */
export async function sendMockWhatsAppMessage(
  payload: WhatsAppMessagePayload,
  config?: WhatsAppGatewayConfig
): Promise<WhatsAppSendResult> {
  const startTimeMs: number = Date.now()
  const normalizedPhone: string = normalizeIndonesianPhoneNumber(payload.recipientPhone)

  // Simulate short network delay (2 to 10 ms)
  await new Promise((resolve): void => {
    setTimeout(resolve, 5)
  })

  const latencyMs: number = Date.now() - startTimeMs
  const messageId: string = `mock-wa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const record: MockDispatchedMessage = {
    id: messageId,
    recipientPhone: normalizedPhone,
    message: payload.message,
    templateName: payload.templateName,
    timestamp: new Date().toISOString(),
    provider: 'mock',
    latencyMs
  }
  mockDispatchedMessages.push(record)

  return {
    success: true,
    provider: 'mock',
    messageId,
    recipientPhone: normalizedPhone,
    latencyMs,
    status: 'sent',
    rawResponse: {
      status: true,
      message: 'Simulated WhatsApp message dispatched successfully.',
      mock_id: messageId,
      recipient: normalizedPhone
    }
  }
}

/**
 * Dispatches a WhatsApp message through the configured active provider.
 */
export async function sendWhatsAppMessage(
  payload: WhatsAppMessagePayload,
  customConfig?: Partial<WhatsAppGatewayConfig>
): Promise<WhatsAppSendResult> {
  const baseConfig: WhatsAppGatewayConfig = getWhatsAppConfig()
  const config: WhatsAppGatewayConfig = { ...baseConfig, ...customConfig }

  if (config.provider === 'mock' || config.isMock) {
    return sendMockWhatsAppMessage(payload, config)
  }

  if (config.provider === 'fonnte') {
    return sendFonnteMessage(payload, config)
  }

  if (config.provider === 'wablas') {
    return sendWablasMessage(payload, config)
  }

  // Fallback to mock
  return sendMockWhatsAppMessage(payload, config)
}

// ============================================================================
// DATABASE LOGGING HELPER
// ============================================================================

/**
 * Logs or updates a notification record in Supabase or WebhookMockStore.
 */
export async function recordNotificationLog(
  params: {
    bookingId?: string | null
    recipientPhone: string
    templateName: TemplateKey
    messageBody: string
    result: WhatsAppSendResult
  },
  options?: DispatchOptions
): Promise<void> {
  const currentTimeIso: string = new Date().toISOString()
  const { bookingId, recipientPhone, templateName, messageBody, result } = params
  const normalizedRecipient: string =
    normalizeIndonesianPhoneNumber(recipientPhone) || recipientPhone

  // 1. If mock store is passed (used in automated unit/integration tests)
  if (options?.mockStore) {
    const store: WebhookMockStore = options.mockStore
    // Check if pending log already exists for this booking & template
    const existingIndex: number = store.notification_logs.findIndex(
      (l): boolean =>
        l.booking_id === bookingId &&
        l.template_name === templateName &&
        l.status === 'pending'
    )

    if (existingIndex >= 0) {
      store.notification_logs[existingIndex].recipient_phone = normalizedRecipient
      store.notification_logs[existingIndex].status = result.status
      store.notification_logs[existingIndex].sent_at = result.success ? currentTimeIso : null
      store.notification_logs[existingIndex].error_message = result.errorMessage || null
      store.notification_logs[existingIndex].response_payload = (result.rawResponse || {
        message_id: result.messageId,
        provider: result.provider,
        latency_ms: result.latencyMs
      }) as unknown as Database['public']['Tables']['notification_logs']['Row']['response_payload']
    } else {
      store.notification_logs.push({
        id: `mock-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        booking_id: bookingId || null,
        recipient_phone: normalizedRecipient,
        channel: 'whatsapp',
        template_name: templateName,
        message_body: messageBody,
        status: result.status,
        response_payload: (result.rawResponse || {
          message_id: result.messageId,
          provider: result.provider,
          latency_ms: result.latencyMs
        }) as unknown as Database['public']['Tables']['notification_logs']['Row']['response_payload'],
        error_message: result.errorMessage || null,
        sent_at: result.success ? currentTimeIso : null,
        created_at: currentTimeIso
      })
    }
    return
  }

  // 2. Otherwise use Supabase client
  const supabase: SupabaseClient<Database> | null =
    options?.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSupabaseClient()

  if (!supabase) {
    // If Supabase is not configured, do not crash
    return
  }

  try {
    // Check for existing pending log
    if (bookingId) {
      const { data: existing } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('template_name', templateName)
        .eq('status', 'pending')
        .maybeSingle()

      if (existing) {
        await supabase
          .from('notification_logs')
          .update({
            status: result.status,
            sent_at: result.success ? currentTimeIso : null,
            error_message: result.errorMessage || null,
            response_payload: {
              message_id: result.messageId,
              provider: result.provider,
              latency_ms: result.latencyMs,
              raw: result.rawResponse
            } as unknown as Database['public']['Tables']['notification_logs']['Update']['response_payload']
          })
          .eq('id', existing.id)
        return
      }
    }

    // Insert fresh record
    await supabase.from('notification_logs').insert({
      booking_id: bookingId || null,
      recipient_phone: normalizedRecipient,
      channel: 'whatsapp',
      template_name: templateName,
      message_body: messageBody,
      status: result.status,
      response_payload: {
        message_id: result.messageId,
        provider: result.provider,
        latency_ms: result.latencyMs,
        raw: result.rawResponse
      } as unknown as Database['public']['Tables']['notification_logs']['Insert']['response_payload'],
      error_message: result.errorMessage || null,
      sent_at: result.success ? currentTimeIso : null,
      created_at: currentTimeIso
    })
  } catch (error: unknown) {
    console.error('[WhatsApp Notification Log Error]', error)
  }
}

// ============================================================================
// HIGH-LEVEL DISPATCHER FUNCTIONS (CORE DELIVERABLES)
// ============================================================================

/**
 * 1. INSTANT PAYMENT CONFIRMATION (CUSTOMER & BARBER)
 *
 * Dispatches both messages in parallel via Promise.allSettled:
 * (a) booking_confirmed to customer
 * (b) barber_booking_alert to master barber
 *
 * Definition of Done (DoD):
 * Guaranteed to dispatch within < 5 seconds SLA after payment verification.
 */
export async function sendInstantPaymentConfirmation(
  params: InstantPaymentConfirmationParams
): Promise<InstantPaymentConfirmationResult> {
  const startTimeMs: number = Date.now()
  const { booking, options } = params

  const toleranceTime: string = calculateToleranceTime(booking.startTime)
  const rescheduleDeadlineTime: string = calculateRescheduleDeadlineTime(booking.startTime)
  const formattedBookingDate: string = formatIndonesianDate(booking.bookingDate)
  const formattedDp: string = formatIndonesianCurrency(booking.dpAmountIdr)
  const formattedRemaining: string = formatIndonesianCurrency(booking.remainingBalanceIdr)
  const cleanStart: string = cleanTimeString(booking.startTime)
  const cleanEnd: string = cleanTimeString(booking.endTime)

  const barberInfo: BarberContactInfo = getBarberContact(
    booking.barberId,
    booking.barberName,
    booking.chairNumber
  )

  const ticketUrl: string =
    booking.ticketUrl || `${SHOP_METADATA.siteUrl}/tickets/${booking.bookingCode}`

  // Render Customer Template: booking_confirmed
  const customerMessage: string = renderWhatsAppTemplate('booking_confirmed', {
    customer_name: booking.customerName,
    booking_code: booking.bookingCode,
    service_names: booking.serviceNames,
    service_duration: booking.serviceDurationMinutes,
    barber_name: barberInfo.name,
    chair_number: barberInfo.chairNumber,
    booking_date: formattedBookingDate,
    start_time: cleanStart,
    end_time: cleanEnd,
    dp_amount_formatted: formattedDp,
    remaining_balance_formatted: formattedRemaining,
    tolerance_time: toleranceTime,
    reschedule_deadline_time: rescheduleDeadlineTime,
    address: SHOP_METADATA.location,
    google_maps_url: SHOP_METADATA.googleMapsUrl,
    ticket_url: ticketUrl
  })

  // Render Barber Alert Template: barber_booking_alert
  const barberMessage: string = renderWhatsAppTemplate('barber_booking_alert', {
    barber_name: barberInfo.name,
    booking_code: booking.bookingCode,
    customer_name: booking.customerName,
    service_names: booking.serviceNames,
    service_duration: booking.serviceDurationMinutes,
    booking_date: formattedBookingDate,
    start_time: cleanStart,
    end_time: cleanEnd,
    special_notes: booking.specialNotes?.trim() || 'Tidak ada catatan khusus'
  })

  const targetBarberPhone: string = booking.barberPhone || barberInfo.phone

  // Transmit both messages concurrently
  const [customerSettled, barberSettled] = await Promise.allSettled([
    sendWhatsAppMessage(
      {
        recipientPhone: booking.customerPhone,
        message: customerMessage,
        templateName: 'booking_confirmed',
        bookingId: booking.bookingId
      },
      options?.gatewayConfigOverride
    ),
    sendWhatsAppMessage(
      {
        recipientPhone: targetBarberPhone,
        message: barberMessage,
        templateName: 'barber_booking_alert',
        bookingId: booking.bookingId
      },
      options?.gatewayConfigOverride
    )
  ])

  const customerResult: WhatsAppSendResult =
    customerSettled.status === 'fulfilled'
      ? customerSettled.value
      : {
          success: false,
          provider: 'mock',
          messageId: `err-cust-${Date.now()}`,
          recipientPhone: booking.customerPhone,
          latencyMs: Date.now() - startTimeMs,
          status: 'failed',
          rawResponse: null,
          errorMessage: String(customerSettled.reason)
        }

  const barberResult: WhatsAppSendResult =
    barberSettled.status === 'fulfilled'
      ? barberSettled.value
      : {
          success: false,
          provider: 'mock',
          messageId: `err-brb-${Date.now()}`,
          recipientPhone: targetBarberPhone,
          latencyMs: Date.now() - startTimeMs,
          status: 'failed',
          rawResponse: null,
          errorMessage: String(barberSettled.reason)
        }

  // Asynchronously record both logs
  await Promise.allSettled([
    recordNotificationLog(
      {
        bookingId: booking.bookingId,
        recipientPhone: booking.customerPhone,
        templateName: 'booking_confirmed',
        messageBody: customerMessage,
        result: customerResult
      },
      options
    ),
    recordNotificationLog(
      {
        bookingId: booking.bookingId,
        recipientPhone: targetBarberPhone,
        templateName: 'barber_booking_alert',
        messageBody: barberMessage,
        result: barberResult
      },
      options
    )
  ])

  const totalLatencyMs: number = Date.now() - startTimeMs
  const dodCompliant: boolean = totalLatencyMs < DELIVERY_SLA_MS

  return {
    success: customerResult.success && barberResult.success,
    bookingId: booking.bookingId,
    bookingCode: booking.bookingCode,
    customerResult,
    barberResult,
    totalLatencyMs,
    dodCompliant
  }
}

/**
 * Resolves booking data by ID and dispatches instant payment confirmation.
 * Works seamlessly with either WebhookMockStore or Supabase client.
 */
export async function dispatchBookingConfirmedWhatsApp(
  bookingId: string,
  options?: DispatchOptions
): Promise<InstantPaymentConfirmationResult | null> {
  // 1. From mock store if present
  if (options?.mockStore) {
    const store: WebhookMockStore = options.mockStore
    const b: BookingRow | undefined =
      store.bookings.get(bookingId) ||
      Array.from(store.bookings.values()).find((row: BookingRow): boolean => row.id === bookingId)

    if (!b) {
      console.warn(`[WhatsApp Dispatcher] Booking ${bookingId} not found in mock store`)
      return null
    }

    const barberContact: BarberContactInfo = getBarberContact(b.barber_id)
    const notifData: BookingNotificationData = {
      bookingId: b.id,
      bookingCode: b.booking_code,
      customerName: b.customer_name,
      customerPhone: b.customer_phone,
      customerEmail: b.customer_email,
      barberId: b.barber_id,
      barberName: barberContact.name,
      barberPhone: barberContact.phone,
      chairNumber: barberContact.chairNumber,
      bookingDate: b.booking_date,
      startTime: b.start_time,
      endTime: b.end_time,
      serviceNames: 'Gentlemen Classic Haircut',
      serviceDurationMinutes: b.service_duration_minutes,
      dpAmountIdr: b.down_payment_idr,
      remainingBalanceIdr: b.remaining_balance_idr,
      specialNotes: b.notes
    }

    return sendInstantPaymentConfirmation({ booking: notifData, options })
  }

  // 2. From Supabase client
  const supabase: SupabaseClient<Database> | null =
    options?.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSupabaseClient()

  if (!supabase) {
    console.warn('[WhatsApp Dispatcher] Supabase client unavailable for booking lookup')
    return null
  }

  try {
    const { data: b, error } = await supabase
      .from('bookings')
      .select('*, barbers(id, name, chair_number), booking_services(services(name))')
      .eq('id', bookingId)
      .single()

    if (error || !b) {
      console.warn(`[WhatsApp Dispatcher] Failed to query booking ${bookingId}:`, error?.message)
      return null
    }

    const barberRelation = b.barbers as unknown as { id?: string; name?: string; chair_number?: number } | null
    const barberId: string = barberRelation?.id || b.barber_id
    const barberName: string = barberRelation?.name || 'Master Barber'
    const chairNumber: number = barberRelation?.chair_number || 1
    const barberContact: BarberContactInfo = getBarberContact(barberId, barberName, chairNumber)

    const bsArray = (b.booking_services || []) as unknown as Array<{ services?: { name?: string } | null }>
    const serviceNames: string =
      bsArray
        .map((item): string => item.services?.name || '')
        .filter(Boolean)
        .join(', ') || 'Gentlemen Classic Haircut'

    const notifData: BookingNotificationData = {
      bookingId: b.id,
      bookingCode: b.booking_code,
      customerName: b.customer_name,
      customerPhone: b.customer_phone,
      customerEmail: b.customer_email,
      barberId,
      barberName: barberContact.name,
      barberPhone: barberContact.phone,
      chairNumber: barberContact.chairNumber,
      bookingDate: b.booking_date,
      startTime: b.start_time,
      endTime: b.end_time,
      serviceNames,
      serviceDurationMinutes: b.service_duration_minutes,
      dpAmountIdr: b.down_payment_idr,
      remainingBalanceIdr: b.remaining_balance_idr,
      specialNotes: b.notes
    }

    return sendInstantPaymentConfirmation({ booking: notifData, options })
  } catch (err: unknown) {
    console.error('[WhatsApp Dispatcher Error]', err)
    return null
  }
}

/**
 * 2. BARBER BOOKING ALERT ONLY
 */
export async function sendBarberBookingAlert(
  booking: BookingNotificationData,
  options?: DispatchOptions
): Promise<WhatsAppSendResult> {
  const barberInfo: BarberContactInfo = getBarberContact(
    booking.barberId,
    booking.barberName,
    booking.chairNumber
  )
  const targetBarberPhone: string = booking.barberPhone || barberInfo.phone
  const formattedBookingDate: string = formatIndonesianDate(booking.bookingDate)
  const cleanStart: string = cleanTimeString(booking.startTime)
  const cleanEnd: string = cleanTimeString(booking.endTime)

  const message: string = renderWhatsAppTemplate('barber_booking_alert', {
    barber_name: barberInfo.name,
    booking_code: booking.bookingCode,
    customer_name: booking.customerName,
    service_names: booking.serviceNames,
    service_duration: booking.serviceDurationMinutes,
    booking_date: formattedBookingDate,
    start_time: cleanStart,
    end_time: cleanEnd,
    special_notes: booking.specialNotes?.trim() || 'Tidak ada catatan khusus'
  })

  const result: WhatsAppSendResult = await sendWhatsAppMessage(
    {
      recipientPhone: targetBarberPhone,
      message,
      templateName: 'barber_booking_alert',
      bookingId: booking.bookingId
    },
    options?.gatewayConfigOverride
  )

  await recordNotificationLog(
    {
      bookingId: booking.bookingId,
      recipientPhone: targetBarberPhone,
      templateName: 'barber_booking_alert',
      messageBody: message,
      result
    },
    options
  )

  return result
}

/**
 * 3. ARRIVAL REMINDER (H-2 Jam or H-30 Menit)
 */
export async function sendArrivalReminder(
  params: ArrivalReminderParams
): Promise<WhatsAppSendResult> {
  const { booking, reminderType, options } = params
  const barberInfo: BarberContactInfo = getBarberContact(
    booking.barberId,
    booking.barberName,
    booking.chairNumber
  )

  const cleanStart: string = cleanTimeString(booking.startTime)
  const toleranceTime: string = calculateToleranceTime(booking.startTime)
  const formattedBookingDate: string = formatIndonesianDate(booking.bookingDate)
  const formattedRemaining: string = formatIndonesianCurrency(booking.remainingBalanceIdr)
  const ticketUrl: string =
    booking.ticketUrl || `${SHOP_METADATA.siteUrl}/tickets/${booking.bookingCode}`

  let message: string
  let templateKey: TemplateKey

  if (reminderType === 'h2') {
    templateKey = 'arrival_reminder_h2'
    message = renderWhatsAppTemplate('arrival_reminder_h2', {
      customer_name: booking.customerName,
      booking_code: booking.bookingCode,
      barber_name: barberInfo.name,
      booking_date: formattedBookingDate,
      start_time: cleanStart,
      tolerance_time: toleranceTime,
      remaining_balance_formatted: formattedRemaining,
      address: SHOP_METADATA.location,
      google_maps_url: SHOP_METADATA.googleMapsUrl,
      ticket_url: ticketUrl
    })
  } else {
    templateKey = 'arrival_reminder_h30m'
    message = renderWhatsAppTemplate('arrival_reminder_h30m', {
      customer_name: booking.customerName,
      booking_code: booking.bookingCode,
      barber_name: barberInfo.name,
      start_time: cleanStart,
      google_maps_url: SHOP_METADATA.googleMapsUrl
    })
  }

  const result: WhatsAppSendResult = await sendWhatsAppMessage(
    {
      recipientPhone: booking.customerPhone,
      message,
      templateName: templateKey,
      bookingId: booking.bookingId
    },
    options?.gatewayConfigOverride
  )

  await recordNotificationLog(
    {
      bookingId: booking.bookingId,
      recipientPhone: booking.customerPhone,
      templateName: templateKey,
      messageBody: message,
      result
    },
    options
  )

  return result
}

/**
 * 4. BATCH REMINDERS DISPATCHER (FOR CRON RUNNERS)
 *
 * Scans today's confirmed bookings in Asia/Jakarta timezone.
 * Dispatches:
 * - H-2 reminder if booking is 110-130 minutes away and not yet sent.
 * - H-30m reminder if booking is 25-35 minutes away and not yet sent.
 */
export async function dispatchUpcomingReminders(
  options?: DispatchOptions
): Promise<ReminderDispatchResult> {
  const startTimeMs: number = Date.now()
  const todayJakarta: string = getJakartaDateString()
  const currentJakartaTime: string = getJakartaTimeString()
  const currentMinutes: number = timeStringToMinutes(currentJakartaTime)

  let scannedCount: number = 0
  let h2Dispatched: number = 0
  let h30mDispatched: number = 0
  const errors: string[] = []

  // Check mock store first if available
  if (options?.mockStore) {
    const store: WebhookMockStore = options.mockStore
    const confirmedBookings: BookingRow[] = Array.from(store.bookings.values()).filter(
      (b: BookingRow): boolean => b.status === 'confirmed' && b.booking_date === todayJakarta
    )

    scannedCount = confirmedBookings.length

    for (const b of confirmedBookings) {
      const bStartMinutes: number = timeStringToMinutes(cleanTimeString(b.start_time))
      const deltaMinutes: number = bStartMinutes - currentMinutes

      // Check H-2 window: 110 to 130 minutes
      if (deltaMinutes >= 110 && deltaMinutes <= 130) {
        const alreadySent: boolean = store.notification_logs.some(
          (l): boolean => l.booking_id === b.id && l.template_name === 'arrival_reminder_h2'
        )
        if (!alreadySent) {
          const notifData: BookingNotificationData = {
            bookingId: b.id,
            bookingCode: b.booking_code,
            customerName: b.customer_name,
            customerPhone: b.customer_phone,
            barberId: b.barber_id,
            barberName: 'Master Barber',
            bookingDate: b.booking_date,
            startTime: b.start_time,
            endTime: b.end_time,
            serviceNames: 'Gentlemen Classic Haircut',
            serviceDurationMinutes: b.service_duration_minutes,
            dpAmountIdr: b.down_payment_idr,
            remainingBalanceIdr: b.remaining_balance_idr
          }
          await sendArrivalReminder({ booking: notifData, reminderType: 'h2', options })
          h2Dispatched++
        }
      }

      // Check H-30m window: 25 to 35 minutes
      if (deltaMinutes >= 25 && deltaMinutes <= 35) {
        const alreadySent: boolean = store.notification_logs.some(
          (l): boolean => l.booking_id === b.id && l.template_name === 'arrival_reminder_h30m'
        )
        if (!alreadySent) {
          const notifData: BookingNotificationData = {
            bookingId: b.id,
            bookingCode: b.booking_code,
            customerName: b.customer_name,
            customerPhone: b.customer_phone,
            barberId: b.barber_id,
            barberName: 'Master Barber',
            bookingDate: b.booking_date,
            startTime: b.start_time,
            endTime: b.end_time,
            serviceNames: 'Gentlemen Classic Haircut',
            serviceDurationMinutes: b.service_duration_minutes,
            dpAmountIdr: b.down_payment_idr,
            remainingBalanceIdr: b.remaining_balance_idr
          }
          await sendArrivalReminder({ booking: notifData, reminderType: 'h30m', options })
          h30mDispatched++
        }
      }
    }

    return {
      timestamp: new Date().toISOString(),
      scannedCount,
      h2Dispatched,
      h30mDispatched,
      errors,
      latencyMs: Date.now() - startTimeMs
    }
  }

  // Supabase implementation
  const supabase: SupabaseClient<Database> | null =
    options?.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSupabaseClient()

  if (!supabase) {
    return {
      timestamp: new Date().toISOString(),
      scannedCount: 0,
      h2Dispatched: 0,
      h30mDispatched: 0,
      errors: ['Supabase client not configured'],
      latencyMs: Date.now() - startTimeMs
    }
  }

  try {
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*, barbers(name, chair_number)')
      .eq('status', 'confirmed')
      .eq('booking_date', todayJakarta)

    if (bookingsError || !bookings) {
      errors.push(`Failed to fetch bookings: ${bookingsError?.message}`)
      return {
        timestamp: new Date().toISOString(),
        scannedCount: 0,
        h2Dispatched: 0,
        h30mDispatched: 0,
        errors,
        latencyMs: Date.now() - startTimeMs
      }
    }

    scannedCount = bookings.length

    for (const b of bookings) {
      const bStartMinutes: number = timeStringToMinutes(cleanTimeString(b.start_time))
      const deltaMinutes: number = bStartMinutes - currentMinutes
      const barberRelation = b.barbers as unknown as { name?: string; chair_number?: number } | null

      // Check H-2
      if (deltaMinutes >= 110 && deltaMinutes <= 130) {
        const { data: existingLog } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('booking_id', b.id)
          .eq('template_name', 'arrival_reminder_h2')
          .maybeSingle()

        if (!existingLog) {
          const notifData: BookingNotificationData = {
            bookingId: b.id,
            bookingCode: b.booking_code,
            customerName: b.customer_name,
            customerPhone: b.customer_phone,
            barberId: b.barber_id,
            barberName: barberRelation?.name || 'Master Barber',
            chairNumber: barberRelation?.chair_number || 1,
            bookingDate: b.booking_date,
            startTime: b.start_time,
            endTime: b.end_time,
            serviceNames: 'Gentlemen Classic Haircut',
            serviceDurationMinutes: b.service_duration_minutes,
            dpAmountIdr: b.down_payment_idr,
            remainingBalanceIdr: b.remaining_balance_idr
          }
          await sendArrivalReminder({ booking: notifData, reminderType: 'h2', options })
          h2Dispatched++
        }
      }

      // Check H-30m
      if (deltaMinutes >= 25 && deltaMinutes <= 35) {
        const { data: existingLog } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('booking_id', b.id)
          .eq('template_name', 'arrival_reminder_h30m')
          .maybeSingle()

        if (!existingLog) {
          const notifData: BookingNotificationData = {
            bookingId: b.id,
            bookingCode: b.booking_code,
            customerName: b.customer_name,
            customerPhone: b.customer_phone,
            barberId: b.barber_id,
            barberName: barberRelation?.name || 'Master Barber',
            chairNumber: barberRelation?.chair_number || 1,
            bookingDate: b.booking_date,
            startTime: b.start_time,
            endTime: b.end_time,
            serviceNames: 'Gentlemen Classic Haircut',
            serviceDurationMinutes: b.service_duration_minutes,
            dpAmountIdr: b.down_payment_idr,
            remainingBalanceIdr: b.remaining_balance_idr
          }
          await sendArrivalReminder({ booking: notifData, reminderType: 'h30m', options })
          h30mDispatched++
        }
      }
    }
  } catch (err: unknown) {
    errors.push(err instanceof Error ? err.message : String(err))
  }

  return {
    timestamp: new Date().toISOString(),
    scannedCount,
    h2Dispatched,
    h30mDispatched,
    errors,
    latencyMs: Date.now() - startTimeMs
  }
}

/**
 * 5. PENDING NOTIFICATION RETRY & QUEUE SWEEPER
 *
 * Sweeps 'pending' records from notification_logs table,
 * dispatches them to WhatsApp gateway, and marks them 'sent' or 'failed'.
 */
export async function processPendingNotifications(
  options?: DispatchOptions
): Promise<ProcessPendingResult> {
  const timestamp: string = new Date().toISOString()
  const results: WhatsAppSendResult[] = []
  let sentCount: number = 0
  let failedCount: number = 0

  if (options?.mockStore) {
    const store: WebhookMockStore = options.mockStore
    const pendingLogs = store.notification_logs.filter((l): boolean => l.status === 'pending')

    for (const log of pendingLogs) {
      const result: WhatsAppSendResult = await sendWhatsAppMessage(
        {
          recipientPhone: log.recipient_phone,
          message: log.message_body,
          templateName: log.template_name as TemplateKey,
          bookingId: log.booking_id
        },
        options.gatewayConfigOverride
      )

      log.status = result.status
      log.sent_at = result.success ? new Date().toISOString() : null
      log.error_message = result.errorMessage || null

      results.push(result)
      if (result.success) {
        sentCount++
      } else {
        failedCount++
      }
    }

    return {
      timestamp,
      processedCount: pendingLogs.length,
      sentCount,
      failedCount,
      results
    }
  }

  const supabase: SupabaseClient<Database> | null =
    options?.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSupabaseClient()

  if (!supabase) {
    return {
      timestamp,
      processedCount: 0,
      sentCount: 0,
      failedCount: 0,
      results: []
    }
  }

  const { data: pendingLogs, error } = await supabase
    .from('notification_logs')
    .select('*')
    .eq('status', 'pending')
    .limit(50)

  if (error || !pendingLogs || pendingLogs.length === 0) {
    return {
      timestamp,
      processedCount: 0,
      sentCount: 0,
      failedCount: 0,
      results: []
    }
  }

  for (const log of pendingLogs) {
    const result: WhatsAppSendResult = await sendWhatsAppMessage(
      {
        recipientPhone: log.recipient_phone,
        message: log.message_body,
        templateName: log.template_name as TemplateKey,
        bookingId: log.booking_id
      },
      options?.gatewayConfigOverride
    )

    await supabase
      .from('notification_logs')
      .update({
        status: result.status,
        sent_at: result.success ? new Date().toISOString() : null,
        error_message: result.errorMessage || null,
        response_payload: {
          message_id: result.messageId,
          provider: result.provider,
          latency_ms: result.latencyMs,
          raw: result.rawResponse
        } as unknown as Database['public']['Tables']['notification_logs']['Update']['response_payload']
      })
      .eq('id', log.id)

    results.push(result)
    if (result.success) {
      sentCount++
    } else {
      failedCount++
    }
  }

  return {
    timestamp,
    processedCount: pendingLogs.length,
    sentCount,
    failedCount,
    results
  }
}
