/**
 * DAMEZ BARBERSHOP - AUTHORITATIVE BOOKING POLICY ENGINE
 * Deliverable: lib/booking/policy.ts
 * 
 * Mengatur Aturan Bisnis & Kebijakan Operasional Resmi:
 * 1. Reschedule & Pembatalan: Cutoff maksimal H-3 jam (180 menit) sebelum waktu mulai slot
 * 2. Toleransi Keterlambatan Tamu: Maksimal 15 menit dari jadwal (Peringatan 10m, No-Show 15m)
 * 3. Uang Muka (DP): Flat Rp 20.000 (Non-refundable jika pembatalan < H-3 jam atau No-Show)
 */

export const RESCHEDULE_CUTOFF_HOURS = 3;
export const RESCHEDULE_CUTOFF_MINUTES = 180;
export const LATENESS_WARNING_THRESHOLD_MINUTES = 10;
export const LATENESS_TOLERANCE_LIMIT_MINUTES = 15;
export const FLAT_DOWN_PAYMENT_IDR = 20000;

export interface ReschedulePolicyEvaluation {
  isAllowed: boolean;
  minutesUntilSlot: number;
  hoursUntilSlot: number;
  cutoffTime: string; // HH:mm
  deadlineIso: string;
  dpHandling: 'transferrable' | 'forfeited';
  reason?: string;
}

export interface CancellationPolicyEvaluation {
  isEligibleForPreservedDP: boolean;
  minutesUntilSlot: number;
  hoursUntilSlot: number;
  cutoffTime: string; // HH:mm
  dpHandling: 'preserved' | 'forfeited';
  dpStatusExplanation: string;
}

export interface ArrivalToleranceEvaluation {
  status: 'on_time' | 'late_warning' | 'tolerance_exceeded';
  diffMinutes: number;
  isLateWarning: boolean;
  isPastTolerance: boolean;
  toleranceLimitTime: string; // HH:mm
  recommendedAction: 'serve_immediately' | 'prepare_station_and_warn' | 'mark_no_show_and_release_chair';
}

/**
 * Normalizes input time into pure HH:mm format
 */
export function extractCleanTime(timeStr: string): string {
  if (!timeStr) return '00:00';
  if (timeStr.includes('T')) {
    const match = timeStr.match(/T(\d{2}:\d{2})/);
    if (match) return match[1];
  }
  const match = timeStr.match(/^(\d{2}:\d{2})/);
  if (match) return match[1];
  return timeStr.slice(0, 5);
}

/**
 * Converts HH:mm to minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  const clean = extractCleanTime(timeStr);
  const [h, m] = clean.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Converts minutes from midnight to HH:mm
 */
export function minutesToTimeString(minutes: number): string {
  const bounded = Math.max(0, Math.min(24 * 60 - 1, minutes));
  const h = Math.floor(bounded / 60);
  const m = bounded % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Constructs an absolute epoch timestamp in milliseconds for slot start
 */
export function parseSlotTimestampMs(bookingDate: string, startTime: string): number {
  if (startTime.includes('T') && startTime.includes('+')) {
    return new Date(startTime).getTime();
  }
  const cleanTime = extractCleanTime(startTime);
  return new Date(`${bookingDate}T${cleanTime}:00+07:00`).getTime();
}

/**
 * Evaluates Reschedule Eligibility against the H-3 Jam Cutoff rule
 */
export function evaluateRescheduleEligibility(
  bookingDate: string,
  startTime: string,
  now: Date = new Date()
): ReschedulePolicyEvaluation {
  const slotTimestampMs = parseSlotTimestampMs(bookingDate, startTime);
  const nowTimestampMs = now.getTime();
  const diffMs = slotTimestampMs - nowTimestampMs;
  const minutesUntilSlot = Math.floor(diffMs / (60 * 1000));
  const hoursUntilSlot = Number((minutesUntilSlot / 60).toFixed(2));

  const cleanStartTime = extractCleanTime(startTime);
  const slotMinutes = timeStringToMinutes(cleanStartTime);
  const cutoffMinutes = Math.max(0, slotMinutes - RESCHEDULE_CUTOFF_MINUTES);
  const cutoffTime = minutesToTimeString(cutoffMinutes);

  const deadlineTimestampMs = slotTimestampMs - RESCHEDULE_CUTOFF_MINUTES * 60 * 1000;
  const deadlineIso = new Date(deadlineTimestampMs).toISOString();

  const isAllowed = minutesUntilSlot >= RESCHEDULE_CUTOFF_MINUTES;

  if (isAllowed) {
    return {
      isAllowed: true,
      minutesUntilSlot,
      hoursUntilSlot,
      cutoffTime,
      deadlineIso,
      dpHandling: 'transferrable'
    };
  }

  return {
    isAllowed: false,
    minutesUntilSlot,
    hoursUntilSlot,
    cutoffTime,
    deadlineIso,
    dpHandling: 'forfeited',
    reason: `Penjadwalan ulang mandiri telah ditutup karena melewati batas waktu H-3 jam (pukul ${cutoffTime} WIB).`
  };
}

/**
 * Evaluates Cancellation Policy & Down Payment disposition
 */
export function evaluateCancellationPolicy(
  bookingDate: string,
  startTime: string,
  now: Date = new Date()
): CancellationPolicyEvaluation {
  const slotTimestampMs = parseSlotTimestampMs(bookingDate, startTime);
  const nowTimestampMs = now.getTime();
  const diffMs = slotTimestampMs - nowTimestampMs;
  const minutesUntilSlot = Math.floor(diffMs / (60 * 1000));
  const hoursUntilSlot = Number((minutesUntilSlot / 60).toFixed(2));

  const cleanStartTime = extractCleanTime(startTime);
  const slotMinutes = timeStringToMinutes(cleanStartTime);
  const cutoffMinutes = Math.max(0, slotMinutes - RESCHEDULE_CUTOFF_MINUTES);
  const cutoffTime = minutesToTimeString(cutoffMinutes);

  const isEligibleForPreservedDP = minutesUntilSlot >= RESCHEDULE_CUTOFF_MINUTES;

  if (isEligibleForPreservedDP) {
    return {
      isEligibleForPreservedDP: true,
      minutesUntilSlot,
      hoursUntilSlot,
      cutoffTime,
      dpHandling: 'preserved',
      dpStatusExplanation: 'Karena pembatalan dilakukan lebih awal dari batas H-3 jam, kuota reservasi Anda telah ditutup tanpa kewajiban sisa pelunasan. Anda dapat melakukan pemesanan jadwal baru kapan saja.'
    };
  }

  return {
    isEligibleForPreservedDP: false,
    minutesUntilSlot,
    hoursUntilSlot,
    cutoffTime,
    dpHandling: 'forfeited',
    dpStatusExplanation: 'Pembatalan dilakukan kurang dari batas H-3 jam sebelum jadwal sesi. Sesuai kebijakan gerai, uang muka (DP) dinyatakan hangus untuk kompensasi slot barber yang telah dipersiapkan.'
  };
}

/**
 * Evaluates Customer Arrival Tolerance (0-9m on-time, 10-14m warning, >=15m past tolerance)
 */
export function evaluateArrivalTolerance(
  bookingDate: string,
  startTime: string,
  now: Date = new Date()
): ArrivalToleranceEvaluation {
  const slotTimestampMs = parseSlotTimestampMs(bookingDate, startTime);
  const nowTimestampMs = now.getTime();
  const diffMs = nowTimestampMs - slotTimestampMs;
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  const cleanStartTime = extractCleanTime(startTime);
  const slotMinutes = timeStringToMinutes(cleanStartTime);
  const toleranceLimitMinutes = slotMinutes + LATENESS_TOLERANCE_LIMIT_MINUTES;
  const toleranceLimitTime = minutesToTimeString(toleranceLimitMinutes);

  if (diffMinutes < LATENESS_WARNING_THRESHOLD_MINUTES) {
    return {
      status: 'on_time',
      diffMinutes: Math.max(0, diffMinutes),
      isLateWarning: false,
      isPastTolerance: false,
      toleranceLimitTime,
      recommendedAction: 'serve_immediately'
    };
  }

  if (diffMinutes < LATENESS_TOLERANCE_LIMIT_MINUTES) {
    return {
      status: 'late_warning',
      diffMinutes,
      isLateWarning: true,
      isPastTolerance: false,
      toleranceLimitTime,
      recommendedAction: 'prepare_station_and_warn'
    };
  }

  return {
    status: 'tolerance_exceeded',
    diffMinutes,
    isLateWarning: false,
    isPastTolerance: true,
    toleranceLimitTime,
    recommendedAction: 'mark_no_show_and_release_chair'
  };
}
