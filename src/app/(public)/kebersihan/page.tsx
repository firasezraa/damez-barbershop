import type { Metadata } from "next";
import Link from "next/link";
import { MonoLabel, Plate } from "@/components/ui/plate";

export const metadata: Metadata = {
  title: "Standar Kebersihan & Higienis — Damez Barbershop",
  description:
    "Protokol kebersihan empat tahap Damez Barbershop: pisau silet sekali pakai, sterilisasi ganda UV-C, neck paper higienis, dan handuk hangat beraroma.",
};

const PROTOCOLS = [
  {
    step: "01",
    id: "silet",
    title: "Mata Pisau Silet 100% Sekali Pakai",
    subtitle: "Single-Use Surgical Razor Blade",
    desc: "Untuk setiap sesi pencukuran jenggot, kumis, maupun perapian cambang, mata pisau silet selalu dikeluarkan dari segel pembungkus baru dan dipasang langsung di hadapan Anda. Setelah pemakaian selesai, pisau langsung dibuang ke wadah pembuangan benda tajam medis tertutup. Kami tidak pernah menggunakan ulang mata pisau cukur untuk dua orang berbeda dalam kondisi apa pun.",
  },
  {
    step: "02",
    id: "sterilisasi",
    title: "Sterilisasi Ganda Antiseptik & Sinar UV-C",
    subtitle: "Hospital-Grade Disinfection & UV Cabinet",
    desc: "Setiap gunting rambut tempa, sisir karbon, dan bilah mesin pemotong dibersihkan dari serpihan rambut mikro, direndam dalam larutan disinfektan berstandar medis untuk membasmi kuman, lalu dikeringkan dan disimpan di lemari sterilisasi sinar UV-C. Peralatan baru diambil keluar saat Anda telah siap duduk di kursi pangkas.",
  },
  {
    step: "03",
    id: "neck-paper",
    title: "Kertas Leher Pelindung Higienis",
    desc: "Sebelum kain penutup (cape) dipasang, kami melingkarkan strip kertas elastis sekali pakai (disposable neck paper) pada leher Anda. Lapisan ini menyerap keringat dan mencegah kain penutup bersentuhan langsung dengan kulit leher, mencegah risiko iritasi serta perpindahan minyak alami antar-tamu.",
  },
  {
    step: "04",
    id: "handuk",
    title: "Handuk Katun Hangat Uap Aromaterapi",
    subtitle: "Steam Sanitized & Lemon Eucalyptus Oil",
    desc: "Handuk wajah melalui proses pencucian bersuhu tinggi dengan detergen antibakteri dan uap panas. Disimpan hangat di mesin pemanas khusus dengan tetesan minyak esensial lemon dan eucalyptus yang menenangkan kulit serta melegakan pernapasan.",
  },
];

export default function HygieneDetailPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-6 py-14 lg:py-20">
      <header className="flex flex-col gap-3">
        <MonoLabel tone="brass">Dedikasi Kebersihan & Keamanan</MonoLabel>
        <h1 className="font-display text-4xl font-extrabold text-text sm:text-5xl">
          Standar Higienis Empat Tahap
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted">
          Keahlian memotong rambut harus ditopang oleh rasa aman dan kebersihan mutlak. Di Damez
          Barbershop, setiap kursi dan set peralatan disiapkan secara steril sebelum Anda duduk.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-4">
          <Link
            href="/#papan-jadwal"
            className="inline-flex h-11 items-center justify-center rounded-[3px] bg-brass px-6 font-display text-sm font-bold text-ink transition-colors hover:brightness-105"
          >
            Lihat Jadwal Bersih Hari Ini
          </Link>
          <Link
            href="/booking"
            className="inline-flex h-11 items-center justify-center rounded-[3px] border border-line bg-surface px-5 font-mono text-xs uppercase text-text hover:border-brass/60"
          >
            Kunci Kursi Steril →
          </Link>
        </div>
      </header>

      {/* Rincian 4 Tahap Protokol */}
      <section className="flex flex-col gap-6">
        {PROTOCOLS.map((proto) => (
          <Plate
            key={proto.step}
            id={proto.id}
            className="flex flex-col gap-4 p-6 scroll-mt-24 sm:p-8"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="font-mono text-xs font-bold text-brass">Tahap {proto.step}</span>
              {proto.subtitle ? (
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                  {proto.subtitle}
                </span>
              ) : null}
            </div>

            <h2 className="font-display text-2xl font-bold text-text">{proto.title}</h2>
            <p className="text-base leading-relaxed text-muted">{proto.desc}</p>
          </Plate>
        ))}
      </section>

      {/* Catatan Jeda Sanitasi Sistem */}
      <Plate className="flex flex-col gap-3 border-brass/40 bg-surface p-6">
        <MonoLabel tone="brass">Jeda Otomatis 10 Menit Antar Tamu</MonoLabel>
        <h3 className="font-display text-xl font-bold text-text">
          Sistem Menjamin Waktu Pembersihan Tidak Tergesa-Gesa
        </h3>
        <p className="text-sm leading-relaxed text-muted">
          Mesin reservasi Damez Barbershop secara otomatis menyisipkan *turnaround buffer* 10 menit
          setelah setiap durasi pangkas selesai. Waktu ini dikhususkan bagi barber kami untuk
          menyapu serpihan rambut, mensterilkan alat di UV box, mengganti silet baru, dan menyiapkan
          kursi higienis untuk kedatangan Anda.
        </p>
      </Plate>

      {/* Navigasi Footer */}
      <div className="flex flex-wrap items-center justify-between border-t border-line pt-6 font-mono text-xs text-muted">
        <Link href="/barber" className="hover:text-text">
          ← Lihat Profil Master Barber
        </Link>
        <Link href="/layanan" className="text-brass hover:underline">
          Lihat Menu & Durasi Layanan →
        </Link>
      </div>
    </main>
  );
}
