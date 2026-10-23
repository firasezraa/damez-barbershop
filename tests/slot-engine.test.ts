/**
 * UNIT TEST: Production Slot Generation Engine
 * Memverifikasi ketepatan logika penentuan slot, buffer sanitasi 10 menit,
 * pengecualian jam istirahat bergantian, deteksi bentrok booking,
 * dan pelepasan otomatis status expired pending_payment.
 */

import {
  calculateBarberSlots,
  calculateAvailableSlotsForDate
} from '../lib/slots/engine.ts';
import type {
  BarberProfile,
  ExistingBooking,
  AvailableSlot,
  AggregatedSlotResult
} from '../lib/slots/engine.ts';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

console.log('--- RUNNING SLOT ENGINE TEST SUITE ---');

// Mock Data 3 Master Barber Damez Barbershop
const mockRian: BarberProfile = {
  id: 'b0000001-0000-0000-0000-000000000001',
  name: 'Rian Pratama',
  chair_number: 1,
  regular_day_off: 0, // Libur Minggu
  is_active: true,
  breaks: [
    { start_time: '12:00', end_time: '12:55', title: 'Istirahat Siang' },
    { start_time: '18:00', end_time: '18:55', title: 'Istirahat Sore' }
  ]
};

const mockDimas: BarberProfile = {
  id: 'b0000001-0000-0000-0000-000000000002',
  name: 'Dimas Arisandi',
  chair_number: 2,
  regular_day_off: 1, // Libur Senin
  is_active: true,
  breaks: [
    { start_time: '13:00', end_time: '13:55', title: 'Istirahat Siang' },
    { start_time: '19:00', end_time: '19:55', title: 'Istirahat Sore' }
  ]
};

const mockKevin: BarberProfile = {
  id: 'b0000001-0000-0000-0000-000000000003',
  name: 'Kevin Sanjaya',
  chair_number: 3,
  regular_day_off: 2, // Libur Selasa
  is_active: true,
  breaks: [
    { start_time: '14:00', end_time: '14:55', title: 'Istirahat Siang' },
    { start_time: '20:00', end_time: '20:55', title: 'Istirahat Sore' }
  ]
};

const allMockBarbers: BarberProfile[] = [mockRian, mockDimas, mockKevin];

// ============================================================================
// TEST 1: Barber Rian pada hari kerja normal (Sabtu, 2026-10-24) tanpa booking
// ============================================================================
console.log('Test 1: Menghitung slot kosong barber Rian (Sabtu, 2026-10-24)...');
// Gunakan waktu statis di pagi hari sebelum buka (08:00 WIB)
const morningTime: Date = new Date('2026-10-24T01:00:00.000Z'); // 08:00 WIB

const slotsRianSaturday: AvailableSlot[] = calculateBarberSlots({
  targetDate: '2026-10-24',
  totalDurationMinutes: 45, // 45m cut + 10m buffer = 55m window
  barber: mockRian,
  existingBookings: [],
  currentTime: morningTime
});

// Verifikasi slot pertama jam 10:00 WIB
assert(slotsRianSaturday.length > 0, 'Harus ada slot yang tersedia');
assert(slotsRianSaturday[0].time === '10:00', `Slot pertama harus 10:00, didapat: ${slotsRianSaturday[0].time}`);
assert(slotsRianSaturday[0].total_window === 55, 'Total window harus 55 menit (45m service + 10m buffer)');
assert(slotsRianSaturday[0].start_time === '2026-10-24T10:00:00+07:00', 'Start time ISO mismatch');
assert(slotsRianSaturday[0].end_time === '2026-10-24T10:55:00+07:00', 'End time ISO mismatch');

// Verifikasi jam istirahat Rian (12:00-12:55) TIDAK BOLEH muncul atau tumpang tindih
const rianBreakTimes = slotsRianSaturday.map((s: AvailableSlot) => s.time);
assert(!rianBreakTimes.includes('12:00'), 'Slot 12:00 tidak boleh tersedia karena istirahat siang Rian');
assert(!rianBreakTimes.includes('12:15'), 'Slot 12:15 tidak boleh tersedia karena istirahat siang Rian');
assert(!rianBreakTimes.includes('12:30'), 'Slot 12:30 tidak boleh tersedia karena istirahat siang Rian');
assert(!rianBreakTimes.includes('12:45'), 'Slot 12:45 tidak boleh tersedia karena istirahat siang Rian');
// Slot 11:15 (selesai 12:10), 11:30 (selesai 12:25), 11:45 (selesai 12:40) juga harus ditolak karena menabrak 12:00!
assert(!rianBreakTimes.includes('11:15'), 'Slot 11:15 tidak boleh tumpang tindih dengan istirahat 12:00-12:55');
assert(!rianBreakTimes.includes('11:30'), 'Slot 11:30 tidak boleh tumpang tindih dengan istirahat 12:00-12:55');
assert(!rianBreakTimes.includes('11:45'), 'Slot 11:45 tidak boleh tumpang tindih dengan istirahat 12:00-12:55');

// Begitu juga istirahat sore Rian (18:00-18:55)
assert(!rianBreakTimes.includes('18:00'), 'Slot 18:00 tidak boleh tersedia karena istirahat sore Rian');
assert(!rianBreakTimes.includes('17:15'), 'Slot 17:15 tidak boleh tumpang tindih dengan 18:00');
assert(!rianBreakTimes.includes('17:30'), 'Slot 17:30 tidak boleh tumpang tindih dengan 18:00');
assert(!rianBreakTimes.includes('17:45'), 'Slot 17:45 tidak boleh tumpang tindih dengan 18:00');

console.log(`PASS: Test 1 lolos! Rian memiliki ${slotsRianSaturday.length} slot valid tanpa tabrakan break.`);

// ============================================================================
// TEST 2: Rotasi Hari Libur Rutin Mingguan (Day-Off)
// ============================================================================
console.log('Test 2: Verifikasi Hari Libur Rutin Mingguan...');
// 2026-10-25 adalah hari Minggu (Sunday = 0) -> Rian libur!
const slotsRianSunday = calculateBarberSlots({
  targetDate: '2026-10-25',
  totalDurationMinutes: 45,
  barber: mockRian,
  existingBookings: [],
  currentTime: morningTime
});
assert(slotsRianSunday.length === 0, 'Rian harus memiliki 0 slot pada hari Minggu (Libur Rutin)');

// Dimas & Kevin harus tetap punya slot di hari Minggu!
const slotsDimasSunday = calculateBarberSlots({
  targetDate: '2026-10-25',
  totalDurationMinutes: 45,
  barber: mockDimas,
  existingBookings: [],
  currentTime: morningTime
});
assert(slotsDimasSunday.length > 0, 'Dimas harus tetap memiliki slot pada hari Minggu');

// 2026-10-26 adalah hari Senin (Monday = 1) -> Dimas libur!
const slotsDimasMonday = calculateBarberSlots({
  targetDate: '2026-10-26',
  totalDurationMinutes: 45,
  barber: mockDimas,
  existingBookings: [],
  currentTime: morningTime
});
assert(slotsDimasMonday.length === 0, 'Dimas harus memiliki 0 slot pada hari Senin (Libur Rutin)');

// 2026-10-27 adalah hari Selasa (Tuesday = 2) -> Kevin libur!
const slotsKevinTuesday = calculateBarberSlots({
  targetDate: '2026-10-27',
  totalDurationMinutes: 45,
  barber: mockKevin,
  existingBookings: [],
  currentTime: morningTime
});
assert(slotsKevinTuesday.length === 0, 'Kevin harus memiliki 0 slot pada hari Selasa (Libur Rutin)');

console.log('PASS: Test 2 lolos! Seluruh aturan rotating day-off terverifikasi 100%.');

// ============================================================================
// TEST 3: Deteksi Bentrok Booking Aktif (Confirmed & In-Progress)
// ============================================================================
console.log('Test 3: Deteksi bentrok jadwal dengan booking confirmed...');
const sampleConfirmedBooking: ExistingBooking = {
  id: 'b1111111-0000-0000-0000-000000000001',
  barber_id: mockRian.id,
  start_time: '2026-10-24T14:00:00+07:00',
  end_time: '2026-10-24T14:55:00+07:00',
  status: 'confirmed'
};

const slotsWithBooking = calculateBarberSlots({
  targetDate: '2026-10-24',
  totalDurationMinutes: 45,
  barber: mockRian,
  existingBookings: [sampleConfirmedBooking],
  currentTime: morningTime
});

const timesWithBooking = slotsWithBooking.map((s: AvailableSlot) => s.time);
assert(!timesWithBooking.includes('14:00'), 'Slot 14:00 harus hilang karena sudah dibooking confirmed');
assert(!timesWithBooking.includes('14:15'), 'Slot 14:15 harus hilang karena overlap');
assert(!timesWithBooking.includes('14:30'), 'Slot 14:30 harus hilang karena overlap');
assert(!timesWithBooking.includes('14:45'), 'Slot 14:45 harus hilang karena overlap');
assert(!timesWithBooking.includes('13:15'), 'Slot 13:15 (selesai 14:10) harus hilang karena overlap');
assert(!timesWithBooking.includes('13:30'), 'Slot 13:30 (selesai 14:25) harus hilang karena overlap');
assert(!timesWithBooking.includes('13:45'), 'Slot 13:45 (selesai 14:40) harus hilang karena overlap');

// Tapi slot 15:00 (setelah booking dan buffer selesai di 14:55) HARUS TERSEDIA!
assert(timesWithBooking.includes('15:00'), 'Slot 15:00 harus tersedia');

console.log('PASS: Test 3 lolos! Slot terisi otomatis hilang dari opsi jam.');

// ============================================================================
// TEST 4: Temporary Hold (pending_payment) dengan TTL 15 Menit
// ============================================================================
console.log('Test 4: Temporary hold TTL 15 menit & pelepasan otomatis status expired...');

// Skenario 4.1: Booking pending_payment masih aktif (hold_expires_at di masa depan)
const activeHoldBooking: ExistingBooking = {
  id: 'b1111111-0000-0000-0000-000000000002',
  barber_id: mockRian.id,
  start_time: '2026-10-24T16:00:00+07:00',
  end_time: '2026-10-24T16:55:00+07:00',
  status: 'pending_payment',
  hold_expires_at: '2026-10-24T08:15:00+07:00' // Expire 15 menit lagi
};

const slotsWithActiveHold = calculateBarberSlots({
  targetDate: '2026-10-24',
  totalDurationMinutes: 45,
  barber: mockRian,
  existingBookings: [activeHoldBooking],
  currentTime: morningTime // Waktu sekarang 08:00 WIB (< 08:15 WIB)
});

const timesWithActiveHold = slotsWithActiveHold.map((s: AvailableSlot) => s.time);
assert(!timesWithActiveHold.includes('16:00'), 'Slot 16:00 harus terkunci selama pending_payment aktif');

// Skenario 4.2: Booking pending_payment telah KEDALUWARSA (hold_expires_at di masa lalu)
const expiredHoldBooking: ExistingBooking = {
  id: 'b1111111-0000-0000-0000-000000000003',
  barber_id: mockRian.id,
  start_time: '2026-10-24T16:00:00+07:00',
  end_time: '2026-10-24T16:55:00+07:00',
  status: 'pending_payment',
  hold_expires_at: '2026-10-24T07:45:00+07:00' // Expired 15 menit yang lalu dari 08:00 WIB
};

const slotsWithExpiredHold = calculateBarberSlots({
  targetDate: '2026-10-24',
  totalDurationMinutes: 45,
  barber: mockRian,
  existingBookings: [expiredHoldBooking],
  currentTime: morningTime // Waktu sekarang 08:00 WIB (> 07:45 WIB)
});

const timesWithExpiredHold = slotsWithExpiredHold.map((s: AvailableSlot) => s.time);
assert(timesWithExpiredHold.includes('16:00'), 'Slot 16:00 harus otomatis terbuka kembali jika pending_payment sudah expired');

// Skenario 4.3: Booking cancelled / no_show tidak boleh memblokir slot
const cancelledBooking: ExistingBooking = {
  id: 'b1111111-0000-0000-0000-000000000004',
  barber_id: mockRian.id,
  start_time: '2026-10-24T16:00:00+07:00',
  end_time: '2026-10-24T16:55:00+07:00',
  status: 'cancelled'
};

const slotsWithCancelled = calculateBarberSlots({
  targetDate: '2026-10-24',
  totalDurationMinutes: 45,
  barber: mockRian,
  existingBookings: [cancelledBooking],
  currentTime: morningTime
});
assert(slotsWithCancelled.map(s => s.time).includes('16:00'), 'Slot 16:00 harus tetap tersedia jika booking status cancelled');

console.log('PASS: Test 4 lolos! Temporary hold dan pelepasan otomatis slot expired tuntas 100%.');

// ============================================================================
// TEST 5: Lead Time Pemesanan Hari Ini (Lead Time Filter)
// ============================================================================
console.log('Test 5: Lead time filter untuk booking hari ini...');
// Misalkan sekarang adalah tanggal 2026-10-24 jam 13:40 WIB
const middayTimeToday: Date = new Date('2026-10-24T06:40:00.000Z'); // 13:40 WIB
// Dengan min lead time 30 menit, batas cutoff adalah 13:40 + 30m = 14:10 WIB

const slotsTodayAfternoon = calculateBarberSlots({
  targetDate: '2026-10-24',
  totalDurationMinutes: 45,
  barber: mockRian,
  existingBookings: [],
  minLeadTimeMinutes: 30,
  currentTime: middayTimeToday
});

const afternoonTimes = slotsTodayAfternoon.map(s => s.time);
// Slot jam 10:00 - 13:45 adalah masa lalu / dalam lead time, tidak boleh muncul!
assert(!afternoonTimes.includes('10:00'), 'Slot pagi 10:00 tidak boleh muncul di siang hari');
assert(!afternoonTimes.includes('13:30'), 'Slot 13:30 sudah lewat');
assert(!afternoonTimes.includes('14:00'), 'Slot 14:00 kurang dari 30 menit dari 13:40 (cutoff 14:10)');

// Slot jam 14:15 atau 14:30 (setelah cutoff 14:10) boleh muncul jika tidak tabrakan
assert(afternoonTimes.includes('14:15'), 'Slot 14:15 harus tersedia karena >= cutoff 14:10');

console.log('PASS: Test 5 lolos! Lead time harian memotong slot lampau dan instan dengan presisi.');

// ============================================================================
// TEST 6: Multi-Barber Aggregation ("siapa saja" / any barber)
// ============================================================================
console.log('Test 6: Multi-barber aggregation...');
const aggregatedResult: AggregatedSlotResult = calculateAvailableSlotsForDate({
  targetDate: '2026-10-24', // Sabtu: Rian, Dimas, Kevin aktif
  totalDurationMinutes: 45,
  barbers: allMockBarbers,
  existingBookings: [sampleConfirmedBooking], // Rian sibuk 14:00-14:55
  currentTime: morningTime
});

assert(aggregatedResult.total_slots_count > 0, 'Total slots aggregated harus > 0');
assert(aggregatedResult.date === '2026-10-24', 'Tanggal agregasi sesuai');

// Pada jam 14:00 WIB:
// Rian tidak tersedia (karena booked)
// Kevin tidak tersedia (karena istirahat siang 14:00-14:55)
// Dimas TERSEDIA! (karena Dimas break di 13:00 dan tidak ada booking di 14:00)
const slotsAt1400 = aggregatedResult.slots.filter(s => s.time === '14:00');
assert(slotsAt1400.length === 1, `Harus ada tepat 1 barber yang tersedia di 14:00, didapat: ${slotsAt1400.length}`);
assert(slotsAt1400[0].barber_name === 'Dimas Arisandi', `Barber di 14:00 harus Dimas, didapat: ${slotsAt1400[0].barber_name}`);

console.log('PASS: Test 6 lolos! Agregasi multi-barber staggered break berhasil.');

// ============================================================================
// TEST 7: Combo Duration (Layanan Panjang 80 menit + 10 menit buffer = 90 menit)
// ============================================================================
console.log('Test 7: Combo service duration (80 menit + 10 menit buffer)...');
const comboSlots = calculateBarberSlots({
  targetDate: '2026-10-24',
  totalDurationMinutes: 80, // 80 menit service + 10 buffer = 90 menit total window
  barber: mockRian,
  existingBookings: [],
  currentTime: morningTime
});

assert(comboSlots.length > 0, 'Harus ada combo slots yang tersedia');
assert(comboSlots[0].service_duration === 80, 'Service duration harus 80');
assert(comboSlots[0].buffer_duration === 10, 'Buffer duration harus 10');
assert(comboSlots[0].total_window === 90, 'Total window harus 90');
// Slot 10:00 berakhir di 11:30
assert(comboSlots[0].end_time === '2026-10-24T11:30:00+07:00', 'End time 90m window mismatch');

// Verifikasi slot terakhir tidak melebihi 21:00 WIB
const lastComboSlot = comboSlots[comboSlots.length - 1];
assert(lastComboSlot.end_time <= '2026-10-24T21:00:00+07:00', 'Slot tidak boleh melebihi jam tutup gerai 21:00 WIB');

console.log('PASS: Test 7 lolos! Perhitungan jendela waktu layanan majemuk akurat.');

console.log('\n======================================================');
console.log('CONGRATULATIONS: 7/7 Slot Engine Unit Tests Passed 100%!');
console.log('======================================================');
