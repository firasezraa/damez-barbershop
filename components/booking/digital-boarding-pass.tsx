"use client";

import * as React from "react";
import Link from "next/link";
import {
  Scissors,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Armchair,
  MapPin,
  Copy,
  Check,
  Printer,
  Share2,
  MessageCircle,
  Home,
  ShieldCheck,
  AlertCircle,
  Building2,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PaymentBookingDetail } from "@/components/payment/types";
import { SHOP_METADATA } from "@/components/booking/constants";

interface DigitalBoardingPassProps {
  booking: PaymentBookingDetail;
  className?: string;
}

export function DigitalBoardingPass({
  booking,
  className,
}: DigitalBoardingPassProps) {
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  // Copy Booking Code
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(booking.booking_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (e) {
      // Fallback
    }
  };

  // Copy Ticket Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      // Fallback
    }
  };

  // Handle Print
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const formattedTotal = `Rp ${booking.total_price_idr.toLocaleString("id-ID")}`;
  const formattedDp = `Rp ${booking.down_payment_idr.toLocaleString("id-ID")}`;
  const formattedRemaining = `Rp ${booking.remaining_balance_idr.toLocaleString("id-ID")}`;

  // WhatsApp Admin Link & Prefilled Message
  const adminPhone = SHOP_METADATA.officialPhoneDigits || "6281234567890";
  const waMessage = [
    `Halo Admin Damez Barbershop, saya ingin konfirmasi tiket reservasi saya:`,
    `- Kode Booking: ${booking.booking_code}`,
    `- Nama: ${booking.customer_name}`,
    `- Jadwal: ${booking.booking_date} pukul ${booking.start_time} WIB`,
    `- Master Barber: ${booking.barber.name} (Kursi ${booking.barber.chair_number})`,
    `- Sisa Pelunasan di Kasir: ${formattedRemaining}`,
    `Terima kasih.`
  ].join("\n");

  const waUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className={cn("mx-auto w-full max-w-xl flex flex-col gap-6", className)}>
      {/* Top Success Announcement */}
      <div className="flex flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-3 shadow-lg shadow-emerald-950/30">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
          Reservasi Berhasil Dikonfirmasi
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
          Uang muka (DP) telah diterima. Tiket digital boarding pass Anda siap ditunjukkan kepada kasir saat kedatangan.
        </p>
      </div>

      {/* THE DIGITAL BOARDING PASS CARD */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-surface shadow-2xl shadow-black/80 print:shadow-none print:border-black">
        {/* Pass Top Banner (Aviation / Barber Header) */}
        <div className="relative bg-gradient-to-r from-surface-elevated via-surface to-surface-elevated px-6 py-5 border-b border-border/80">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/40">
                <Scissors className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-widest text-primary uppercase">
                  DAMEZ BARBERSHOP
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  DIGITAL BOARDING PASS
                </span>
              </div>
            </div>

            <Badge variant="confirmed" className="text-xs px-3 py-1 font-bold">
              TERKONFIRMASI - DP LUNAS
            </Badge>
          </div>
        </div>

        {/* Primary Booking Code & Barcode Section */}
        <div className="px-6 py-5 border-b border-dashed border-border/70 bg-surface-elevated/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Kode Booking Unik
              </span>
              <div className="flex items-center gap-2.5 mt-0.5">
                <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-wider text-primary">
                  {booking.booking_code}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  {copiedCode ? (
                    <>
                      <Check data-icon="inline-start" className="size-3.5 text-emerald-500" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy data-icon="inline-start" className="size-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Gate / Seat Tag */}
            <div className="flex flex-col sm:items-end">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Gate Kursi
              </span>
              <span className="text-lg font-black text-foreground">
                KURSI {String(booking.barber.chair_number).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Perforated Line with Notch Cutouts */}
        <div className="relative flex items-center justify-center my-[-1px]">
          {/* Left Notch */}
          <div className="absolute -left-3 size-6 rounded-full bg-background border-r border-border" />
          {/* Dashed Line */}
          <div className="w-full border-t-2 border-dashed border-border/60 mx-4" />
          {/* Right Notch */}
          <div className="absolute -right-3 size-6 rounded-full bg-background border-l border-border" />
        </div>

        {/* Flight & Passenger Detail Grid */}
        <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
          {/* Passenger Name */}
          <div className="flex items-start gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-primary border border-border">
              <User className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pelanggan
              </span>
              <span className="font-bold text-foreground">
                {booking.customer_name}
              </span>
              <span className="text-xs text-muted-foreground">
                {booking.customer_phone}
              </span>
            </div>
          </div>

          {/* Master Barber */}
          <div className="flex items-start gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-primary border border-border">
              <Armchair className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Master Barber
              </span>
              <span className="font-bold text-foreground">
                {booking.barber.name}
              </span>
              <span className="text-xs text-primary">
                {booking.barber.title} ({booking.barber.nickname})
              </span>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-primary border border-border">
              <Calendar className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tanggal Kedatangan
              </span>
              <span className="font-bold text-foreground">
                {booking.booking_date}
              </span>
              <span className="text-xs text-muted-foreground">
                Waktu Indonesia Barat (WIB)
              </span>
            </div>
          </div>

          {/* Time & Duration */}
          <div className="flex items-start gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-primary border border-border">
              <Clock className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Jam Kedatangan
              </span>
              <span className="font-bold text-foreground">
                {booking.start_time} - {booking.end_time} WIB
              </span>
              <span className="text-xs text-muted-foreground">
                Estimasi durasi: {booking.service_duration_minutes} menit
              </span>
            </div>
          </div>
        </div>

        {/* Services Breakdown */}
        <div className="px-6 py-4 border-t border-border/80 bg-surface-elevated/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Layanan Terpilih
          </span>
          <div className="mt-2 flex flex-col gap-1.5">
            {booking.services.map((svc) => (
              <div key={svc.id} className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">
                  {svc.name}
                </span>
                <span className="font-semibold text-muted-foreground">
                  Rp {svc.price_idr.toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FINANCIAL SUMMARY & SISA PELUNASAN KASIR (Crucial DoD & Spec) */}
        <div className="px-6 py-5 border-t border-border bg-gradient-to-b from-surface to-surface-elevated">
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Total Biaya Layanan:</span>
              <span className="font-medium text-foreground">{formattedTotal}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-400 mb-3">
              <span>Uang Muka (DP) Terbayar:</span>
              <span className="font-semibold">- {formattedDp} (Lunas)</span>
            </div>

            {/* Sisa Pelunasan di Tempat Highlight */}
            <div className="flex items-center justify-between border-t border-primary/30 pt-3">
              <div className="flex flex-col">
                <span className="text-xs font-extrabold uppercase tracking-wide text-foreground">
                  Sisa Pelunasan di Kasir:
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Bayar langsung di tempat setelah selesai
                </span>
              </div>
              <span className="font-mono text-xl sm:text-2xl font-black text-primary">
                {formattedRemaining}
              </span>
            </div>
          </div>
        </div>

        {/* Barcode Graphic for Cashier Scanner */}
        <div className="px-6 py-5 border-t border-border bg-surface-elevated/60 flex flex-col items-center justify-center text-center">
          {/* Vector Stylized Barcode */}
          <div className="flex items-center justify-center gap-[3px] h-12 w-full max-w-xs px-4 py-1.5 bg-white rounded-lg">
            {/* Alternating barcode lines */}
            {[
              3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 3, 2, 1, 3, 4, 1,
              2, 3, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 1, 4, 1,
            ].map((width, idx) => (
              <div
                key={idx}
                className="h-full bg-black shrink-0"
                style={{ width: `${width}px` }}
              />
            ))}
          </div>

          <span className="mt-2 font-mono text-[11px] tracking-widest text-muted-foreground">
            {booking.booking_code}
          </span>
          <span className="mt-0.5 text-[10px] text-muted-foreground">
            Tunjukkan kode ini kepada kasir saat Anda tiba di barbershop
          </span>
        </div>

        {/* Arrival Terms and Location Note */}
        <div className="px-6 py-4 border-t border-border text-[11px] text-muted-foreground leading-relaxed flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <MapPin className="size-3.5 text-primary shrink-0" />
            <span>Lokasi: {SHOP_METADATA.location}</span>
          </div>
          <div className="flex items-start gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Jaminan Kursi Siap: Hadir 10 menit lebih awal. Toleransi keterlambatan maksimal 15 menit sebelum kursi dialihkan.
            </span>
          </div>
        </div>
      </div>

      {/* WHATSAPP ADMIN BUTTON (Mandatory Spec) */}
      <div className="flex flex-col gap-3">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button
            type="button"
            size="lg"
            className="w-full bg-[#25D366] text-white hover:bg-[#20BD5A] font-bold shadow-lg shadow-[#25D366]/20 border-0"
          >
            <MessageCircle data-icon="inline-start" className="size-5" />
            Hubungi Admin via WhatsApp
          </Button>
        </a>

        {/* Secondary Action Toolbar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs"
          >
            <Printer data-icon="inline-start" className="size-3.5" />
            Cetak Tiket
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="text-xs"
          >
            {copiedLink ? (
              <>
                <Check data-icon="inline-start" className="size-3.5 text-emerald-500" />
                Tersalin
              </>
            ) : (
              <>
                <Share2 data-icon="inline-start" className="size-3.5" />
                Bagikan Tiket
              </>
            )}
          </Button>

          <Link href="/" className="col-span-2 sm:col-span-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              <Home data-icon="inline-start" className="size-3.5" />
              Ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
