import * as React from "react";
import {
  IconScissors,
  IconVolumeOff,
  IconShieldCheck,
  IconSparkles,
  IconMapPin,
} from "@/components/ui/icons";

export function BrandStory() {
  return (
    <section id="kisah-kami" className="py-16 md:py-24 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Brand Story Narrative */}
          <div className="flex flex-col gap-6 lg:col-span-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-primary tracking-widest uppercase">
              <IconMapPin size="micro" aria-hidden="true" />
              <span>Senopati Raya, Jakarta Selatan</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-[1.2]">
              Menghargai Waktu, <br />
              <span className="text-primary">Merawat Tradisi Pangkas Presisi</span>
            </h2>

            <p className="text-base text-muted-foreground leading-relaxed">
              Damez Barbershop lahir di Jalan Senopati Raya dari pengamatan sederhana terhadap rutinitas pria urban. Banyak pria menginginkan potongan rambut yang rapi dan terawat, namun sering kali harus mengorbankan waktu berharga mereka untuk duduk menunggu tanpa kepastian dalam antrean fisik yang panjang.
            </p>

            <p className="text-base text-muted-foreground leading-relaxed">
              Kami menyatukan tradisi pangkas rambut klasik yang mengutamakan ketelitian tangan dengan kenyamanan ruang santai pria modern. Setiap sesi diatur dengan alokasi waktu yang jelas ditambah jeda pembersihan 10 menit. Anda dapat mempercayakan kerapian penampilan Anda kepada master barber kami, menikmati atmosfer yang tenang, lalu kembali beraktivitas dengan rasa percaya diri penuh.
            </p>

            {/* Quiet Cut Special Callout */}
            <div className="rounded-xl border border-secondary/40 bg-secondary/10 p-4 sm:p-5 flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-white shadow-sm">
                <IconVolumeOff size="sm" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-foreground">
                  Pilihan Eksklusif: Opsi Quiet Cut
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bagi Anda yang baru saja menyelesaikan rapat kerja melelahkan atau membutuhkan ketenangan, sampaikan kepada barber kami. Kami melayani Anda dengan perhatian penuh tanpa percakapan yang tidak perlu selain konfirmasi teknis panjang rambut.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Three Craftsmanship Badges */}
          <div className="flex flex-col gap-5 lg:col-span-6">
            {/* Card 1 */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-md hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 border border-primary/30 text-primary">
                  <IconScissors size="sm" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Presisi Pangkas Anatomis
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Analisis kontur tengkorak kepala sebelum pemotongan, penggunaan gunting baja tempa Jepang untuk tekstur alami, serta mesin nirkabel terkalibrasi nol milimeter agar gradasi fade tetap rapi selama berminggu-minggu.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-md hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-secondary/20 border border-secondary/40 text-[#D97706]">
                  <IconSparkles size="sm" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Ruang Santai yang Tenang
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sofa kulit berwarna cognac yang empuk, pendingin udara sejuk, alunan musik jazzy lo-fi, seduhan kopi dingin gratis, dan suasana temaram yang menenangkan mata dari paparan layar gawai.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-md hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 border border-primary/30 text-primary">
                  <IconShieldCheck size="sm" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Higienitas Tanpa Kompromi
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Mata pisau razor baru dibuka dari segel langsung di depan mata Anda, sterilisasi ganda dengan cairan disinfektan dan lemari UV-C, strip pelindung leher higienis, serta jeda 10 menit khusus pembersihan antar-sesi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
