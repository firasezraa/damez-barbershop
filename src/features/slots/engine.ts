import { jakartaIso } from "../../lib/time/jakarta.ts";

/**
 * Engine ketersediaan slot. Fungsi murni: seluruh masukan sudah dalam
 * menit-dari-tengah-malam WIB, jadi bisa diuji tanpa database dan tanpa
 * bergantung pada zona waktu mesin.
 *
 * Aturan (IDEA.md §3, §7):
 * - slot hanya pada grid 15 menit dari jam buka;
 * - layanan + buffer sterilisasi harus selesai sebelum jam tutup;
 * - tidak boleh beririsan dengan istirahat bergilir maupun booking aktif
 *   (booking sudah memuat buffer di `end_time`, jadi intervalnya dipakai apa adanya);
 * - slot yang mulai kurang dari lead time dianggap tidak tersedia.
 */

export type Interval = { startMinutes: number; endMinutes: number };

export type SlotRules = {
  dateJakarta: string;
  openMinutes: number;
  closeMinutes: number;
  breaks: Interval[];
  busy: Interval[];
  durationMinutes: number;
  bufferMinutes: number;
  gridStepMinutes: number;
  leadTimeMinutes: number;
  /** Menit WIB saat ini; `null` kalau tanggalnya masih jauh di depan. */
  nowMinutes: number | null;
  isDayOff?: boolean;
};

function overlaps(startMinutes: number, endMinutes: number, intervals: Interval[]): boolean {
  return intervals.some(
    (interval) => startMinutes < interval.endMinutes && interval.startMinutes < endMinutes,
  );
}

export function computeAvailableSlots(rules: SlotRules): string[] {
  if (rules.isDayOff === true) {
    return [];
  }

  const totalMinutes = rules.durationMinutes + rules.bufferMinutes;
  const lastStart = rules.closeMinutes - totalMinutes;
  const earliestStart =
    rules.nowMinutes === null ? rules.openMinutes : rules.nowMinutes + rules.leadTimeMinutes;

  const slots: string[] = [];

  for (
    let startMinutes = rules.openMinutes;
    startMinutes <= lastStart;
    startMinutes += rules.gridStepMinutes
  ) {
    if (startMinutes < earliestStart) {
      continue;
    }

    const endMinutes = startMinutes + totalMinutes;
    if (overlaps(startMinutes, endMinutes, rules.breaks)) {
      continue;
    }
    if (overlaps(startMinutes, endMinutes, rules.busy)) {
      continue;
    }

    slots.push(jakartaIso(rules.dateJakarta, startMinutes));
  }

  return slots;
}