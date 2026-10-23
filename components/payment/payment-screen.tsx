"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  IconShieldCheck,
  IconArrowLeft,
  IconAlertCircle,
  IconLoader2,
  IconCalendar,
  IconCircleCheck,
  IconLock,
} from "@/components/ui/icons";
import { GalaxyBarberPoleLoader } from "@/components/ui/galaxy-components";
import { CountdownTimer } from "./countdown-timer";
import { QrisDisplay } from "./qris-display";
import { SnapButton } from "./snap-button";
import { PaymentSummary } from "./payment-summary";
import { Button } from "@/components/ui/button";
import type { PaymentBookingDetail, SnapCheckoutData } from "./types";
import { BOOKING_BARBERS, BOOKING_SERVICES } from "@/components/booking/constants";

interface PaymentScreenProps {
  initialCode?: string;
  initialId?: string;
}

export function PaymentScreen({ initialCode, initialId }: PaymentScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const bookingCode = initialCode || searchParams?.get("code") || "";
  const bookingId = initialId || searchParams?.get("id") || "";

  const [booking, setBooking] = React.useState<PaymentBookingDetail | null>(null);
  const [checkoutData, setCheckoutData] = React.useState<SnapCheckoutData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = React.useState(false);
  const [isExpired, setIsExpired] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // 1. Fetch Booking Details
  const fetchBookingDetails = React.useCallback(async () => {
    if (!bookingCode && !bookingId) {
      setErrorMessage("Kode booking atau ID tidak ditemukan pada URL.");
      setIsLoading(false);
      return;
    }

    const queryKey = bookingCode || bookingId;

    try {
      // First try /api/booking/[code]
      const res = await fetch(`/api/booking/${encodeURIComponent(queryKey)}`, {
        cache: "no-store",
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const data: PaymentBookingDetail = json.data;
          setBooking(data);

          if (data.status === "confirmed") {
            router.push(`/booking/success/${data.booking_code}`);
            return;
          }

          if (data.is_expired || data.status === "expired") {
            setIsExpired(true);
          }
          return;
        }
      }

      // Fallback try /api/booking/hold?code=...
      const holdRes = await fetch(`/api/booking/hold?code=${encodeURIComponent(queryKey)}`, {
        cache: "no-store",
      });

      if (holdRes.ok) {
        const holdJson = await holdRes.json();
        if (holdJson.success && holdJson.data) {
          const holdData = holdJson.data;

          if (holdData.status === "confirmed") {
            router.push(`/booking/success/${holdData.booking_code || queryKey}`);
            return;
          }

          if (holdData.is_expired) {
            setIsExpired(true);
          }

          const bRecord = holdData.booking;
          const barber = BOOKING_BARBERS.find((b) => b.id === bRecord?.barber_id) || BOOKING_BARBERS[0];

          const fallbackDetail: PaymentBookingDetail = {
            id: holdData.booking_id || bRecord?.id || queryKey,
            booking_code: holdData.booking_code || bRecord?.booking_code || queryKey,
            customer_name: bRecord?.customer_name || "Pelanggan Damez",
            customer_phone: bRecord?.customer_phone || "081234567890",
            customer_email: bRecord?.customer_email || null,
            barber_id: barber.id,
            barber: {
              id: barber.id,
              code: barber.code,
              name: barber.name,
              nickname: barber.nickname,
              title: barber.title,
              chair_number: barber.chairNumber,
              avatar_url: barber.avatarUrl,
            },
            booking_date: bRecord?.booking_date || new Date().toISOString().slice(0, 10),
            start_time: bRecord?.start_time || "14:30",
            end_time: bRecord?.end_time || "15:15",
            service_duration_minutes: bRecord?.service_duration_minutes || 45,
            services: [
              {
                id: BOOKING_SERVICES[0].id,
                name: BOOKING_SERVICES[0].name,
                duration_minutes: BOOKING_SERVICES[0].durationMinutes,
                price_idr: BOOKING_SERVICES[0].price,
              },
            ],
            total_price_idr: bRecord?.total_price_idr || 50000,
            down_payment_idr: bRecord?.down_payment_idr || 20000,
            remaining_balance_idr: bRecord?.remaining_balance_idr || 30000,
            status: holdData.status || "pending_payment",
            hold_expires_at: holdData.hold_expires_at || null,
            is_expired: Boolean(holdData.is_expired),
            remaining_seconds: holdData.remaining_seconds || 900,
            remaining_formatted: holdData.remaining_formatted || "15:00",
            confirmed_at: null,
            notes: null,
          };

          setBooking(fallbackDetail);
          return;
        }
      }

      setErrorMessage("Data reservasi tidak dapat dimuat atau telah kedaluwarsa.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Koneksi gagal: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, [bookingCode, bookingId, router]);

  // 2. Fetch Snap Checkout Token
  const fetchCheckoutToken = React.useCallback(async (targetBookingId: string) => {
    try {
      const res = await fetch("/api/booking/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: targetBookingId,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setCheckoutData(json.data);
        }
      }
    } catch (e) {
      console.warn("[Checkout Token] Failed to initialize Snap checkout:", e);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    fetchBookingDetails();
  }, [fetchBookingDetails]);

  // Once booking is loaded, fetch checkout token if not yet loaded
  React.useEffect(() => {
    if (booking && !checkoutData && booking.status === "pending_payment" && !isExpired) {
      fetchCheckoutToken(booking.id);
    }
  }, [booking, checkoutData, isExpired, fetchCheckoutToken]);

  // 3. Polling for confirmation every 3 seconds
  React.useEffect(() => {
    if (!booking || booking.status !== "pending_payment" || isExpired) return;

    const interval = setInterval(async () => {
      try {
        const queryKey = booking.booking_code || booking.id;
        const res = await fetch(`/api/booking/${encodeURIComponent(queryKey)}`, {
          cache: "no-store",
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            if (json.data.status === "confirmed") {
              clearInterval(interval);
              router.push(`/booking/success/${json.data.booking_code}`);
            } else if (json.data.is_expired || json.data.status === "expired") {
              setIsExpired(true);
            }
          }
        }
      } catch {
        // Polling silent catch
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [booking, isExpired, router]);

  // 4. Intercept accidental navigation / refresh when payment is pending (BUG-M801-08)
  React.useEffect(() => {
    if (!booking || booking.status !== "pending_payment" || isExpired) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Sesi pembayaran DP sedang aktif. Meninggalkan halaman ini dapat membatalkan atau menyulitkan konfirmasi reservasi Anda.";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [booking, isExpired]);

  // Manual Check Status Button
  const handleManualCheckStatus = async () => {
    if (!booking) return;
    setIsCheckingStatus(true);
    try {
      const queryKey = booking.booking_code || booking.id;
      const res = await fetch(`/api/booking/${encodeURIComponent(queryKey)}`, {
        cache: "no-store",
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setBooking(json.data);
          if (json.data.status === "confirmed") {
            router.push(`/booking/success/${json.data.booking_code}`);
          } else if (json.data.is_expired || json.data.status === "expired") {
            setIsExpired(true);
          }
        }
      }
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Simulate Payment Success (Dev / Demo)
  const handleSimulatePayment = async () => {
    if (!booking) return;
    try {
      const queryKey = booking.booking_code || booking.id;
      const res = await fetch(`/api/booking/${encodeURIComponent(queryKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          router.push(`/booking/success/${json.data.booking_code}`);
        }
      }
    } catch (e) {
      console.warn("Simulation failed:", e);
    }
  };

  // Handle countdown expiry
  const handleTimerExpired = () => {
    setIsExpired(true);
    if (booking) {
      setBooking((prev) => (prev ? { ...prev, is_expired: true, status: "expired" } : null));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 text-muted-foreground p-4">
        <GalaxyBarberPoleLoader
          mode="normal"
          statusText="Menyiapkan Gerbang Pembayaran..."
          subText="Menghubungkan ke sistem reservasi"
        />
      </div>
    );
  }

  if (errorMessage && !booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-destructive/40 bg-surface p-6 text-center">
          <IconAlertCircle size="xl" className="mx-auto text-destructive mb-3" aria-hidden="true" />
          <h2 className="text-lg font-bold text-foreground mb-1.5">
            Reservasi Tidak Ditemukan
          </h2>
          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
            {errorMessage}
          </p>
          <div className="flex flex-col gap-2.5">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setErrorMessage(null);
                setIsLoading(true);
                fetchBookingDetails();
              }}
            >
              Coba Muat Ulang
            </Button>
            <Link href="/book">
              <Button variant="primary" className="w-full">
                Mulai Reservasi Baru
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md px-4 py-3.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href="/book"
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconArrowLeft size="micro" aria-hidden="true" />
            <span>Kembali ke Jadwal</span>
          </Link>

          <div className="flex items-center gap-2">
            <IconShieldCheck size="micro" className="text-primary" aria-hidden="true" />
            <span className="text-xs font-bold tracking-wide uppercase text-foreground">
              Pembayaran Aman
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8 flex-1">
        {/* Screen Title */}
        <div className="mb-6 text-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
            Pembayaran Uang Muka (DP)
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Kunci slot kursi master barber Anda dengan pembayaran DP flat Rp 20.000 via QRIS atau Midtrans Snap.
          </p>
        </div>

        {/* 15-Minute Countdown Timer Banner */}
        <div className="mb-6">
          <CountdownTimer
            holdExpiresAt={booking?.hold_expires_at}
            initialRemainingSeconds={booking?.remaining_seconds || 900}
            onExpire={handleTimerExpired}
          />
        </div>

        {/* Expired State Notice */}
        {isExpired ? (
          <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-6 text-center shadow-lg mb-8">
            <IconAlertCircle size="xl" className="mx-auto text-destructive mb-3" aria-hidden="true" />
            <h3 className="text-base font-bold text-destructive mb-1.5">
              Waktu Pembayaran Telah Habis (15 Menit)
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
              Demi menjaga keadilan dan ketersediaan slot bagi pelanggan lain, penahanan kursi kerja barber Anda telah dilepas kembali secara otomatis.
            </p>
            <div className="flex justify-center">
              <Link href="/book">
                <Button variant="primary" size="lg" className="min-w-[200px]">
                  Pilih Jadwal Ulang
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Payment Grid Layout: Summary (Left) & QRIS/Snap (Right) */
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            {/* Left Column: Booking & Financial Summary (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {booking && <PaymentSummary booking={booking} />}
            </div>

            {/* Right Column: QRIS Display & Snap Button (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* QRIS Display Card */}
              {booking && (
                <QrisDisplay
                  grossAmount={booking.down_payment_idr}
                  bookingCode={booking.booking_code}
                  onCheckStatus={handleManualCheckStatus}
                  onSimulateSuccess={handleSimulatePayment}
                  isChecking={isCheckingStatus}
                />
              )}

              {/* Midtrans Snap Popup Trigger */}
              <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <IconLock size="micro" className="text-primary" aria-hidden="true" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Pilihan Metode Lain
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ingin bayar menggunakan GoPay, ShopeePay, atau Virtual Account bank? Buka popup Midtrans Snap:
                </p>

                <SnapButton
                  token={checkoutData?.token}
                  redirectUrl={checkoutData?.redirect_url}
                  onSuccess={(result) => {
                    if (booking) {
                      router.push(`/booking/success/${booking.booking_code}`);
                    }
                  }}
                  onPending={(result) => {
                    handleManualCheckStatus();
                  }}
                  onError={(err) => {
                    console.warn("Snap error:", err);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-border py-4 px-4 text-center text-xs text-muted-foreground">
        <span>Damez Barbershop Senopati. Reservasi Pasti, Tanpa Antre.</span>
      </footer>
    </div>
  );
}
