import { TIMEZONE } from "../config/constants.ts";

/**
 * Waktu Jakarta dihitung dari instant, bukan dari zona mesin. VPS pengembangan
 * berzona Asia/Shanghai dan runner CI berzona UTC; keduanya harus menghasilkan
 * tanggal dan menit WIB yang sama.
 *
 * Jakarta tidak memakai DST, jadi offsetnya tetap +07:00 sepanjang tahun.
 */
const JAKARTA_OFFSET_MINUTES = 7 * 60;
const MINUTES_PER_DAY = 24 * 60;

/** Menit-dari-tengah-malam WIB untuk sebuah instant. */
export function jakartaMinutesOf(instant: Date): number {
  const utcMinutes = instant.getUTCHours() * 60 + instant.getUTCMinutes();
  return (utcMinutes + JAKARTA_OFFSET_MINUTES) % MINUTES_PER_DAY;
}

/** Tanggal WIB (`YYYY-MM-DD`) untuk sebuah instant. */
export function jakartaDateString(instant: Date): string {
  const shifted = new Date(instant.getTime() + JAKARTA_OFFSET_MINUTES * 60_000);
  return shifted.toISOString().slice(0, 10);
}

/** ISO waktu WIB untuk tanggal + menit-dari-tengah-malam. */
export function jakartaIso(dateJakarta: string, minutesOfDay: number): string {
  const hours = Math.floor(minutesOfDay / 60);
  const minutes = minutesOfDay % 60;
  return `${dateJakarta}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+07:00`;
}

export const JAKARTA_TIMEZONE = TIMEZONE;
