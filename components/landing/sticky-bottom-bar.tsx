"use client";

import * as React from "react";
import { IconCalendar, IconArrowRight } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

export function StickyBottomBar() {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-background/95 border-t border-border/80 px-4 py-3 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        {/* Left Information */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#34D399] animate-pulse" />
            <span className="text-xs font-bold text-foreground">
              DP Flat Rp 20.000
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            Jaminan kursi siap tanpa antre
          </span>
        </div>

        {/* Right CTA Button */}
        <a href="#layanan" className="shrink-0">
          <Button
            variant="amber-glow"
            size="lg"
            className="h-[52px] min-h-[52px] px-5 py-2 text-sm font-bold tracking-wider uppercase gap-2 shadow-lg"
          >
            <span>BOOKING SEKARANG</span>
            <IconArrowRight size="micro" aria-hidden="true" />
          </Button>
        </a>
      </div>
    </div>
  );
}
