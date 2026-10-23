"use client";

import * as React from "react";
import {
  IconUsers,
  IconScissors,
  IconCheck,
  IconAward,
  IconCalendar,
} from "@/components/ui/icons";
import { BOOKING_BARBERS, ANY_BARBER_ID } from "./constants";
import { BookingBarber } from "./types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Step2BarberProps {
  selectedBarberId: string | null;
  onSelectBarber: (barberId: string | null) => void;
  selectedDate?: string;
}

export function Step2Barber({
  selectedBarberId,
  onSelectBarber,
  selectedDate,
}: Step2BarberProps) {
  // Hitung hari libur barber jika tanggal sudah dipilih
  let dayOfWeekForDate: number | null = null;
  if (selectedDate && selectedDate.includes("-")) {
    const [y, m, d] = selectedDate.split("-").map((s) => parseInt(s, 10));
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      dayOfWeekForDate = new Date(y, m - 1, d).getDay();
    }
  }

  const isAnySelected = !selectedBarberId || selectedBarberId === ANY_BARBER_ID;

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Step Header */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Langkah 2 dari 5
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Tentukan Master Barber Pilihan Anda
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Setiap barber memiliki keahlian potongan khusus. Anda bebas memilih barber andalan atau menyerahkan pilihan kepada barber yang siap di toko.
        </p>
      </div>

      {/* Option 1: Any Available Barber (Recommended for fastest slots) */}
      <div
        onClick={() => onSelectBarber(null)}
        role="radio"
        aria-checked={isAnySelected}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onSelectBarber(null);
          }
        }}
        className={cn(
          "relative flex items-center justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer select-none",
          "min-h-[72px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isAnySelected
            ? "border-primary bg-primary/10 shadow-lg shadow-primary/15"
            : "border-border bg-surface hover:border-primary/40 hover:bg-surface-elevated"
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl border transition-colors",
              isAnySelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface-elevated text-primary"
            )}
          >
            <IconUsers size="md" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Siapa Saja yang Siap
              </h3>
              <Badge variant="primary" className="text-[10px] py-0 px-2 h-5">
                Rekomendasi Cepat
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Waktu tunggu paling fleksibel, dipilihkan barber yang siap melayani Anda.
            </p>
          </div>
        </div>

        <div
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border transition-all",
            isAnySelected
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-border bg-surface-elevated text-transparent"
          )}
        >
          <IconCheck size="micro" stroke={3} aria-hidden="true" />
        </div>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-border/60" />
        <span className="absolute bg-background px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Atau Pilih Barber Khusus
        </span>
      </div>

      {/* Master Barbers List */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {BOOKING_BARBERS.map((barber) => {
          const isSelected = selectedBarberId === barber.id || selectedBarberId === barber.code;
          const isOffDay = dayOfWeekForDate !== null && dayOfWeekForDate === barber.regularDayOff;

          return (
            <div
              key={barber.id}
              onClick={() => {
                if (!isOffDay) {
                  onSelectBarber(barber.id);
                }
              }}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isOffDay}
              tabIndex={isOffDay ? -1 : 0}
              onKeyDown={(e) => {
                if (!isOffDay && (e.key === " " || e.key === "Enter")) {
                  e.preventDefault();
                  onSelectBarber(barber.id);
                }
              }}
              className={cn(
                "group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-200 select-none",
                "min-h-[160px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isOffDay && "opacity-45 cursor-not-allowed bg-surface/40 border-border",
                !isOffDay && isSelected && "border-primary bg-primary/10 shadow-lg shadow-primary/15 cursor-pointer",
                !isOffDay && !isSelected && "border-border bg-surface hover:border-primary/40 hover:bg-surface-elevated cursor-pointer"
              )}
            >
              {/* Header: Chair Number & Selection */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono font-semibold text-primary">
                    Kursi {barber.chairNumber} • {barber.nickname}
                  </span>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {barber.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {barber.title}
                  </span>
                </div>

                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-surface-elevated text-transparent"
                  )}
                >
                  <IconCheck size="micro" stroke={3} aria-hidden="true" />
                </div>
              </div>

              {/* Specialty */}
              <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {barber.specialty}
              </p>

              {/* Footer: Regular Day Off */}
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-[11px]">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <IconCalendar size="micro" className="text-primary" aria-hidden="true" />
                  <span>Libur: Hari {barber.dayOffName}</span>
                </div>
                {isOffDay && (
                  <span className="font-semibold text-destructive">
                    Sedang Libur
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Guidance Note */}
      <div className="rounded-xl border border-border/60 bg-surface/50 p-3.5 text-xs text-muted-foreground text-center">
        Barber yang sedang libur mingguan atau telah penuh jadwalnya ditandai dengan warna redup dan tidak dapat dipilih untuk tanggal bersangkutan.
      </div>
    </div>
  );
}
