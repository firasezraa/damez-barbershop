import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { ValuePillars } from "@/components/landing/value-pillars";
import { BrandStory } from "@/components/landing/brand-story";
import { ServicesGrid } from "@/components/landing/services-grid";
import { BarberTeam } from "@/components/landing/barber-team";
import { GallerySection } from "@/components/landing/gallery-section";
import { LocationMap } from "@/components/landing/location-map";
import { FaqSection } from "@/components/landing/faq-section";
import { Footer } from "@/components/landing/footer";
import { StickyBottomBar } from "@/components/landing/sticky-bottom-bar";
import { LocalBusinessSchema } from "@/components/seo/local-business-schema";

export const metadata: Metadata = {
  title: "Damez Barbershop | Tampil Rapi Tanpa Mengantre di Senopati Jakarta Selatan",
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
  alternates: {
    canonical: "https://damezbarber.com",
  },
  openGraph: {
    title: "Damez Barbershop: Tampil Rapi Tanpa Mengantre",
    description:
      "Reservasi jadwal potong rambut pria di Senopati dalam 2 menit. Bebas antre fisik, DP Rp 20.000 aman via QRIS, dan kursi siap saat Anda tiba.",
    url: "https://damezbarber.com",
    siteName: "Damez Barbershop",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Damez Barbershop: Tampil Rapi Tanpa Mengantre",
    description:
      "Reservasi jadwal potong rambut pria di Senopati dalam 2 menit. Bebas antre fisik, DP Rp 20.000 aman via QRIS, dan kursi siap saat Anda tiba.",
  },
};

export default function PublicLandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Schema.org LocalBusiness SEO Data */}
      <LocalBusinessSchema />

      {/* Main Navigation */}
      <Navbar />

      {/* Page Content Flow */}
      <main className="flex-1 flex flex-col">
        <Hero />
        <ValuePillars />
        <BrandStory />
        <ServicesGrid />
        <BarberTeam />
        <GallerySection />
        <LocationMap />
        <FaqSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Sticky Booking Bar */}
      <StickyBottomBar />
    </div>
  );
}
