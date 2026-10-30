// Katalog dan papan hari dibaca saat request: papan menampilkan keadaan kursi
// hari ini, jadi tidak boleh dibekukan saat build.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { ACTION_CLASSES, MonoLabel } from "@/components/ui/plate";
import { SlotCell } from "@/components/ui/slot-cell";
import { buildDayBoard, formatHour } from "@/features/catalogue/day-board";
import { formatRupiah, listActiveServices } from "@/features/catalogue/queries";
import { CANCEL_CUTOFF_HOURS, DOWN_PAYMENT_IDR, LATE_TOLERANCE_MINUTES } from "@/lib/config/constants";

/**
 * Beranda (IDEA.md §17.7.1). Pembukanya bukan hero bergambar melainkan papan hari
 * gerai: baris jam, kolom kursi, dan daftar layanan. Grid berlubang ini memakai
 * bahasa keadaan yang sama dengan dasbor kasir.
 */
export const metadata: Metadata = {
  title: "Damez Barbershop Jakarta Selatan: Kunci Kursi Pangkas",
  description:
    "Tiga kursi, tiga barber, satu gerai di Jakarta Selatan. Lihat jam yang masih kosong hari ini, kunci dengan DP Rp 20.000, buka 10:00-21:00 WIB.",
  openGraph: {
    title: "Damez Barbershop Jakarta Selatan",
    description: "Lihat kursi yang masih bebas hari ini, lalu kunci jamnya.",
    type: "website",
  },
};

const STEPS = [
  {
    title: "Pilih jam yang masih bebas",
    body: "Papan di sebelah memperlihatkan keadaan sebenarnya hari ini, bukan contoh.",
  },
  {
    title: "Kunci dengan DP",
    body: `DP ${formatRupiah(DOWN_PAYMENT_IDR)} lewat QRIS atau virtual account; kursi ditahan 15 menit.`,
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
    answer:
      "DP dibayar saat booking untuk mengunci kursi selama 15 menit, lalu dipotong dari total nota saat Anda melunasi di kasir.",
  },
  {
    question: "Bisa batal atau ubah jadwal?",
    answer: `Bisa sampai ${CANCEL_CUTOFF_HOURS} jam sebelum jadwal. Lewat dari itu DP hangus karena kursinya sudah ditahan untuk Anda.`,
  },
  {
    question: "Kalau saya datang terlambat?",
    answer: `Toleransi ${LATE_TOLERANCE_MINUTES} menit. Lewat itu barber mulai melayani tamu berikutnya dan kursi Anda dilepas.`,
  },
];

export default async function LandingPage() {
  const [board, services] = await Promise.all([buildDayBoard(), listActiveServices()]);
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
        // Data terstruktur statis, bukan masukan pengguna.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="grid gap-10 px-6 py-10 lg:grid-cols-[392px_1fr] lg:gap-0 lg:px-0 lg:py-0">
        {/* Kiri: identitas gerai, aturan, satu tindakan */}
        <section className="flex flex-col gap-5 lg:h-full lg:justify-between lg:border-r lg:border-line lg:px-9 lg:py-9">
          <h1 className="font-display text-[52px] leading-[0.94] font-extrabold tracking-[-0.02em]">
            DAMEZ
            <span className="mt-2.5 block font-mono text-[13px] font-medium tracking-[0.14em] text-muted uppercase">
              Tiga kursi. Tiga barber. Satu gerai.
            </span>
          </h1>

          <p className="max-w-md text-[16.5px] leading-[1.52] text-text/90">
            Pilih kursi dan jamnya, kunci dengan DP {formatRupiah(DOWN_PAYMENT_IDR)}. Kursi
            ditahan 15 menit. Terlambat lebih dari {LATE_TOLERANCE_MINUTES} menit, DP hangus.
          </p>

          <Link href="/booking" className={ACTION_CLASSES}>
            <span>Kunci kursi saya</span>
            <span className="font-mono text-xs font-semibold opacity-70">
              {formatRupiah(DOWN_PAYMENT_IDR)}
            </span>
          </Link>

          {/* Daftar biasa, bukan <dl>: axe menolak <dl> yang isinya bukan pasangan
              dt/dd, dan aturan ini dulu lolos hanya karena form lama tidak memakainya. */}
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

          <p className="font-mono text-[12.5px] text-muted">
            Tanpa akun · nomor WhatsApp untuk tiket dan pengingat
          </p>

          {/* Di layar lebar langkah-langkah ini mengisi rail supaya kolom kiri tidak
              menggantung; di ponsel ia muncul sebagai seksi sendiri di bawah papan. */}
          <ol className="mt-2 hidden flex-col gap-4 border-t border-line pt-5 lg:flex">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-1.5">
                <MonoLabel tone="brass">{`${String(index + 1).padStart(2, "0")}`}</MonoLabel>
                <h3 className="font-display text-sm font-bold">{step.title}</h3>
                <p className="font-mono text-[12.5px] leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Kanan: papan hari */}
        <section aria-labelledby="papan-hari" className="flex flex-col lg:px-15 lg:py-8">
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

          {/* Ponsel: satu blok per kursi, karena tiga kolom tidak terbaca di 390 px */}
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

          {/* Gulungan layanan: delapan alat di slotnya */}
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
        </section>
      </div>

      <section aria-labelledby="cara" className="border-t border-line px-6 py-10 sm:block lg:hidden">
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

      <section aria-labelledby="faq" className="border-t border-line px-6 py-10 lg:pr-16 lg:pl-[440px]">
        <h2 id="faq" className="font-display text-2xl font-bold">
          Pertanyaan yang sering diajukan
        </h2>
        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          {FAQ.map((item) => (
            <div key={item.question} className="border-l border-line pl-4">
              <dt className="font-display text-base font-bold">{item.question}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-8 font-mono text-[12.5px] text-muted lg:pr-16 lg:pl-[440px]">
        <p>Damez Barbershop · Jakarta Selatan · buka 10:00–21:00 WIB</p>
        <Link href="/booking" className="text-brass underline underline-offset-4">
          Kunci kursi sekarang
        </Link>
      </footer>
    </main>
  );
}
