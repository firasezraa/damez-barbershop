/**
 * DAMEZ BARBERSHOP - MOTION SYSTEM & SPRING PHYSICS TOKENS
 *
 * Kalibrasi Gerak Hardware-Accelerated Berbasis motion/react.
 * Sesuai spesifikasi docs/design/motion-choreography.md & WCAG 2.1 Level AA.
 * Prinsip: Zero Layout Shift (CLS = 0), GPU-accelerated (transform & opacity),
 * dan dukungan penuh prefers-reduced-motion.
 */

import type { TargetAndTransition } from "motion/react";

export const SPRING_TOKENS = {
  snappy: {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
    mass: 0.6,
  },
  surface: {
    type: "spring" as const,
    stiffness: 350,
    damping: 28,
    mass: 0.8,
  },
  wizard: {
    type: "spring" as const,
    stiffness: 320,
    damping: 32,
    mass: 0.9,
  },
  layout: {
    type: "spring" as const,
    stiffness: 400,
    damping: 35,
    mass: 0.8,
  },
  drift: {
    type: "spring" as const,
    stiffness: 260,
    damping: 24,
    mass: 1.0,
  },
  bounce: {
    type: "spring" as const,
    stiffness: 380,
    damping: 18,
    mass: 1.1,
    bounce: 0.38,
  },
  pulse: {
    type: "spring" as const,
    stiffness: 180,
    damping: 20,
    mass: 1.0,
  },
} as const;

export const DURATION_TOKENS = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.35,
  slow: 0.6,
  relaxed: 1.2,
} as const;

/**
 * Variasi Directional Slide Wizard Booking (AnimatePresence mode="wait")
 * Arah: +1 (maju/next), -1 (mundur/back)
 */
export const wizardSlideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.98,
    filter: "blur(3px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      x: SPRING_TOKENS.wizard,
      opacity: { duration: 0.25 },
      scale: SPRING_TOKENS.surface,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
    scale: 0.98,
    filter: "blur(3px)",
    transition: {
      x: SPRING_TOKENS.wizard,
      opacity: { duration: 0.2 },
    },
  }),
};

/**
 * Variasi Staggered Fade-Up Hero Entrance
 */
export const heroContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

export const heroItemVariants = {
  hidden: {
    opacity: 0,
    y: 28,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: SPRING_TOKENS.drift,
  },
};

export const heroCardVariants = {
  hidden: {
    opacity: 0,
    y: 36,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_TOKENS.surface,
  },
};

/**
 * Variasi Pulse & Breathing Glow Timer 15 Menit
 */
export const pulseTransitions: Record<"calm" | "warning" | "critical", TargetAndTransition> = {
  calm: {
    scale: [1, 1.025, 1],
    boxShadow: [
      "0 0 12px rgba(217, 119, 6, 0.2)",
      "0 0 28px rgba(217, 119, 6, 0.45)",
      "0 0 12px rgba(217, 119, 6, 0.2)",
    ],
    transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
  },
  warning: {
    scale: [1, 1.035, 1],
    boxShadow: [
      "0 0 16px rgba(245, 158, 11, 0.3)",
      "0 0 38px rgba(245, 158, 11, 0.6)",
      "0 0 16px rgba(245, 158, 11, 0.3)",
    ],
    transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
  },
  critical: {
    scale: [0.99, 1.05, 1.01, 1.05, 0.99],
    boxShadow: [
      "0 0 20px rgba(239, 68, 68, 0.4)",
      "0 0 45px rgba(239, 68, 68, 0.8)",
      "0 0 25px rgba(239, 68, 68, 0.5)",
      "0 0 50px rgba(239, 68, 68, 0.9)",
      "0 0 20px rgba(239, 68, 68, 0.4)",
    ],
    transition: { duration: 0.85, repeat: Infinity, ease: "easeInOut" },
  },
};
