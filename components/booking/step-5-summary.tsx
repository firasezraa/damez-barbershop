"use client";

import * as React from "react";
import {
  IconScissors,
  IconUser,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconLock,
  IconShieldCheck,
  IconAlertCircle,
  IconHelpCircle,
  IconPhone,
  IconTicket,
} from "@/components/ui/icons";
import { BOOKING_SERVICES, BOOKING_BARBERS, FLAT_DOWN_PAYMENT_IDR } from "./constants";
import { BookingCalculation, BookingFormData } from "./types";
import { formatIndonesianDate, formatRupiah } from "./utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Step5SummaryProps {
  formData: BookingFormData;
  calculation: BookingCalculation;
  onEditStep: (step: 1 | 2 | 3 | 4) => void;
  conflictError: string | null;
  onDismissConflict: () => void;
}

export function Step5Summary({
  formData,
  calculation,
  onEditStep,
  conflictError,
  onDismissConflict,
}: Step5SummaryProps) {
  const selectedServices = BOOKING_SERVICES.filter(
    (srv) =>
      formData.selectedServiceIds.includes(srv.id) ||
      formData.selectedServiceIds.includes(srv.code)
  );

  const selectedBarber = BOOKING_BARBERS.find(
    (b) => b.id === formData.barberId || b.code === formData.barberId
  );

  const barberDisplayName = selectedBarber
    ? `${selectedBarber.name} (${selectedBarber.nickname})`
    : "Siapa Saja yang Siap (Fleksibel)";

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Step Header */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Langkah 5 dari 5
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Periksa Rincian dan Kunci Kursi Anda
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Periksa kembali rincian pemesanan Anda sebelum melanjutkan ke proses pembayaran uang muka.
        </p>
      </div>

      {/* Conflict Modal / Banner (HTTP 409 Handling) */}
      {conflictError && (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/50 bg-destructive/10 p-5 flex flex-col gap-3 shadow-lg"
        >
          <div className="flex items-center gap-2 text-destructive font-bold text-base">
            <IconAlertCircle size="sm" className="shrink-0" aria-hidden="true" />
            <span>Slot Baru Saja Terisi</span>
          </div>
          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
            Mohon maaf, slot pukul {formData.selectedTime} WIB baru saja dikunci oleh pelanggan lain beberapa detik yang lalu. Kami ingin memastikan Anda tetap mendapatkan jadwal terbaik hari ini.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onDismissConflict();
                onEditStep(3);
              }}
            >
              Pilih Jam Baru dengan Barber Ini
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDismissConflict}
            >
              Tutup
            </Button>
          </div>
        </div>
      )}

      {/* Main Reservation Summary Card */}
      <Card className="border-border bg-surface shadow-xl">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Rincian Reservasi Kursi</CardTitle>
            <Badge variant="confirmed" className="text-[11px]">
              Siap Dikunci
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 pt-4">
          {/* Services Section */}
          <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-primary">
                <IconScissors size="sm" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Layanan Terpilih ({selectedServices.length})
                </span>
                <span className="font-bold text-foreground text-sm sm:text-base">
                  {selectedServices.map((s) => s.name).join(" + ")}
                </span>
                <span className="text-xs text-muted-foreground">
                  Durasi pengerjaan: {calculation.totalServiceMinutes} Menit (+ 10 menit sterilisasi)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="text-xs font-semibold text-primary hover:underline shrink-0"
            >
              Ubah
            </button>
          </div>

          {/* Master Barber Section */}
          <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-primary">
                <IconUser size="sm" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Master Barber
                </span>
                <span className="font-bold text-foreground text-sm sm:text-base">
                  {barberDisplayName}
                </span>
                {selectedBarber && (
                  <span className="text-xs text-muted-foreground">
                    Kursi Nomor {selectedBarber.chairNumber} • {selectedBarber.title}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="text-xs font-semibold text-primary hover:underline shrink-0"
            >
              Ubah
            </button>
          </div>

          {/* Date & Time Schedule Section */}
          <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-primary">
                <IconCalendar size="sm" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Waktu Kedatangan
                </span>
                <span className="font-bold text-foreground text-sm sm:text-base">
                  {formatIndonesianDate(formData.selectedDate)}
                </span>
                <span className="font-mono text-xs font-semibold text-primary">
                  {formData.selectedTime} - {calculation.endTime} WIB
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="text-xs font-semibold text-primary hover:underline shrink-0"
            >
              Ubah
            </button>
          </div>

          {/* Customer Contact Section */}
          <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-primary">
                <IconPhone size="sm" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Kontak Penerima Tiket
                </span>
                <span className="font-bold text-foreground text-sm sm:text-base">
                  {formData.customerName}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {formData.customerPhone}
                </span>
                {formData.notes && (
                  <p className="mt-1 text-xs text-muted-foreground italic line-clamp-2">
                    Catatan: &ldquo;{formData.notes}&rdquo;
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(4)}
              className="text-xs font-semibold text-primary hover:underline shrink-0"
            >
              Ubah
            </button>
          </div>

          {/* Location Shop Section */}
          <div className="flex items-start gap-3 pt-1 text-xs text-muted-foreground">
            <IconMapPin size="sm" className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Jl. Senopati Raya No. 42, Kebayoran Baru, Jakarta Selatan
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Financial Transparency Calculation Card */}
      <Card className="border-border bg-surface p-5 flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Rincian Transparansi Pembayaran
        </h3>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Tarif Layanan:</span>
          <span className="font-mono font-bold text-foreground">
            {formatRupiah(calculation.totalPrice)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-primary">
            <IconLock size="micro" aria-hidden="true" />
            <span className="font-semibold">Uang Muka (DP Online via QRIS):</span>
          </div>
          <span className="font-mono font-bold text-primary">
            {formatRupiah(calculation.downPayment)}
          </span>
        </div>

        <div className="w-full border-t border-border/80 my-1" />

        <div className="flex items-center justify-between text-base">
          <span className="font-semibold text-foreground">
            Sisa Pelunasan di Kasir Toko:
          </span>
          <span className="font-mono text-lg font-extrabold text-foreground">
            {formatRupiah(calculation.remainingPrice)}
          </span>
        </div>

        {/* Financial Guarantee Note */}
        <div className="rounded-xl bg-surface-elevated border border-border/80 p-3 text-xs text-muted-foreground leading-relaxed mt-2">
          Uang muka Rp 20.000 langsung memotong tagihan akhir Anda di meja kasir. Sisa pembayaran sebesar {formatRupiah(calculation.remainingPrice)} dapat dilunasi dengan uang tunai atau transfer QRIS di toko setelah sesi pangkas selesai.
        </div>
      </Card>

      {/* 15-Minute Hold Commitment Notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs sm:text-sm text-foreground">
        <IconShieldCheck size="sm" className="shrink-0 text-primary mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          Menekan tombol di bawah ini akan mengunci slot kursi Anda selama 15 menit agar tidak diambil pelanggan lain selagi Anda menyelesaikan pembayaran QRIS.
        </p>
      </div>
    </div>
  );
}
