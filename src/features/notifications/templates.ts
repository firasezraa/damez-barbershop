/**
 * Template pesan WhatsApp. Kebijakan owner: tanpa emoji (IDEA.md §3), kalimat
 * lugas, dan menyebut nominal apa adanya. Waktu selalu WIB.
 */

export type BookingMessageInput = {
  fullName: string;
  bookingCode: string;
  startTime: Date;
  barberName: string;
  chairNumber: number;
  dpIdr: number;
  remainingIdr: number;
};

const JAKARTA = "Asia/Jakarta";

function formatDate(instant: Date): string {
  return instant.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: JAKARTA,
  });
}

function formatTime(instant: Date): string {
  return instant.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: JAKARTA,
  });
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

/** Pesan konfirmasi setelah DP terverifikasi. */
export function buildBookingConfirmedMessage(input: BookingMessageInput): string {
  return [
    `Halo ${input.fullName}, kursi Anda di Damez Barbershop sudah terkunci.`,
    "",
    `Kode booking: ${input.bookingCode}`,
    `Jadwal: ${formatDate(input.startTime)}, ${formatTime(input.startTime)} WIB`,
    `Barber: ${input.barberName} (kursi ${input.chairNumber})`,
    `DP diterima: ${formatRupiah(input.dpIdr)}`,
    `Sisa dibayar di kasir: ${formatRupiah(input.remainingIdr)}`,
    "",
    "Datang maksimal 15 menit setelah jadwal. Pembatalan paling lambat 3 jam sebelum jadwal.",
    "Tunjukkan pesan ini di kasir.",
  ].join("\n");
}