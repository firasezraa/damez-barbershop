/**
 * DAMEZ BARBERSHOP - STRICT ASIA/JAKARTA (WIB / UTC+07:00) TIMEZONE UTILITIES
 * 
 * Sesuai ketetapan PRD & WBS (M3-03):
 * Seluruh komputasi slot waktu, batas waktu kedaluwarsa, filter kalender,
 * dan perbandingan jam operasional dikunci secara baku pada zona waktu
 * Asia/Jakarta (WIB). Tidak terpengaruh oleh zona waktu lokal host / server.
 */

export const JAKARTA_TIMEZONE: string = 'Asia/Jakarta';
export const JAKARTA_OFFSET_HOURS: number = 7;
export const JAKARTA_OFFSET_MINUTES: number = 7 * 60; // 420 menit

export interface JakartaDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number; // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
}

/**
 * Mengambil komponen tanggal dan waktu saat ini (atau objek Date tertentu)
 * yang direfleksikan secara deterministik dalam zona waktu Asia/Jakarta.
 * Menggunakan Intl.DateTimeFormat agar kompatibel lintas platform Node.js / V8.
 */
export function getJakartaDateTimeParts(date: Date = new Date()): JakartaDateTimeParts {
  // Gunakan format bahasa baku untuk ekstraksi bagian tanggal di Asia/Jakarta
  const formatter: Intl.DateTimeFormat = new Intl.DateTimeFormat('en-US', {
    timeZone: JAKARTA_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  });

  const parts: Intl.DateTimeFormatPart[] = formatter.formatToParts(date);
  let year: number = 0;
  let month: number = 0;
  let day: number = 0;
  let hour: number = 0;
  let minute: number = 0;
  let second: number = 0;

  parts.forEach((part: Intl.DateTimeFormatPart) => {
    switch (part.type) {
      case 'year':
        year = Number(part.value);
        break;
      case 'month':
        month = Number(part.value);
        break;
      case 'day':
        day = Number(part.value);
        break;
      case 'hour':
        hour = Number(part.value);
        break;
      case 'minute':
        minute = Number(part.value);
        break;
      case 'second':
        second = Number(part.value);
        break;
    }
  });

  // Hitung dayOfWeek di Asia/Jakarta (0 = Minggu, 1 = Senin, ..., 6 = Sabtu)
  // Buat tanggal berbasis UTC siang hari untuk memastikan indeks hari deterministik
  const midDayUtc: Date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayOfWeek: number = midDayUtc.getUTCDay();

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    dayOfWeek
  };
}

/**
 * Mendapatkan string tanggal kalender "YYYY-MM-DD" dalam zona waktu Asia/Jakarta.
 */
export function getJakartaDateString(date: Date = new Date()): string {
  const { year, month, day } = getJakartaDateTimeParts(date);
  const formattedMonth: string = String(month).padStart(2, '0');
  const formattedDay: string = String(day).padStart(2, '0');
  return `${year}-${formattedMonth}-${formattedDay}`;
}

/**
 * Mendapatkan string jam "HH:mm" dalam zona waktu Asia/Jakarta.
 */
export function getJakartaTimeString(date: Date = new Date()): string {
  const { hour, minute } = getJakartaDateTimeParts(date);
  const formattedHour: string = String(hour).padStart(2, '0');
  const formattedMinute: string = String(minute).padStart(2, '0');
  return `${formattedHour}:${formattedMinute}`;
}

/**
 * Menghitung indeks hari dalam seminggu (0 = Minggu, 1 = Senin, ..., 6 = Sabtu)
 * untuk tanggal string berformat "YYYY-MM-DD" di zona waktu Asia/Jakarta.
 */
export function getJakartaDayOfWeek(dateStr: string): number {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year: number = Number(yearStr);
  const month: number = Number(monthStr);
  const day: number = Number(dayStr);
  const midDayUtc: Date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return midDayUtc.getUTCDay();
}

/**
 * Mengonversi format jam "HH:mm" atau "HH:mm:ss" ke integer menit dari jam 00:00.
 * Contoh: "10:00" -> 600, "12:55" -> 775.
 */
export function timeStringToMinutes(timeStr: string): number {
  const parts: string[] = timeStr.split(':');
  const hours: number = Number(parts[0]);
  const minutes: number = Number(parts[1] ?? '0');
  return hours * 60 + minutes;
}

/**
 * Mengonversi total menit dari jam 00:00 ke string format jam "HH:mm".
 * Contoh: 600 -> "10:00", 775 -> "12:55".
 */
export function minutesToTimeString(totalMinutes: number): string {
  const normalized: number = Math.max(0, Math.min(1439, Math.floor(totalMinutes)));
  const h: number = Math.floor(normalized / 60);
  const m: number = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Menghasilkan ISO 8601 String dengan penanda zona waktu eksplisit "+07:00" (Asia/Jakarta).
 * Contoh: ("2026-10-24", "10:00") -> "2026-10-24T10:00:00+07:00"
 */
export function createJakartaIsoString(dateStr: string, timeStr: string): string {
  const cleanTime: string = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return `${dateStr}T${cleanTime}+07:00`;
}

/**
 * Memeriksa apakah dua interval waktu [startA, endA) dan [startB, endB) saling tumpang tindih (overlap).
 * Menggunakan model matematika irisan himpunan terbuka di ujung kanan [start, end).
 */
export function isIntervalOverlapping(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

/**
 * Mengonversi rentang waktu ISO (start_time & end_time) ke interval menit pada targetDate di Asia/Jakarta.
 * Mengembalikan null jika rentang waktu berada di luar targetDate.
 */
export function parseBookingToJakartaMinutes(
  startIso: string,
  endIso: string,
  targetDateStr: string
): { startMinutes: number; endMinutes: number } | null {
  const startDate: Date = new Date(startIso);
  const endDate: Date = new Date(endIso);

  const startTargetDate: string = getJakartaDateString(startDate);
  // Jika booking dimulai di tanggal yang berbeda dengan targetDate kalender Jakarta
  if (startTargetDate !== targetDateStr) {
    return null;
  }

  const startParts: JakartaDateTimeParts = getJakartaDateTimeParts(startDate);
  const endParts: JakartaDateTimeParts = getJakartaDateTimeParts(endDate);

  const startMinutes: number = startParts.hour * 60 + startParts.minute;
  
  // Jika end_time melewati pergantian hari kalender Jakarta
  const endDateStr: string = getJakartaDateString(endDate);
  let endMinutes: number = endParts.hour * 60 + endParts.minute;
  if (endDateStr !== targetDateStr) {
    endMinutes += 1440;
  }

  return {
    startMinutes,
    endMinutes
  };
}
