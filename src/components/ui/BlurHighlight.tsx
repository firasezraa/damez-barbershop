"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export interface BlurHighlightProps {
  children: ReactNode;
  blurAmount?: number; // pixel blur saat belum aktif, default 8px
  inactiveOpacity?: number; // opasitas saat belum aktif, default 0.3
  blurDelay?: number; // delay transisi blur dalam detik
  blurDuration?: number; // durasi transisi blur dalam detik
  viewportOptions?: {
    once?: boolean;
    amount?: number;
  };
  as?: "div" | "span" | "p" | "h1" | "h2" | "h3";
  className?: string;
  style?: CSSProperties;
}

/**
 * BlurHighlight: Komponen reveal berbasis transisi blur murni (tanpa highlight).
 * Teks / konten mengalir dari kabur (blur + translasi ringan) menjadi tajam
 * dan jelas saat memasuki viewport pengguna.
 */
export function BlurHighlight({
  children,
  blurAmount = 8,
  inactiveOpacity = 0.3,
  blurDelay = 0,
  blurDuration = 0.8,
  viewportOptions = { once: true, amount: 0.3 },
  as = "div",
  className = "",
  style,
}: BlurHighlightProps) {
  const [inView, setInView] = useState(() => {
    if (typeof window !== "undefined" && typeof IntersectionObserver === "undefined") {
      return true;
    }
    return false;
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          setInView(true);
          if (viewportOptions.once !== false) {
            observer.unobserve(el);
          }
        } else if (viewportOptions.once === false) {
          setInView(false);
        }
      },
      {
        threshold: viewportOptions.amount ?? 0.3,
        rootMargin: "-10% 0px -10% 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [viewportOptions.amount, viewportOptions.once]);

  const Component = as;

  const dynamicStyles: CSSProperties = {
    filter: inView ? "blur(0px)" : `blur(${blurAmount}px)`,
    opacity: inView ? 1 : inactiveOpacity,
    transform: inView ? "translate3d(0, 0, 0)" : "translate3d(0, 8px, 0)",
    transitionProperty: "filter, opacity, transform",
    transitionDuration: `${blurDuration}s`,
    transitionDelay: `${blurDelay}s`,
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    willChange: "filter, opacity, transform",
    ...style,
  };

  return (
    <Component ref={ref as never} style={dynamicStyles} className={className}>
      {children}
    </Component>
  );
}
