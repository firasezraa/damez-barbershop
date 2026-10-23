"use client";

import * as React from "react";
import {
  IconCalendar,
  IconClock,
  IconUser,
  IconScissors,
  IconArmchair,
  IconCircleCheck,
  IconAlertCircle,
  IconCreditCard,
  IconMapPin,
} from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PaymentBookingDetail } from "./types";

interface PaymentSummaryProps {
  booking: PaymentBookingDetail;
  className?: string;
}

export function PaymentSummary({ booking, className }: PaymentSummaryProps) {
  const formattedTotal = `Rp ${booking.total_price_idr.toLocaleString("id-ID")}`;
  const formattedDp = `Rp ${booking.down_payment_idr.toLocaleString("id-ID")}`;
  const formattedRemaining = `Rp ${booking.remaining_balance_idr.toLocaleString("id-ID")}`;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-md shadow-black/40",
        className
      )}
    >
      {/* Top Banner: Booking Code & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Kode Reservasi
          </span>
          <span className="font-mono text-base font-extrabold text-foreground">
            {booking.booking_code}
          </span>
        </div>
        <Badge
          variant={
            booking.status === "confirmed"
              ? "confirmed"
              : booking.status === "expired"
              ? "noshow"
              : "pending"
          }
        >
          {booking.status === "confirmed"
            ? "Terkonfirmasi"
            : booking.status === "expired"
            ? "Kedaluwarsa"
            : "Menunggu Pembayaran DP"}
        </Badge>
      </div>

      {/* Booking Meta: Barber, Date, Time */}
      <div className="grid grid-cols-1 gap-3.5 py-4 border-b border-border text-sm sm:grid-cols-2">
        {/* Barber */}
        <div className="flex items-start gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-primary border border-border">
            <IconArmchair size="micro" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Master Barber</span>
            <span className="font-semibold text-foreground">
              {booking.barber.name}
            </span>
            <span className="text-[11px] text-primary">
              Kursi {booking.barber.chair_number} ({booking.barber.nickname})
            </span>
          </div>
        </div>

        {/* Schedule */}
        <div className="flex items-start gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-primary border border-border">
            <IconCalendar size="micro" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Tanggal & Jam</span>
            <span className="font-semibold text-foreground">
              {booking.booking_date}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {booking.start_time} - {booking.end_time} WIB ({booking.service_duration_minutes} menit)
            </span>
          </div>
        </div>

        {/* Customer */}
        <div className="flex items-start gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-primary border border-border">
            <IconUser size="micro" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Nama Pelanggan</span>
            <span className="font-semibold text-foreground">
              {booking.customer_name}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {booking.customer_phone}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-primary border border-border">
            <IconMapPin size="micro" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Lokasi Toko</span>
            <span className="font-semibold text-foreground">
              Damez Barbershop
            </span>
            <span className="text-[11px] text-muted-foreground">
              Senopati Raya No. 42, Jaksel
            </span>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="py-4 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Layanan yang Dipilih
        </span>
        <div className="mt-2.5 flex flex-col gap-2">
          {booking.services.map((svc) => (
            <div
              key={svc.id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <IconScissors size="micro" className="text-primary" aria-hidden="true" />
                <span className="font-medium text-foreground">{svc.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({svc.duration_minutes} mnt)
                </span>
              </div>
              <span className="font-semibold text-foreground">
                Rp {svc.price_idr.toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Transparency Calculation */}
      <div className="pt-4 flex flex-col gap-2.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Total Layanan:</span>
          <span className="font-medium text-foreground">{formattedTotal}</span>
        </div>

        {/* Highlighted Down Payment */}
        <div className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/30 p-2.5">
          <div className="flex items-center gap-2">
            <IconCreditCard size="micro" className="text-primary" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">
                Uang Muka (DP) Wajib:
              </span>
              <span className="text-[10px] text-muted-foreground">
                Flat via Midtrans / QRIS
              </span>
            </div>
          </div>
          <span className="text-base font-extrabold text-primary">
            {formattedDp}
          </span>
        </div>

        {/* Highlighted Remaining Settlement */}
        <div className="flex items-center justify-between rounded-xl bg-surface-elevated border border-border p-2.5">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">
              Sisa Pelunasan di Tempat:
            </span>
            <span className="text-[10px] text-muted-foreground">
              Bayar di kasir setelah pangkas rambut selesai
            </span>
          </div>
          <span className="text-base font-bold text-foreground">
            {formattedRemaining}
          </span>
        </div>

        {/* Note on Payment Settlement */}
        <div className="mt-1 flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <IconAlertCircle size="micro" className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Sisa pelunasan sebesar {formattedRemaining} dapat dibayarkan di kasir dengan tunai atau QRIS toko.
          </span>
        </div>
      </div>
    </div>
  );
}
