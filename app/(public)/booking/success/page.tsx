"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { SuccessScreen } from "@/components/booking/success-screen";
import { Loader2 } from "lucide-react";

function SuccessQueryLoader() {
  const searchParams = useSearchParams();
  const code = searchParams?.get("code") || "";
  return <SuccessScreen bookingCode={code} />;
}

export default function BookingSuccessQueryPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 text-muted-foreground p-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <span className="text-sm font-medium">Memuat tiket digital...</span>
        </div>
      }
    >
      <SuccessQueryLoader />
    </React.Suspense>
  );
}
