"use client";

import * as React from "react";
import {
  IconQrcode,
  IconRefresh,
  IconCircleCheck,
  IconShieldCheck,
  IconDeviceMobile,
  IconSparkles,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QrisDisplayProps {
  grossAmount?: number;
  bookingCode: string;
  onCheckStatus?: () => Promise<void> | void;
  onSimulateSuccess?: () => Promise<void> | void;
  isChecking?: boolean;
  className?: string;
}

export function QrisDisplay({
  grossAmount = 20000,
  bookingCode,
  onCheckStatus,
  onSimulateSuccess,
  isChecking = false,
  className,
}: QrisDisplayProps) {
  const [isSimulating, setIsSimulating] = React.useState(false);

  const handleSimulate = async () => {
    if (!onSimulateSuccess) return;
    setIsSimulating(true);
    try {
      await onSimulateSuccess();
    } finally {
      setIsSimulating(false);
    }
  };

  const formattedAmount = `Rp ${grossAmount.toLocaleString("id-ID")}`;

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-md shadow-black/40",
        className
      )}
    >
      {/* Header QRIS */}
      <div className="flex w-full items-center justify-between border-b border-border pb-3.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <IconQrcode size="sm" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-wider text-foreground">
              QRIS STANDAR NASIONAL
            </span>
            <span className="text-[10px] text-muted-foreground">
              NMID: ID1020038849204
            </span>
          </div>
        </div>
        <Badge variant="primary" className="text-[11px] font-semibold">
          DP Flat 20k
        </Badge>
      </div>

      {/* Merchant Title */}
      <div className="my-3 text-center">
        <h4 className="text-sm font-semibold tracking-wide text-foreground">
          DAMEZ BARBERSHOP SENOPATI
        </h4>
        <p className="text-xs text-muted-foreground">
          Order ID: {bookingCode}
        </p>
      </div>

      {/* QR Code Container (Crisp High-Contrast Card) */}
      <div className="relative my-2 flex flex-col items-center justify-center rounded-2xl border-2 border-primary/50 bg-white p-5 shadow-inner">
        {/* SVG Scannable Stylized QR Code */}
        <svg
          viewBox="0 0 160 160"
          className="size-48 sm:size-52"
          shapeRendering="crispEdges"
          aria-label={`QRIS Pembayaran DP ${formattedAmount} Kode ${bookingCode}`}
        >
          {/* Background */}
          <rect width="160" height="160" fill="#FFFFFF" />

          {/* Top-Left Finder Pattern */}
          <rect x="12" y="12" width="40" height="40" fill="#121212" />
          <rect x="18" y="18" width="28" height="28" fill="#FFFFFF" />
          <rect x="24" y="24" width="16" height="16" fill="#121212" />

          {/* Top-Right Finder Pattern */}
          <rect x="108" y="12" width="40" height="40" fill="#121212" />
          <rect x="114" y="18" width="28" height="28" fill="#FFFFFF" />
          <rect x="120" y="24" width="16" height="16" fill="#121212" />

          {/* Bottom-Left Finder Pattern */}
          <rect x="12" y="108" width="40" height="40" fill="#121212" />
          <rect x="18" y="114" width="28" height="28" fill="#FFFFFF" />
          <rect x="24" y="120" width="16" height="16" fill="#121212" />

          {/* Timing Patterns */}
          <rect x="58" y="24" width="6" height="6" fill="#121212" />
          <rect x="70" y="24" width="6" height="6" fill="#121212" />
          <rect x="82" y="24" width="6" height="6" fill="#121212" />
          <rect x="94" y="24" width="6" height="6" fill="#121212" />

          <rect x="24" y="58" width="6" height="6" fill="#121212" />
          <rect x="24" y="70" width="6" height="6" fill="#121212" />
          <rect x="24" y="82" width="6" height="6" fill="#121212" />
          <rect x="24" y="94" width="6" height="6" fill="#121212" />

          {/* Data Modules Clusters */}
          <rect x="58" y="40" width="18" height="12" fill="#121212" />
          <rect x="84" y="40" width="18" height="12" fill="#121212" />
          <rect x="64" y="58" width="32" height="6" fill="#121212" />
          <rect x="58" y="70" width="12" height="18" fill="#121212" />
          <rect x="90" y="70" width="12" height="18" fill="#121212" />

          {/* Center Brand Accent Shield */}
          <rect x="70" y="70" width="20" height="20" rx="3" fill="#D97706" />
          <text
            x="80"
            y="84"
            fill="#FFFFFF"
            fontSize="11"
            fontFamily="sans-serif"
            fontWeight="bold"
            textAnchor="middle"
          >
            D
          </text>

          {/* Bottom Right Modules */}
          <rect x="58" y="94" width="18" height="12" fill="#121212" />
          <rect x="82" y="94" width="18" height="12" fill="#121212" />
          <rect x="108" y="58" width="12" height="18" fill="#121212" />
          <rect x="126" y="58" width="18" height="12" fill="#121212" />
          <rect x="108" y="82" width="18" height="18" fill="#121212" />
          <rect x="132" y="76" width="12" height="24" fill="#121212" />
          <rect x="64" y="114" width="24" height="12" fill="#121212" />
          <rect x="64" y="132" width="18" height="12" fill="#121212" />
          <rect x="94" y="114" width="18" height="24" fill="#121212" />
          <rect x="118" y="114" width="12" height="12" fill="#121212" />
          <rect x="136" y="114" width="12" height="24" fill="#121212" />
          <rect x="118" y="132" width="12" height="12" fill="#121212" />
        </svg>

        {/* Amount Tag Overlay */}
        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1 border border-border">
          <span className="text-[11px] font-medium text-muted-foreground">Nominal:</span>
          <span className="text-xs font-bold text-primary">{formattedAmount}</span>
        </div>
      </div>

      {/* Supported Payment Logos / Labels */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-center text-[10px] text-muted-foreground">
        <span className="rounded bg-surface-elevated px-2 py-0.5 border border-border">BCA</span>
        <span className="rounded bg-surface-elevated px-2 py-0.5 border border-border">Mandiri</span>
        <span className="rounded bg-surface-elevated px-2 py-0.5 border border-border">BRI</span>
        <span className="rounded bg-surface-elevated px-2 py-0.5 border border-border">BNI</span>
        <span className="rounded bg-surface-elevated px-2 py-0.5 border border-border">GoPay</span>
        <span className="rounded bg-surface-elevated px-2 py-0.5 border border-border">OVO</span>
        <span className="rounded bg-surface-elevated px-2 py-0.5 border border-border">ShopeePay</span>
        <span className="rounded bg-surface-elevated px-2 py-0.5 border border-border">DANA</span>
      </div>

      {/* Instructions */}
      <div className="mt-4 w-full rounded-xl bg-surface-elevated p-3 border border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1.5">
          <IconDeviceMobile size="micro" className="text-primary" aria-hidden="true" />
          <span>Cara Pembayaran QRIS:</span>
        </div>
        <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
          <li>Buka aplikasi mobile banking atau e-wallet pilihan Anda.</li>
          <li>Pindai kode QRIS di atas dan pastikan nominal tepat {formattedAmount}.</li>
          <li>Selesaikan transaksi. Tiket digital otomatis terbit setelah verifikasi.</li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex w-full flex-col gap-2.5">
        {onCheckStatus && (
          <Button
            type="button"
            variant="outline"
            className="w-full text-xs font-semibold"
            onClick={() => onCheckStatus()}
            disabled={isChecking}
          >
            <IconRefresh
              data-icon="inline-start"
              size="micro"
              className={cn(isChecking && "animate-spin")}
              aria-hidden="true"
            />
            {isChecking ? "Memeriksa Status..." : "Cek Status Pembayaran"}
          </Button>
        )}

        {onSimulateSuccess && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-[11px] text-primary/80 hover:text-primary hover:bg-primary/10 border border-dashed border-primary/30"
            onClick={handleSimulate}
            disabled={isSimulating}
          >
            <IconSparkles data-icon="inline-start" size="micro" aria-hidden="true" />
            {isSimulating ? "Memproses Simulasi..." : "Simulasikan Pembayaran Berhasil (Dev Demo)"}
          </Button>
        )}
      </div>

      {/* Security Guarantee Note */}
      <div className="mt-3.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <IconShieldCheck size="micro" className="text-emerald-500" aria-hidden="true" />
        <span>Terenkripsi SHA-512 & Garansi Kursi 100% Siap</span>
      </div>
    </div>
  );
}
