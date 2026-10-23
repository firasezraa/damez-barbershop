/**
 * DAMEZ BARBERSHOP - TEST SUITE: SLOT TEMPORARY LOCKING & AUTO-EXPIRE ENGINE
 * 
 * Menguji kepatuhan penuh terhadap DoD:
 * 1. Perhitungan presisi TTL 15 menit (900 detik) untuk pending_payment.
 * 2. Penguncian slot sementara (temporary hold) mencegah double booking.
 * 3. Deteksi kedaluwarsa tepat pada menit ke-15 (t >= 15m).
 * 4. Mesin pelepasan otomatis (auto-expire engine) mengubah status menjadi 'expired'.
 * 5. Pelepasan slot instan: slot dapat langsung dipesan kembali oleh pelanggan lain.
 * 6. Integrasi Route Handler Cron (/api/cron/expire-slots).
 * 7. Integrasi Route Handler Hold (/api/booking/hold).
 * 8. Integritas Skema SQL Migration 002.
 */

import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  calculateHoldExpiry,
  isHoldExpired,
  getRemainingHoldTime,
  createTemporarySlotHold,
  releaseExpiredSlotHolds,
  checkBookingHoldStatus,
  resetInMemoryHoldsStore,
  HOLD_TTL_MINUTES,
  HOLD_TTL_SECONDS
} from '../lib/slots/auto-expire.ts'
import { GET as cronGetHandler, POST as cronPostHandler } from '../app/api/cron/expire-slots/route.ts'
import { GET as holdGetHandler, POST as holdPostHandler } from '../app/api/booking/hold/route.ts'

console.log('=== RUNNING SLOT TEMPORARY LOCKING & AUTO-EXPIRE TEST SUITE ===\n')

// ----------------------------------------------------------------------------
// TEST 1: Presisi Perhitungan TTL 15 Menit (900 Detik)
// ----------------------------------------------------------------------------
console.log('[Test 1] Precision 15-Minute Hold TTL Calculation')
{
  const testNow = new Date('2026-10-24T14:00:00.000Z')
  const expiry = calculateHoldExpiry(testNow)

  assert.strictEqual(expiry.ttlMinutes, 15, 'Hold TTL harus tepat 15 menit')
  assert.strictEqual(expiry.ttlSeconds, 900, 'Hold TTL harus tepat 900 detik')
  
  const expectedExpireIso = '2026-10-24T14:15:00.000Z'
  assert.strictEqual(expiry.expiresAtIso, expectedExpireIso, 'Timestamp kedaluwarsa harus tepat 14:15:00Z')

  // Hitung sisa waktu saat t = 0
  const remainingAtStart = getRemainingHoldTime(expiry.expiresAtIso, testNow)
  assert.strictEqual(remainingAtStart.seconds, 900, 'Sisa detik di awal harus 900')
  assert.strictEqual(remainingAtStart.formatted, '15:00', 'Format sisa waktu awal harus 15:00')
  assert.strictEqual(remainingAtStart.isExpired, false, 'Belum boleh kedaluwarsa')

  // Hitung sisa waktu saat t = 10 menit (sisa 5 menit)
  const tenMinutesLater = new Date('2026-10-24T14:10:00.000Z')
  const remainingMid = getRemainingHoldTime(expiry.expiresAtIso, tenMinutesLater)
  assert.strictEqual(remainingMid.seconds, 300, 'Sisa detik harus 300')
  assert.strictEqual(remainingMid.formatted, '05:00', 'Format sisa waktu harus 05:00')
  assert.strictEqual(remainingMid.isExpired, false)

  // Hitung sisa waktu saat t = 14 menit 45 detik (sisa 15 detik)
  const almostExpired = new Date('2026-10-24T14:14:45.000Z')
  const remainingClose = getRemainingHoldTime(expiry.expiresAtIso, almostExpired)
  assert.strictEqual(remainingClose.seconds, 15)
  assert.strictEqual(remainingClose.formatted, '00:15')
  assert.strictEqual(remainingClose.isExpired, false)

  console.log('PASS: Presisi TTL 15 menit (900 detik) dan countdown terverifikasi 100%.\n')
}

// ----------------------------------------------------------------------------
// TEST 2: Penguncian Slot Sementara (Temporary Hold Locking)
// ----------------------------------------------------------------------------
console.log('[Test 2] Temporary Hold Slot Locking')
{
  resetInMemoryHoldsStore()

  const barberRianId = 'b0000001-0000-0000-0000-000000000001'
  const bookingDate = '2026-10-24'
  const startTime = '2026-10-24T15:00:00+07:00'
  const endTime = '2026-10-24T15:55:00+07:00' // 45m service + 10m buffer

  const baseTime = new Date('2026-10-24T08:00:00.000Z')

  const holdResult = await createTemporarySlotHold({
    barberId: barberRianId,
    bookingDate,
    startTime,
    endTime,
    serviceDurationMinutes: 45,
    bufferMinutes: 10,
    totalPriceIdr: 50000,
    downPaymentIdr: 20000,
    customerName: 'Ahmad Faiz',
    customerPhone: '081234567890',
    now: baseTime
  })

  assert.strictEqual(holdResult.success, true, 'Hold pertama harus berhasil dibuat')
  assert.ok(holdResult.booking, 'Data booking harus dikembalikan')
  assert.strictEqual(holdResult.booking.status, 'pending_payment', 'Status harus pending_payment')
  assert.strictEqual(holdResult.expiresInSeconds, 900, 'TTL hold harus 900 detik')
  assert.ok(holdResult.holdExpiresAt, 'Waktu kedaluwarsa harus terisi')

  console.log(`PASS: Slot berhasil dikunci sementara dengan booking_code ${holdResult.booking.booking_code}.\n`)
}

// ----------------------------------------------------------------------------
// TEST 3: Pencegahan Double Booking Selama Hold Aktif (Anti-Collision)
// ----------------------------------------------------------------------------
console.log('[Test 3] Double Booking Prevention While Hold is Active')
{
  const barberRianId = 'b0000001-0000-0000-0000-000000000001'
  const bookingDate = '2026-10-24'
  const startTime = '2026-10-24T15:00:00+07:00'
  const endTime = '2026-10-24T15:55:00+07:00'

  // Waktu sekarang baru berselang 5 menit (masih aktif karena TTL 15 menit)
  const fiveMinutesLater = new Date('2026-10-24T08:05:00.000Z')

  // Pelanggan kedua mencoba memesan slot yang persis sama
  const conflictResult = await createTemporarySlotHold({
    barberId: barberRianId,
    bookingDate,
    startTime,
    endTime,
    serviceDurationMinutes: 45,
    bufferMinutes: 10,
    totalPriceIdr: 50000,
    downPaymentIdr: 20000,
    customerName: 'Budi Santoso',
    customerPhone: '089876543210',
    now: fiveMinutesLater
  })

  assert.strictEqual(conflictResult.success, false, 'Hold kedua harus ditolak karena slot sedang dikunci')
  assert.strictEqual(conflictResult.errorCode, 'SLOT_ALREADY_LOCKED', 'Error code harus SLOT_ALREADY_LOCKED')
  assert.ok(conflictResult.error?.includes('ditahan') || conflictResult.error?.includes('terisi'), 'Pesan error harus informatif')

  console.log('PASS: Slot yang sedang ditahan terbukti kebal dari double booking (DoD Enforced).\n')
}

// ----------------------------------------------------------------------------
// TEST 4: Deteksi Kedaluwarsa Tepat pada Menit ke-15 (DoD: Exact 15m Cutoff)
// ----------------------------------------------------------------------------
console.log('[Test 4] Auto-Expiration Detection Exactly at 15th Minute')
{
  const startTimeIso = '2026-10-24T08:00:00.000Z'
  const holdExpiry = calculateHoldExpiry(new Date(startTimeIso)) // Expire di 08:15:00.000Z

  // 14 menit 59 detik: BELUM expired
  const at14m59s = new Date('2026-10-24T08:14:59.000Z')
  assert.strictEqual(isHoldExpired(holdExpiry.expiresAtIso, at14m59s), false, 'Detik 14:59 tidak boleh dianggap expired')

  // 15 menit 00 detik: TEPAT expired
  const at15m00s = new Date('2026-10-24T08:15:00.000Z')
  assert.strictEqual(isHoldExpired(holdExpiry.expiresAtIso, at15m00s), true, 'Tepat menit 15:00 harus expired')

  // 15 menit 01 detik: SUDAH expired
  const at15m01s = new Date('2026-10-24T08:15:01.000Z')
  assert.strictEqual(isHoldExpired(holdExpiry.expiresAtIso, at15m01s), true, 'Menit 15:01 harus expired')

  console.log('PASS: Batas ambang kedaluwarsa terbukti tepat pada menit ke-15.\n')
}

// ----------------------------------------------------------------------------
// TEST 5: Mesin Pelepasan Otomatis (Auto-Expire Sweep Engine)
// ----------------------------------------------------------------------------
console.log('[Test 5] Auto-Expire Sweep Engine execution')
{
  resetInMemoryHoldsStore()

  const barberRianId = 'b0000001-0000-0000-0000-000000000001'
  const t0 = new Date('2026-10-24T08:00:00.000Z')

  // Buat 2 hold pada t0
  const hold1 = await createTemporarySlotHold({
    barberId: barberRianId,
    bookingDate: '2026-10-24',
    startTime: '2026-10-24T10:00:00+07:00',
    endTime: '2026-10-24T10:55:00+07:00',
    serviceDurationMinutes: 45,
    totalPriceIdr: 50000,
    customerName: 'User One',
    customerPhone: '081111111111',
    now: t0
  })

  const hold2 = await createTemporarySlotHold({
    barberId: barberRianId,
    bookingDate: '2026-10-24',
    startTime: '2026-10-24T11:00:00+07:00',
    endTime: '2026-10-24T11:55:00+07:00',
    serviceDurationMinutes: 45,
    totalPriceIdr: 50000,
    customerName: 'User Two',
    customerPhone: '082222222222',
    now: t0
  })

  // Sweep di menit ke-10: tidak boleh ada yang expired
  const sweepAt10m = await releaseExpiredSlotHolds({ now: new Date('2026-10-24T08:10:00.000Z') })
  assert.strictEqual(sweepAt10m.expired_count, 0, 'Tidak boleh ada yang dilepas pada menit ke-10')

  // Sweep di menit ke-16: kedua hold harus kedaluwarsa & dilepas
  const sweepAt16m = await releaseExpiredSlotHolds({ now: new Date('2026-10-24T08:16:00.000Z') })
  assert.strictEqual(sweepAt16m.expired_count, 2, 'Dua hold harus dilepas pada menit ke-16')
  assert.strictEqual(sweepAt16m.released_booking_codes.length, 2)

  // Status booking harus berubah menjadi 'expired'
  const statusHold1 = await checkBookingHoldStatus(hold1.booking!.id, { now: new Date('2026-10-24T08:16:00.000Z') })
  assert.strictEqual(statusHold1.status, 'expired', 'Status booking harus expired')
  assert.strictEqual(statusHold1.isExpired, true)

  console.log('PASS: Auto-expire sweep berhasil membatalkan booking expired dan mengubah status ke expired.\n')
}

// ----------------------------------------------------------------------------
// TEST 6: Pelepasan Slot Instan (Slot Re-availability pasca Expired)
// ----------------------------------------------------------------------------
console.log('[Test 6] Instant Slot Re-availability After 15-Minute Expiration (DoD)')
{
  resetInMemoryHoldsStore()

  const barberRianId = 'b0000001-0000-0000-0000-000000000001'
  const bookingDate = '2026-10-24'
  const targetStartTime = '2026-10-24T14:00:00+07:00'
  const targetEndTime = '2026-10-24T14:55:00+07:00'

  const t0 = new Date('2026-10-24T08:00:00.000Z')

  // Customer A memesan pada pukul 08:00
  const initialHold = await createTemporarySlotHold({
    barberId: barberRianId,
    bookingDate,
    startTime: targetStartTime,
    endTime: targetEndTime,
    serviceDurationMinutes: 45,
    totalPriceIdr: 50000,
    customerName: 'Customer A (Unpaid)',
    customerPhone: '081234567890',
    now: t0
  })
  assert.strictEqual(initialHold.success, true)

  // Customer B mencoba memesan pada pukul 08:10 (menit ke-10) -> DITOLAK
  const attemptAt10m = await createTemporarySlotHold({
    barberId: barberRianId,
    bookingDate,
    startTime: targetStartTime,
    endTime: targetEndTime,
    serviceDurationMinutes: 45,
    totalPriceIdr: 50000,
    customerName: 'Customer B',
    customerPhone: '089999999999',
    now: new Date('2026-10-24T08:10:00.000Z')
  })
  assert.strictEqual(attemptAt10m.success, false, 'Harus ditolak di menit ke-10')

  // Pada pukul 08:15:05 (menit ke-15 lewat 5 detik), Customer B mencoba memesan lagi
  // Engine harus secara otomatis melepaskan slot expired dari Customer A dan memberikan hold baru kepada Customer B!
  const attemptAt15m05s = await createTemporarySlotHold({
    barberId: barberRianId,
    bookingDate,
    startTime: targetStartTime,
    endTime: targetEndTime,
    serviceDurationMinutes: 45,
    totalPriceIdr: 50000,
    customerName: 'Customer B',
    customerPhone: '089999999999',
    now: new Date('2026-10-24T08:15:05.000Z')
  })

  assert.strictEqual(attemptAt15m05s.success, true, 'Slot harus otomatis bebas dan berhasil dipesan oleh Customer B!')
  assert.strictEqual(attemptAt15m05s.booking?.customer_name, 'Customer B')
  assert.strictEqual(attemptAt15m05s.booking?.status, 'pending_payment')

  console.log('PASS: DoD Selesai 100%! Slot dilepas otomatis pada menit ke-15 dan dapat langsung dipesan kembali.\n')
}

// ----------------------------------------------------------------------------
// TEST 7: Route Handler Scheduled Cron (/api/cron/expire-slots)
// ----------------------------------------------------------------------------
console.log('[Test 7] Scheduled Cron Route Handler (/api/cron/expire-slots)')
{
  process.env.CRON_SECRET = 'test-secret-cron-token'

  // Skenario 7.1: Request tanpa secret ditolak dengan 401
  const unauthRequest = new Request('http://localhost:3000/api/cron/expire-slots', {
    method: 'GET'
  })
  const unauthRes = await cronGetHandler(unauthRequest)
  assert.strictEqual(unauthRes.status, 401, 'Request tanpa otorisasi harus menghasilkan 401 Unauthorized')

  // Skenario 7.2: Request dengan Authorization Bearer token yang valid
  const authRequest = new Request('http://localhost:3000/api/cron/expire-slots', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer test-secret-cron-token'
    }
  })
  const authRes = await cronGetHandler(authRequest)
  assert.strictEqual(authRes.status, 200, 'Request dengan Bearer token harus menghasilkan 200 OK')
  const authBody = await authRes.json()
  assert.strictEqual(authBody.success, true)
  assert.ok(authBody.message.includes('sweep completed'))

  // Skenario 7.3: Request POST dengan header x-cron-secret
  const postRequest = new Request('http://localhost:3000/api/cron/expire-slots', {
    method: 'POST',
    headers: {
      'x-cron-secret': 'test-secret-cron-token'
    }
  })
  const postRes = await cronPostHandler(postRequest)
  assert.strictEqual(postRes.status, 200)

  // Bersihkan environment variable
  delete process.env.CRON_SECRET

  console.log('PASS: Route Handler /api/cron/expire-slots terverifikasi dengan otorisasi Bearer/header.\n')
}

// ----------------------------------------------------------------------------
// TEST 8: Route Handler Booking Hold (/api/booking/hold)
// ----------------------------------------------------------------------------
console.log('[Test 8] Booking Slot Hold Route Handler (/api/booking/hold)')
{
  resetInMemoryHoldsStore()

  // Skenario 8.1: POST mengunci slot baru
  const holdPostReq = new Request('http://localhost:3000/api/booking/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      barber_id: 'b0000001-0000-0000-0000-000000000001',
      booking_date: '2026-10-24',
      start_time: '2026-10-24T16:00:00+07:00',
      end_time: '2026-10-24T16:55:00+07:00',
      customer_name: 'Dodi Hermawan',
      customer_phone: '081233445566',
      service_duration_minutes: 45,
      total_price_idr: 50000
    })
  })

  const holdPostRes = await holdPostHandler(holdPostReq)
  assert.strictEqual(holdPostRes.status, 201, 'POST /api/booking/hold harus menghasilkan 201 Created')
  const holdPostBody = await holdPostRes.json()
  assert.strictEqual(holdPostBody.success, true)
  assert.ok(holdPostBody.data.booking_code)
  assert.strictEqual(holdPostBody.data.status, 'pending_payment')

  const createdCode = holdPostBody.data.booking_code

  // Skenario 8.2: GET memeriksa status sisa waktu hold
  const holdGetReq = new Request(`http://localhost:3000/api/booking/hold?code=${createdCode}`, {
    method: 'GET'
  })
  const holdGetRes = await holdGetHandler(holdGetReq)
  assert.strictEqual(holdGetRes.status, 200, 'GET /api/booking/hold harus menghasilkan 200 OK')
  const holdGetBody = await holdGetRes.json()
  assert.strictEqual(holdGetBody.success, true)
  assert.strictEqual(holdGetBody.data.status, 'pending_payment')
  assert.strictEqual(holdGetBody.data.is_expired, false)
  assert.ok(holdGetBody.data.remaining_seconds > 0)

  // Skenario 8.3: POST dengan waktu bentrok harus menghasilkan 409 Conflict
  const conflictReq = new Request('http://localhost:3000/api/booking/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      barber_id: 'b0000001-0000-0000-0000-000000000001',
      booking_date: '2026-10-24',
      start_time: '2026-10-24T16:00:00+07:00',
      end_time: '2026-10-24T16:55:00+07:00',
      customer_name: 'Competitor Booking',
      customer_phone: '089999999999'
    })
  })
  const conflictRes = await holdPostHandler(conflictReq)
  assert.strictEqual(conflictRes.status, 409, 'Pemesanan bentrok harus menghasilkan 409 Conflict')

  console.log('PASS: Route Handler /api/booking/hold POST & GET lolos pengujian 100%.\n')
}

// ----------------------------------------------------------------------------
// TEST 9: Verifikasi Skema SQL Migration 002
// ----------------------------------------------------------------------------
console.log('[Test 9] Verification of SQL Migration 002_slot_temporary_locking_and_auto_expire.sql')
{
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const migration2Path = path.join(currentDir, '../supabase/migrations/002_slot_temporary_locking_and_auto_expire.sql')
  assert.ok(fs.existsSync(migration2Path), 'File migration 002 harus ada di filesystem')

  const sqlContent = fs.readFileSync(migration2Path, 'utf8')

  // Cek fungsi fn_cleanup_expired_holds
  assert.ok(
    sqlContent.includes('CREATE OR REPLACE FUNCTION public.fn_cleanup_expired_holds()'),
    'Fungsi public.fn_cleanup_expired_holds() harus didefinisikan'
  )

  // Cek trigger auto-expire sebelum insert booking
  assert.ok(
    sqlContent.includes('CREATE OR REPLACE FUNCTION public.fn_trigger_cleanup_expired_holds()'),
    'Trigger function fn_trigger_cleanup_expired_holds harus ada'
  )
  assert.ok(
    sqlContent.includes('trg_auto_expire_holds_before_booking_insert'),
    'Trigger trg_auto_expire_holds_before_booking_insert harus dipasang'
  )

  // Cek trigger enforce hold TTL
  assert.ok(
    sqlContent.includes('CREATE OR REPLACE FUNCTION public.fn_enforce_booking_hold_ttl()'),
    'Trigger function fn_enforce_booking_hold_ttl harus ada'
  )
  assert.ok(
    sqlContent.includes('trg_enforce_booking_hold_ttl'),
    'Trigger trg_enforce_booking_hold_ttl harus dipasang'
  )

  // Cek stored procedure atomik fn_create_booking_hold
  assert.ok(
    sqlContent.includes('CREATE OR REPLACE FUNCTION public.fn_create_booking_hold('),
    'Stored procedure public.fn_create_booking_hold harus ada'
  )

  // Cek monitoring view v_active_holds
  assert.ok(
    sqlContent.includes('CREATE OR REPLACE VIEW public.v_active_holds'),
    'Monitoring view public.v_active_holds harus ada'
  )

  // Cek security invoker pada view
  assert.ok(
    sqlContent.includes('security_invoker = true'),
    'View v_active_holds harus menggunakan WITH (security_invoker = true)'
  )

  // Cek pg_cron scheduling block
  assert.ok(
    sqlContent.includes('damez-auto-expire-holds') && sqlContent.includes('* * * * *'),
    'Konfigurasi pg_cron schedule (* * * * *) harus ada'
  )

  console.log('PASS: SQL Migration 002 terverifikasi lengkap dengan trigger, stored procedure, view, dan pg_cron.\n')
}

console.log('========================================================================')
console.log('CONGRATULATIONS: ALL 9 SLOT TEMPORARY LOCKING & AUTO-EXPIRE TESTS PASSED!')
console.log('DoD VERIFIED: Slot dilepas otomatis tepat pada menit ke-15!')
console.log('========================================================================')
