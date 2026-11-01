// Katalog dan papan hari dibaca saat request: papan menampilkan keadaan kursi
// hari ini, jadi tidak boleh dibekukan saat build.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { Hero6 } from "@/components/hero/Hero6";
import { LiveReservationSection } from "@/components/booking/LiveReservationSection";
import { ServicesCatalogSection } from "@/components/booking/ServicesCatalogSection";
import { LocationSection } from "@/components/location/LocationSection";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { MonoLabel, Plate } from "@/components/ui/plate";
import { buildDayBoard } from "@/features/catalogue/day-board";
import {
  listActiveBarbers,
  listActiveServices,
} from "@/features/catalogue/queries";
import {
  CANCEL_CUTOFF_HOURS,
  HOLD_TTL_SECONDS,
  LATE_TOLERANCE_MINUTES,
} from "@/lib/config/constants";

/** Lama hold dalam kata, diambil dari konstanta supaya angkanya tidak hidup dua kali. */
const HOLD_LABEL = `${Math.round(HOLD_TTL_SECONDS / 60)} menit`;

export const metadata: Metadata = {
  title: "Damez Barbershop — Ruang Pangkas Presisi & Reservasi Kursi",
  description:
    "Company profile dan reservasi kursi Damez Barbershop Jakarta Selatan. Tiga kursi, tiga master barber, presisi anatomis, dan kepastian jadwal tanpa antre.",
  openGraph: {
    title: "Damez Barbershop Jakarta Selatan",
    description: "Seni pangkas presisi dan kepastian waktu di Jakarta Selatan.",
    type: "website",
  },
};

const VALUES = [
  {
    number: "01",
    title: "Pangkas Presisi Anatomis",
    desc: "Setiap potongan disesuaikan dengan kontur kepala, arah tumbuh rambut, dan gaya hidup Anda. Bukan cetakan seragam yang kaku.",
  },
  {
    number: "02",
    title: "Sanitasi Alat 4 Tahap",
    desc: "Gunting tempa Jepang dan clipper dibersihkan, disterilisasi UV/cairan, dan disanitasi menyeluruh di setiap jeda 10 menit antar tamu.",
  },
  {
    number: "03",
    title: "Kehormatan Waktu Pria",
    desc: "Sistem reservasi real-time dengan kunci kursi 15 menit dan jaminan tanpa antre. Waktu Anda dihormati seutuhnya.",
  },
];


const FAQ = [
  {
    question: "Apakah harus membuat akun?",
    answer: "Tidak. Cukup nama dan nomor WhatsApp aktif saat mengunci kursi.",
  },
  {
    question: "Bagaimana cara kerja DP Rp 20.000?",
    answer: `DP dibayar saat booking untuk mengunci kursi, lalu dipotong dari total nota ketika Anda melunasi di kasir. Sisa tagihan dibayar tunai atau QRIS di gerai.`,
  },
  {
    question: "Berapa lama kursi ditahan setelah saya memesan?",
    answer: `Kursi ditahan ${HOLD_LABEL}. Kalau DP belum masuk sampai batas itu, slot dilepas otomatis dan bisa diambil orang lain.`,
  },
  {
    question: "Bisa batal atau ubah jadwal?",
    answer: `Bisa selama masih lebih dari ${CANCEL_CUTOFF_HOURS} jam sebelum jadwal. Lewat dari itu DP hangus karena kursinya sudah ditahan untuk Anda. Perubahan diurus lewat balasan pesan tiket WhatsApp Anda — belum ada pembatalan mandiri di situs.`,
  },
  {
    question: "Kalau saya terlambat?",
    answer: `Ada toleransi ${LATE_TOLERANCE_MINUTES} menit. Lewat dari itu kedatangan dicatat sebagai tidak hadir dan DP hangus; Anda tetap bisa minta didaftarkan sebagai tamu walk-in di kasir bila masih ada kursi kosong.`,
  },
  {
    question: "Kalau barber tidak bisa hadir, DP saya bagaimana?",
    answer: "DP dikembalikan penuh. Tim gerai menghubungi Anda lebih dulu untuk menawarkan jadwal pengganti atau barber lain pada jam yang sama.",
  },
];

export default async function LandingPage() {
  const [board, services, barbers] = await Promise.all([
    buildDayBoard(),
    listActiveServices(),
    listActiveBarbers(),
  ]);
  const prices = services.map((service) => service.priceIdr);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: "Damez Barbershop",
    description: "Barbershop pria di Jakarta Selatan dengan reservasi kursi tanpa antre.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Jakarta Selatan",
      addressRegion: "DKI Jakarta",
      addressCountry: "ID",
    },
    areaServed: "Jakarta Selatan",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "10:00",
        closes: "21:00",
      },
    ],
    priceRange:
      prices.length === 0
        ? undefined
        : `Rp ${Math.min(...prices).toLocaleString("id-ID")} - Rp ${Math.max(...prices).toLocaleString("id-ID")}`,
  };

  return (
    <main className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 1. HERO SECTION (REACT BITS PRO HERO-6: ROTATING CAROUSEL WITH PROGRESS LINE & GLOW) */}
      <Hero6 />

      {/* Nilai Utama Gerai Damez */}
      <section className="border-b border-line px-6 py-12 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-3">
            {VALUES.map((v, i) => (
              <ScrollReveal key={v.number} delay={i * 0.12} duration={0.8}>
                <Plate className="flex h-full flex-col gap-2 p-5">
                  <MonoLabel tone="brass">{v.number}</MonoLabel>
                  <h2 className="font-display text-base font-bold text-text">{v.title}</h2>
                  <p className="text-sm leading-relaxed text-muted">{v.desc}</p>
                </Plate>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 2. KATALOG LAYANAN & TARIF */}
      <ServicesCatalogSection services={services} />

      {/* 3. PROFIL MASTER BARBER (CRAFTSMANSHIP & PERSONA TIAP KURSI) */}
      <section id="master-barber" className="border-b border-line px-6 py-16 lg:px-16 scroll-mt-28">
        <div className="mx-auto flex max-w-5xl flex-col gap-10">
          <ScrollReveal duration={0.8}>
            <div className="flex flex-col gap-2">
              <MonoLabel tone="brass">Tim & Dedikasi Keahlian</MonoLabel>
              <h2 className="font-display text-3xl font-extrabold text-text sm:text-4xl">
                Tiga Master Barber. Karakter Unik di Setiap Kursi.
              </h2>
              <p className="max-w-xl text-base text-muted">
                Di Damez, Anda tidak sekadar dipotong rambutnya. Anda berkonsultasi dengan master barber
                yang memahami geometri kepala, jenis rambut, dan kebiasaan styling Anda.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-3">
            {barbers.map((b, i) => (
              <ScrollReveal key={b.id} delay={i * 0.12} duration={0.8}>
                <Plate className="flex h-full flex-col justify-between p-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-line pb-3">
                      <span className="font-mono text-xs uppercase text-brass">
                        Kursi {b.chairNumber}
                      </span>
                      {b.nickname ? (
                        <span className="rounded-[2px] bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-muted">
                          &quot;{b.nickname}&quot;
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-text">{b.fullName}</h3>
                      <p className="font-mono text-xs text-brass">{b.title ?? "Master Barber"}</p>
                    </div>
                    <p className="text-sm leading-relaxed text-muted">
                      {b.bio ?? "Berpengalaman tinggi dalam potongan pria klasik dan modern."}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-line pt-3 font-mono text-xs text-ghost">
                    <div>
                      Spesialisasi: <span className="text-text">{b.specialty ?? "All-around Cut"}</span>
                    </div>
                    <a
                      href="#papan-jadwal"
                      className="text-brass hover:underline flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <span>Cek Jadwal</span>
                      <span>↓</span>
                    </a>
                  </div>
                </Plate>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PAPAN STATUS JADWAL & KUNCI KURSI LANGSUNG (REDESIGNED) */}
      <LiveReservationSection
        board={board}
        barbers={barbers}
      />

      {/* 5. FAQ SEPUTAR ATURAN GERAI */}
      <section aria-labelledby="faq" className="border-b border-line px-6 py-14 lg:px-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <ScrollReveal duration={0.8}>
            <div>
              <MonoLabel tone="brass">Ketentuan & Kebijakan</MonoLabel>
              <h2 id="faq" className="mt-1 font-display text-3xl font-bold text-text">
                Pertanyaan yang sering diajukan
              </h2>
            </div>
          </ScrollReveal>
          <dl className="grid gap-6 sm:grid-cols-2">
            {FAQ.map((item, idx) => (
              <ScrollReveal key={item.question} delay={idx * 0.08} duration={0.8}>
                <Plate className="flex h-full flex-col gap-2 p-5">
                  <dt className="font-display text-base font-semibold text-text">{item.question}</dt>
                  <dd className="text-sm leading-relaxed text-muted">{item.answer}</dd>
                </Plate>
              </ScrollReveal>
            ))}
          </dl>
        </div>
      </section>

      {/* 6. LOKASI GERAI & PETA INTERAKTIF */}
      <LocationSection />

      {/* 7. FOOTER COMPANY PROFILE */}
      <footer className="px-6 py-12 lg:px-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <span className="font-display text-xl font-bold tracking-tight text-text">
                DAMEZ BARBERSHOP
              </span>
              <p className="font-mono text-xs leading-relaxed text-muted">
                Ruang santai pangkas rambut pria modern di Ciputat Timur. Menghormati waktu Anda
                lewat presisi potongan dan kepastian jadwal.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <MonoLabel>Operasional & Lokasi</MonoLabel>
              <p className="font-mono text-xs text-text">Senin – Minggu: 10:00 – 21:00 WIB</p>
              <p className="font-mono text-xs text-muted">
                Jl. Legoso Raya No.80c, Pisangan, Ciputat Timur
              </p>
              <a
                href="https://www.google.com/maps/place/Damez+Barbershop/@-6.3164905,106.7536217,17z/data=!3m1!4b1!4m6!3m5!1s0x2e69efc2f4a2ee67:0xf3b8c74fbcf03099!8m2!3d-6.3164905!4d106.7536217!16s%2Fg%2F11z0h5k33v"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-brass underline underline-offset-4"
              >
                Lihat di Google Maps ↗
              </a>
              <p className="font-mono text-xs text-danger">
                Toleransi keterlambatan: {LATE_TOLERANCE_MINUTES} menit
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <MonoLabel>Bantuan & Navigasi</MonoLabel>
              <Link
                href="/booking"
                className="font-mono text-xs text-brass underline underline-offset-4"
              >
                Kunci kursi sekarang
              </Link>
              <Link
                href="/kebijakan-privasi"
                className="font-mono text-xs text-muted underline underline-offset-4"
              >
                Kebijakan privasi
              </Link>
              <p className="font-mono text-xs text-ghost">
                Balas pesan tiket WhatsApp Anda untuk pembatalan atau perubahan jadwal.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between border-t border-line pt-6 font-mono text-[11px] text-muted">
            <p>© {new Date().getFullYear()} Damez Barbershop. All rights reserved.</p>
            <p>Tangerang Selatan, Banten, Indonesia.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
