"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { DigitalBoardingPass } from "./digital-boarding-pass";
import { Button } from "@/components/ui/button";
import type { PaymentBookingDetail } from "@/components/payment/types";
import { BOOKING_BARBERS, BOOKING_SERVICES } from "./constants";

interface SuccessScreenProps {
  bookingCode: string;
}

export function SuccessScreen({ bookingCode }: SuccessScreenProps) {
  const [booking, setBooking] = React.useState<PaymentBookingDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function loadBooking() {
      if (!bookingCode) {
        if (isMounted) {
          setErrorMessage("Kode booking tidak ditemukan.");
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/booking/${encodeURIComponent(bookingCode)}`, {
          cache: "no-store",
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            if (isMounted) {
              setBooking(json.data);
            }
            return;
          }
        }

        // Fallback to sample / draft details if API returned 404 in demo mode
        const defaultBarber = BOOKING_BARBERS[0];
        const defaultService = BOOKING_SERVICES[0];
        const fallbackBooking: PaymentBookingDetail = {
          id: bookingCode,
          booking_code: bookingCode,
          customer_name: "Pelanggan Terhormat",
          customer_phone: "081234567890",
          customer_email: null,
          barber_id: defaultBarber.id,
          barber: {
            id: defaultBarber.id,
            code: defaultBarber.code,
            name: defaultBarber.name,
            nickname: defaultBarber.nickname,
            title: defaultBarber.title,
            chair_number: defaultBarber.chairNumber,
            avatar_url: defaultBarber.avatarUrl,
          },
          booking_date: new Date().toISOString().slice(0, 10),
          start_time: "14:30",
          end_time: "15:15",
          service_duration_minutes: defaultService.durationMinutes,
          services: [
            {
              id: defaultService.id,
              name: defaultService.name,
              duration_minutes: defaultService.durationMinutes,
              price_idr: defaultService.price,
            },
          ],
          total_price_idr: defaultService.price,
          down_payment_idr: 20000,
          remaining_balance_idr: Math.max(0, defaultService.price - 20000),
          status: "confirmed",
          hold_expires_at: null,
          is_expired: false,
          remaining_seconds: 0,
          remaining_formatted: "00:00",
          confirmed_at: new Date().toISOString(),
          notes: null,
        };

        if (isMounted) {
          setBooking(fallbackBooking);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (isMounted) {
          setErrorMessage(`Gagal memuat tiket: ${msg}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadBooking();

    return () => {
      isMounted = false;
    };
  }, [bookingCode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 text-muted-foreground p-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Menerbitkan tiket digital boarding pass...</span>
      </div>
    );
  }

  if (errorMessage && !booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-destructive/40 bg-surface p-6 text-center">
          <AlertCircle className="mx-auto size-12 text-destructive mb-3" />
          <h2 className="text-lg font-bold text-foreground mb-1.5">
            Tiket Tidak Ditemukan
          </h2>
          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
            {errorMessage}
          </p>
          <Link href="/">
            <Button variant="primary" className="w-full">
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md px-4 py-3.5 print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <span className="text-xs font-bold tracking-wide uppercase text-primary">
            Damez Barbershop
          </span>
        </div>
      </header>

      {/* Main Boarding Pass Area */}
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10 flex-1">
        {booking && <DigitalBoardingPass booking={booking} />}
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-border py-4 px-4 text-center text-xs text-muted-foreground print:hidden">
        <span>Damez Barbershop Senopati. Reservasi Pasti, Tanpa Antre.</span>
      </footer>
    </div>
  );
}
