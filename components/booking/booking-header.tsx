"use client";

import * as React from "react";
import { motion } from "motion/react";
import { IconArrowLeft, IconScissors } from "@/components/ui/icons";
import { BookingStep } from "./types";
import { STEP_METADATA } from "./constants";
import { SPRING_TOKENS } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface BookingHeaderProps {
  currentStep: BookingStep;
  onBack: () => void;
  onStepClick?: (step: BookingStep) => void;
  canNavigateToStep?: (step: BookingStep) => boolean;
}

export function BookingHeader({
  currentStep,
  onBack,
  onStepClick,
  canNavigateToStep,
}: BookingHeaderProps) {
  const currentMeta = STEP_METADATA.find((m) => m.step === currentStep) || STEP_METADATA[0];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/80 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
        {/* Top row: Brand & Action */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={onBack}
                aria-label="Kembali ke langkah sebelumnya"
                className="flex size-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-border bg-surface text-foreground transition-all hover:border-primary/50 hover:bg-surface-elevated active:scale-95"
              >
                <IconArrowLeft size="sm" aria-hidden="true" />
              </button>
            ) : (
              <a
                href="/"
                aria-label="Kembali ke Beranda"
                className="flex size-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-border bg-surface text-primary transition-all hover:border-primary/50 hover:bg-surface-elevated active:scale-95"
              >
                <IconScissors size="sm" aria-hidden="true" />
              </a>
            )}

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-primary">
                Langkah {currentStep} dari 5
              </span>
              <h1 className="text-base font-bold text-foreground line-clamp-1">
                {currentMeta.shortDesc}
              </h1>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              DP Rp 20.000
            </span>
          </div>
        </div>

        {/* 5-Step Visual Progress Bar */}
        <div className="mt-3 grid grid-cols-5 gap-1.5" aria-label="Progres Formulir Reservasi">
          {STEP_METADATA.map((meta) => {
            const isCompleted = meta.step < currentStep;
            const isCurrent = meta.step === currentStep;
            const isNavigable = canNavigateToStep ? canNavigateToStep(meta.step as BookingStep) : isCompleted;

            return (
              <button
                key={meta.step}
                type="button"
                disabled={!isNavigable}
                onClick={() => onStepClick && isNavigable && onStepClick(meta.step as BookingStep)}
                className={cn(
                  "group relative flex flex-col gap-1 text-left transition-all p-1 rounded-lg",
                  isNavigable ? "cursor-pointer" : "cursor-default opacity-60"
                )}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Langkah ${meta.step}: ${meta.label}`}
              >
                {isCurrent && (
                  <motion.div
                    layoutId="active-step-indicator"
                    className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/30 pointer-events-none"
                    transition={SPRING_TOKENS.layout}
                  />
                )}
                <div
                  className={cn(
                    "relative z-10 h-1.5 w-full rounded-full transition-all duration-300",
                    isCompleted && "bg-primary",
                    isCurrent && "bg-primary",
                    !isCompleted && !isCurrent && "bg-surface-elevated"
                  )}
                />
                <span
                  className={cn(
                    "relative z-10 hidden text-[10px] font-medium tracking-tight sm:inline-block truncate transition-colors",
                    isCurrent && "font-bold text-primary",
                    isCompleted && "text-muted-foreground",
                    !isCompleted && !isCurrent && "text-muted-foreground/50"
                  )}
                >
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
