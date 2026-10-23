"use client";

import * as React from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  initialRemainingSeconds?: number;
  holdExpiresAt?: string | null;
  onExpire?: () => void;
  className?: string;
}

export function CountdownTimer({
  initialRemainingSeconds = 900, // 15 menit default
  holdExpiresAt,
  onExpire,
  className,
}: CountdownTimerProps) {
  // Hitung target waktu akhir dalam milidetik
  const targetTimeMs = React.useMemo(() => {
    if (holdExpiresAt) {
      const parsed = new Date(holdExpiresAt).getTime();
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    return Date.now() + initialRemainingSeconds * 1000;
  }, [holdExpiresAt, initialRemainingSeconds]);

  const [secondsLeft, setSecondsLeft] = React.useState<number>(() => {
    const diff = Math.max(0, Math.floor((targetTimeMs - Date.now()) / 1000));
    return diff;
  });

  const hasExpiredRef = React.useRef(false);

  React.useEffect(() => {
    const updateCountdown = () => {
      const diff = Math.max(0, Math.floor((targetTimeMs - Date.now()) / 1000));
      setSecondsLeft(diff);

      if (diff <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        if (onExpire) {
          onExpire();
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetTimeMs, onExpire]);

  // Format menit dan detik
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");

  const totalDurationSeconds = 15 * 60; // 900 detik (15 menit)
  const progressPercent = Math.min(
    100,
    Math.max(0, (secondsLeft / totalDurationSeconds) * 100)
  );

  const isWarning = secondsLeft > 0 && secondsLeft <= 180; // 3 menit terakhir
  const isExpired = secondsLeft === 0;

  return (
    <div
      role="timer"
      aria-live="polite"
      className={cn(
        "w-full rounded-2xl border p-4 transition-all duration-300",
        isExpired
          ? "border-destructive/60 bg-destructive/10 text-destructive-foreground"
          : isWarning
          ? "border-red-500/50 bg-red-950/25 text-red-200 shadow-md shadow-red-950/40"
          : "border-primary/30 bg-surface-elevated text-foreground shadow-sm shadow-primary/10",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl border",
              isExpired
                ? "border-destructive/40 bg-destructive/20 text-destructive"
                : isWarning
                ? "border-red-500/50 bg-red-500/20 text-red-400 animate-pulse"
                : "border-primary/40 bg-primary/15 text-primary"
            )}
          >
            {isWarning || isExpired ? (
              <AlertTriangle className="size-5" />
            ) : (
              <Clock className="size-5" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Batas Waktu Pembayaran
            </span>
            <span className="text-sm font-medium">
              {isExpired
                ? "Waktu pembayaran telah habis"
                : isWarning
                ? "Segera selesaikan pembayaran DP"
                : "Slot kursi ditahan selama 15 menit"}
            </span>
          </div>
        </div>

        {/* Digital Clock Display */}
        <div className="flex flex-col items-end">
          <div
            className={cn(
              "font-mono text-2xl font-extrabold tracking-wider sm:text-3xl",
              isExpired
                ? "text-destructive"
                : isWarning
                ? "text-red-400 animate-pulse"
                : "text-primary"
            )}
          >
            {formattedMinutes}:{formattedSeconds}
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Menit : Detik
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-surface">
        <div
          className={cn(
            "h-full transition-all duration-1000 ease-linear",
            isExpired
              ? "w-0 bg-destructive"
              : isWarning
              ? "bg-red-500"
              : "bg-primary"
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
