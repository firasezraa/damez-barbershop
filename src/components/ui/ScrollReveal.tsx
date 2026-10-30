"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number; // detik
  duration?: number; // detik
  className?: string;
}

/**
 * ScrollReveal: Komponen animasi scroll selaras dengan kurva easing React Bits Pro Hero 6.
 * Menggunakan motion.div dengan viewport inspection { once: true, amount: 0.2 }.
 * Easing: [0.2, 0.65, 0.3, 0.9] (smooth deceleration).
 */
export function ScrollReveal({
  children,
  delay = 0,
  duration = 0.8,
  className = "",
}: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration,
        delay,
        ease: [0.2, 0.65, 0.3, 0.9],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
