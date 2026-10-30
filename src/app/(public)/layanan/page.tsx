import type { Metadata } from "next";
import Link from "next/link";
import { MonoLabel, Plate } from "@/components/ui/plate";
import { formatRupiah, listActiveServices } from "@/features/catalogue/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Katalog & Detail Layanan — Damez Barbershop",
  description:
    "Detail lengkap 8 layanan pangkas rambut, cukur jenggot, dan terapi perawatan pria di Damez Barbershop Jakarta Selatan.",
};

const SERVICE_DETAILS: Record<
  string,
  {
    stepNotes: string[];
    idealFor: string;
    productUsed: string;
  }
> = {
  "gentlemen-classic-haircut": {
    stepNotes: [
      "Konsultasi arah tumbuh rambut & bentuk anatomis kepala",
      "Pangkas presisi teknik scissor-over-comb dengan gunting tempa Jepang",
      "Pencucian rambut relaksasi dengan sampo beraroma menthol segar",
      "Pengeringan dan penataan rambut menggunakan premium pomade / matte clay",
    ],
    idealFor: "Pria profesional yang menginginkan potongan rapi abadi (side-part, slick back, executive cut).",
    productUsed: "Gunting baja karbon tinggi Jepang, pomade water-based / matte hair clay.",
  },
  "premium-fade-taper-cut": {
    stepNotes: [
      "Konsultasi tingkat ketipisan fade (Low, Mid, High, atau Skin Fade)",
      "Pencukuran gradasi bertahap nol milimeter dengan clipper nirkabel terkalibrasi",
      "Penegasan garis tepi pelipis dan cambang dengan razor berpisau steril",
      "Tonic penyegar kulit kepala dan styling bertekstur",
    ],
    idealFor: "Tampilan kontemporer tajam, rahang tegas, dan gradasi kulit halus tanpa garis patah.",
    productUsed: "Precision cordless clipper, foil shaver, hair texturizing powder.",
  },
  "junior-kids-haircut": {
    stepNotes: [
      "Pendekatan ramah anak untuk kenyamanan selama proses pangkas",
      "Pemotongan lembut disesuaikan dengan tekstur rambut anak",
      "Pemberian bedak hipoalergenik dan perapian tanpa rasa takut",
    ],
    idealFor: "Anak-anak hingga usia remaja yang menginginkan model rambut rapi dan segar.",
    productUsed: "Peralatan ergonomis aman anak, bedak kulit lembut non-iritasi.",
  },
  "beard-sculpting-hot-towel-shave": {
    stepNotes: [
      "Kompres handuk hangat beraroma minyak kayu putih & lemon untuk membuka pori",
      "Aplikasi krim busa cukur hangat pelembut helai jenggot",
      "Pencukuran menggunakan pisau silet baru bersegel (single-use blade)",
      "Bilas dingin penyegar pori-pori dan aftershave soothing balm",
    ],
    idealFor: "Perapian dan pembentukan kontur jenggot simetris serta pengalaman relaksasi klasik.",
    productUsed: "Disposable surgical razor, hot lather shave cream, aftershave balm.",
  },
  "relaxing-hair-spa-anti-dandruff": {
    stepNotes: [
      "Diagnosa singkat kondisi ketombe dan kelembapan kulit kepala",
      "Aplikasi serum / krim spa eksfoliasi sel kulit mati",
      "Pijatan akupresur relaksasi kepala, leher, dan bahu",
      "Bilas bersih dan pemberian scalp tonic penguat akar rambut",
    ],
    idealFor: "Pria dengan masalah kulit kepala gatal, ketombe, atau stres kerja yang membutuhkan relaksasi.",
    productUsed: "Anti-dandruff scalp scrub cream, clarifying shampoo, tea tree cooling tonic.",
  },
  "black-hair-color-revival": {
    stepNotes: [
      "Pemeriksaan helai rambut uban atau kusam yang membutuhkan pemulihan warna",
      "Pewarnaan hitam alami formula bebas amonia berbau lembut",
      "Waktu peresapan pigmen 20 menit dengan penutup khusus",
      "Pencucian rambut pengunci warna dan kondisioner pelindung kilau",
    ],
    idealFor: "Menutup uban secara merata dengan hasil hitam natural tanpa terlihat belang atau kaku.",
    productUsed: "Ammonia-free natural black hair dye, color-lock conditioner.",
  },
  "express-clean-cut-wash": {
    stepNotes: [
      "Perapian cepat bagian sisi samping dan belakang leher",
      "Pencucian kilat pembersih serpihan rambut",
      "Blow dry cepat dengan sentuhan hair tonic segar",
    ],
    idealFor: "Pria sibuk yang butuh merapikan rambut sebelum rapat penting dalam durasi singkat.",
    productUsed: "High-power hair vacuum & clipper, refreshing hair tonic.",
  },
  "the-damez-signature-executive-combo": {
    stepNotes: [
      "Sesi lengkap Gentlemen Haircut dengan teknik gunting & mesin terpadu",
      "Royal hot towel shave & pembentukan jenggot atau cukur kumis presisi",
      "Terapi pijat kepala, leher, dan pundak selama 15 menit",
      "Pencucian rambut ganda dan finishing styling eksekutif",
    ],
    idealFor: "Pengalaman relaksasi maksimal dan transformasi penampilan menyeluruh dalam satu kunjungan.",
    productUsed: "Koleksi lengkap produk premium Damez Barbershop.",
  },
};

export default async function ServicesDetailPage() {
  const services = await listActiveServices();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-14 lg:py-20">
      {/* Header Halaman */}
      <header className="flex flex-col gap-3">
        <MonoLabel tone="brass">Menu & Spesifikasi Perawatan</MonoLabel>
        <h1 className="font-display text-4xl font-extrabold text-text sm:text-5xl">
          Katalog Lengkap Layanan Damez
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted">
          Seluruh layanan kami dirancang dengan durasi presisi dan standar kebersihan tertinggi.
          DP Rp 20.000 berlaku flat untuk setiap booking dan dipotong langsung saat pelunasan di meja
          kasir gerai.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-4">
          <Link
            href="/booking"
            className="inline-flex h-11 items-center justify-center rounded-[3px] bg-brass px-6 font-display text-sm font-bold text-ink transition-colors hover:brightness-105"
          >
            Pesan Jadwal Layanan
          </Link>
          <Link
            href="/#papan-jadwal"
            className="inline-flex h-11 items-center justify-center rounded-[3px] border border-line bg-surface px-5 font-mono text-xs uppercase text-text hover:border-brass/60"
          >
            Cek Papan Ketersediaan Hari Ini →
          </Link>
        </div>
      </header>

      {/* Grid Rincian 8 Layanan */}
      <section className="flex flex-col gap-6">
        {services.map((service, index) => {
          const detail = SERVICE_DETAILS[service.slug];
          const anchorId =
            service.slug === "gentlemen-classic-haircut"
              ? "classic-cut"
              : service.slug === "premium-fade-taper-cut"
                ? "premium-fade"
                : service.slug === "beard-sculpting-hot-towel-shave"
                  ? "beard-shave"
                  : service.slug === "the-damez-signature-executive-combo"
                    ? "signature-combo"
                    : service.slug;

          return (
            <Plate
              key={service.id}
              className="flex flex-col justify-between gap-6 p-6 scroll-mt-24 sm:p-8"
            >
              <div id={anchorId} className="flex flex-col gap-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-brass">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                      {service.category}
                    </span>
                    {service.recommended ? (
                      <span className="rounded-[2px] bg-brass/10 px-2 py-0.5 font-mono text-[10px] text-brass">
                        REKOMENDASI
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3 font-mono text-sm">
                    <span className="text-muted">{service.durationMinutes} Menit</span>
                    <span className="font-bold text-brass">{formatRupiah(service.priceIdr)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="font-display text-2xl font-bold text-text">{service.name}</h2>
                  <p className="text-sm leading-relaxed text-muted">
                    {service.description ??
                      "Perawatan rambut presisi dengan standar pangkas profesional Damez."}
                  </p>
                </div>

                {detail ? (
                  <div className="mt-2 grid gap-6 border-t border-line-2 pt-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <MonoLabel>Tahapan Pengerjaan</MonoLabel>
                      <ul className="flex flex-col gap-1.5 pl-4 font-mono text-xs text-muted list-disc">
                        {detail.stepNotes.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-3 font-mono text-xs text-muted">
                      <div>
                        <span className="font-bold text-text block mb-1">Ideal Untuk:</span>
                        <p>{detail.idealFor}</p>
                      </div>
                      <div>
                        <span className="font-bold text-text block mb-1">Alat & Produk:</span>
                        <p>{detail.productUsed}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between border-t border-line pt-4">
                <span className="font-mono text-xs text-ghost">
                  DP Rp 20.000 · Pelunasan sisa di kasir
                </span>
                <Link
                  href="/booking"
                  className="font-display text-xs font-bold uppercase tracking-wider text-brass hover:underline"
                >
                  Pilih Layanan Ini & Booking Kursi →
                </Link>
              </div>
            </Plate>
          );
        })}
      </section>

      {/* Footer Navigasi Antar Halaman */}
      <div className="flex flex-wrap items-center justify-between border-t border-line pt-6 font-mono text-xs text-muted">
        <Link href="/" className="hover:text-text">
          ← Kembali ke Beranda
        </Link>
        <Link href="/barber" className="text-brass hover:underline">
          Kenali Master Barber Kami →
        </Link>
      </div>
    </main>
  );
}
