import { BOOKING_SERVICES, FLAT_DOWN_PAYMENT_IDR, SANITATION_BUFFER_MINUTES } from "./constants.ts";
import type { BookingCalculation, BookingService } from "./types.ts";

/**
 * Menghitung rincian waktu, total biaya, dan DP dari daftar ID layanan yang dipilih
 */
export function calculateBookingTotals(
  selectedServiceIds: string[],
  startTime?: string
): BookingCalculation {
  const selectedServices: BookingService[] = BOOKING_SERVICES.filter((srv) =>
    selectedServiceIds.includes(srv.id) || selectedServiceIds.includes(srv.code)
  );

  const totalServiceMinutes = selectedServices.reduce(
    (sum, srv) => sum + srv.durationMinutes,
    0
  );
  const bufferMinutes = SANITATION_BUFFER_MINUTES;
  const totalWindowMinutes = totalServiceMinutes + bufferMinutes;

  const totalPrice = selectedServices.reduce((sum, srv) => sum + srv.price, 0);
  const downPayment = FLAT_DOWN_PAYMENT_IDR;
  const remainingPrice = Math.max(0, totalPrice - downPayment);

  let endTime = "";
  if (startTime && startTime.includes(":")) {
    const [hStr, mStr] = startTime.split(":");
    const startHour = parseInt(hStr, 10);
    const startMin = parseInt(mStr, 10);

    if (!isNaN(startHour) && !isNaN(startMin)) {
      const totalMinutesFromMidnight = startHour * 60 + startMin + totalServiceMinutes;
      const endHour = Math.floor(totalMinutesFromMidnight / 60) % 24;
      const endMinute = totalMinutesFromMidnight % 60;
      endTime = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
    }
  }

  return {
    totalServiceMinutes,
    bufferMinutes,
    totalWindowMinutes,
    totalPrice,
    downPayment,
    remainingPrice,
    endTime,
  };
}

/**
 * Format mata uang Rupiah standar
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\s+/g, " ");
}

export interface UpcomingDateItem {
  dateString: string; // "YYYY-MM-DD"
  dayName: string; // "Senin", "Selasa", dll
  dayNumber: string; // "24"
  monthName: string; // "Okt"
  fullFormatted: string; // "Sabtu, 24 Oktober 2026"
  isToday: boolean;
  isTomorrow: boolean;
  dayOfWeek: number; // 0 = Minggu, 1 = Senin, ...
}

const INDONESIAN_DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const INDONESIAN_MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/**
 * Menghasilkan daftar tanggal 7 hari ke depan berbasis Waktu Indonesia Barat (WIB)
 */
export function getUpcomingDates(daysCount = 7): UpcomingDateItem[] {
  const result: UpcomingDateItem[] = [];

  // Gunakan waktu sekarang di zona Asia/Jakarta
  const now = new Date();
  const jakartaTimeString = now.toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
  });
  const todayJakarta = new Date(jakartaTimeString);

  for (let i = 0; i < daysCount; i++) {
    const targetDate = new Date(todayJakarta);
    targetDate.setDate(todayJakarta.getDate() + i);

    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const dateNum = targetDate.getDate();
    const dayOfWeek = targetDate.getDay();

    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(dateNum).padStart(2, "0")}`;
    const dayName = INDONESIAN_DAYS[dayOfWeek];
    const monthName = INDONESIAN_MONTHS_SHORT[month];
    const fullMonthName = INDONESIAN_MONTHS[month];
    const fullFormatted = `${dayName}, ${dateNum} ${fullMonthName} ${year}`;

    result.push({
      dateString,
      dayName,
      dayNumber: String(dateNum),
      monthName,
      fullFormatted,
      isToday: i === 0,
      isTomorrow: i === 1,
      dayOfWeek,
    });
  }

  return result;
}

/**
 * Format tanggal YYYY-MM-DD ke string Bahasa Indonesia lengkap
 */
export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  const d = new Date(year, month, day);
  const dayName = INDONESIAN_DAYS[d.getDay()];
  const monthName = INDONESIAN_MONTHS[month];

  return `${dayName}, ${day} ${monthName} ${year}`;
}

/**
 * Validasi dan normalisasi nomor WhatsApp format Indonesia
 */
export function validateIndonesianPhone(phone: string): {
  isValid: boolean;
  normalized: string;
  e164?: string;
  errorMessage?: string;
} {
  if (!phone || typeof phone !== "string") {
    return {
      isValid: false,
      normalized: "",
      errorMessage: "Nomor WhatsApp aktif wajib diisi.",
    };
  }

  // Bersihkan zero-width space dan pemisah umum (spasi, tanda hubung, kurung, titik, underscore, slash)
  const cleaned = phone.trim().replace(/[\u200B-\u200D\uFEFF\s\-\(\)\._\/]/g, "");

  if (!cleaned) {
    return {
      isValid: false,
      normalized: "",
      errorMessage: "Nomor WhatsApp aktif wajib diisi.",
    };
  }

  // Normalisasi prefix internasional atau kebiasaan tanpa awalan 0 (+62, 62, atau 8xxx)
  let normalized = cleaned;
  if (normalized.startsWith("+62")) {
    normalized = "0" + normalized.slice(3);
  } else if (normalized.startsWith("62")) {
    normalized = "0" + normalized.slice(2);
  } else if (normalized.startsWith("8")) {
    normalized = "0" + normalized;
  }

  // Validasi ketat: hanya boleh berisi digit angka
  if (!/^\d+$/.test(normalized)) {
    return {
      isValid: false,
      normalized,
      errorMessage: "Nomor WhatsApp hanya boleh berisi digit angka tanpa huruf atau simbol.",
    };
  }

  // Nomor seluler Indonesia wajib diawali 08
  if (!normalized.startsWith("08")) {
    return {
      isValid: false,
      normalized,
      errorMessage: "Nomor WhatsApp seluler harus diawali dengan 08 (contoh: 081234567890).",
    };
  }

  // Cek prefix non-seluler atau bebas pulsa (contoh: 0800 / 0804 toll-free)
  if (!/^08[1-9]/.test(normalized)) {
    return {
      isValid: false,
      normalized,
      errorMessage: "Nomor bebas pulsa atau korporat (080x) tidak didukung untuk WhatsApp.",
    };
  }

  // Panjang nomor ponsel seluler Indonesia umumnya 10 sampai 14 digit
  if (normalized.length < 10 || normalized.length > 14) {
    return {
      isValid: false,
      normalized,
      errorMessage: "Nomor WhatsApp harus terdiri dari 10 hingga 14 digit angka.",
    };
  }

  return {
    isValid: true,
    normalized,
    e164: "+62" + normalized.slice(1),
  };
}
