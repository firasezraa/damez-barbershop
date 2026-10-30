import type { ReactNode } from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { CANCEL_CUTOFF_HOURS, DOWN_PAYMENT_IDR, LATE_TOLERANCE_MINUTES } from "@/lib/config/constants";
import "./globals.css";

/*
 * Huruf tinggal di repo (src/app/fonts) dan dimuat dengan next/font/local, bukan
 * next/font/google. Alasannya bukan selera: `next/font/google` mengunduh berkas
 * huruf saat build, dan satu kali CI gagal karena modul `.../font/google/font`
 * tidak bisa di-resolve ketika unduhan itu bermasalah. Build yang butuh jaringan
 * bukan build yang bisa diulang.
 *
 * Archivo dipilih karena punya sumbu lebar: satu keluarga bisa membentang seperti
 * huruf papan toko (display) tanpa membeli keluarga kedua (IDEA.md §17.5).
 * Spline Sans Mono memegang semua angka supaya kolom jam dan harga bisa
 * dibandingkan secara vertikal.
 */
const display = localFont({
  src: "./fonts/archivo-latin-var.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-archivo",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const mono = localFont({
  src: "./fonts/spline-sans-mono-latin-400.woff2",
  weight: "400 600",
  style: "normal",
  variable: "--font-spline-mono",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  title: "Damez Barbershop — Jakarta Selatan",
  description: `Reservasi kursi pangkas tanpa mengantre di Damez Barbershop, Jakarta Selatan. DP flat Rp ${DOWN_PAYMENT_IDR.toLocaleString("id-ID")} via QRIS, tiga master barber, buka 10:00-21:00 WIB, toleransi keterlambatan ${LATE_TOLERANCE_MINUTES} menit, pembatalan sampai H-${CANCEL_CUTOFF_HOURS} jam.`,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${mono.variable}`}>
      <body className="bg-ink font-body text-text antialiased">{children}</body>
    </html>
  );
}