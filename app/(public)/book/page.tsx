import * as React from "react";
import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Reservasi Kursi Cepat | Damez Barbershop Senopati",
  description:
    "Reservasi kursi potong rambut pria tanpa antre di kawasan Senopati Jakarta Selatan. Pilih master barber, jam pasti, dan garansi DP Rp 20.000.",
  openGraph: {
    title: "Reservasi Kursi Cepat | Damez Barbershop Senopati",
    description:
      "Reservasi online kursi pangkas rambut pria klasik dan modern di Senopati. Langsung duduk saat tiba.",
    url: "https://damezbarbershop.com/book",
    siteName: "Damez Barbershop",
    locale: "id_ID",
    type: "website",
  },
  alternates: {
    canonical: "https://damezbarbershop.com/book",
  },
};

function BookingLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-8 animate-spin text-primary" />
      <span className="text-sm font-medium">Menyiapkan formulir reservasi...</span>
    </div>
  );
}

export default function BookPage() {
  return (
    <React.Suspense fallback={<BookingLoadingFallback />}>
      <BookingWizard />
    </React.Suspense>
  );
}
