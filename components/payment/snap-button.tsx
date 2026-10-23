"use client";

import * as React from "react";
import { CreditCard, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MidtransSnapResult } from "./types";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks?: {
          onSuccess?: (result: MidtransSnapResult) => void;
          onPending?: (result: MidtransSnapResult) => void;
          onError?: (result: MidtransSnapResult) => void;
          onClose?: () => void;
        }
      ) => void;
      embed?: (
        token: string,
        options: { embedId: string; [key: string]: unknown }
      ) => void;
    };
  }
}

interface SnapButtonProps {
  token?: string;
  redirectUrl?: string;
  onSuccess?: (result: MidtransSnapResult) => void;
  onPending?: (result: MidtransSnapResult) => void;
  onError?: (result: MidtransSnapResult) => void;
  onClose?: () => void;
  isProduction?: boolean;
  clientKey?: string;
  className?: string;
  disabled?: boolean;
}

export function SnapButton({
  token,
  redirectUrl,
  onSuccess,
  onPending,
  onError,
  onClose,
  isProduction = false,
  clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "SB-Mid-client-mock",
  className,
  disabled = false,
}: SnapButtonProps) {
  const [isScriptLoaded, setIsScriptLoaded] = React.useState(false);
  const [isOpeningPopup, setIsOpeningPopup] = React.useState(false);
  const [scriptError, setScriptError] = React.useState<string | null>(null);

  // Load Midtrans Snap JS script dynamically
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.snap) {
      setIsScriptLoaded(true);
      return;
    }

    const snapBaseUrl = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    const existingScript = document.querySelector(`script[src^="${snapBaseUrl}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => setIsScriptLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.src = snapBaseUrl;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;

    script.onload = () => {
      setIsScriptLoaded(true);
    };

    script.onerror = () => {
      console.warn("[Snap Script] Gagal memuat script Midtrans Snap dari CDN.");
      setScriptError("Gagal memuat gateway popup Midtrans.");
    };

    document.body.appendChild(script);

    return () => {
      // Keep script in document to avoid reload overhead
    };
  }, [isProduction, clientKey]);

  const handleOpenSnap = () => {
    if (!token) {
      if (redirectUrl) {
        window.open(redirectUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (window.snap && typeof window.snap.pay === "function") {
      setIsOpeningPopup(true);
      try {
        window.snap.pay(token, {
          onSuccess: (result) => {
            setIsOpeningPopup(false);
            if (onSuccess) onSuccess(result);
          },
          onPending: (result) => {
            setIsOpeningPopup(false);
            if (onPending) onPending(result);
          },
          onError: (result) => {
            setIsOpeningPopup(false);
            if (onError) onError(result);
          },
          onClose: () => {
            setIsOpeningPopup(false);
            if (onClose) onClose();
          },
        });
      } catch (err) {
        console.warn("[Snap Pay] Exception in snap.pay:", err);
        setIsOpeningPopup(false);
        if (redirectUrl) {
          window.open(redirectUrl, "_blank", "noopener,noreferrer");
        }
      }
    } else if (redirectUrl) {
      // Fallback ke redirect URL jika Snap popup script terblokir
      window.open(redirectUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <Button
        type="button"
        variant="amber-glow"
        size="lg"
        className={cn("w-full font-bold shadow-md", className)}
        onClick={handleOpenSnap}
        disabled={disabled || isOpeningPopup || !token}
      >
        {isOpeningPopup ? (
          <>
            <Loader2 data-icon="inline-start" className="size-5 animate-spin" />
            Membuka Pembayaran Midtrans...
          </>
        ) : (
          <>
            <CreditCard data-icon="inline-start" className="size-5" />
            Bayar DP Rp 20.000 via Snap
          </>
        )}
      </Button>

      {/* Fallback link if popup fails or script is blocked */}
      {redirectUrl && (
        <a
          href={redirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground hover:text-primary transition-colors py-1"
        >
          <span>Buka di tab baru jika popup tidak muncul</span>
          <ExternalLink className="size-3" />
        </a>
      )}

      {scriptError && (
        <div className="flex items-center gap-1.5 rounded-lg bg-destructive/10 p-2 text-xs text-destructive border border-destructive/30">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{scriptError} Gunakan scan QRIS di atas untuk pembayaran langsung.</span>
        </div>
      )}
    </div>
  );
}
