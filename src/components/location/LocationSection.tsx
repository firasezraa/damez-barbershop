"use client";

import { useId } from "react";
import {
  Car,
  Clock,
  Compass,
  ExternalLink,
  MapPin,
  Navigation,
} from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const GOOGLE_MAPS_LINK =
  "https://www.google.com/maps/place/Damez+Barbershop/@-6.3164905,106.7536217,17z/data=!3m1!4b1!4m6!3m5!1s0x2e69efc2f4a2ee67:0xf3b8c74fbcf03099!8m2!3d-6.3164905!4d106.7536217!16s%2Fg%2F11z0h5k33v";

const MAP_EMBED_URL =
  "https://maps.google.com/maps?q=Damez+Barbershop+Jl.+Legoso+Raya+No.80c+Ciputat&t=&z=16&ie=UTF8&iwloc=&output=embed";

export function LocationSection() {
  const headingId = useId();

  return (
    <section
      id="lokasi"
      aria-labelledby={headingId}
      className="relative overflow-hidden border-b border-line bg-ink py-20 lg:py-28 scroll-mt-28"
    >
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute -top-40 right-10 h-96 w-96 rounded-full bg-brass/5 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 left-10 h-80 w-80 rounded-full bg-brass/5 blur-[110px]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section: Left-aligned with ScrollReveal animation */}
        <ScrollReveal duration={0.8}>
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-brass/30 bg-brass/10 px-3.5 py-1 text-xs font-medium text-brass">
              <MapPin className="h-3.5 w-3.5 text-brass" />
              <span className="font-mono uppercase tracking-wider text-[11px]">
                Lokasi & Akses Gerai
              </span>
            </div>

            <h2
              id={headingId}
              className="mt-4 font-display text-3xl font-extrabold tracking-tight text-text sm:text-4xl lg:text-5xl"
            >
              Temukan Gerai Damez Barbershop
            </h2>

            <p className="mt-3 max-w-2xl text-base text-muted sm:text-lg">
              Ruang pangkas presisi yang tenang di Ciputat Timur. Akses mudah dari berbagai penjuru,
              dilengkapi area parkir kendaraan dan ruang tunggu yang nyaman.
            </p>
          </div>
        </ScrollReveal>

        {/* Content Grid: Info on Left, Map on Right with Staggered ScrollReveal */}
        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-stretch">
          {/* Left Column: Address, Hours & Visiting Guide (5 cols) */}
          <ScrollReveal delay={0.15} duration={0.8} className="lg:col-span-5 flex flex-col">
            <div className="flex h-full flex-col justify-between gap-6 rounded-2xl border border-line bg-surface/80 p-6 sm:p-8 backdrop-blur-md">
            <div className="flex flex-col gap-6">
              {/* Alamat Gerai */}
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brass/30 bg-brass/10 text-brass">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-brass font-semibold">
                    Alamat Lengkap
                  </span>
                  <h3 className="mt-1 font-display text-base font-bold text-text">
                    Damez Barbershop
                  </h3>
                  <p className="mt-1 font-mono text-xs text-muted leading-relaxed">
                    Jl. Legoso Raya No.80c, Pisangan, Kec. Ciputat Timur, Kota Tangerang Selatan,
                    Banten 15419
                  </p>
                  <p className="mt-2 text-[11px] text-ghost">
                    Patokan: Kawasan Legoso Raya, dekat kampus UIN & akses Jl. Ir. H. Juanda.
                  </p>
                </div>
              </div>

              {/* Jam Operasional */}
              <div className="flex items-start gap-4 border-t border-line-2 pt-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brass/30 bg-brass/10 text-brass">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-brass font-semibold">
                    Jam Operasional
                  </span>
                  <p className="mt-1 font-display text-base font-bold text-text">
                    Buka Setiap Hari: 10:00 – 21:00 WIB
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    Melayani reservasi kursi online & tamu walk-in langsung di kasir.
                  </p>
                </div>
              </div>

              {/* Fasilitas & Kenyamanan */}
              <div className="flex items-start gap-4 border-t border-line-2 pt-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brass/30 bg-brass/10 text-brass">
                  <Car className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-brass font-semibold">
                    Kenyamanan & Fasilitas
                  </span>
                  <ul className="mt-1.5 flex flex-col gap-1 font-mono text-xs text-muted">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brass" />
                      Area parkir kendaraan roda 2 & roda 4
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brass" />
                      Ruang pangkas dingin ber-AC & higienis
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brass" />
                      Toleransi kedatangan 15 menit dari jam booking
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Direct Map CTA Button */}
            <div className="mt-4 flex flex-col gap-2.5 border-t border-line pt-5">
              <a
                href={GOOGLE_MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brass px-5 font-display text-sm font-bold text-ink shadow-md transition-all hover:brightness-105 active:scale-[0.99]"
              >
                <Compass className="h-4 w-4 transition-transform group-hover:rotate-45" />
                <span>Buka Rute di Google Maps</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </a>

              <p className="text-center font-mono text-[11px] text-muted">
                Klik untuk membuka navigasi GPS langsung di ponsel Anda
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Right Column: Interactive Map Box (7 cols) with ScrollReveal */}
        <ScrollReveal delay={0.3} duration={0.8} className="lg:col-span-7 flex flex-col">
          <div className="relative flex h-full min-h-[380px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
            {/* Top Bar of Map Box */}
            <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="font-mono text-xs font-bold text-text">
                  Peta Interaktif Damez Barbershop
                </span>
              </div>
              <a
                href={GOOGLE_MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-xs text-brass hover:underline"
              >
                <span>Lihat Layar Penuh</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Google Maps iFrame */}
            <div className="relative w-full flex-1 min-h-[360px] sm:min-h-[420px]">
              <iframe
                title="Peta Lokasi Damez Barbershop"
                src={MAP_EMBED_URL}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full grayscale-[25%] contrast-[1.05]"
              />
            </div>

            {/* Bottom Quick Bar inside Map */}
            <div className="border-t border-line bg-surface-2/90 px-5 py-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 font-mono text-xs text-muted">
                <Navigation className="h-3.5 w-3.5 text-brass" />
                <span>Titik Presisi: -6.3164905, 106.7536217</span>
              </div>
              <a
                href={GOOGLE_MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-brass/40 bg-brass/10 px-3 py-1 font-mono text-xs font-semibold text-brass hover:bg-brass hover:text-ink transition-colors"
              >
                Buka Aplikasi Maps ↗
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  </section>
  );
}
