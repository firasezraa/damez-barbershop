import * as React from "react";
import type { Metadata } from "next";
import { SuccessScreen } from "@/components/booking/success-screen";

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Tiket Digital Boarding Pass ${code} | Damez Barbershop`,
    description: `Tiket reservasi resmi kursi potong rambut Damez Barbershop Senopati kode ${code}. Siap ditunjukkan ke kasir.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function BookingSuccessCodePage({ params }: PageProps) {
  const { code } = await params;
  return <SuccessScreen bookingCode={code} />;
}
