"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  direction?: "up" | "down" | "none";
}

export function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  direction = "up",
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== "undefined" && typeof IntersectionObserver === "undefined") {
      return true;
    }
    return false;
  });
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const translateClass =
    direction === "up"
      ? "translate-y-12"
      : direction === "down"
      ? "-translate-y-12"
      : "scale-[0.96]";

  return (
    <div
      ref={elementRef}
      style={{
        transitionDuration: "950ms",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        transitionDelay: `${delayMs}ms`,
      }}
      className={`transition-all ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100 blur-none"
          : `opacity-0 ${translateClass} blur-[4px]`
      } ${className}`}
    >
      {children}
    </div>
  );
}
