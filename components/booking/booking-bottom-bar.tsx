"use client";

import * as React from "react";
import { IconArrowRight, IconLock, IconLoader2 } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { BookingStep } from "./types";
import { formatRupiah } from "./utils";
import { cn } from "@/lib/utils";

interface BookingBottomBarProps {
  currentStep: BookingStep;
  totalPrice: number;
  totalMinutes: number;
  canProceed: boolean;
  onNext: () => void;
  isLoading?: boolean;
  disabledReason?: string;
}

export function BookingBottomBar({
  currentStep,
  totalPrice,
  totalMinutes,
  canProceed,
  onNext,
  isLoading = false,
  disabledReason,
}: BookingBottomBarProps) {
  const lastClickRef = React.useRef(0);

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const now = Date.now();
    if (isLoading || !canProceed) return;
    if (now - lastClickRef.current < 600) {
      e.preventDefault();
      return;
    }
    lastClickRef.current = now;
    onNext();
  };

  const getButtonText = () => {
    if (isLoading) {
      if (currentStep === 5) return "Mengunci kursi Anda...";
      return "Memproses...";
    }
    switch (currentStep) {
      case 1:
        return "Lanjut Pilih Barber";
      case 2:
        return "Lanjut Pilih Tanggal & Jam";
      case 3:
        return "Lanjut Isi Data Diri";
      case 4:
        return "Lanjut ke Ringkasan";
      case 5:
        return "Kunci Slot & Bayar DP Rp 20.000";
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border/80 bg-background/95 px-4 py-3 backdrop-blur-xl shadow-2xl">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
        {/* Left Info: Price & Duration snapshot */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-muted-foreground">Total:</span>
            <span className="font-mono text-base font-bold text-foreground">
              {formatRupiah(totalPrice)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {totalMinutes > 0 && <span>{totalMinutes} Menit</span>}
            <span className="inline-block size-1 rounded-full bg-border" />
            <span className="font-medium text-primary">DP Rp 20.000</span>
          </div>
        </div>

        {/* Right CTA Button */}
        <div className="flex flex-col items-end">
          <Button
            type="button"
            onClick={handleButtonClick}
            disabled={!canProceed || isLoading}
            variant={currentStep === 5 ? "amber-glow" : "primary"}
            size="lg"
            className={cn(
              "h-[52px] min-h-[52px] px-5 py-2 text-sm font-bold tracking-wide gap-2 shadow-lg",
              currentStep === 5 && "shadow-primary/30",
              isLoading && "pointer-events-none opacity-80"
            )}
            aria-disabled={!canProceed || isLoading}
          >
            {isLoading ? (
              <IconLoader2 size="sm" className="animate-spin" aria-hidden="true" />
            ) : currentStep === 5 ? (
              <IconLock size="sm" aria-hidden="true" />
            ) : null}
            <span>{getButtonText()}</span>
            {!isLoading && currentStep !== 5 && (
              <IconArrowRight size="sm" aria-hidden="true" />
            )}
          </Button>

          {!canProceed && disabledReason && (
            <span className="mt-1 text-[10px] text-muted-foreground text-right max-w-[200px] truncate">
              {disabledReason}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
