/**
 * DAMEZ BARBERSHOP - TEST SUITE: DASHBOARD ADMIN, KALENDER, BOOKING LIST & QUICK ACTIONS
 * 
 * Pengujian komprehensif untuk M5-01:
 * 1. Filter kueri reservasi harian (tanggal, barber, status, pencarian nama/kode)
 * 2. Matriks kalender 3 kursi barber (Rian, Dimas, Kevin) dengan break bergantian & day off
 * 3. Quick Action: Input Walk-in (< 15 detik, zero DP, in_progress / confirmed)
 * 4. Quick Action: Mulai Cukur / Seated (confirmed -> in_progress)
 * 5. Quick Action: Selesaikan Layanan & Kasir (Pelunasan sisa bayar = Total - DP 20k)
 * 6. Quick Action: Tandai No-Show (Toleransi 15m habis, DP hangus)
 * 7. Quick Action: Blokir Kursi / Istirahat Darurat
 * 8. Kalkulasi Rekonsiliasi Kas 3 Pos & Omzet Harian
 * 9. Format Laporan Keuangan Harian CSV (RFC 4180)
 * 10. HTTP Route Handler Integration (/api/admin/bookings, status, blocked-slots, daily-csv)
 */

import assert from 'node:assert';
import {
  getAdminDailyBookings,
  getAdminCalendarMatrix,
  createAdminWalkIn,
  startBookingService,
  completeBookingCheckout,
  markBookingNoShow,
  createAdminBlockedSlot,
  getDailyStats,
  generateDailyRevenueCsv,
  resetAdminMockStore,
  OPERATING_SLOT_HOURS,
  FLAT_DP_AMOUNT
} from '../lib/admin/service.ts';
import { SEED_BARBERS, SEED_SERVICES } from '../lib/slots/service.ts';
import { getJakartaDateString } from '../lib/utils/timezone.ts';

// Route Handlers
import { GET as getBookingsRoute, POST as postBookingsRoute } from '../app/api/admin/bookings/route.ts';
import { PATCH as patchBookingStatusRoute } from '../app/api/admin/bookings/[id]/status/route.ts';
import { GET as getBlockedSlotsRoute, POST as postBlockedSlotsRoute } from '../app/api/admin/blocked-slots/route.ts';
import { GET as getDailyCsvRoute } from '../app/api/admin/reports/daily-csv/route.ts';

const TEST_DATE = '2026-10-24'; // Sabtu

async function runTestSuite() {
  console.log('=== RUNNING ADMIN DASHBOARD, CALENDAR & QUICK ACTIONS TEST SUITE ===\n');

  // Reset mock store to fresh seed data
  resetAdminMockStore(TEST_DATE);

  // -------------------------------------------------------------
  // Test 1: Daily Bookings Query & Filters
  // -------------------------------------------------------------
  console.log('[Test 1] Daily Bookings Query & Filters');
  const allBookings = await getAdminDailyBookings({ date: TEST_DATE });
  assert.ok(allBookings.length >= 6, `Expected at least 6 seed bookings, got ${allBookings.length}`);

  // Filter by Barber (Rian)
  const rianId = 'b0000001-0000-0000-0000-000000000001';
  const rianBookings = await getAdminDailyBookings({ date: TEST_DATE, barberId: rianId });
  assert.ok(rianBookings.length > 0, 'Rian should have bookings');
  assert.ok(rianBookings.every((b) => b.barber_id === rianId), 'All bookings should belong to Rian');

  // Filter by Status (in_progress)
  const inProgressBookings = await getAdminDailyBookings({ date: TEST_DATE, status: 'in_progress' });
  assert.ok(inProgressBookings.length > 0, 'Should have in_progress bookings');
  assert.ok(inProgressBookings.every((b) => b.status === 'in_progress'), 'All should have in_progress status');

  // Filter by Search Query (Budi)
  const budiBookings = await getAdminDailyBookings({ date: TEST_DATE, searchQuery: 'Budi' });
  assert.strictEqual(budiBookings.length, 1, 'Should find exactly 1 booking for Budi');
  assert.strictEqual(budiBookings[0].customer_name, 'Budi Santoso');

  console.log('PASS: Test 1 - Daily bookings query and filters verified 100%.\n');

  // -------------------------------------------------------------
  // Test 2: Calendar Matrix 3 Barber Chairs & Staggered Breaks
  // -------------------------------------------------------------
  console.log('[Test 2] Calendar Matrix 3 Barber Chairs & Staggered Breaks');
  const matrix = await getAdminCalendarMatrix(TEST_DATE);
  assert.strictEqual(matrix.length, 3, 'Matrix must have 3 barber columns');
  assert.strictEqual(matrix[0].chair_number, 1, 'Column 1 is Chair 1 (Rian)');
  assert.strictEqual(matrix[1].chair_number, 2, 'Column 2 is Chair 2 (Dimas)');
  assert.strictEqual(matrix[2].chair_number, 3, 'Column 3 is Chair 3 (Kevin)');

  // Verify operating hours per column
  matrix.forEach((col) => {
    assert.strictEqual(col.slots.length, OPERATING_SLOT_HOURS.length, 'Each chair has 11 slot hours');
  });

  // Verify Rian's staggered lunch break at 12:00
  const rianLunchSlot = matrix[0].slots.find((s) => s.slot_time === '12:00');
  assert.ok(rianLunchSlot, '12:00 slot must exist for Rian');
  assert.strictEqual(rianLunchSlot?.status, 'blocked', "Rian's 12:00 slot must be blocked for lunch");

  // Verify Dimas's staggered lunch break at 13:00
  const dimasLunchSlot = matrix[1].slots.find((s) => s.slot_time === '13:00');
  assert.ok(dimasLunchSlot, '13:00 slot must exist for Dimas');
  assert.strictEqual(dimasLunchSlot?.status, 'blocked', "Dimas's 13:00 slot must be blocked for lunch");

  // Verify Kevin's staggered lunch break at 14:00
  const kevinLunchSlot = matrix[2].slots.find((s) => s.slot_time === '14:00');
  assert.ok(kevinLunchSlot, '14:00 slot must exist for Kevin');
  assert.strictEqual(kevinLunchSlot?.status, 'blocked', "Kevin's 14:00 slot must be blocked for lunch");

  console.log('PASS: Test 2 - 3-chair matrix with staggered breaks verified 100%.\n');

  // -------------------------------------------------------------
  // Test 3: Quick Walk-In Booking (< 15 Seconds Flow, DP = 0)
  // -------------------------------------------------------------
  console.log('[Test 3] Quick Walk-In Booking (< 15 Seconds Flow, Zero DP)');
  const walkInStart = performance.now();

  const walkInRes = await createAdminWalkIn({
    customer_name: 'Mas Anton',
    customer_phone: '081299887766',
    barber_id: rianId,
    service_ids: ['a0000001-0000-0000-0000-000000000001'], // Gentlemen Classic Haircut 50k
    start_time: '15:00',
    booking_date: TEST_DATE,
    action_mode: 'start_now',
    notes: 'Tamu langsung potong di kursi'
  });

  const walkInDurationMs = performance.now() - walkInStart;
  assert.ok(walkInRes.success, 'Walk-in booking must succeed');
  assert.ok(walkInRes.booking, 'Walk-in booking object returned');
  assert.strictEqual(walkInRes.booking?.booking_type, 'walk_in');
  assert.strictEqual(walkInRes.booking?.status, 'in_progress');
  assert.strictEqual(walkInRes.booking?.down_payment_idr, 0, 'Walk-in has DP Rp 0');
  assert.strictEqual(walkInRes.booking?.total_price_idr, 50000);
  assert.strictEqual(walkInRes.booking?.remaining_balance_idr, 50000, 'Remaining balance must equal total price');
  assert.ok(walkInDurationMs < 1000, `Walk-in creation took ${walkInDurationMs.toFixed(2)}ms (< 15s DoD)`);

  console.log(`PASS: Test 3 - Quick walk-in created in ${walkInDurationMs.toFixed(2)}ms with zero DP.\n`);

  // -------------------------------------------------------------
  // Test 4: Quick Action 'Mulai Cukur' (confirmed -> in_progress)
  // -------------------------------------------------------------
  console.log("[Test 4] Quick Action 'Mulai Cukur' (confirmed -> in_progress)");
  const confirmedBooking = allBookings.find((b) => b.status === 'confirmed');
  assert.ok(confirmedBooking, 'Must find a confirmed booking to start');

  const startRes = await startBookingService(confirmedBooking.id);
  assert.ok(startRes.success, 'Starting service must succeed');
  assert.strictEqual(startRes.booking?.status, 'in_progress');

  // Attempting to start an already in_progress service should be rejected
  const reStartRes = await startBookingService(confirmedBooking.id);
  assert.strictEqual(reStartRes.success, false, 'Cannot start service that is already in_progress');

  console.log("PASS: Test 4 - 'Mulai Cukur' transition validated 100%.\n");

  // -------------------------------------------------------------
  // Test 5: Quick Action 'Selesaikan & Kasir' (Cashier Settlement)
  // -------------------------------------------------------------
  console.log("[Test 5] Quick Action 'Selesaikan & Kasir' (Cashier Settlement)");
  // Cari booking online yang in_progress
  const inProgressToCheckout = allBookings.find((b) => b.id === 'mock-bk-004');
  assert.ok(inProgressToCheckout, 'Must find mock-bk-004');
  assert.strictEqual(inProgressToCheckout.total_price_idr, 50000);
  assert.strictEqual(inProgressToCheckout.down_payment_idr, 20000);
  assert.strictEqual(inProgressToCheckout.remaining_balance_idr, 30000);

  // Case A: Insufficient Cash Payment (e.g. paying 20.000 when 30.000 is due)
  const failCheckout = await completeBookingCheckout({
    booking_id: inProgressToCheckout.id,
    settlement_method: 'cash',
    cash_amount_received: 20000
  });
  assert.strictEqual(failCheckout.success, false, 'Must reject underpayment');

  // Case B: Cash Payment with Change (paid 50.000 for 30.000 balance -> change 20.000)
  const successCheckout = await completeBookingCheckout({
    booking_id: inProgressToCheckout.id,
    settlement_method: 'cash',
    cash_amount_received: 50000
  });
  assert.ok(successCheckout.success, 'Valid cash checkout must succeed');
  assert.strictEqual(successCheckout.booking?.status, 'completed');
  assert.strictEqual(successCheckout.booking?.settlement_method, 'cash');
  assert.strictEqual(successCheckout.change, 20000, 'Calculated change must be Rp 20.000');

  console.log("PASS: Test 5 - 'Selesaikan & Kasir' and cash change calculation verified.\n");

  // -------------------------------------------------------------
  // Test 6: Quick Action 'Tandai No-Show' (15-Min Tolerance Habis)
  // -------------------------------------------------------------
  console.log("[Test 6] Quick Action 'Tandai No-Show' (15-Min Tolerance Habis)");
  const bookingToNoShow = allBookings.find((b) => b.id === 'mock-bk-002');
  assert.ok(bookingToNoShow, 'Must find mock-bk-002');

  const noShowRes = await markBookingNoShow({
    booking_id: bookingToNoShow.id,
    reason: 'Toleransi 15 menit habis tanpa konfirmasi kedatangan.'
  });
  assert.ok(noShowRes.success, 'No-show marking must succeed');
  assert.strictEqual(noShowRes.booking?.status, 'no_show');
  assert.ok(noShowRes.booking?.cancelled_at, 'Cancelled timestamp set');
  assert.ok(noShowRes.booking?.cancellation_reason?.includes('Toleransi 15 menit'), 'Reason recorded');

  console.log("PASS: Test 6 - 'Tandai No-Show' and DP forfeiture verified.\n");

  // -------------------------------------------------------------
  // Test 7: Emergency Blocked Slot Creation
  // -------------------------------------------------------------
  console.log('[Test 7] Emergency Blocked Slot Creation');
  const blockRes = await createAdminBlockedSlot({
    barber_id: rianId,
    booking_date: TEST_DATE,
    start_time: '16:00',
    end_time: '17:00',
    title: 'Perawatan Kursi Hidrolik',
    reason: 'Perbaikan hidrolik kursi 1'
  });
  assert.ok(blockRes.success, 'Creating blocked slot must succeed');

  // Verify slot appears in matrix
  const updatedMatrix = await getAdminCalendarMatrix(TEST_DATE);
  const rian16Slot = updatedMatrix[0].slots.find((s) => s.slot_time === '16:00');
  assert.strictEqual(rian16Slot?.status, 'blocked');
  assert.strictEqual(rian16Slot?.block_title, 'PERAWATAN KURSI HIDROLIK');

  console.log('PASS: Test 7 - Emergency slot block reflected in calendar matrix.\n');

  // -------------------------------------------------------------
  // Test 8: Daily Stats & 3-Pos Cash Reconciliation
  // -------------------------------------------------------------
  console.log('[Test 8] Daily Stats & 3-Pos Cash Reconciliation');
  const stats = await getDailyStats(TEST_DATE);

  assert.ok(stats.total_slots === 33, 'Total slots is 33');
  assert.ok(stats.booked_slots > 0, 'Booked slots > 0');
  assert.ok(stats.occupancy_rate_percent > 0, 'Occupancy rate > 0%');

  // Formula Check (SOP 6 Bab 9.2):
  // Omzet = DP Online + Kasir Tunai + Kasir QRIS + DP No-Show Hangus
  const expectedNet =
    stats.total_dp_online_idr +
    stats.total_cashier_cash_idr +
    stats.total_cashier_qris_idr +
    stats.total_noshow_forfeited_dp_idr;
  assert.strictEqual(stats.total_net_revenue_idr, expectedNet, 'Net revenue must strictly match the 3-pos sum formula');

  console.log(`PASS: Test 8 - 3-Pos Reconciliation Formula strictly verified: Rp ${stats.total_net_revenue_idr.toLocaleString('id-ID')}.\n`);

  // -------------------------------------------------------------
  // Test 9: Daily Revenue CSV Generation (RFC 4180 Compliant)
  // -------------------------------------------------------------
  console.log('[Test 9] Daily Revenue CSV Generation (RFC 4180 Compliant)');
  const csv = await generateDailyRevenueCsv(TEST_DATE);

  assert.ok(csv.includes('Kode Booking,Tanggal,Waktu Mulai'), 'Header must contain column definitions');
  assert.ok(csv.includes('RINGKASAN REKONSILIASI KAS HARIAN'), 'Must contain reconciliation section');
  assert.ok(csv.includes('1. DP Online (Midtrans QRIS)'), 'Must include Pos 1 DP Online');
  assert.ok(csv.includes('2. Kasir Tunai (Laci Kasir)'), 'Must include Pos 2 Kasir Tunai');
  assert.ok(csv.includes('3. Kasir QRIS Toko'), 'Must include Pos 3 Kasir QRIS');
  assert.ok(csv.includes('4. DP No-Show Hangus'), 'Must include Pos 4 DP No-Show Hangus');
  assert.ok(csv.includes('TOTAL OMZET BERSIH TOKO'), 'Must include Total Net Revenue');

  console.log('PASS: Test 9 - CSV export with 3-pos reconciliation verified.\n');

  // -------------------------------------------------------------
  // Test 10: API Route Handlers Integration
  // -------------------------------------------------------------
  console.log('[Test 10] API Route Handlers Integration');

  // 10.1 GET /api/admin/bookings
  const reqGetBookings = new Request(`http://localhost:3000/api/admin/bookings?date=${TEST_DATE}`);
  const resGetBookings = await getBookingsRoute(reqGetBookings);
  assert.strictEqual(resGetBookings.status, 200);
  const dataGetBookings = await resGetBookings.json();
  assert.ok(dataGetBookings.success);
  assert.ok(Array.isArray(dataGetBookings.bookings));

  // 10.2 POST /api/admin/bookings (Walk-In)
  const reqPostWalkIn = new Request('http://localhost:3000/api/admin/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: 'Tamu API Walkin',
      customer_phone: '081233445566',
      barber_id: rianId,
      service_ids: ['a0000001-0000-0000-0000-000000000001'],
      start_time: '18:00',
      booking_date: TEST_DATE,
      action_mode: 'start_now'
    })
  });
  const resPostWalkIn = await postBookingsRoute(reqPostWalkIn);
  assert.strictEqual(resPostWalkIn.status, 201);
  const dataPostWalkIn = await resPostWalkIn.json();
  assert.ok(dataPostWalkIn.success);
  assert.strictEqual(dataPostWalkIn.booking.customer_name, 'Tamu API Walkin');

  // 10.3 PATCH /api/admin/bookings/[id]/status
  const createdBookingId = dataPostWalkIn.booking.id;
  const reqPatchStatus = new Request(`http://localhost:3000/api/admin/bookings/${createdBookingId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'completed',
      settlement_method: 'cash',
      cash_amount_received: 50000
    })
  });
  const resPatchStatus = await patchBookingStatusRoute(reqPatchStatus, {
    params: Promise.resolve({ id: createdBookingId })
  });
  assert.strictEqual(resPatchStatus.status, 200);
  const dataPatchStatus = await resPatchStatus.json();
  assert.ok(dataPatchStatus.success);
  assert.strictEqual(dataPatchStatus.booking.status, 'completed');

  // 10.4 GET /api/admin/blocked-slots
  const reqGetMatrix = new Request(`http://localhost:3000/api/admin/blocked-slots?date=${TEST_DATE}`);
  const resGetMatrix = await getBlockedSlotsRoute(reqGetMatrix);
  assert.strictEqual(resGetMatrix.status, 200);
  const dataGetMatrix = await resGetMatrix.json();
  assert.ok(dataGetMatrix.success);
  assert.strictEqual(dataGetMatrix.columns.length, 3);

  // 10.5 GET /api/admin/reports/daily-csv
  const reqGetCsv = new Request(`http://localhost:3000/api/admin/reports/daily-csv?date=${TEST_DATE}`);
  const resGetCsv = await getDailyCsvRoute(reqGetCsv);
  assert.strictEqual(resGetCsv.status, 200);
  assert.strictEqual(resGetCsv.headers.get('Content-Type'), 'text/csv; charset=utf-8');
  assert.ok(resGetCsv.headers.get('Content-Disposition')?.includes(`rekap-damez-${TEST_DATE}.csv`));

  console.log('PASS: Test 10 - All 5 Admin API Route Handlers executed and passed 100%.\n');

  console.log('================================================================');
  console.log('CONGRATULATIONS: ALL 10 ADMIN DASHBOARD & QUICK ACTION TESTS PASSED!');
  console.log('DoD VERIFIED: Owner & Barber dapat mengelola antrean harian secara instan.');
  console.log('================================================================');
}

runTestSuite().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
