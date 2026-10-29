import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { listActiveBarbers, listActiveServices } from "@/features/catalogue/queries";

export const metadata: Metadata = {
  title: "Booking Kursi — Damez Barbershop",
  description:
    "Pilih layanan, barber, dan jam kedatangan. Slot dikunci 15 menit dengan DP flat Rp 20.000.",
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
          Empat langkah, tanpa akun. Slot Anda dikunci 15 menit setelah DP Rp 20.000 dibayar.
        </p>
      </header>

      <BookingWizard services={services} barbers={barbers} />
    </main>
  );
}
