"use client";

import * as React from "react";
import { Clock, Check, ArrowRight, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ServiceItem {
  id: string;
  code: string;
  name: string;
  category: "haircut" | "grooming" | "treatment" | "combo";
  durationMinutes: number;
  price: number;
  dpAmount: number;
  badgeLabel: string;
  isPopular?: boolean;
  description: string;
}

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: "srv-01",
    code: "SRV-01",
    name: "Gentlemen Classic Haircut",
    category: "haircut",
    durationMinutes: 45,
    price: 50000,
    dpAmount: 20000,
    badgeLabel: "Paling Populer",
    isPopular: true,
    description:
      "Potongan rambut pria klasik yang disesuaikan dengan karakter wajah dan profesi Anda. Sudah mencakup konsultasi gaya, pencucian rambut dua kali, usapan handuk dingin penyegar, pemijatan bahu ringan, serta sentuhan akhir pomade aroma maskulin.",
  },
  {
    id: "srv-02",
    code: "SRV-02",
    name: "Premium Fade & Taper Cut",
    category: "haircut",
    durationMinutes: 50,
    price: 65000,
    dpAmount: 20000,
    badgeLabel: "Spesialis Fade",
    description:
      "Pengerjaan gradasi rambut tingkat tinggi dengan teknik zero fade, skin fade, atau taper clean cut. Dikerjakan bertahap menggunakan beberapa ukuran clipper untuk menghasilkan transisi rambut yang sangat halus dan garis tepi yang tegas.",
  },
  {
    id: "srv-03",
    code: "SRV-03",
    name: "Junior Gentleman Cut",
    category: "haircut",
    durationMinutes: 35,
    price: 40000,
    dpAmount: 20000,
    badgeLabel: "Ramah Anak",
    description:
      "Layanan pangkas rambut untuk anak dan remaja usia 3 sampai 12 tahun. Barber kami terbiasa menangani anak dengan pendekatan sabar, ramah, dan cekatan agar anak merasa nyaman tanpa rasa takut.",
  },
  {
    id: "srv-04",
    code: "SRV-04",
    name: "Classic Beard Sculpt & Hot Towel Shave",
    category: "grooming",
    durationMinutes: 35,
    price: 45000,
    dpAmount: 20000,
    badgeLabel: "Grooming Jenggot",
    description:
      "Perawatan kumis dan jenggot ala pria sejati. Dimulai dengan kompres handuk hangat untuk membuka pori-pori kulit, pengolesan busa cukur lembut, penataan garis jenggot dengan razor steril baru, dan diakhiri dengan aftershave dingin anti-iritasi.",
  },
  {
    id: "srv-05",
    code: "SRV-05",
    name: "Relaxing Scalp Care & Hair Wash",
    category: "treatment",
    durationMinutes: 40,
    price: 55000,
    dpAmount: 20000,
    badgeLabel: "Perawatan Kulit Kepala",
    description:
      "Solusi relaksasi setelah sepekan bekerja keras. Mencakup pencucian rambut mendalam untuk mengangkat minyak berlebih dan ketombe, pijatan akupresur di titik kepala dan leher belakang selama 20 menit, serta pengaplikasian tonik penyubur rambut dingin.",
  },
  {
    id: "srv-06",
    code: "SRV-06",
    name: "Black Hair Color Revival",
    category: "treatment",
    durationMinutes: 45,
    price: 65000,
    dpAmount: 20000,
    badgeLabel: "Pewarnaan Uban Alami",
    description:
      "Mengembalikan warna hitam alami rambut Anda dengan formula bebas amonia yang tidak berbau menyengat. Menutup uban secara merata dalam waktu singkat tanpa merusak kilau alami helai rambut.",
  },
  {
    id: "srv-07",
    code: "SRV-07",
    name: "Express Clean Cut & Quick Wash",
    category: "haircut",
    durationMinutes: 30,
    price: 40000,
    dpAmount: 20000,
    badgeLabel: "Cepat & Rapi",
    description:
      "Pilihan tepat bagi Anda yang memiliki jadwal padat di jam istirahat kantor. Potongan fokus pada perapian bagian samping dan belakang kepala, dilanjutkan satu kali keramas cepat agar Anda kembali ke kantor dalam kondisi segar dan bebas potongan rambut rontok.",
  },
  {
    id: "srv-08",
    code: "SRV-08",
    name: "Damez Signature Executive Combo",
    category: "combo",
    durationMinutes: 60,
    price: 95000,
    dpAmount: 20000,
    badgeLabel: "Nilai Terbaik",
    isPopular: true,
    description:
      "Paket perawatan lengkap untuk pria yang menginginkan kesegaran menyeluruh. Menggabungkan Gentlemen Classic Haircut, pencukuran kumis jenggot dengan handuk hangat, pemijatan kepala relaksasi panjang, serta tonik rambut dan penataan gaya menggunakan produk terbaik kami.",
  },
];

const CATEGORIES = [
  { key: "all", label: "Semua Layanan" },
  { key: "haircut", label: "Haircut" },
  { key: "grooming", label: "Shave & Grooming" },
  { key: "treatment", label: "Treatment" },
  { key: "combo", label: "Signature Combo" },
];

export function ServicesGrid() {
  const [activeCategory, setActiveCategory] = React.useState<string>("all");

  const filteredServices = React.useMemo(() => {
    if (activeCategory === "all") return SERVICES_DATA;
    return SERVICES_DATA.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  return (
    <section id="layanan" className="py-16 md:py-24 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-10">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">
            Katalog Resmi & Transparan
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Paket Layanan & Tarif
          </h2>
          <p className="max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Delapan paket layanan teruji yang disesuaikan dengan kebutuhan pria modern. Seluruh harga tercantum dalam Rupiah dan sudah termasuk pajak.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-4 mb-10 gap-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer min-h-[44px]",
                activeCategory === cat.key
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "bg-surface border border-border text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services Grid (8 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const remainingBalance = service.price - service.dpAmount;

            return (
              <Card
                key={service.id}
                hoverEffect
                activeGlow={service.isPopular}
                className={cn(
                  "flex flex-col justify-between relative",
                  service.isPopular && "border-primary/50"
                )}
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between p-6 pb-2">
                  <Badge
                    variant={service.isPopular ? "primary" : "secondary"}
                    className="text-[11px]"
                  >
                    {service.badgeLabel}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-surface-elevated px-2.5 py-1 rounded-md border border-border/60">
                    <Clock className="size-3.5 text-primary" />
                    <span>{service.durationMinutes} Menit</span>
                  </div>
                </div>

                {/* Card Main Info */}
                <CardHeader className="pt-2">
                  <CardTitle className="text-lg sm:text-xl line-clamp-1">
                    {service.name}
                  </CardTitle>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold text-foreground">
                      Rp {service.price.toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs text-muted-foreground">/ sesi</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>

                  {/* DP Breakdown Clarification */}
                  <div className="mt-4 rounded-xl bg-surface-elevated border border-border/80 p-3 text-xs flex flex-col gap-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Komitmen DP Booking:</span>
                      <span className="font-mono font-bold text-primary">
                        Rp {service.dpAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Sisa dibayar di kasir:</span>
                      <span className="font-mono text-foreground font-semibold">
                        Rp {remainingBalance.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </CardContent>

                {/* Card Action */}
                <CardFooter className="pt-2 border-t border-border/40 mt-auto">
                  <a
                    href={`/book?service=${service.code}`}
                    className="w-full"
                  >
                    <Button
                      variant={service.isPopular ? "primary" : "outline"}
                      size="default"
                      className="w-full justify-between"
                    >
                      <span>Pilih Layanan Ini</span>
                      <ArrowRight className="size-4" />
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Global Transparency Note */}
        <div className="mt-10 rounded-2xl border border-border bg-surface p-5 text-center text-xs sm:text-sm text-muted-foreground">
          <p>
            Semua paket layanan sudah mencakup konsultasi bentuk wajah, keramas bersih dua kali, usapan handuk penyegar, pemijatan rileks, dan penataan rambut dengan produk premium.
          </p>
        </div>
      </div>
    </section>
  );
}
