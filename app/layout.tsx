import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cinzel, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://damezbarber.com"),
  title: {
    default: "Damez Barbershop | Tampil Rapi Tanpa Mengantre di Senopati Jakarta Selatan",
    template: "%s | Damez Barbershop",
  },
  description:
    "Barbershop pria di Senopati, Jakarta Selatan. Potongan rambut presisi, fade bersih, dan hot towel shave. Booking jadwal online dalam 2 menit tanpa antre, DP flat Rp 20.000 via QRIS.",
  keywords: [
    "barbershop senopati",
    "potong rambut pria jakarta selatan",
    "barbershop tanpa antre",
    "booking barbershop jakarta",
    "classic haircut senopati",
    "fade haircut jakarta selatan",
  ],
  authors: [{ name: "Damez Barbershop" }],
  creator: "Damez Barbershop",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://damezbarber.com",
    title: "Damez Barbershop: Tampil Rapi Tanpa Mengantre",
    description:
      "Reservasi jadwal potong rambut pria di Senopati dalam 2 menit. Bebas antre fisik, DP Rp 20.000 aman via QRIS, dan kursi siap saat Anda tiba.",
    siteName: "Damez Barbershop",
  },
  twitter: {
    card: "summary_large_image",
    title: "Damez Barbershop: Tampil Rapi Tanpa Mengantre",
    description:
      "Reservasi jadwal potong rambut pria di Senopati dalam 2 menit. Bebas antre fisik, DP Rp 20.000 aman via QRIS, dan kursi siap saat Anda tiba.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${cinzel.variable} ${jetbrainsMono.variable} font-sans`}
    >
      <body className={`${plusJakartaSans.className} font-sans min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary`}>
        {children}
      </body>
    </html>
  );
}
