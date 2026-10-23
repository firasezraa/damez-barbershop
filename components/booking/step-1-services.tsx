"use client";

import * as React from "react";
import {
  IconCheck,
  IconClock,
  IconSparkles,
  IconAlertCircle,
  IconShieldCheck,
  getServiceIcon,
} from "@/components/ui/icons";
import { BOOKING_SERVICES, MAX_SERVICES_SELECTABLE } from "./constants";
import { BookingService } from "./types";
import { formatRupiah } from "./utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Step1ServicesProps {
  selectedServiceIds: string[];
  onToggleService: (serviceId: string) => void;
}

export function Step1Services({
  selectedServiceIds,
  onToggleService,
}: Step1ServicesProps) {
  const [warningMessage, setWarningMessage] = React.useState<string | null>(null);

  const handleSelect = (service: BookingService) => {
    const isSelected = selectedServiceIds.includes(service.id) || selectedServiceIds.includes(service.code);

    if (!isSelected && selectedServiceIds.length >= MAX_SERVICES_SELECTABLE) {
      setWarningMessage(
        "Maksimal dua layanan per satu sesi reservasi agar kualitas pengerjaan tetap terjaga. Jika membutuhkan paket lengkap lainnya, silakan pilih paket kombo yang tersedia."
      );
      return;
    }

    setWarningMessage(null);
    onToggleService(service.id);
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Step Header */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Langkah 1 dari 5
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            Pilihan Anda: {selectedServiceIds.length}/{MAX_SERVICES_SELECTABLE} layanan terpilih
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Pilih Layanan Pangkas dan Perawatan
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pilih satu layanan utama atau kombinasikan maksimal dua layanan perawatan. Durasi pengerjaan dan total biaya akan dihitung secara otomatis.
        </p>
      </div>

      {/* Sanitation Guarantee Callout */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs sm:text-sm text-muted-foreground">
        <IconShieldCheck size="sm" className="shrink-0 text-primary mt-0.5" aria-hidden="true" />
        <p>
          <strong className="text-foreground font-semibold">Jeda Sterilisasi:</strong> Setiap sesi sudah termasuk jeda sanitasi alat 10 menit sebelum tamu berikutnya duduk.
        </p>
      </div>

      {/* Max Selection Alert */}
      {warningMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs sm:text-sm text-destructive"
        >
          <IconAlertCircle size="sm" className="shrink-0 mt-0.5" aria-hidden="true" />
          <p>{warningMessage}</p>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {BOOKING_SERVICES.map((service) => {
          const isSelected =
            selectedServiceIds.includes(service.id) ||
            selectedServiceIds.includes(service.code);

          return (
            <div
              key={service.id}
              onClick={() => handleSelect(service)}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  handleSelect(service);
                }
              }}
              className={cn(
                "group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer select-none",
                "min-h-[140px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isSelected
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/15"
                  : "border-border bg-surface hover:border-primary/40 hover:bg-surface-elevated"
              )}
            >
              {/* Top Row: Title, Badges, Selection check */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 pr-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {service.badgeLabel && (
                      <Badge
                        variant={service.isPopular ? "primary" : "secondary"}
                        className="text-[10px] py-0 px-2 h-5"
                      >
                        {service.badgeLabel}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {service.name}
                  </h3>
                </div>

                {/* Custom Checkbox Indicator */}
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-lg border transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-surface-elevated text-transparent group-hover:border-primary/60"
                  )}
                >
                  <IconCheck size="micro" stroke={3} aria-hidden="true" />
                </div>
              </div>

              {/* Description */}
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {service.description}
              </p>

              {/* Bottom Row: Duration & Price */}
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <IconClock size="micro" className="text-primary" aria-hidden="true" />
                  <span>{service.durationMinutes} Menit</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-base font-bold text-foreground">
                    {formatRupiah(service.price)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
