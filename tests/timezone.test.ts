/**
 * UNIT TEST: Asia/Jakarta Timezone Utilities
 * Memverifikasi ketepatan komputasi tanggal, waktu, offset +07:00, dan interval overlap.
 */

import {
  JAKARTA_TIMEZONE,
  JAKARTA_OFFSET_HOURS,
  getJakartaDateTimeParts,
  getJakartaDateString,
  getJakartaTimeString,
  getJakartaDayOfWeek,
  timeStringToMinutes,
  minutesToTimeString,
  createJakartaIsoString,
  isIntervalOverlapping,
  parseBookingToJakartaMinutes
} from '../lib/utils/timezone.ts';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

console.log('--- RUNNING TIMEZONE UTILITIES TEST SUITE ---');

// 1. Verifikasi Constants
assert(JAKARTA_TIMEZONE === 'Asia/Jakarta', 'Timezone harus Asia/Jakarta');
assert(JAKARTA_OFFSET_HOURS === 7, 'Offset WIB harus 7 jam');

// 2. Verifikasi Tanggal & Waktu di Boundary UTC Midnight
// Contoh: UTC 2026-10-23T20:00:00Z -> WIB (+7) adalah 2026-10-24T03:00:00
const testDateUtcBoundary: Date = new Date('2026-10-23T20:00:00.000Z');
const jakartaParts = getJakartaDateTimeParts(testDateUtcBoundary);

assert(jakartaParts.year === 2026, 'Tahun Jakarta harus 2026');
assert(jakartaParts.month === 10, 'Bulan Jakarta harus 10');
assert(jakartaParts.day === 24, 'Hari Jakarta harus 24 (bukan 23)');
assert(jakartaParts.hour === 3, 'Jam Jakarta harus 3');
assert(jakartaParts.minute === 0, 'Menit Jakarta harus 0');

const jakartaDateStr: string = getJakartaDateString(testDateUtcBoundary);
assert(jakartaDateStr === '2026-10-24', `Tanggal Jakarta harus 2026-10-24, didapat: ${jakartaDateStr}`);

const jakartaTimeStr: string = getJakartaTimeString(testDateUtcBoundary);
assert(jakartaTimeStr === '03:00', `Jam Jakarta harus 03:00, didapat: ${jakartaTimeStr}`);

// 3. Verifikasi Day of Week
// 2026-10-24 adalah hari Sabtu (Saturday = 6)
// 2026-10-25 adalah hari Minggu (Sunday = 0)
// 2026-10-26 adalah hari Senin (Monday = 1)
assert(getJakartaDayOfWeek('2026-10-24') === 6, '2026-10-24 harus Sabtu (6)');
assert(getJakartaDayOfWeek('2026-10-25') === 0, '2026-10-25 harus Minggu (0)');
assert(getJakartaDayOfWeek('2026-10-26') === 1, '2026-10-26 harus Senin (1)');
assert(getJakartaDayOfWeek('2026-10-27') === 2, '2026-10-27 harus Selasa (2)');

// 4. Verifikasi Konversi Jam <-> Menit
assert(timeStringToMinutes('10:00') === 600, '10:00 = 600 menit');
assert(timeStringToMinutes('12:55') === 775, '12:55 = 775 menit');
assert(timeStringToMinutes('21:00') === 1260, '21:00 = 1260 menit');

assert(minutesToTimeString(600) === '10:00', '600 menit = 10:00');
assert(minutesToTimeString(775) === '12:55', '775 menit = 12:55');
assert(minutesToTimeString(1260) === '21:00', '1260 menit = 21:00');

// 5. Verifikasi ISO String Generator
const isoString: string = createJakartaIsoString('2026-10-24', '14:30');
assert(isoString === '2026-10-24T14:30:00+07:00', `ISO format mismatch: ${isoString}`);

// 6. Verifikasi Interval Overlapping
// [600, 655) dan [655, 710) TIDAK tumpang tindih (bersebelahan tepat)
assert(!isIntervalOverlapping(600, 655, 655, 710), 'Interval bersebelahan tidak boleh tumpang tindih');
// [600, 660) dan [655, 710) TUMPANG TINDIH 5 menit (655-660)
assert(isIntervalOverlapping(600, 660, 655, 710), 'Interval tumpang tindih 5 menit harus terdeteksi');
// [720, 775) dan [700, 750) TUMPANG TINDIH
assert(isIntervalOverlapping(720, 775, 700, 750), 'Overlap parsial harus terdeteksi');

// 7. Verifikasi Parse Booking ISO to Jakarta Minutes
const bookingParsed = parseBookingToJakartaMinutes(
  '2026-10-24T14:00:00+07:00',
  '2026-10-24T14:55:00+07:00',
  '2026-10-24'
);
assert(bookingParsed !== null, 'Booking parsed tidak boleh null');
assert(bookingParsed!.startMinutes === 840, `Start minutes harus 840 (14:00), didapat: ${bookingParsed!.startMinutes}`);
assert(bookingParsed!.endMinutes === 895, `End minutes harus 895 (14:55), didapat: ${bookingParsed!.endMinutes}`);

// Booking di tanggal berbeda harus return null
const bookingDifferentDate = parseBookingToJakartaMinutes(
  '2026-10-25T14:00:00+07:00',
  '2026-10-25T14:55:00+07:00',
  '2026-10-24'
);
assert(bookingDifferentDate === null, 'Booking di tanggal berbeda harus menghasilkan null');

console.log('PASS: All 7 Timezone test cases executed and passed with 100% precision!');
