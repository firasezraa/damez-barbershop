"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  IconStar,
  IconShieldCheck,
  IconClock,
  IconBolt,
  IconCircleCheck,
  IconArrowRight,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { GalaxyShimmerButton } from "@/components/ui/galaxy-components";
import {
  heroContainerVariants,
  heroItemVariants,
  heroCardVariants,
} from "@/lib/motion";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24">
      {/* Ambient Lighting & Radial Glow */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-3xl -z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-0 top-1/4 h-80 w-80 rounded-full bg-secondary/15 blur-3xl -z-10"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={heroContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center"
        >
          {/* Left Column: Copy & CTAs */}
          <div className="flex flex-col gap-6 lg:col-span-7">
            {/* Social Proof Badge */}
            <motion.div
              variants={heroItemVariants}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 backdrop-blur-md shadow-sm"
            >
              <div className="flex items-center text-primary">
                {[...Array(5)].map((_, i) => (
                  <IconStar key={i} size="micro" className="fill-primary text-primary" aria-hidden="true" />
                ))}
              </div>
              <span className="text-xs font-bold text-foreground">4.9 dari 5 Bintang</span>
              <span className="text-xs text-muted-foreground">• 320 lebih ulasan terverifikasi di Google Maps</span>
            </motion.div>

            {/* Hero Headline */}
            <motion.h1
              variants={heroItemVariants}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.15]"
            >
              Tampil Rapi <br className="hidden sm:inline" />
              <span className="text-primary">Tanpa Mengantre</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              variants={heroItemVariants}
              className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed"
            >
              Dapatkan potongan rambut presisi dan perawatan pria yang bersih di kawasan Senopati. Pilih barber andalan Anda, tentukan jam kedatangan, dan langsung duduk di kursi pangkas saat tiba.
            </motion.p>

            {/* CTA Group */}
            <motion.div
              variants={heroItemVariants}
              className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center"
            >
              <a href="#layanan" className="w-full sm:w-auto">
                <GalaxyShimmerButton
                  variant="amber"
                  size="lg"
                  className="w-full sm:w-auto"
                  icon={<IconArrowRight size="sm" aria-hidden="true" />}
                >
                  Booking Kursi Sekarang
                </GalaxyShimmerButton>
              </a>
              <a href="#layanan" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base border-border hover:border-primary/50 text-foreground min-h-[48px]"
                >
                  <span>Lihat Paket Layanan & Tarif</span>
                </Button>
              </a>
            </motion.div>

            {/* Microcopy DP notice */}
            <motion.p
              variants={heroItemVariants}
              className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2"
            >
              <span className="size-1.5 rounded-full bg-primary inline-block" />
              DP Flat Rp 20.000 via QRIS. Biaya DP memotong nota saat pelunasan di kasir.
            </motion.p>
          </div>

          {/* Right Column: Visual Trust Bento Box */}
          <motion.div variants={heroCardVariants} className="lg:col-span-5">
            <div className="relative rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-2xl">
              <div className="absolute top-0 right-0 -mr-2 -mt-2 rounded-full border border-primary/40 bg-primary/20 px-3 py-1 text-[11px] font-bold text-primary tracking-wider uppercase">
                Jaminan Kursi Pasti
              </div>

              <div className="flex flex-col gap-6">
                <div className="border-b border-border/80 pb-4">
                  <h2 className="font-display text-xl font-bold text-foreground">
                    Tiga Jaminan Layanan Damez
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Standar kepastian waktu untuk pria berjadwal padat di Jakarta Selatan.
                  </p>
                </div>

                {/* Value Checkpoints */}
                <div className="flex flex-col gap-5">
                  {/* Point 1 */}
                  <div className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 border border-primary/30 text-primary">
                      <IconBolt size="sm" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-bold text-foreground">
                        1. Tanpa Perlu Daftar Akun
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Cukup masukkan nama dan nomor WhatsApp aktif. Tidak ada kewajiban mengunduh aplikasi atau mengingat kata sandi baru.
                      </p>
                    </div>
                  </div>

                  {/* Point 2 */}
                  <div className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 border border-primary/30 text-primary">
                      <IconClock size="sm" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-bold text-foreground">
                        2. Kursi Terkunci Pasti
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Slot pilihan Anda diamankan selama 15 menit melalui pembayaran uang muka. Kursi Anda tidak akan diserahkan ke pelanggan lain.
                      </p>
                    </div>
                  </div>

                  {/* Point 3 */}
                  <div className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 border border-primary/30 text-primary">
                      <IconShieldCheck size="sm" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-bold text-foreground">
                        3. Konfirmasi Tiket WhatsApp Seketika
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Begitu pembayaran DP diverifikasi sistem, tiket digital dengan rincian jadwal dan peta rute langsung dikirim ke ponsel Anda.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Trust Badge */}
                <div className="mt-2 rounded-xl bg-surface-elevated border border-border/80 p-3.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Protokol Kebersihan</span>
                  <span className="font-semibold text-primary flex items-center gap-1.5">
                    <IconCircleCheck size="micro" aria-hidden="true" /> Steril UV-C & Silet Baru
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
