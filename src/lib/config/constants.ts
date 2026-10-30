/**
 * Baseline bisnis Damez Barbershop (IDEA.md §3).
 * Angka di sini dikunci owner — jangan diubah tanpa persetujuan ulang.
 * Nilai yang sama juga di-hardcode di SQL (migrasi 0002) karena SQL tidak bisa
 * mengimpor TypeScript; test integrasi R0.7 menegaskan keduanya tidak menyimpang.
 */

/** DP flat per booking, Rupiah. Dipotong dari total saat pelunasan di kasir. */
export const DOWN_PAYMENT_IDR = 20000 as const;

/** TTL hold slot: 15 menit. */
export const HOLD_TTL_SECONDS = 900 as const;

/** Batas batal/reschedule: H-3 jam sebelum jadwal. */
export const CANCEL_CUTOFF_HOURS = 3 as const;

/** Toleransi keterlambatan: 15 menit. Lewat itu -> no_show, slot dilepas. */
export const LATE_TOLERANCE_MINUTES = 15 as const;

/** Jumlah kursi = jumlah master barber aktif. */
export const CHAIR_COUNT = 3 as const;

/** Jam buka gerai (WIB). */
export const OPENING_HOUR = 10 as const;

/** Jam tutup gerai (WIB). */
export const CLOSING_HOUR = 21 as const;

/** Zona waktu tunggal untuk DB, server, dan tampilan. */
export const TIMEZONE = "Asia/Jakarta" as const;

/** Grid slot: slot ditawarkan tiap 15 menit. */
export const SLOT_GRID_STEP_MINUTES = 15 as const;

/** Buffer sterilisasi alat setelah layanan selesai. */
export const TURNAROUND_BUFFER_MINUTES = 10 as const;

/** Lead time minimum sebelum jadwal: 30 menit. */
export const MIN_LEAD_TIME_MINUTES = 30 as const;

/** Anti-hoarding: maksimal 2 hold belum dibayar per nomor telepon. */
export const MAX_ACTIVE_HOLDS_PER_PHONE = 2 as const;
