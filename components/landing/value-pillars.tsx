import * as React from "react";
import {
  IconClock,
  IconUsers,
  IconCreditCard,
  IconSparkles,
  IconShieldCheck,
  IconCircleCheck,
} from "@/components/ui/icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ValuePillars() {
  return (
    <section className="py-16 md:py-24 border-t border-border/40 bg-surface/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-12 sm:mb-16">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">
            Standar Pria Urban
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Mengapa Memilih Reservasi Damez
          </h2>
          <p className="max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Menghilangkan rasa malas mengantre tanpa kepastian, barber yang berganti-ganti, dan kerumitan alur pemesanan konvensional.
          </p>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Pilar 1 */}
          <Card hoverEffect className="relative overflow-hidden border-border/80">
            <div className="absolute top-0 left-0 h-1 w-full bg-primary" />
            <CardHeader>
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/25 text-primary mb-2">
                <IconClock size="md" aria-hidden="true" />
              </div>
              <CardTitle className="text-lg">
                Bebas Antrean Fisik yang Melelahkan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Datang ke barbershop hanya untuk duduk menunggu selama 45 sampai 90 menit adalah pemborosan waktu. Di Damez Barbershop, setiap sesi memiliki alokasi waktu yang jelas ditambah jeda pembersihan 10 menit. Anda datang sesuai jam yang dipilih dan langsung dilayani.
              </p>
            </CardContent>
          </Card>

          {/* Pilar 2 */}
          <Card hoverEffect className="relative overflow-hidden border-border/80">
            <div className="absolute top-0 left-0 h-1 w-full bg-secondary" />
            <CardHeader>
              <div className="flex size-12 items-center justify-center rounded-xl bg-secondary/20 border border-secondary/40 text-[#D97706] mb-2">
                <IconUsers size="md" aria-hidden="true" />
              </div>
              <CardTitle className="text-lg">
                Tiga Master Barber Berdedikasi Penuh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Anda memegang kendali penuh atas siapa yang menangani rambut Anda. Setiap barber kami memiliki keahlian spesifik, mulai dari potongan klasik bertekstur, gradasi kulit (fade) presisi tinggi, hingga perawatan jenggot tradisional menggunakan handuk hangat.
              </p>
            </CardContent>
          </Card>

          {/* Pilar 3 */}
          <Card hoverEffect className="relative overflow-hidden border-border/80">
            <div className="absolute top-0 left-0 h-1 w-full bg-primary" />
            <CardHeader>
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/25 text-primary mb-2">
                <IconCreditCard size="md" aria-hidden="true" />
              </div>
              <CardTitle className="text-lg">
                Transparansi Harga Sejak Awal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tidak ada tarif tersembunyi atau biaya kejutan saat Anda berdiri di depan kasir. Semua paket sudah mencakup konsultasi bentuk wajah, keramas bersih, handuk penyegar, pemijatan rileks, dan penataan rambut dengan produk berkualitas.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 4 Standar Kenyamanan Kursi Pangkas */}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-8 border-b border-border/80 gap-3">
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Empat Standar Kenyamanan Kursi Pangkas
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Kualitas teknis yang Anda rasakan langsung selama berada di studio pangkas kami.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-semibold text-primary w-fit">
              <IconCircleCheck size="micro" aria-hidden="true" />
              <span>Standar Operasional 100% Terverifikasi</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Standar 1 */}
            <div className="flex flex-col gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-surface-elevated border border-border text-primary font-mono text-sm font-bold">
                01
              </div>
              <h4 className="text-base font-bold text-foreground">
                Ketepatan Teknik Pangkas
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gunting dan mesin pemotong dijalankan oleh tenaga ahli yang mengerti arah tumbuh rambut dan kontur tengkorak kepala Anda. Hasil potongan tampak rapi lebih lama, bahkan setelah dua hingga tiga minggu.
              </p>
            </div>

            {/* Standar 2 */}
            <div className="flex flex-col gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-surface-elevated border border-border text-primary font-mono text-sm font-bold">
                02
              </div>
              <h4 className="text-base font-bold text-foreground">
                Sanitasi Bersih Setiap Sesi
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Seluruh gunting, mata pisau cukur, dan sisir direndam dalam cairan antiseptik serta disterilkan menggunakan lemari sinar UV sebelum menyentuh kulit kepala Anda. Pisau razor selalu diganti baru di depan mata Anda.
              </p>
            </div>

            {/* Standar 3 */}
            <div className="flex flex-col gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-surface-elevated border border-border text-primary font-mono text-sm font-bold">
                03
              </div>
              <h4 className="text-base font-bold text-foreground">
                Jeda Sanitasi 10 Menit
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Kami tidak menerima pelanggan secara terburu-buru. Waktu jeda 10 menit disiapkan khusus agar barber dapat membersihkan sisa rambut, mengganti kertas leher baru, dan menyiapkan ruang kerja yang segar.
              </p>
            </div>

            {/* Standar 4 */}
            <div className="flex flex-col gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-surface-elevated border border-border text-primary font-mono text-sm font-bold">
                04
              </div>
              <h4 className="text-base font-bold text-foreground">
                Ruang Tenang & Kopi Dingin
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bagi Anda yang datang sedikit lebih awal, silakan bersantai di sofa kulit kami yang tenang, nikmati seduhan kopi dingin gratis, dan gunakan jaringan internet cepat tanpa gangguan bising.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
