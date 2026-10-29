import type { Metadata } from "next";
import Link from "next/link";
import { formatRupiah, listActiveBarbers, listActiveServices } from "@/features/catalogue/queries";
import { DOWN_PAYMENT_IDR } from "@/lib/config/constants";

export const metadata: Metadata = {
  title: "Damez Barbershop Senopati: Booking Kursi Tanpa Antre",
  description:
    "Barbershop pria di Senopati, Jakarta Selatan. Pilih barber, tentukan jam, dan langsung duduk di kursi pangkas. DP flat Rp 20.000 via QRIS.",
  openGraph: {
    title: "Damez Barbershop Senopati",
    description: "Tampil rapi tanpa mengantre. Booking kursi pangkas dengan kepastian jam.",
    type: "website",
  },
};

const VALUE_POINTS = [
  {
    title: "Tanpa Perlu Daftar Akun",
    body: "Cukup masukkan nama dan nomor WhatsApp aktif. Tidak ada kewajiban mengunduh aplikasi atau mengingat kata sandi baru.",
  },
  {
    title: "Kursi Terkunci Pasti",
    body: "Slot pilihan Anda diamankan selama 15 menit lewat uang muka. Kursi Anda tidak akan diserahkan ke pelanggan lain.",
  },
  {
    title: "Konfirmasi Tiket WhatsApp Seketika",
    body: "Begitu pembayaran DP diverifikasi sistem, tiket digital dengan rincian jadwal dikirim ke ponsel Anda.",
  },
];

const PILLARS = [
  {
    title: "Bebas Antrean Fisik",
    body: "Setiap sesi punya alokasi waktu jelas ditambah jeda pembersihan 10 menit. Anda datang sesuai jam yang dipilih dan langsung dilayani.",
  },
  {
    title: "Tiga Master Barber",
    body: "Anda memegang kendali penuh atas siapa yang menangani rambut Anda, dari potongan klasik sampai fade presisi tinggi.",
  },
  {
    title: "Transparansi Harga",
    body: "Tarif setiap paket tertulis sejak awal. DP flat Rp 20.000 memotong nota Anda saat pelunasan di kasir.",
  },
];

const FAQ = [
  {
    question: "Apakah harus membuat akun?",
    answer: "Tidak. Cukup nama dan nomor WhatsApp aktif saat mengunci slot.",
  },
  {
    question: "Bagaimana cara kerja DP Rp 20.000?",
    answer:
      "DP dibayar saat booking untuk mengunci kursi selama 15 menit, lalu dipotong dari total nota ketika Anda melunasi di kasir.",
  },
  {
    question: "Bisa batal atau ubah jadwal?",
    answer: "Bisa sampai 3 jam sebelum jadwal. Lewat dari itu DP hangus karena kursi sudah dikunci untuk Anda.",
  },
];

export default async function LandingPage() {
  const [services, barbers] = await Promise.all([listActiveServices(), listActiveBarbers()]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: "Damez Barbershop",
    description: "Barbershop pria di Senopati, Jakarta Selatan. Booking kursi tanpa antre.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Senopati",
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
    priceRange: "Rp 40.000 - Rp 95.000",
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-12">
      <script
        type="application/ld+json"
        // Data terstruktur statis, bukan masukan pengguna.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <span className="font-display text-lg tracking-[0.2em] text-brass uppercase">Damez</span>
          <Link
            href="/booking"
            className="rounded-card bg-brass px-4 py-3 text-sm font-medium text-ink transition hover:brightness-110"
          >
            Booking Sekarang
          </Link>
        </div>

        <p className="text-sm text-muted">
          4.9 dari 5 bintang, lebih dari 320 ulasan terverifikasi di Google Maps
        </p>

        <h1 className="font-display text-4xl leading-tight text-text sm:text-5xl">
          Tampil Rapi Tanpa Mengantre
        </h1>
        <p className="max-w-2xl text-base text-muted">
          Dapatkan potongan rambut presisi dan perawatan pria yang bersih di kawasan Senopati.
          Pilih barber andalan Anda, tentukan jam kedatangan, dan langsung duduk di kursi pangkas
          saat tiba.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/booking"
            className="rounded-card bg-brass px-5 py-4 text-base font-medium text-ink transition hover:brightness-110"
          >
            Booking Kursi Sekarang
          </Link>
          <Link
            href="#layanan"
            className="rounded-card border border-surface-2 px-5 py-4 text-base text-text transition hover:border-brass"
          >
            Lihat Paket Layanan &amp; Tarif
          </Link>
        </div>
        <p className="text-sm text-muted">
          DP Flat {formatRupiah(DOWN_PAYMENT_IDR)} via QRIS. Biaya DP memotong nota saat pelunasan di kasir.
        </p>
      </header>

      <section aria-labelledby="jaminan" className="flex flex-col gap-6">
        <h2 id="jaminan" className="font-display text-2xl text-text">
          Tiga jaminan layanan
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {VALUE_POINTS.map((point) => (
            <li key={point.title} className="rounded-card border border-surface-2 bg-surface p-5">
              <h3 className="font-display text-lg text-text">{point.title}</h3>
              <p className="mt-2 text-sm text-muted">{point.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pilar" className="flex flex-col gap-6">
        <h2 id="pilar" className="font-display text-2xl text-text">
          Mengapa memilih reservasi Damez
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {PILLARS.map((pillar) => (
            <li key={pillar.title} className="rounded-card bg-surface-2/40 p-5">
              <h3 className="font-display text-lg text-text">{pillar.title}</h3>
              <p className="mt-2 text-sm text-muted">{pillar.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="layanan" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 id="layanan" className="font-display text-2xl text-text">
            Paket layanan dan tarif
          </h2>
          <p className="text-sm text-muted">
            Harga sudah termasuk konsultasi gaya, cuci rambut, dan styling.
          </p>
        </div>
        <ul className="grid gap-3">
          {services.map((service) => (
            <li
              key={service.id}
              className="flex flex-col gap-2 rounded-card border border-surface-2 bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-lg text-text">{service.name}</h3>
                <p className="text-sm text-muted">
                  {service.durationMinutes} menit, {service.category}
                </p>
                {service.description === null ? null : (
                  <p className="max-w-2xl text-sm text-muted">{service.description}</p>
                )}
              </div>
              <p className="font-display text-lg text-brass whitespace-nowrap">
                {formatRupiah(service.priceIdr)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="barber" className="flex flex-col gap-6">
        <h2 id="barber" className="font-display text-2xl text-text">
          Tiga master barber
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {barbers.map((barber) => (
            <li key={barber.id} className="rounded-card border border-surface-2 bg-surface p-5">
              <p className="text-sm text-brass">Kursi {barber.chairNumber}</p>
              <h3 className="font-display text-lg text-text">{barber.fullName}</h3>
              {barber.title === null ? null : <p className="text-sm text-muted">{barber.title}</p>}
              {barber.specialty === null ? null : (
                <p className="mt-2 text-sm text-muted">{barber.specialty}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="faq" className="flex flex-col gap-4">
        <h2 id="faq" className="font-display text-2xl text-text">
          Pertanyaan yang sering diajukan
        </h2>
        <dl className="flex flex-col gap-4">
          {FAQ.map((item) => (
            <div key={item.question} className="rounded-card bg-surface p-5">
              <dt className="font-display text-base text-text">{item.question}</dt>
              <dd className="mt-2 text-sm text-muted">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="flex flex-col gap-3 border-t border-surface-2 pt-8 text-sm text-muted">
        <p>Damez Barbershop, Senopati, Jakarta Selatan. Buka setiap hari 10.00 sampai 21.00 WIB.</p>
        <Link href="/booking" className="text-brass underline underline-offset-4">
          Booking kursi sekarang
        </Link>
      </footer>
    </main>
  );
}