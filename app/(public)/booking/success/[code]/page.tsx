import * as React from "react";
import type { Metadata } from "next";
import { SuccessScreen } from "@/components/booking/success-screen";

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const sanitizedCode = (code || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);
  const titleText = sanitizedCode
    ? `Tiket Digital Boarding Pass ${sanitizedCode} | Damez Barbershop`
    : "Tiket Digital Boarding Pass | Damez Barbershop";
  const descText = sanitizedCode
    ? `Tiket reservasi resmi kursi potong rambut Damez Barbershop Senopati kode ${sanitizedCode}. Siap ditunjukkan ke kasir.`
    : "Tiket reservasi resmi kursi potong rambut Damez Barbershop Senopati. Siap ditunjukkan ke kasir.";

  return {
    title: titleText,
    description: descText,
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
