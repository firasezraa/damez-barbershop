import type { Metadata } from "next";
import Link from "next/link";
import { MonoLabel, Plate } from "@/components/ui/plate";
import { listActiveBarbers } from "@/features/catalogue/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Master Barber Kami — Damez Barbershop",
  description:
    "Profil mendalam tiga master barber Damez Barbershop: Rian Pratama, Dimas Arisandi, dan Kevin Sanjaya. Pengalaman, karakter pangkas, dan spesialisasi kursi.",
};

const BARBER_EXTENDED: Record<
  number,
  {
    experience: string;
    signatureCuts: string[];
    workPhilosophy: string;
    toolsUsed: string;
  }
> = {
  1: {
    experience: "6 Tahun Pengalaman (Bandung & Jakarta Selatan)",
    signatureCuts: ["Classic Side-Part Pompadour", "Executive Slick Back", "Scissor-Over-Comb Taper", "Textured Gentleman Crop"],
    workPhilosophy:
      "Kerapian abadi lahir dari ketenangan tangan dan pemahaman pusaran mahkota kepala. Tidak ada potongan yang terburu-buru di Kursi 1.",
    toolsUsed: "Gunting tempa baja karbon tinggi Jepang, sisir karbon antistatis, pomade water-based.",
  },
  2: {
    experience: "5 Tahun Pengalaman & Finalis Kompetisi Barber Nasional",
    signatureCuts: ["Low / Mid / High Skin Fade", "Sharp Taper Fade", "Modern French Crop", "Precision Hairline Outline"],
    workPhilosophy:
      "Gradasi kulit sempurna adalah perpaduan sudut milimeter mesin pemotong nirkabel dengan bentuk alami garis rahang dan leher Anda.",
    toolsUsed: "Cordless zero-gap clipper, foil finishing shaver, hair clay & texture powder.",
  },
  3: {
    experience: "7 Tahun Pengalaman (Heritage Barbershop & Luxury Hotel)",
    signatureCuts: ["Royal Hot Towel Shave", "Beard Sculpting & Symmetry", "Aromatherapy Scalp Massage", "Gentle Neck Therapy"],
    workPhilosophy:
      "Sesi pangkas dan cukur adalah jeda bernapas bagi pria urban. Sentuhan hangat handuk aromaterapi dan silet steril memberi kesegaran sejati.",
    toolsUsed: "Single-use surgical razor blade, handuk uap minyak lemon-kayu putih, soothing aftershave.",
  },
};

export default async function BarberDetailPage() {
  const barbers = await listActiveBarbers();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-14 lg:py-20">
      <header className="flex flex-col gap-3">
        <MonoLabel tone="brass">Pengrajin Pangkas Presisi</MonoLabel>
        <h1 className="font-display text-4xl font-extrabold text-text sm:text-5xl">
          Tiga Master Barber Damez
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted">
          Di Damez Barbershop, setiap kursi dikepalai oleh seorang master barber berkarakter unik.
          Pilih barber yang paling selaras dengan gaya rambut dan kenyamanan istirahat Anda.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-4">
          <Link
            href="/#papan-jadwal"
            className="inline-flex h-11 items-center justify-center rounded-[3px] bg-brass px-6 font-display text-sm font-bold text-ink transition-colors hover:brightness-105"
          >
            Lihat Jadwal Barber Hari Ini
          </Link>
          <Link
            href="/booking"
            className="inline-flex h-11 items-center justify-center rounded-[3px] border border-line bg-surface px-5 font-mono text-xs uppercase text-text hover:border-brass/60"
          >
            Reservasi Kursi Tertentu →
          </Link>
        </div>
      </header>

      {/* Rincian 3 Master Barber */}
      <section className="flex flex-col gap-8">
        {barbers.map((barber) => {
          const ext = BARBER_EXTENDED[barber.chairNumber];
          const anchorId =
            barber.chairNumber === 1
              ? "rian-pratama"
              : barber.chairNumber === 2
                ? "dimas-arisandi"
                : "kevin-sanjaya";

          return (
            <Plate
              key={barber.id}
              className="flex flex-col justify-between gap-6 p-6 scroll-mt-24 sm:p-8"
            >
              <div id={anchorId} className="flex flex-col gap-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-brass">
                      Kursi {barber.chairNumber}
                    </span>
                    {barber.nickname ? (
                      <span className="rounded-[2px] bg-surface-2 px-2.5 py-0.5 font-mono text-xs text-text">
                        &quot;{barber.nickname}&quot;
                      </span>
                    ) : null}
                  </div>

                  <span className="font-mono text-xs text-muted">
                    {ext?.experience ?? "Master Barber Senior"}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <h2 className="font-display text-2xl font-bold text-text sm:text-3xl">
                    {barber.fullName}
                  </h2>
                  <p className="font-mono text-xs font-semibold text-brass">
                    {barber.title ?? "Senior Master Barber"}
                  </p>
                </div>

                <p className="text-base leading-relaxed text-muted">
                  {barber.bio ??
                    "Berdedikasi pada potongan pria berkarakter rapi dengan keahlian teknis tinggi."}
                </p>

                {ext ? (
                  <div className="mt-2 grid gap-6 border-t border-line-2 pt-5 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <MonoLabel>Keahlian Gaya Rambut</MonoLabel>
                      <ul className="flex flex-col gap-1.5 pl-4 font-mono text-xs text-muted list-disc">
                        {ext.signatureCuts.map((cut) => (
                          <li key={cut} className="text-text">
                            {cut}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-4 font-mono text-xs text-muted">
                      <div>
                        <span className="font-bold text-text block mb-1">Filosofi Kursi:</span>
                        <p className="italic text-text/90">&ldquo;{ext.workPhilosophy}&rdquo;</p>
                      </div>
                      <div>
                        <span className="font-bold text-text block mb-1">Peralatan Unggulan:</span>
                        <p>{ext.toolsUsed}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between border-t border-line pt-4">
                <span className="font-mono text-xs text-ghost">
                  Tersedia untuk Booking Online & Tamu Walk-in
                </span>
                <Link
                  href="/booking"
                  className="font-display text-xs font-bold uppercase tracking-wider text-brass hover:underline"
                >
                  Pilih {barber.fullName} Saat Booking →
                </Link>
              </div>
            </Plate>
          );
        })}
      </section>

      {/* Navigasi Footer */}
      <div className="flex flex-wrap items-center justify-between border-t border-line pt-6 font-mono text-xs text-muted">
        <Link href="/layanan" className="hover:text-text">
          ← Lihat Katalog Layanan
        </Link>
        <Link href="/kebersihan" className="text-brass hover:underline">
          Lihat Protokol Higienis & Kebersihan Alat →
        </Link>
      </div>
    </main>
  );
}
