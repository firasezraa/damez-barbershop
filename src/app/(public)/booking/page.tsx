// Katalog dibaca dari database saat request, bukan saat build: build produksi
// (termasuk preview di Vercel) tidak boleh bergantung pada ketersediaan database.
// Cache/ISR menyusul di R5 bersama pengukuran LCP.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { listActiveBarbers, listActiveServices } from "@/features/catalogue/queries";
import { formatRupiah } from "@/features/catalogue/types";
import { DOWN_PAYMENT_IDR, HOLD_TTL_SECONDS } from "@/lib/config/constants";

export const metadata: Metadata = {
  title: "Booking Kursi — Damez Barbershop",
  description: `Pilih layanan, barber, dan jam kedatangan. Kursi ditahan ${Math.round(HOLD_TTL_SECONDS / 60)} menit dengan DP flat ${formatRupiah(DOWN_PAYMENT_IDR)}.`,
  robots: { index: true, follow: true },
};

export default async function BookingPage() {
  const [services, barbers] = await Promise.all([listActiveServices(), listActiveBarbers()]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <p className="font-display text-sm tracking-[0.2em] text-brass uppercase">Damez</p>
        <h1 className="font-display text-3xl text-text">Booking Kursi</h1>
        <p className="text-sm text-muted">
          Empat langkah, tanpa akun. Kursi ditahan {Math.round(HOLD_TTL_SECONDS / 60)} menit —
          selesaikan DP {formatRupiah(DOWN_PAYMENT_IDR)} sebelum batas itu habis.
        </p>
      </header>

      <BookingWizard services={services} barbers={barbers} />
    </main>
  );
}
