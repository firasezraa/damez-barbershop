"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MonoLabel } from "@/components/ui/plate";

export type HeroSlide = {
  id: string;
  eyebrow: string;
  titlePrimary: string;
  titleAccent: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  image: string;
  imageAlt: string;
  badge: string;
};

const DAMEZ_HERO_SLIDES: HeroSlide[] = [
  {
    id: "presisi",
    eyebrow: "Seni Pangkas Presisi · Est. Jakarta Selatan",
    titlePrimary: "Seni Pangkas Presisi.",
    titleAccent: "Ruang Tenang Pria Modern.",
    description:
      "Kami hadir untuk mengakhiri kompromi antara potongan tergesa-gesa dan antrean panjang yang membuang waktu. Tiga kursi vintage, tiga master barber, dan komitmen penuh menghormati ritme hidup Anda.",
    ctaText: "Kunci Kursi Sekarang",
    ctaHref: "/booking",
    secondaryCtaText: "Lihat Ketersediaan Hari Ini ↓",
    secondaryCtaHref: "#papan-jadwal",
    image:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Master Barber memotong rambut pria dengan teknik gunting presisi di kursi vintage",
    badge: "Kursi 1 — Classic Cuts",
  },
  {
    id: "craftsmanship",
    eyebrow: "Gradasi Halus & Kontur Kepala",
    titlePrimary: "Gradasi Skin Fade.",
    titleAccent: "Garis Tepi Tajam & Anatomis.",
    description:
      "Menggunakan clipper nirkabel terkalibrasi nol milimeter dan gunting baja tempa Jepang. Perpindahan helai demi helai menciptakan siluet yang menyatu sempurna dengan rahang Anda.",
    ctaText: "Pilih Barber Anda",
    ctaHref: "/barber",
    secondaryCtaText: "Jelajahi 8 Katalog Layanan →",
    secondaryCtaHref: "/layanan",
    image:
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Alat pangkas rambut steril dan razor berkualitas tinggi di meja kerja barber",
    badge: "Kursi 2 — Fade & Taper",
  },
  {
    id: "kebersihan",
    eyebrow: "Sanitasi 4 Tahap · Jeda 10 Menit Otomatis",
    titlePrimary: "Handuk Uap Hangat.",
    titleAccent: "Pisau Silet 100% Sekali Pakai.",
    description:
      "Setiap alat disterilisasi ganda dengan cairan antiseptik medis dan kabinet sinar UV-C. Silet baru bersegel selalu dibuka langsung di hadapan Anda sebelum sesi cukur jenggot dimulai.",
    ctaText: "Standar Higienis Kami",
    ctaHref: "/kebersihan",
    secondaryCtaText: "Reservasi Kursi Steril →",
    secondaryCtaHref: "/booking",
    image:
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Proses cukur tradisional dengan handuk hangat aromaterapi dan silet higienis",
    badge: "Kursi 3 — Shave & Scalp Therapy",
  },
];

const AUTOPLAY_STEP_MS = 40;
const AUTOPLAY_TOTAL_MS = 3500; // 3.5 detik per slide (lebih dinamis dan gesit)
const STEP_PERCENT = (AUTOPLAY_STEP_MS / AUTOPLAY_TOTAL_MS) * 100;

export function Hero6() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const currentSlide = DAMEZ_HERO_SLIDES[currentIndex] ?? DAMEZ_HERO_SLIDES[0]!;

  const goToSlide = useCallback((idx: number) => {
    setCurrentIndex(idx);
    setProgressPercent(0);
  }, []);

  // Interval-driven progress update without impure Date.now() calls
  useEffect(() => {
    const timer = setInterval(() => {
      setProgressPercent((prev) => {
        const next = prev + STEP_PERCENT;
        if (next >= 100) {
          setCurrentIndex((current) => (current + 1) % DAMEZ_HERO_SLIDES.length);
          return 0;
        }
        return next;
      });
    }, AUTOPLAY_STEP_MS);

    return () => clearInterval(timer);
  }, []);

  return (
    <section
      aria-label="Hero Spotlight Carousel"
      className="relative overflow-hidden border-b border-line px-6 py-14 lg:px-16 lg:py-20"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
        {/* Kolom Kiri: Teks Narasi & CTA */}
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <MonoLabel tone="brass">{currentSlide.eyebrow}</MonoLabel>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-text transition-all duration-300 sm:text-6xl lg:text-7xl">
              {currentSlide.titlePrimary}
              <span className="block text-brass">{currentSlide.titleAccent}</span>
            </h1>
          </div>

          <p className="max-w-xl text-base leading-relaxed text-muted transition-opacity duration-300 sm:text-lg">
            {currentSlide.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href={currentSlide.ctaHref}
              className="inline-flex h-13 items-center justify-center rounded-[3px] bg-brass px-8 font-display text-base font-bold text-ink transition-transform hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]"
            >
              {currentSlide.ctaText}
            </Link>
            <a
              href={currentSlide.secondaryCtaHref}
              className="inline-flex h-13 items-center justify-center rounded-[3px] border border-line bg-surface px-6 font-mono text-xs uppercase tracking-wider text-text transition-colors hover:border-brass/60"
            >
              {currentSlide.secondaryCtaText}
            </a>
          </div>

          {/* Indikator Progres Baris (Bawah Teks pada Layar Mobile/Tablet) */}
          <div className="mt-4 flex items-center gap-2 lg:hidden">
            {DAMEZ_HERO_SLIDES.map((slide, idx) => {
              const active = idx === currentIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"
                  aria-label={`Pindah ke slide ${idx + 1}`}
                >
                  <div
                    className="h-full bg-brass transition-all duration-75"
                    style={{
                      width: active ? `${progressPercent}%` : idx < currentIndex ? "100%" : "0%",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Kolom Tengah (Desktop): Garis Progres Vertikal (Progress Line Indicator) */}
        <div className="hidden flex-col items-center justify-center gap-3 lg:flex">
          {DAMEZ_HERO_SLIDES.map((slide, idx) => {
            const active = idx === currentIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(idx)}
                className="group relative flex h-24 w-1.5 flex-col items-center justify-start overflow-hidden rounded-full bg-surface-2 transition-all hover:w-2"
                aria-label={`Slide ${idx + 1}: ${slide.titlePrimary}`}
              >
                {/* Background track */}
                <div
                  className="w-full bg-brass transition-all duration-75"
                  style={{
                    height: active ? `${progressPercent}%` : idx < currentIndex ? "100%" : "0%",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Kolom Kanan: Rotating Carousel Frame & Brass Glow Light */}
        <div className="relative flex flex-1 items-center justify-center">
          {/* Ambient Glow Light di belakang gambar (Warna brass #C8A24A disesuaikan tema website) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-4 rounded-full bg-[radial-gradient(circle_at_center,rgba(200,162,74,0.25)_0%,rgba(194,162,92,0.12)_45%,transparent_70%)] blur-3xl transition-opacity duration-700"
          />

          {/* Sekunder Glow Light sudut untuk kedalaman atmosferik */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-brass/10 blur-2xl"
          />

          {/* Frame Gambar Carousel */}
          <div className="relative z-10 w-full overflow-hidden rounded-[4px] border border-line bg-surface shadow-2xl transition-all duration-500">
            <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/11]">
              <Image
                key={currentSlide.image}
                src={currentSlide.image}
                alt={currentSlide.imageAlt}
                fill
                priority={currentIndex === 0}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center transition-all duration-700 animate-in fade-in zoom-in-95"
              />

              {/* Gradient Overlay bawah gambar */}
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink via-ink/60 to-transparent pointer-events-none z-10" />

              {/* Badge Informasi di atas gambar */}
              <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between">
                <span className="rounded-[2px] border border-line bg-surface/90 px-3 py-1 font-mono text-[11px] font-bold text-brass backdrop-blur-md">
                  {currentSlide.badge}
                </span>

                <div className="flex items-center gap-1 font-mono text-[11px] text-muted">
                  <span className="font-bold text-text">0{currentIndex + 1}</span>
                  <span>/</span>
                  <span>0{DAMEZ_HERO_SLIDES.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
