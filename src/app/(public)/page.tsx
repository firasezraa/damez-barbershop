// Katalog dan papan hari dibaca saat request: papan menampilkan keadaan kursi
// hari ini, jadi tidak boleh dibekukan saat build.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { Hero6 } from "@/components/hero/Hero6";
import { BlurHighlight } from "@/components/ui/BlurHighlight";
import { ACTION_CLASSES, MonoLabel, Plate } from "@/components/ui/plate";
import { SlotCell } from "@/components/ui/slot-cell";
import { buildDayBoard, formatHour } from "@/features/catalogue/day-board";
import {
  formatRupiah,
  listActiveBarbers,
  listActiveServices,
} from "@/features/catalogue/queries";
import {
  CANCEL_CUTOFF_HOURS,
  DOWN_PAYMENT_IDR,
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

const STEPS = [
  {
    title: "Pilih jam yang masih bebas",
    body: "Papan di sebelah memperlihatkan keadaan sebenarnya hari ini, bukan contoh.",
  },
  {
    title: "Kunci dengan DP",
    body: `DP ${formatRupiah(DOWN_PAYMENT_IDR)} lewat QRIS atau virtual account; kursi ditahan ${HOLD_LABEL}.`,
  },
  {
    title: "Datang, duduk, selesai",
    body: `Kasir memotong DP dari total nota. Toleransi ${LATE_TOLERANCE_MINUTES} menit.`,
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
              <BlurHighlight key={v.number} blurDelay={i * 0.15} blurDuration={0.8}>
                <Plate className="flex h-full flex-col gap-2 p-5">
                  <MonoLabel tone="brass">{v.number}</MonoLabel>
                  <h2 className="font-display text-base font-bold text-text">{v.title}</h2>
                  <p className="text-sm leading-relaxed text-muted">{v.desc}</p>
                </Plate>
              </BlurHighlight>
            ))}
          </div>
        </div>
      </section>

      {/* 2. SECTION BOOKING & PAPAN HARI INI */}
      <section id="papan-jadwal" className="border-b border-line">
        <div className="grid gap-10 px-6 py-10 lg:grid-cols-[392px_1fr] lg:gap-0 lg:px-0 lg:py-0">
          {/* Kolom kiri: ringkasan booking & aturan */}
          <div className="flex flex-col gap-5 lg:h-full lg:justify-between lg:border-r lg:border-line lg:px-9 lg:py-9">
            <div className="flex flex-col gap-4">
              <BlurHighlight blurDuration={0.8}>
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-text">
                  Reservasi Kursi
                  <span className="mt-1 block font-mono text-xs font-normal uppercase tracking-wider text-muted">
                    Tiga kursi · Tiga barber · Satu gerai
                  </span>
                </h2>
              </BlurHighlight>

              <p className="text-sm leading-relaxed text-text/90">
                Pilih kursi dan jamnya di papan samping, kunci dengan DP{" "}
                {formatRupiah(DOWN_PAYMENT_IDR)}. Kursi ditahan {HOLD_LABEL}. Terlambat lebih dari{" "}
                {LATE_TOLERANCE_MINUTES} menit, DP hangus.
              </p>

              <Link href="/booking" className={ACTION_CLASSES}>
                <span>Kunci kursi saya</span>
                <span className="font-mono text-xs font-semibold opacity-70">
                  {formatRupiah(DOWN_PAYMENT_IDR)}
                </span>
              </Link>
            </div>

            <ul className="grid gap-2 font-mono text-[13px] text-muted">
              <li>
                Buka <b className="font-semibold text-text">10:00 – 21:00 WIB</b>
              </li>
              <li>
                Batal/reschedule <b className="font-semibold text-text">H-{CANCEL_CUTOFF_HOURS} jam</b>
              </li>
              <li>
                Pelunasan <b className="font-semibold text-text">di kasir</b>, DP dipotong
              </li>
              <li>
                Gerai <b className="font-semibold text-text">Jakarta Selatan</b>
              </li>
            </ul>

            <p className="font-mono text-xs text-muted">
              Tanpa akun · nomor WhatsApp hanya untuk tiket dan konfirmasi
            </p>

            <ol className="hidden flex-col gap-4 border-t border-line pt-5 lg:flex">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex flex-col gap-1.5">
                  <MonoLabel tone="brass">{`0${index + 1}`}</MonoLabel>
                  <h3 className="font-display text-sm font-bold text-text">{step.title}</h3>
                  <p className="font-mono text-xs leading-relaxed text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Kolom kanan: papan hari */}
          <div aria-labelledby="papan-hari" className="flex flex-col lg:px-15 lg:py-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
              <h2
                id="papan-hari"
                className="font-display text-sm font-semibold tracking-[0.14em] uppercase"
              >
                Papan hari ini — {board.label} · {formatHour(board.startHour)}–{formatHour(board.endHour)}
              </h2>
              <span className="font-mono text-[12.5px] text-brass">
                {Math.floor(board.nowMinutes / 60)
                  .toString()
                  .padStart(2, "0")}
                :
                {(board.nowMinutes % 60).toString().padStart(2, "0")}{" "}
                WIB sekarang · {board.scheduledCount} slot terjadwal hari ini
              </span>
            </div>

            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ghost">
              <li className="whitespace-nowrap">arsir = kursi terjadwal</li>
              <li className="whitespace-nowrap">garis putus = kursi bebas</li>
              <li className="whitespace-nowrap">ISTIRAHAT = barber istirahat</li>
              <li className="whitespace-nowrap">bingkai brass = jam yang Anda pilih</li>
            </ul>

            {/* Desktop & tablet lebar: grid jam × kursi */}
            <div className="mt-2 hidden sm:block">
              <div className="grid grid-cols-[72px_repeat(3,1fr)] lg:grid-cols-[96px_repeat(3,1fr)]">
                <div aria-hidden="true" />
                {board.chairs.map((chair) => (
                  <div
                    key={chair.chairNumber}
                    className="flex h-[72px] flex-col justify-center border-l border-line pl-3 lg:pl-4"
                  >
                    <MonoLabel tone="brass">Kursi {chair.chairNumber}</MonoLabel>
                    <span className="mt-0.5 font-display text-[17px] font-bold lg:text-lg">
                      {chair.barberName}
                    </span>
                    {chair.barberTitle === null ? null : (
                      <span className="mt-0.5 font-mono text-xs text-muted">{chair.barberTitle}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-line">
                {Array.from({ length: board.endHour - board.startHour }, (_, index) => {
                  const hour = board.startHour + index;

                  return (
                    <div
                      key={hour}
                      className="grid h-11 grid-cols-[72px_repeat(3,1fr)] border-b border-line-2 lg:grid-cols-[96px_repeat(3,1fr)]"
                    >
                      <div className="flex items-center pl-1 font-mono text-[12.5px] text-muted">
                        {formatHour(hour)}
                      </div>
                      {board.chairs.map((chair) => {
                        const slot = chair.slots.find((item) => item.hour === hour);
                        return (
                          <div
                            key={chair.chairNumber}
                            className="flex items-center border-l border-line-2 px-0 py-1"
                          >
                            <SlotCell
                              state={slot?.state ?? "free"}
                              text={slot?.text}
                              className="justify-self-stretch"
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ponsel: satu blok per kursi */}
            <div className="mt-2 flex flex-col gap-6 sm:hidden">
              {board.chairs.map((chair) => (
                <div key={chair.chairNumber} className="flex flex-col">
                  <div className="flex items-baseline justify-between border-b border-line pb-2">
                    <MonoLabel tone="brass">Kursi {chair.chairNumber}</MonoLabel>
                    <span className="font-display text-base font-bold">{chair.barberName}</span>
                  </div>
                  <ul className="flex flex-col">
                    {chair.slots.map((slot) => (
                      <li
                        key={slot.hour}
                        className="flex h-10 items-center gap-3 border-b border-line-2"
                      >
                        <span className="w-14 font-mono text-[12.5px] text-muted">
                          {formatHour(slot.hour)}
                        </span>
                        <SlotCell state={slot.state} text={slot.text} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Gulungan 8 layanan */}
            <div className="mt-4 border-t border-line pt-px sm:pl-[72px] lg:pl-24">
              <ul className="grid grid-cols-2 gap-px bg-line-2 lg:grid-cols-4">
                {services.map((service) => (
                  <li
                    key={service.id}
                    className={`flex min-h-[104px] flex-col gap-1 bg-surface px-3.5 py-3 ${
                      service.recommended ? "shadow-[inset_0_2px_0_var(--color-brass)]" : ""
                    }`}
                  >
                    <h3 className="font-display text-[13px] leading-snug font-semibold sm:line-clamp-2 sm:min-h-[34px]">
                      {service.name}
                    </h3>
                    <p className="font-mono text-xs text-muted">
                      {service.durationMinutes} menit · {service.category}
                    </p>
                    <p className="mt-auto font-mono text-sm text-brass">
                      {formatRupiah(service.priceIdr)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROFIL MASTER BARBER (CRAFTSMANSHIP) */}
      <section className="border-b border-line px-6 py-16 lg:px-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-10">
          <BlurHighlight blurDuration={0.8}>
            <div className="flex flex-col gap-2">
              <MonoLabel tone="brass">Tim & Dedikasi Keahlian</MonoLabel>
              <h2 className="font-display text-3xl font-extrabold text-text sm:text-4xl">
                Tiga Master Barber. Karakter Unik di Setiap Kursi.
              </h2>
              <p className="max-w-xl text-base text-muted">
                Di Damez, Anda tidak sekadar dipotong rambutnya. Anda berkonsultasi dengan barber
                yang memahami geometri kepala, jenis rambut, dan kebiasaan styling Anda.
              </p>
            </div>
          </BlurHighlight>

          <div className="grid gap-6 sm:grid-cols-3">
            {barbers.map((b, i) => (
              <BlurHighlight key={b.id} blurDelay={i * 0.15} blurDuration={0.8}>
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

                  <div className="mt-6 border-t border-line pt-3 font-mono text-xs text-ghost">
                    Spesialisasi: <span className="text-text">{b.specialty ?? "All-around Cut"}</span>
                  </div>
                </Plate>
              </BlurHighlight>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CARA MENGUNCI KURSI (UNTUK MOBILE) */}
      <section aria-labelledby="cara" className="border-b border-line px-6 py-10 sm:block lg:hidden">
        <h2 id="cara" className="font-display text-2xl font-bold">
          Cara mengunci kursi
        </h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-2">
              <MonoLabel tone="brass">{`0${index + 1}`}</MonoLabel>
              <h3 className="font-display text-lg font-bold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 5. FAQ SEPUTAR ATURAN GERAI */}
      <section aria-labelledby="faq" className="border-b border-line px-6 py-14 lg:px-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <BlurHighlight blurDuration={0.8}>
            <div>
              <MonoLabel tone="brass">Ketentuan & Kebijakan</MonoLabel>
              <h2 id="faq" className="mt-1 font-display text-3xl font-bold text-text">
                Pertanyaan yang sering diajukan
              </h2>
            </div>
          </BlurHighlight>
          <dl className="grid gap-6 sm:grid-cols-2">
            {FAQ.map((item, idx) => (
              <BlurHighlight key={item.question} blurDelay={idx * 0.08} blurDuration={0.8}>
                <Plate className="flex h-full flex-col gap-2 p-5">
                  <dt className="font-display text-base font-semibold text-text">{item.question}</dt>
                  <dd className="text-sm leading-relaxed text-muted">{item.answer}</dd>
                </Plate>
              </BlurHighlight>
            ))}
          </dl>
        </div>
      </section>

      {/* 6. FOOTER COMPANY PROFILE */}
      <footer className="px-6 py-12 lg:px-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <span className="font-display text-xl font-bold tracking-tight text-text">
                DAMEZ BARBERSHOP
              </span>
              <p className="font-mono text-xs leading-relaxed text-muted">
                Ruang santai pangkas rambut pria modern di Jakarta Selatan. Menghormati waktu Anda
                lewat presisi potongan dan kepastian jadwal.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <MonoLabel>Operasional & Lokasi</MonoLabel>
              <p className="font-mono text-xs text-text">Senin – Minggu: 10:00 – 21:00 WIB</p>
              <p className="font-mono text-xs text-muted">
                Jakarta Selatan · Melayani Booking Online & Tamu Walk-in
              </p>
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
            <p>Jakarta Selatan, Indonesia.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
