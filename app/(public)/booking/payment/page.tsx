import * as React from "react";
import type { Metadata } from "next";
import { PaymentScreen } from "@/components/payment/payment-screen";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Pembayaran DP Reservasi | Damez Barbershop Senopati",
  description:
    "Selesaikan pembayaran uang muka (DP) flat Rp 20.000 via QRIS atau Midtrans Snap untuk mengunci slot kursi master barber Anda di Damez Barbershop Senopati.",
  robots: {
    index: false,
    follow: false,
  },
};

function PaymentLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-8 animate-spin text-primary" />
      <span className="text-sm font-medium">Memuat gerbang pembayaran...</span>
    </div>
  );
}

export default function BookingPaymentPage() {
  return (
    <React.Suspense fallback={<PaymentLoadingFallback />}>
      <PaymentScreen />
    </React.Suspense>
  );
}
