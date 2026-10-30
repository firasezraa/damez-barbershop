"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { MonoLabel } from "@/components/ui/plate";

export interface HeroSlide {
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
  color: string;
}

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
    color: "bg-brass/20",
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
      "https://images.unsplash.com/photo-1541533848490-bc8115cd6522?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Proses pangkas rambut gradasi skin fade tajam menggunakan clipper nirkabel profesional",
    badge: "Kursi 2 — Fade & Taper",
    color: "bg-brass/20",
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
    imageAlt: "Proses cukur tradisional dengan silet higienis dan detailing garis rambut",
    badge: "Kursi 3 — Shave & Scalp Therapy",
    color: "bg-brass/20",
  },
];

export function Hero6() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const slides = DAMEZ_HERO_SLIDES;
  const slideCount = slides.length;
  const currentSlide = slides[currentSlideIndex] ?? slides[0]!;

  // Persis logika React Bits Pro Hero 6:
  // Timer akumulasi progress: 5000ms per slide, update tiap 50ms
  useEffect(() => {
    const timer = setInterval(() => {
      setProgressPercent((prev) => {
        const next = prev >= 100 ? 0 : prev + 100 / ((5000 * slideCount) / 50);
        const nextIdx = Math.min(Math.floor((next / 100) * slideCount), slideCount - 1);
        setCurrentSlideIndex((current) => (current !== nextIdx ? nextIdx : current));
        return next;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [slideCount]);

  const handleSelectSlide = (idx: number) => {
    setProgressPercent((idx / slideCount) * 100);
    setCurrentSlideIndex(idx);
  };

  return (
    <section
      aria-label="Hero Spotlight Carousel"
      className="relative overflow-hidden border-b border-line px-6 py-14 lg:px-16 lg:py-20"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
        {/* Kolom Kiri: Teks Narasi & CTA persis animasi React Bits Pro (AnimatePresence mode="wait") */}
        <div className="flex flex-1 flex-col justify-center min-h-[340px] sm:min-h-[380px] lg:min-h-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlideIndex}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.15 },
                },
                exit: {
                  opacity: 0,
                  transition: { duration: 0.2 },
                },
              }}
              className="space-y-6"
            >
              <motion.div
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    transition: { duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] },
                  },
                }}
              >
                <MonoLabel tone="brass">{currentSlide.eyebrow}</MonoLabel>
              </motion.div>

              <h1 className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-text sm:text-6xl lg:text-7xl">
                <motion.span
                  variants={{
                    hidden: { y: 30, opacity: 0 },
                    visible: {
                      y: 0,
                      opacity: 1,
                      transition: { duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] },
                    },
                  }}
                  className="block"
                >
                  {currentSlide.titlePrimary}
                </motion.span>
                <motion.span
                  variants={{
                    hidden: { y: 30, opacity: 0 },
                    visible: {
                      y: 0,
                      opacity: 1,
                      transition: { duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] },
                    },
                  }}
                  className="block text-brass"
                >
                  {currentSlide.titleAccent}
                </motion.span>
              </h1>

              <motion.p
                variants={{
                  hidden: { y: 30, opacity: 0 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    transition: { duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] },
                  },
                }}
                className="max-w-xl text-base leading-relaxed text-muted sm:text-lg"
              >
                {currentSlide.description}
              </motion.p>
            </motion.div>
          </AnimatePresence>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex flex-wrap items-center gap-4 pt-6"
          >
            <Link
              href={currentSlide.ctaHref}
              className="inline-flex h-13 w-full shrink-0 items-center justify-center rounded-[3px] bg-brass px-8 font-display text-base font-bold whitespace-nowrap text-ink transition-transform hover:scale-[1.02] hover:brightness-105 active:scale-[0.98] sm:w-[240px]"
            >
              {currentSlide.ctaText}
            </Link>
            <a
              href={currentSlide.secondaryCtaHref}
              className="inline-flex h-13 w-full shrink-0 items-center justify-center rounded-[3px] border border-line bg-surface px-6 font-mono text-xs tracking-wider whitespace-nowrap text-text uppercase transition-colors hover:border-brass/60 sm:w-[268px]"
            >
              {currentSlide.secondaryCtaText}
            </a>
          </motion.div>
        </div>

        {/* Kolom Tengah (Desktop): Garis Progres Vertikal persis React Bits Pro */}
        <div className="hidden flex-col items-center justify-center gap-4 h-[420px] lg:flex">
          {slides.map((_, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectSlide(idx)}
              className="group relative w-1 flex-1 cursor-pointer overflow-hidden rounded-full bg-surface-2"
              aria-label={`Slide ${idx + 1}`}
            >
              <div className="absolute inset-0 bg-surface-2/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {idx === currentSlideIndex && (
                <motion.div
                  className="absolute top-0 left-0 w-full bg-brass origin-top"
                  initial={{ height: "0%" }}
                  animate={{
                    height: `${((progressPercent - (100 * idx) / slideCount) / (100 / slideCount)) * 100}%`,
                  }}
                  transition={{ duration: 0.05, ease: "linear" }}
                />
              )}
              {idx < currentSlideIndex && <div className="absolute inset-0 bg-brass" />}
            </div>
          ))}
        </div>

        {/* Kolom Kanan: Foto Carousel & Glow Ambient persis React Bits Pro Hero 6 */}
        <div className="relative flex flex-1 items-center justify-center">
          {/* Ambient Glow di belakang gambar (React Bits Pro pattern) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlideIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.35, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8 }}
              className="pointer-events-none absolute -inset-4 rounded-full bg-[radial-gradient(circle_at_center,rgba(200,162,74,0.3)_0%,rgba(194,162,92,0.15)_45%,transparent_70%)] blur-3xl"
            />
          </AnimatePresence>

          {/* Frame Gambar Carousel */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl sm:aspect-[16/11] lg:max-w-md lg:h-[420px]">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={currentSlideIndex}
                initial={{ opacity: 0, scale: 0.95, y: "100%" }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: "-100%" }}
                transition={{ duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] }}
                className="absolute inset-0 w-full h-full"
              >
                <Image
                  src={currentSlide.image}
                  alt={currentSlide.imageAlt}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center"
                />

                {/* Gradient Overlay bawah gambar */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink via-ink/60 to-transparent pointer-events-none z-10" />

                {/* Badge Informasi di atas gambar */}
                <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between">
                  <span className="rounded-[2px] border border-line bg-surface/90 px-3 py-1 font-mono text-[11px] font-bold text-brass backdrop-blur-md">
                    {currentSlide.badge}
                  </span>

                  <div className="flex items-center gap-1 font-mono text-[11px] text-muted">
                    <span className="font-bold text-text">0{currentSlideIndex + 1}</span>
                    <span>/</span>
                    <span>0{slides.length}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Indikator Progres Baris (Bawah Teks pada Layar Mobile/Tablet) persis React Bits Pro */}
        <div className="flex lg:hidden justify-center gap-2 mt-4">
          {slides.map((_, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectSlide(idx)}
              className="relative w-16 h-1 bg-surface-2 rounded-full overflow-hidden cursor-pointer"
            >
              {idx === currentSlideIndex && (
                <motion.div
                  className="absolute inset-0 bg-brass origin-left"
                  style={{
                    scaleX: (progressPercent - (100 * idx) / slideCount) / (100 / slideCount),
                  }}
                  transition={{ duration: 0.05, ease: "linear" }}
                />
              )}
              {idx < currentSlideIndex && <div className="absolute inset-0 bg-brass" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
