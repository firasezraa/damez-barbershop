import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "outline"
    | "confirmed"
    | "pending"
    | "noshow"
    | "cancelled";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-surface text-foreground border-border",
    primary: "bg-primary/15 text-primary border-primary/30",
    secondary: "bg-secondary/20 text-[#D97706] border-secondary/40",
    outline: "border-border text-muted-foreground bg-transparent",
    confirmed: "bg-[#064E3B] text-[#34D399] border-[#064E3B]",
    pending: "bg-[#451A03] text-[#FBBF24] border-[#451A03]",
    noshow: "bg-[#450A0A] text-[#F87171] border-[#450A0A]",
    cancelled: "bg-[#27272A] text-[#A1A1AA] border-[#27272A]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
