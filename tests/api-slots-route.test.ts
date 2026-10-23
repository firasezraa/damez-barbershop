/**
 * INTEGRATION TEST: /api/slots/available Route Handler
 * Memverifikasi kontrak API (Contract-06), validasi parameter, integrasi service,
 * status HTTP, cache-control headers, dan latensi query (< 350 ms).
 */

import { GET } from '../app/api/slots/available/route.ts';
import { NextRequest } from 'next/server.js';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

console.log('--- RUNNING API SLOTS ROUTE HANDLER TEST SUITE ---');

async function testSuite(): Promise<void> {
  // ==========================================================================
  // CASE 1: Request tanpa parameter 'date' (Wajib 400 Bad Request)
  // ==========================================================================
  console.log('Case 1: Testing missing date parameter...');
  const req1 = new NextRequest('http://localhost:3000/api/slots/available');
  const res1 = await GET(req1);
  assert(res1.status === 400, `Status harus 400, didapat: ${res1.status}`);
  const json1 = await res1.json();
  assert(json1.success === false, 'success harus false');
  assert(json1.error.includes("'date'"), 'Pesan error harus menyebut parameter date');
  console.log('PASS: Case 1 - Missing date validation handled correctly.');

  // ==========================================================================
  // CASE 2: Request dengan format tanggal salah (Wajib 400 Bad Request)
  // ==========================================================================
  console.log('Case 2: Testing invalid date format...');
  const req2 = new NextRequest('http://localhost:3000/api/slots/available?date=24-10-2026');
  const res2 = await GET(req2);
  assert(res2.status === 400, `Status harus 400, didapat: ${res2.status}`);
  const json2 = await res2.json();
  assert(json2.success === false, 'success harus false');
  console.log('PASS: Case 2 - Invalid date format handled correctly.');

  // ==========================================================================
  // CASE 3: Request dengan duration tidak valid (Wajib 400 Bad Request)
  // ==========================================================================
  console.log('Case 3: Testing invalid duration parameter...');
  const req3 = new NextRequest('http://localhost:3000/api/slots/available?date=2026-10-24&duration=-20');
  const res3 = await GET(req3);
  assert(res3.status === 400, `Status harus 400, didapat: ${res3.status}`);
  const json3 = await res3.json();
  assert(json3.success === false, 'success harus false');
  console.log('PASS: Case 3 - Invalid duration handled correctly.');

  // ==========================================================================
  // CASE 4: Valid Request All Barbers ("siapa saja")
  // ==========================================================================
  console.log('Case 4: Testing valid request for all barbers (barber_id=any)...');
  const req4 = new NextRequest('http://localhost:3000/api/slots/available?date=2026-10-24&barber_id=any');
  const res4 = await GET(req4);
  assert(res4.status === 200, `Status harus 200, didapat: ${res4.status}`);
  
  // Periksa Security & Caching Headers
  assert(res4.headers.get('Cache-Control')?.includes('no-store') === true, 'Cache-Control harus no-store');
  assert(res4.headers.get('X-Timezone') === 'Asia/Jakarta', 'X-Timezone header harus Asia/Jakarta');

  const json4 = await res4.json();
  assert(json4.success === true, 'success harus true');
  assert(json4.date === '2026-10-24', 'Date harus 2026-10-24');
  assert(json4.total_duration_minutes === 45, 'Default duration harus 45 menit');
  assert(json4.buffer_minutes === 10, 'Buffer harus 10 menit');
  assert(json4.total_window_minutes === 55, 'Total window harus 55 menit');
  assert(Array.isArray(json4.slots), 'slots harus berupa array');
  assert(json4.slots.length > 0, 'slots tidak boleh kosong');

  // Validasi Kontrak Contract-06 pada item slot
  const firstSlot = json4.slots[0];
  assert(typeof firstSlot.time === 'string', 'slot.time harus string (misal "10:00")');
  assert(firstSlot.available === true, 'slot.available harus true');
  assert(firstSlot.start_time.endsWith('+07:00'), 'start_time harus berakhiran +07:00');
  assert(firstSlot.end_time.endsWith('+07:00'), 'end_time harus berakhiran +07:00');
  console.log(`PASS: Case 4 - All barbers request returned ${json4.slots.length} available slots.`);

  // ==========================================================================
  // CASE 5: Valid Request Single Barber (Rian Pratama)
  // ==========================================================================
  console.log('Case 5: Testing single barber request (Rian Pratama)...');
  const rianId = 'b0000001-0000-0000-0000-000000000001';
  const req5 = new NextRequest(`http://localhost:3000/api/slots/available?date=2026-10-24&barber_id=${rianId}`);
  const res5 = await GET(req5);
  assert(res5.status === 200, `Status harus 200, didapat: ${res5.status}`);
  const json5 = await res5.json();
  assert(json5.barber_id === rianId, 'barber_id response harus sesuai parameter');
  // Seluruh slot harus milik Rian
  json5.slots.forEach((s: { barber_id: string }) => {
    assert(s.barber_id === rianId, 'Seluruh slot harus milik Rian');
  });
  console.log(`PASS: Case 5 - Single barber filtered correctly with ${json5.slots.length} slots.`);

  // ==========================================================================
  // CASE 6: Multi-Service Duration Calculation
  // ==========================================================================
  console.log('Case 6: Testing service_ids duration accumulation...');
  // Layanan 1 (Gentlemen Classic: 45m) + Layanan 3 (Kids Junior: 35m) = 80m duration
  const srv1 = 'a0000001-0000-0000-0000-000000000001';
  const srv3 = 'a0000001-0000-0000-0000-000000000003';
  const req6 = new NextRequest(`http://localhost:3000/api/slots/available?date=2026-10-24&barber_id=${rianId}&service_ids=${srv1},${srv3}`);
  const res6 = await GET(req6);
  assert(res6.status === 200, `Status harus 200, didapat: ${res6.status}`);
  const json6 = await res6.json();
  assert(json6.total_duration_minutes === 80, `Total duration harus 80 menit, didapat: ${json6.total_duration_minutes}`);
  assert(json6.total_window_minutes === 90, `Total window harus 90 menit (80m + 10m buffer), didapat: ${json6.total_window_minutes}`);
  console.log(`PASS: Case 6 - Service duration accumulated correctly to 80m + 10m buffer = 90m.`);

  // ==========================================================================
  // CASE 7: Latency & Performance Benchmark (< 350 ms)
  // ==========================================================================
  console.log('Case 7: Testing API query performance & latency benchmark (< 350 ms)...');
  const iterations = 10;
  const startTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    const benchReq = new NextRequest(`http://localhost:3000/api/slots/available?date=2026-10-24&barber_id=any`);
    const benchRes = await GET(benchReq);
    assert(benchRes.status === 200, 'Benchmark status harus 200');
  }
  const totalDuration = Date.now() - startTime;
  const avgLatency = totalDuration / iterations;
  console.log(`Average Query Latency: ${avgLatency.toFixed(2)} ms across ${iterations} iterations`);
  assert(avgLatency < 350, `Latensi harus < 350 ms sesuai PRD DoD, didapat: ${avgLatency.toFixed(2)} ms`);
  console.log('PASS: Case 7 - Performance benchmark successfully passed (< 350 ms target).');

  console.log('\n=============================================================');
  console.log('CONGRATULATIONS: 7/7 API Slots Route Handler Tests Passed 100%!');
  console.log('=============================================================');
}

testSuite().catch((err) => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
