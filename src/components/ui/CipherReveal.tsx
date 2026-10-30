"use client";

import {
  createElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
} from "react";

export interface CipherRevealProps {
  text: string;
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  fontSize?: number | string;
  fontWeight?: number | string;
  letterSpacing?: string;
  lineHeight?: number | string;
  align?: "left" | "center" | "right";
  color?: string;
  scrambleColor?: string;
  scrambleOpacity?: number;
  charset?: string;
  trigger?: "view" | "mount" | "manual";
  order?: "left" | "right" | "center" | "random";
  from?: "blank" | "scrambled";
  duration?: number; // detik
  scramble?: number; // detik per karakter
  rate?: number; // scrambles per detik
  hover?: "trail" | "replay" | "none";
  hoverRadius?: number;
  loop?: boolean;
  interval?: number;
  onComplete?: () => void;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

/**
 * CipherReveal: Komponen headline yang melakukan decode karakter acak (scrambled)
 * menjadi teks utuh secara deterministik, halus, dan stabil tanpa layout shift.
 */
export function CipherReveal({
  text,
  as = "span",
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  align = "left",
  color,
  scrambleColor,
  scrambleOpacity = 0.42,
  charset = "auto",
  trigger = "view",
  order = "left",
  from = "scrambled",
  duration = 1.4,
  scramble = 0.45,
  rate = 16,
  hover = "replay",
  loop = false,
  interval = 5,
  onComplete,
  className = "",
  style,
}: CipherRevealProps) {
  const containerRef = useRef<HTMLElement>(null);

  const [output, setOutput] = useState<Array<{ char: string; isLocked: boolean }>>(() =>
    text.split("").map((c) => ({ char: c, isLocked: true }))
  );
  const isRunningRef = useRef(false);

  const availableChars = charset === "auto" ? DEFAULT_CHARSET : charset;

  const getRandomChar = useCallback(
    (originalChar: string) => {
      if (originalChar === " " || originalChar === "\n") return originalChar;
      const idx = Math.floor(Math.random() * availableChars.length);
      return availableChars[idx] ?? "*";
    },
    [availableChars]
  );

  const playReveal = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const targetText = text;
    const chars = targetText.split("");
    const len = chars.length;
    const orderIndices: number[] = Array.from({ length: len }, (_, i) => i);

    if (order === "right") {
      orderIndices.reverse();
    } else if (order === "center") {
      const mid = Math.floor(len / 2);
      orderIndices.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
    } else if (order === "random") {
      orderIndices.sort(() => Math.random() - 0.5);
    }

    const startTime = performance.now();
    const durationMs = duration * 1000;
    const scrambleMs = scramble * 1000;
    const locked = new Set<number>();

    let frameId: number;
    let lastScrambleTime = 0;
    const scrambleIntervalMs = 1000 / rate;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Determine how many characters should lock
      const lockCount = Math.floor(progress * len);
      for (let i = 0; i < lockCount; i++) {
        const charIdx = orderIndices[i];
        if (charIdx !== undefined) {
          locked.add(charIdx);
        }
      }

      if (now - lastScrambleTime >= scrambleIntervalMs || progress >= 1) {
        lastScrambleTime = now;
        const nextOutput = chars.map((realChar, idx) => {
          if (realChar === " " || realChar === "\n") {
            return { char: realChar, isLocked: true };
          }
          if (locked.has(idx) || progress >= 1) {
            return { char: realChar, isLocked: true };
          }
          if (from === "blank" && elapsed < (orderIndices.indexOf(idx) / len) * durationMs - scrambleMs) {
            return { char: "\u00A0", isLocked: false };
          }
          return { char: getRandomChar(realChar), isLocked: false };
        });

        setOutput(nextOutput);
      }

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        // Guarantee 100% exact final text
        setOutput(chars.map((c) => ({ char: c, isLocked: true })));
        isRunningRef.current = false;
        onComplete?.();
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      isRunningRef.current = false;
    };
  }, [duration, from, getRandomChar, onComplete, order, rate, scramble, text]);

  // Handle trigger: view or mount
  useEffect(() => {
    let cancel: (() => void) | undefined;

    if (trigger === "mount") {
      const timer = setTimeout(() => {
        cancel = playReveal();
      }, 50);
      return () => {
        clearTimeout(timer);
        cancel?.();
      };
    }

    if (trigger === "view") {
      const el = containerRef.current;
      if (!el || typeof IntersectionObserver === "undefined") {
        const timer = setTimeout(() => {
          cancel = playReveal();
        }, 50);
        return () => {
          clearTimeout(timer);
          cancel?.();
        };
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && entry.isIntersecting) {
            playReveal();
            if (!loop) {
              observer.unobserve(el);
            }
          }
        },
        { threshold: 0.2 }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [loop, playReveal, trigger]);

  // Handle looping
  useEffect(() => {
    if (!loop || interval <= 0) return;
    const timer = setInterval(() => {
      if (!isRunningRef.current) {
        playReveal();
      }
    }, interval * 1000);

    return () => clearInterval(timer);
  }, [interval, loop, playReveal]);

  // Handle hover replay
  const handleMouseEnter = () => {
    if (hover === "replay" && !isRunningRef.current) {
      playReveal();
    }
  };

  const inlineStyles: CSSProperties = {
    fontSize,
    fontWeight,
    letterSpacing,
    lineHeight,
    textAlign: align,
    color,
    ...style,
  };

  const content = output.map((item, index) => {
    return (
      <span
        key={index}
        style={{
          color: item.isLocked ? color : scrambleColor ?? "var(--color-brass)",
          opacity: item.isLocked ? 1 : scrambleOpacity,
          display: "inline-block",
          minWidth: item.char === " " ? "0.3em" : undefined,
        }}
        className={item.isLocked ? "" : "font-mono font-normal"}
      >
        {item.char === " " ? "\u00A0" : item.char || "\u00A0"}
      </span>
    );
  });

  const commonProps = {
    onMouseEnter: handleMouseEnter,
    style: inlineStyles,
    className: `inline-block tracking-tight select-none ${className}`,
    "aria-label": text,
  };

  if (as === "h1") return <h1 ref={containerRef as React.RefObject<HTMLHeadingElement>} {...commonProps}>{content}</h1>;
  if (as === "h2") return <h2 ref={containerRef as React.RefObject<HTMLHeadingElement>} {...commonProps}>{content}</h2>;
  if (as === "h3") return <h3 ref={containerRef as React.RefObject<HTMLHeadingElement>} {...commonProps}>{content}</h3>;
  if (as === "h4") return <h4 ref={containerRef as React.RefObject<HTMLHeadingElement>} {...commonProps}>{content}</h4>;
  if (as === "p") return <p ref={containerRef as React.RefObject<HTMLParagraphElement>} {...commonProps}>{content}</p>;
  if (as === "div") return <div ref={containerRef as React.RefObject<HTMLDivElement>} {...commonProps}>{content}</div>;

  return (
    <span ref={containerRef as React.RefObject<HTMLSpanElement>} {...commonProps}>
      {content}
    </span>
  );
}
