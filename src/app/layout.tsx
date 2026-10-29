import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Damez Barbershop — Senopati, Jakarta Selatan",
  description:
    "Reservasi kursi pangkas tanpa mengantre di Damez Barbershop Senopati. DP flat Rp 20.000 via QRIS, tiga master barber, buka 10:00-21:00 WIB.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable}`}>
      <body className="bg-ink font-body text-text antialiased">{children}</body>
    </html>
  );
}
