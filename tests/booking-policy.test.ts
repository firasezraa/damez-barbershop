/**
 * DAMEZ BARBERSHOP - BOOKING POLICY UNIT TESTS
 * Test-Driven Development (TDD) for H-3 Cutoff & 15-Min Tolerance Rules
 */

import assert from 'node:assert'
import {
  evaluateRescheduleEligibility,
  evaluateCancellationPolicy,
  evaluateArrivalTolerance,
  RESCHEDULE_CUTOFF_HOURS,
  LATENESS_TOLERANCE_LIMIT_MINUTES,
  FLAT_DOWN_PAYMENT_IDR
} from '../lib/booking/policy.ts'

console.log('=== RUNNING BOOKING POLICY UNIT TESTS (tests/booking-policy.test.ts) ===\n')

// Test 1: Constants
console.log('[Test 1] Verifying policy constants')
assert.strictEqual(RESCHEDULE_CUTOFF_HOURS, 3, 'Reschedule cutoff must be 3 hours')
assert.strictEqual(LATENESS_TOLERANCE_LIMIT_MINUTES, 15, 'Tolerance limit must be 15 minutes')
assert.strictEqual(FLAT_DOWN_PAYMENT_IDR, 20000, 'Flat DP must be Rp 20.000')
console.log('PASS: Policy constants verified.\n')

// Test 2: Reschedule Policy H-3 Cutoff Evaluation
console.log('[Test 2] Reschedule Policy H-3 Hours Cutoff')
const targetDate = '2026-10-27'
const targetStartTime = '14:00'

// 2.1: Request at 10:00 (4 hours before) -> Allowed
const res4h = evaluateRescheduleEligibility(
  targetDate,
  targetStartTime,
  new Date('2026-10-27T10:00:00+07:00')
)
assert.strictEqual(res4h.isAllowed, true, '4 hours before slot must be allowed')
assert.strictEqual(res4h.dpHandling, 'transferrable', 'DP must be transferrable')
assert.strictEqual(res4h.cutoffTime, '11:00', 'Cutoff time for 14:00 slot must be 11:00')
assert.strictEqual(res4h.minutesUntilSlot, 240, 'Remaining minutes must be 240')

// 2.2: Request at 11:00 exactly (3 hours before) -> Allowed
const res3h = evaluateRescheduleEligibility(
  targetDate,
  targetStartTime,
  new Date('2026-10-27T11:00:00+07:00')
)
assert.strictEqual(res3h.isAllowed, true, 'Exactly 3 hours before slot must be allowed')
assert.strictEqual(res3h.dpHandling, 'transferrable')

// 2.3: Request at 11:01 (2 hours 59 minutes before) -> Disallowed (< H-3 jam)
const res2h59m = evaluateRescheduleEligibility(
  targetDate,
  targetStartTime,
  new Date('2026-10-27T11:01:00+07:00')
)
assert.strictEqual(res2h59m.isAllowed, false, 'Less than 3 hours before slot must be disallowed')
assert.strictEqual(res2h59m.dpHandling, 'forfeited', 'DP is forfeited on late reschedule')
assert.ok(res2h59m.reason?.includes('H-3'), 'Reason must mention H-3 cutoff')

// 2.4: Request at 13:30 (30 minutes before) -> Disallowed
const res30m = evaluateRescheduleEligibility(
  targetDate,
  targetStartTime,
  new Date('2026-10-27T13:30:00+07:00')
)
assert.strictEqual(res30m.isAllowed, false)
assert.strictEqual(res30m.dpHandling, 'forfeited')
console.log('PASS: Reschedule H-3 cutoff rules verified.\n')

// Test 3: Cancellation Policy H-3 Evaluation
console.log('[Test 3] Cancellation Policy & DP Forfeiture Rules')
// 3.1: Cancel 5 hours before -> DP Preserved / Eligible for credit
const cancel5h = evaluateCancellationPolicy(
  targetDate,
  targetStartTime,
  new Date('2026-10-27T09:00:00+07:00')
)
assert.strictEqual(cancel5h.isEligibleForPreservedDP, true)
assert.strictEqual(cancel5h.dpHandling, 'preserved')
assert.ok(cancel5h.dpStatusExplanation.includes('lebih awal dari batas H-3 jam'))

// 3.2: Cancel 1 hour before -> DP Forfeited
const cancel1h = evaluateCancellationPolicy(
  targetDate,
  targetStartTime,
  new Date('2026-10-27T13:00:00+07:00')
)
assert.strictEqual(cancel1h.isEligibleForPreservedDP, false)
assert.strictEqual(cancel1h.dpHandling, 'forfeited')
assert.ok(cancel1h.dpStatusExplanation.includes('kurang dari batas H-3 jam'))
console.log('PASS: Cancellation policy and DP explanation verified.\n')

// Test 4: 15-Minute Arrival Tolerance Evaluation
console.log('[Test 4] 15-Minute Customer Arrival Tolerance & Lateness Stages')
// 4.1: Arrival at 14:05 (5 min late) -> On Time (within grace period)
const tol5m = evaluateArrivalTolerance(
  targetDate,
  targetStartTime,
  new Date('2026-10-27T14:05:00+07:00')
)
assert.strictEqual(tol5m.status, 'on_time')
assert.strictEqual(tol5m.diffMinutes, 5)
assert.strictEqual(tol5m.isLateWarning, false)
assert.strictEqual(tol5m.isPastTolerance, false)
assert.strictEqual(tol5m.toleranceLimitTime, '14:15')
assert.strictEqual(tol5m.recommendedAction, 'serve_immediately')

// 4.2: Arrival at 14:10 (10 min late) -> Late Warning Stage
const tol10m = evaluateArrivalTolerance(
  targetDate,
  targetStartTime,
  new Date('2026-10-27T14:10:00+07:00')
)
assert.strictEqual(tol10m.status, 'late_warning')
assert.strictEqual(tol10m.diffMinutes, 10)
assert.strictEqual(tol10m.isLateWarning, true)
assert.strictEqual(tol10m.isPastTolerance, false)
assert.strictEqual(tol10m.recommendedAction, 'prepare_station_and_warn')

// 4.3: Arrival at 14:14 (14 min late) -> Late Warning Stage
const tol14m = evaluateArrivalTolerance(
  targetDate,
  targetStartTime,
  new Date('2026-10-27T14:14:00+07:00')
)
assert.strictEqual(tol14m.status, 'late_warning')
assert.strictEqual(tol14m.isLateWarning, true)
assert.strictEqual(tol14m.isPastTolerance, false)

// 4.4: Arrival at 14:15 exactly (15 min late) -> Tolerance Exceeded
const tol15m = evaluateArrivalTolerance(
  targetDate,
  targetStartTime,
  new Date('2026-10-27T14:15:00+07:00')
)
assert.strictEqual(tol15m.status, 'tolerance_exceeded')
assert.strictEqual(tol15m.diffMinutes, 15)
assert.strictEqual(tol15m.isLateWarning, false)
assert.strictEqual(tol15m.isPastTolerance, true)
assert.strictEqual(tol15m.recommendedAction, 'mark_no_show_and_release_chair')

// 4.5: Arrival at 14:20 (20 min late) -> Tolerance Exceeded
const tol20m = evaluateArrivalTolerance(
  targetDate,
  targetStartTime,
  new Date('2026-10-27T14:20:00+07:00')
)
assert.strictEqual(tol20m.status, 'tolerance_exceeded')
assert.strictEqual(tol20m.isPastTolerance, true)
console.log('PASS: 15-minute tolerance and late warning stages verified.\n')

// Test 5: Full ISO 8601 String Input Resilience
console.log('[Test 5] ISO 8601 Timestamps Resilience')
const isoStartTime = '2026-10-27T14:00:00+07:00'
const isoRes = evaluateRescheduleEligibility(
  targetDate,
  isoStartTime,
  new Date('2026-10-27T10:00:00+07:00')
)
assert.strictEqual(isoRes.isAllowed, true)
assert.strictEqual(isoRes.cutoffTime, '11:00')

const isoTol = evaluateArrivalTolerance(
  targetDate,
  isoStartTime,
  new Date('2026-10-27T14:16:00+07:00')
)
assert.strictEqual(isoTol.status, 'tolerance_exceeded')
assert.strictEqual(isoTol.isPastTolerance, true)
console.log('PASS: Full ISO 8601 string input parsed seamlessly without NaN errors.\n')

console.log('======================================================')
console.log('ALL BOOKING POLICY TESTS PASSED (100% VERIFIED)')
console.log('======================================================')
