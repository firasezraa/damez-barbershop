import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Archivo, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

/*
 * Archivo dipilih karena punya sumbu lebar: satu keluarga bisa membentang seperti
 * huruf papan toko (display) tanpa membeli keluarga kedua (IDEA.md §17.5).
 * Spline Sans Mono memegang semua angka supaya kolom jam dan harga bisa
 * dibandingkan secara vertikal.
 */
const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const mono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-spline-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Damez Barbershop — Senopati, Jakarta Selatan",
  description:
    "Reservasi kursi pangkas tanpa mengantre di Damez Barbershop Senopati. DP flat Rp 20.000 via QRIS, tiga master barber, buka 10:00-21:00 WIB.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${mono.variable}`}>
      <body className="bg-ink font-body text-text antialiased">{children}</body>
    </html>
  );
}
