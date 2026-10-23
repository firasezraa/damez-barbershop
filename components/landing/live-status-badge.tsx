"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface StatusInfo {
  label: string;
  description: string;
  status: "open" | "closing_soon" | "closed";
}

function getJakartaStatus(): StatusInfo {
  const now = new Date();
  // Compute current UTC time and add +7 hours for Asia/Jakarta (WIB)
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const wibTotalMinutes = (utcHours * 60 + utcMinutes + 7 * 60) % (24 * 60);

  // 10:00 WIB = 600 minutes
  // 20:00 WIB = 1200 minutes
  // 21:00 WIB = 1260 minutes
  if (wibTotalMinutes >= 600 && wibTotalMinutes < 1200) {
    return {
      label: "Buka Hari Ini",
      description: "10:00 - 21:00 WIB (Sesi terakhir 20:00 WIB)",
      status: "open",
    };
  } else if (wibTotalMinutes >= 1200 && wibTotalMinutes <= 1260) {
    return {
      label: "Menjelang Tutup",
      description: "Melayani sesi terakhir di kursi",
      status: "closing_soon",
    };
  } else {
    return {
      label: "Toko Tutup",
      description: "Buka kembali pukul 10:00 WIB (Reservasi online tetap aktif)",
      status: "closed",
    };
  }
}

export function LiveStatusBadge({
  className,
  showDescription = false,
}: {
  className?: string;
  showDescription?: boolean;
}) {
  const [statusInfo, setStatusInfo] = React.useState<StatusInfo>({
    label: "Buka Hari Ini",
    description: "10:00 - 21:00 WIB (Sesi terakhir 20:00 WIB)",
    status: "open",
  });

  React.useEffect(() => {
    setStatusInfo(getJakartaStatus());
    const interval = setInterval(() => {
      setStatusInfo(getJakartaStatus());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const badgeColor = {
    open: "bg-[#064E3B] text-[#34D399] border-[#064E3B]",
    closing_soon: "bg-[#451A03] text-[#FBBF24] border-[#451A03]",
    closed: "bg-[#27272A] text-[#A1A1AA] border-[#27272A]",
  }[statusInfo.status];

  const dotColor = {
    open: "bg-[#34D399]",
    closing_soon: "bg-[#FBBF24]",
    closed: "bg-[#A1A1AA]",
  }[statusInfo.status];

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide shadow-sm",
          badgeColor
        )}
      >
        <span className="relative flex size-2">
          {statusInfo.status === "open" && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                dotColor
              )}
            />
          )}
          <span className={cn("relative inline-flex size-2 rounded-full", dotColor)} />
        </span>
        <span>{statusInfo.label}</span>
      </div>
      {showDescription && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {statusInfo.description}
        </span>
      )}
    </div>
  );
}
