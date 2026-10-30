import type { Metadata } from "next";
import Link from "next/link";
import { MonoLabel, Plate } from "@/components/ui/plate";

export const metadata: Metadata = {
  title: "Kisah Kami — Damez Barbershop",
  description:
    "Perjalanan, filosofi keahlian (craftsmanship), dan kenyamanan ruang santai pria modern di Damez Barbershop Jakarta Selatan.",
};

const CHAPTERS = [
  {
    id: "kehormatan-waktu",
    eyebrow: "Bagian 01",
    title: "Menghadirkan Kembali Kehormatan Waktu Pria",
    paragraphs: [
      "Damez Barbershop lahir di Jakarta Selatan dari pengamatan sederhana terhadap rutinitas pria urban. Banyak pria menginginkan potongan rambut yang rapi dan terawat, namun sering kali harus mengorbankan waktu berharga mereka untuk duduk menunggu tanpa kepastian dalam antrean fisik yang panjang.",
      "Di sisi lain, pengalaman pangkas rambut cepat yang serba terburu-buru kerap mengabaikan ketelitian anatomi kepala, sehingga potongan rambut kehilangan bentuk aslinya hanya dalam hitungan minggu.",
      "Kami mendirikan Damez Barbershop untuk mengakhiri kompromi tersebut. Kami menyatukan tradisi pangkas rambut klasik yang mengutamakan ketelitian tangan dengan kenyamanan ruang santai pria masa kini. Setiap kunjungan diposisikan sebagai momen jeda yang tertata rapi.",
    ],
  },
  {
    id: "craftsmanship",
    eyebrow: "Bagian 02",
    title: "Seni Pemotongan Rambut Presisi Anatomis",
    paragraphs: [
      "Memotong rambut pria adalah keahlian yang menuntut perpaduan antara disiplin geometri dan kepekaan rasa. Rambut setiap orang tumbuh dengan pola unik, memiliki pusaran alami berbeda, serta menempel pada kontur tengkorak kepala yang tidak pernah benar-benar simetris.",
      "Teknik pangkas kami memadukan ketelitian gunting baja Jepang tempa tangan (scissor-over-comb dan point cutting) untuk mahkota rambut yang tahan lama, serta gradasi mesin nirkabel terkalibrasi nol milimeter untuk transisi skin fade yang menyatu mulus dengan garis rahang.",
      "Hasil akhirnya adalah siluet potongan rambut yang kokoh, seimbang dari segala sudut pandang, dan mudah dirapikan sendiri di rumah setiap pagi tanpa memerlukan waktu penataan yang lama.",
    ],
  },
  {
    id: "ruang-tenang",
    eyebrow: "Bagian 03",
    title: "Kenyamanan Ruang Santai & Opsi Quiet Cut",
    paragraphs: [
      "Kami merancang Damez Barbershop sebagai tempat pangkas yang tenang di tengah kesibukan Jakarta Selatan. Ruang kerja kami memadukan dinding bernuansa arang gelap, aksen tembaga hangat, dan kursi hidrolik vintage berbahan besi tempa kokoh dengan bantalan busa tebal.",
      "Begitu melangkah masuk, perhatian tamu disambut oleh aroma khas kayu cedarwood bercampur kesegaran mint dan alunan musik lo-fi jazzy pada tingkat volume yang santai.",
      "Bagi pria yang baru saja menyelesaikan rapat kerja melelahkan atau membutuhkan keheningan untuk beristirahat, kami menyediakan opsi Quiet Cut. Barber kami akan melayani Anda dengan penuh perhatian tanpa percakapan yang tidak perlu selama proses pangkas berlangsung.",
    ],
  },
  {
    id: "reservasi-digital",
    eyebrow: "Bagian 04",
    title: "Filosofi Reservasi Tanpa Akun & Kepastian Jadwal",
    paragraphs: [
      "Ketidakpastian antrean adalah musuh utama waktu pria produktif. Kami menolak sistem nomor antrean kertas konvensional yang memaksa tamu duduk berjam-jam.",
      "Sistem reservasi Damez dibangun transparan: pelanggan memilih layanan, barber, dan jam yang masih bebas di papan live, lalu mengunci kursi dengan uang muka flat Rp 20.000. Uang muka ini memotong total nota di kasir saat pelunasan.",
      "Bagi tamu, kursi dijamin siap saat tiba di gerai. Bagi barber, sistem ini memberikan ketenangan kerja agar mereka dapat mencurahkan konsentrasi penuh pada setiap detail guntingan tanpa perlu terburu-buru mengejar kuantitas.",
    ],
  },
];

export default function AboutStoryPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-14 px-6 py-14 lg:py-20">
      <header className="flex flex-col gap-3">
        <MonoLabel tone="brass">Brand Story & Craftsmanship</MonoLabel>
        <h1 className="font-display text-4xl font-extrabold text-text sm:text-5xl">
          Kisah Kami di Damez Barbershop
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted">
          Dedikasi pada seni pangkas rambut anatomis, kehormatan waktu pria, dan ruang santai yang
          menenangkan di Jakarta Selatan.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-4">
          <Link
            href="/#papan-jadwal"
            className="inline-flex h-11 items-center justify-center rounded-[3px] bg-brass px-6 font-display text-sm font-bold text-ink transition-colors hover:brightness-105"
          >
            Lihat Papan Hari Ini
          </Link>
          <Link
            href="/barber"
            className="inline-flex h-11 items-center justify-center rounded-[3px] border border-line bg-surface px-5 font-mono text-xs uppercase text-text hover:border-brass/60"
          >
            Kenali Master Barber →
          </Link>
        </div>
      </header>

      {/* Chapters Story */}
      <section className="flex flex-col gap-10">
        {CHAPTERS.map((chap) => (
          <article
            key={chap.id}
            id={chap.id}
            className="flex flex-col gap-4 border-b border-line pb-10 scroll-mt-24 last:border-b-0"
          >
            <MonoLabel tone="brass">{chap.eyebrow}</MonoLabel>
            <h2 className="font-display text-2xl font-bold text-text sm:text-3xl">{chap.title}</h2>
            <div className="flex flex-col gap-3 text-base leading-relaxed text-muted">
              {chap.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </article>
        ))}
      </section>

      {/* Bottom CTA Card */}
      <Plate className="flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-display text-xl font-bold text-text">
            Siap Merasakan Pengalaman Damez?
          </span>
          <p className="font-mono text-xs text-muted">
            Tiga kursi, tiga master barber. Tanpa antre, DP flat Rp 20.000.
          </p>
        </div>
        <Link
          href="/booking"
          className="inline-flex h-11 items-center justify-center rounded-[3px] bg-brass px-6 font-display text-sm font-bold text-ink hover:brightness-105"
        >
          Kunci Kursi Anda
        </Link>
      </Plate>

      {/* Footer Navigasi */}
      <div className="flex flex-wrap items-center justify-between border-t border-line pt-6 font-mono text-xs text-muted">
        <Link href="/" className="hover:text-text">
          ← Kembali ke Beranda
        </Link>
        <Link href="/kebersihan" className="text-brass hover:underline">
          Lihat Standar Kebersihan Alat 4 Tahap →
        </Link>
      </div>
    </main>
  );
}
