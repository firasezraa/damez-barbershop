"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  openItem: string | null;
  toggleItem: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

export function Accordion({
  children,
  className,
  defaultValue = null,
}: {
  children: React.ReactNode;
  className?: string;
  defaultValue?: string | null;
}) {
  const [openItem, setOpenItem] = React.useState<string | null>(defaultValue);

  const toggleItem = React.useCallback((value: string) => {
    setOpenItem((current) => (current === value ? null : value));
  }, []);

  return (
    <AccordionContext.Provider value={{ openItem, toggleItem }}>
      <div className={cn("flex flex-col gap-3", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(AccordionContext);
  if (!context) throw new Error("AccordionItem must be used within Accordion");
  const isOpen = context.openItem === value;

  return (
    <div
      data-state={isOpen ? "open" : "closed"}
      className={cn(
        "rounded-xl border border-border bg-surface transition-all duration-200 overflow-hidden",
        isOpen && "border-primary/50 shadow-md shadow-black/20",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ value?: string; isOpen?: boolean }>, {
            value,
            isOpen,
          });
        }
        return child;
      })}
    </div>
  );
}

export function AccordionTrigger({
  value,
  isOpen,
  children,
  className,
}: {
  value?: string;
  isOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(AccordionContext);
  if (!context) throw new Error("AccordionTrigger must be used within Accordion");

  return (
    <button
      type="button"
      onClick={() => value && context.toggleItem(value)}
      aria-expanded={isOpen}
      className={cn(
        "flex w-full items-center justify-between p-5 text-left text-base font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset cursor-pointer min-h-[48px]",
        className
      )}
    >
      <span className="flex-1 pr-4">{children}</span>
      <ChevronDown
        className={cn(
          "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180 text-primary"
        )}
      />
    </button>
  );
}

export function AccordionContent({
  isOpen,
  children,
  className,
}: {
  isOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "px-5 pb-5 text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-4",
        className
      )}
    >
      {children}
    </div>
  );
}
