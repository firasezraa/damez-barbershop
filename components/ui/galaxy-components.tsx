"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// 1. GALAXY SHIMMER BUTTON (Hero CTA)
// ============================================================================

export interface GalaxyShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "amber" | "leather";
  size?: "default" | "lg";
  isLoading?: boolean;
}

export const GalaxyShimmerButton = React.forwardRef<
  HTMLButtonElement,
  GalaxyShimmerButtonProps
>(
  (
    {
      children,
      icon,
      variant = "amber",
      size = "lg",
      isLoading = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isAmber = variant === "amber";

    const gradientConic = isAmber
      ? "bg-[conic-gradient(from_90deg_at_50%_50%,#784c25_0%,#d97706_25%,#f59e0b_50%,#d97706_75%,#784c25_100%)]"
      : "bg-[conic-gradient(from_90deg_at_50%_50%,#3d2613_0%,#784c25_25%,#d97706_50%,#784c25_75%,#3d2613_100%)]";

    const sizePadding =
      size === "lg" ? "px-7 py-3.5 min-h-[52px] text-base" : "px-5 py-2.5 min-h-[48px] text-sm";

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(
          "group relative inline-flex items-center justify-center p-[2px] rounded-xl overflow-hidden font-sans font-bold transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "active:scale-[0.97] hover:scale-[1.02] hover:shadow-[0_0_25px_-4px_rgba(217,119,6,0.45)]",
          "disabled:opacity-45 disabled:pointer-events-none disabled:grayscale-[80%] disabled:transform-none disabled:shadow-none",
          className
        )}
        {...props}
      >
        {/* Animated Conic Gradient Border */}
        <span
          className={cn(
            "absolute inset-[-1000%] animate-[spin_5s_linear_infinite] group-hover:animate-[spin_2.2s_linear_infinite] opacity-85 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none motion-reduce:animate-none motion-reduce:rotate-45",
            gradientConic
          )}
          aria-hidden="true"
        />

        {/* Button Inner Core Surface */}
        <span
          className={cn(
            "relative flex items-center justify-center gap-3 w-full h-full rounded-[10px] bg-gradient-to-b from-[#222222] to-[#141414] text-foreground group-hover:text-amber-200 transition-colors duration-200",
            sizePadding
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Memproses...</span>
            </span>
          ) : (
            <>
              <span className="tracking-wide">{children}</span>
              {icon && (
                <span className="text-primary group-hover:text-amber-300 group-hover:translate-x-0.5 transition-transform duration-200">
                  {icon}
                </span>
              )}
            </>
          )}
        </span>
      </button>
    );
  }
);
GalaxyShimmerButton.displayName = "GalaxyShimmerButton";

// ============================================================================
// 2. GALAXY TACTILE LIFT CARD (Services & Barber Team)
// ============================================================================

export interface GalaxyTactileCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  badgeLabel?: string;
  durationOrRole?: string;
  priceOrRating?: string;
  priceSubtext?: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  onSelect?: () => void;
}

export const GalaxyTactileCard = React.forwardRef<
  HTMLDivElement,
  GalaxyTactileCardProps
>(
  (
    {
      title,
      subtitle,
      badgeLabel,
      durationOrRole,
      priceOrRating,
      priceSubtext = "Tarif Layanan",
      isSelected = false,
      isDisabled = false,
      onSelect,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="checkbox"
        tabIndex={isDisabled ? -1 : 0}
        aria-checked={isSelected}
        aria-disabled={isDisabled}
        onClick={isDisabled ? undefined : onSelect}
        onKeyDown={(e) => {
          if (!isDisabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onSelect?.();
          }
        }}
        className={cn(
          "group relative flex flex-col justify-between p-6 rounded-2xl bg-surface border border-border overflow-hidden transition-all duration-300 ease-out select-none min-h-[220px]",
          !isDisabled && [
            "cursor-pointer hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-black/70",
            "active:translate-y-0 active:scale-[0.995]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          ],
          isSelected && [
            "border-primary bg-[#1F1912] shadow-[0_0_24px_-4px_rgba(217,119,6,0.35)]",
          ],
          isDisabled && [
            "opacity-45 grayscale-[90%] cursor-not-allowed pointer-events-none",
          ],
          className
        )}
        {...props}
      >
        {/* Top Metallic Chamfer Accent Line */}
        <div
          className={cn(
            "absolute top-0 inset-x-0 h-[1.5px] transition-all duration-500 pointer-events-none",
            isSelected
              ? "bg-gradient-to-r from-primary/40 via-amber-400 to-primary/40"
              : "bg-gradient-to-r from-transparent via-amber-500/0 group-hover:via-amber-500/70 to-transparent"
          )}
          aria-hidden="true"
        />

        {/* Ambient Spotlight Hover Fill */}
        <div
          className={cn(
            "absolute -inset-px rounded-2xl pointer-events-none transition-opacity duration-500",
            isSelected
              ? "bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-100"
              : "bg-gradient-to-br from-primary/10 via-transparent to-secondary/15 opacity-0 group-hover:opacity-100"
          )}
          aria-hidden="true"
        />

        {/* Header Content */}
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            {badgeLabel ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
                {badgeLabel}
              </span>
            ) : <span />}
            {durationOrRole && (
              <span className="font-mono text-sm font-semibold text-muted-foreground">
                {durationOrRole}
              </span>
            )}
          </div>

          <h3 className="font-display text-xl font-bold text-foreground group-hover:text-amber-200 transition-colors">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {subtitle}
            </p>
          )}
          {children}
        </div>

        {/* Footer Area */}
        <div className="relative z-10 mt-6 pt-4 border-t border-border flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground block">{priceSubtext}</span>
            <span className="font-mono text-lg font-extrabold text-foreground">
              {priceOrRating}
            </span>
          </div>

          {/* Checkbox status indicator */}
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-xl border transition-all duration-200",
              isSelected
                ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/40"
                : "border-border bg-surface-elevated text-transparent group-hover:border-primary/60"
            )}
          >
            <svg
              className="size-4 stroke-current stroke-[3]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>
    );
  }
);
GalaxyTactileCard.displayName = "GalaxyTactileCard";

// ============================================================================
// 3. GALAXY SLOT PILL (Schedule & Time Picker)
// ============================================================================

export interface GalaxySlotPillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  time: string;
  isAvailable?: boolean;
  isSelected?: boolean;
  isHeld?: boolean;
  heldReason?: string;
  onSlotClick?: () => void;
}

export const GalaxySlotPill = React.forwardRef<
  HTMLButtonElement,
  GalaxySlotPillProps
>(
  (
    {
      time,
      isAvailable = true,
      isSelected = false,
      isHeld = false,
      heldReason = "Ditahan 15m",
      onSlotClick,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isActuallyDisabled = disabled || !isAvailable;

    return (
      <button
        ref={ref}
        type="button"
        disabled={isActuallyDisabled}
        aria-pressed={isSelected}
        aria-label={`Pukul ${time} WIB, ${
          isSelected
            ? "Terpilih"
            : isHeld
            ? "Sedang Ditahan 15 Menit"
            : isAvailable
            ? "Tersedia"
            : "Penuh"
        }`}
        onClick={isActuallyDisabled ? undefined : onSlotClick}
        className={cn(
          "group relative flex flex-col items-center justify-center min-h-[52px] min-w-[84px] px-3.5 py-2 rounded-xl border text-foreground font-mono transition-all duration-200 select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Available state
          isAvailable && !isSelected && !isHeld && [
            "border-border bg-surface hover:border-primary/60 hover:bg-surface-elevated hover:-translate-y-0.5 hover:shadow-md active:scale-95",
          ],
          // Selected state
          isSelected && [
            "bg-primary border-primary-hover text-primary-foreground font-bold shadow-[0_0_18px_-2px_rgba(217,119,6,0.5)] scale-[1.03]",
          ],
          // Held state (locked 15m)
          isHeld && !isSelected && [
            "border-amber-600/40 bg-[#271A0E] text-amber-300 hover:border-amber-500",
          ],
          // Booked / Full state
          isActuallyDisabled && [
            "border-[#242424] bg-[#161616] text-[#555555] line-through cursor-not-allowed pointer-events-none shadow-none transform-none",
          ],
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-1.5">
          {/* Radar indicator dot */}
          {!isSelected && !isActuallyDisabled && (
            <span className="relative flex size-2">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                  isHeld ? "bg-amber-400" : "bg-emerald-400"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex size-2 rounded-full",
                  isHeld ? "bg-amber-500" : "bg-emerald-500"
                )}
              />
            </span>
          )}
          <span className="text-xs font-bold tracking-tight">{time}</span>
        </div>

        <span
          className={cn(
            "text-[10px] font-sans font-medium transition-colors",
            isSelected ? "text-primary-foreground/90 font-bold" : "text-muted-foreground",
            isHeld && "text-amber-400 font-semibold"
          )}
        >
          {isSelected
            ? "Pilihan"
            : isHeld
            ? heldReason
            : isActuallyDisabled
            ? "Penuh"
            : "WIB"}
        </span>
      </button>
    );
  }
);
GalaxySlotPill.displayName = "GalaxySlotPill";

// ============================================================================
// 4. GALAXY BESPOKE VINTAGE BARBER-POLE & AMBIENT PULSE LOADER
// ============================================================================

export interface GalaxyBarberPoleLoaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  mode?: "normal" | "urgent" | "success" | "expired";
  statusText?: string;
  subText?: string;
}

export const GalaxyBarberPoleLoader: React.FC<GalaxyBarberPoleLoaderProps> = ({
  mode = "normal",
  statusText,
  subText,
  className,
  ...props
}) => {
  const isUrgent = mode === "urgent";
  const isSuccess = mode === "success";
  const isExpired = mode === "expired";

  const defaultStatus = isSuccess
    ? "Pembayaran DP Berhasil!"
    : isExpired
    ? "Waktu Penahanan Habis"
    : isUrgent
    ? "Segera Selesaikan (01:45)"
    : "Slot Anda Dilindungi (14:48)";

  const defaultSub = isSuccess
    ? "Tiket Boarding Pass Siap"
    : isExpired
    ? "Slot telah dilepaskan kembali ke publik"
    : isUrgent
    ? "Slot akan dilepas jika waktu habis"
    : "Menunggu verifikasi pelunasan DP QRIS";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center p-6 text-center", className)}
      {...props}
    >
      {/* Concentric Breathing Rings Wrapper */}
      <div className="relative flex items-center justify-center w-40 h-40">
        {!isExpired && (
          <>
            <div
              className={cn(
                "absolute size-36 rounded-full border pointer-events-none animate-[ping_2.6s_cubic-bezier(0.2,0.8,0.2,1)_infinite]",
                isUrgent
                  ? "border-red-500/40 bg-red-500/10"
                  : isSuccess
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-primary/25 bg-primary/5"
              )}
              aria-hidden="true"
            />
            <div
              className={cn(
                "absolute size-28 rounded-full border pointer-events-none animate-[ping_2.6s_cubic-bezier(0.2,0.8,0.2,1)_1.3s_infinite]",
                isUrgent
                  ? "border-red-500/50 bg-red-500/15"
                  : isSuccess
                  ? "border-emerald-500/50 bg-emerald-500/15"
                  : "border-primary/35 bg-primary/10"
              )}
              aria-hidden="true"
            />
          </>
        )}

        {/* 3D Barber Pole Cylinder Hardware Assembly */}
        <div
          className={cn(
            "relative flex flex-col items-center z-10 shadow-2xl transition-all duration-500",
            isSuccess && "scale-105"
          )}
        >
          {isSuccess ? (
            <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-emerald-500 bg-emerald-950 text-emerald-400 shadow-xl shadow-emerald-950/60">
              <svg
                className="size-10 stroke-current stroke-[3]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <>
              {/* Top Brass Cap */}
              <div className="w-12 h-3 rounded-t-md bg-gradient-to-r from-[#aa771c] via-[#f7d57f] to-[#aa771c] border-b border-black/40 shadow-md" />
              <div className="w-8 h-1 bg-[#784c25]" />

              {/* Glass Cylinder Core */}
              <div
                className={cn(
                  "relative w-10 h-24 overflow-hidden border-x-2 border-black/40 shadow-[inset_6px_0_8px_rgba(0,0,0,0.7),inset_-6px_0_8px_rgba(0,0,0,0.7)]",
                  isExpired && "grayscale"
                )}
              >
                {/* Helical Stripes Layer */}
                <div
                  className={cn(
                    "absolute inset-0 w-full h-full bg-[repeating-linear-gradient(-45deg,#b91c1c_0px,#b91c1c_12px,#f5f5f0_12px,#f5f5f0_24px,#1e3a8a_24px,#1e3a8a_36px,#d97706_36px,#d97706_48px)] [background-size:100%_72px]",
                    !isExpired &&
                      (isUrgent
                        ? "animate-[barberSpin_1.1s_linear_infinite]"
                        : "animate-[barberSpin_2.4s_linear_infinite]")
                  )}
                  style={{
                    animation: !isExpired
                      ? isUrgent
                        ? "barberSpin 1.1s linear infinite"
                        : "barberSpin 2.4s linear infinite"
                      : "none",
                  }}
                />

                {/* Glass Sheen Curvature Reflection */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/45 via-transparent to-black/60 pointer-events-none" />
              </div>

              {/* Bottom Brass Cap */}
              <div className="w-8 h-1 bg-[#784c25]" />
              <div className="w-12 h-3 rounded-b-md bg-gradient-to-r from-[#aa771c] via-[#f7d57f] to-[#aa771c] border-t border-black/40 shadow-md" />
            </>
          )}
        </div>
      </div>

      {/* Status Typography */}
      <div className="mt-4 flex flex-col gap-1 max-w-xs">
        <div
          className={cn(
            "inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider",
            isUrgent
              ? "text-red-400"
              : isSuccess
              ? "text-emerald-400"
              : isExpired
              ? "text-neutral-500"
              : "text-primary"
          )}
        >
          <span
            className={cn(
              "size-2 rounded-full",
              isUrgent
                ? "bg-red-400 animate-ping"
                : isSuccess
                ? "bg-emerald-400"
                : isExpired
                ? "bg-neutral-600"
                : "bg-primary animate-pulse"
            )}
          />
          <span>{statusText || defaultStatus}</span>
        </div>
        <p className="text-xs text-muted-foreground">{subText || defaultSub}</p>
      </div>
    </div>
  );
};
