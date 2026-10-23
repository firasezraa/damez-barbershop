"use client";

import * as React from "react";
import { Camera, Sparkles, Eye, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface GalleryItem {
  id: number;
  title: string;
  tag: string;
  description: string;
  aspect: string;
  accentColor: string;
}

export const GALLERY_DATA: GalleryItem[] = [
  {
    id: 1,
    title: "Suasana Kursi Vintage dan Ruang Tunggu Nyaman",
    tag: "Interior & Studio",
    description:
      "Kursi pangkas berbalut kulit cokelat dengan cermin berbingkai kayu jati, berpadu dengan udara sejuk berpendingin ruangan.",
    aspect: "aspect-[16/9] sm:aspect-[4/3]",
    accentColor: "from-amber-900/40 via-surface to-surface-elevated",
  },
  {
    id: 2,
    title: "Hasil Potongan Classic Sidepart Belah Samping",
    tag: "Karya Master Barber",
    description:
      "Tekstur rambut tertata simetris dengan garis belahan bersih yang mudah dirapikan kembali menggunakan sisir saku.",
    aspect: "aspect-[4/3]",
    accentColor: "from-stone-900/60 via-surface to-surface-elevated",
  },
  {
    id: 3,
    title: "Gradasi Halus Low Skin Fade",
    tag: "Presisi Fade",
    description:
      "Peralihan warna rambut yang rapi dari dasar leher hingga puncak mahkota kepala, bersih dan simetris di kedua sisi.",
    aspect: "aspect-[4/3]",
    accentColor: "from-amber-950/50 via-surface to-surface-elevated",
  },
  {
    id: 4,
    title: "Cukur Jenggot dengan Kompres Handuk Hangat",
    tag: "Royal Grooming",
    description:
      "Perlakuan tradisional untuk membuka pori-pori dan melunakkan helai jenggot sebelum sentuhan razor baru.",
    aspect: "aspect-[4/3]",
    accentColor: "from-secondary/30 via-surface to-surface-elevated",
  },
  {
    id: 5,
    title: "Lemari Sterilisasi Alat Sinar UV",
    tag: "Higienitas Mandatori",
    description:
      "Seluruh gunting, clipper guards, dan sisir tersusun rapi di dalam kotak sterilisasi yang aktif bekerja di sela setiap sesi pangkas.",
    aspect: "aspect-[4/3]",
    accentColor: "from-emerald-950/40 via-surface to-surface-elevated",
  },
  {
    id: 6,
    title: "Potongan Modern Textured Crop",
    tag: "Tren Kontemporer",
    description:
      "Gaya kasual pria urban dengan poni bertekstur alami, ringan dirawat tanpa memerlukan pomade tebal.",
    aspect: "aspect-[16/9] sm:aspect-[4/3]",
    accentColor: "from-amber-900/40 via-surface to-surface-elevated",
  },
];

export function GallerySection() {
  const [selectedItem, setSelectedItem] = React.useState<GalleryItem | null>(null);

  return (
    <section id="galeri" className="py-16 md:py-24 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-12 sm:mb-16">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">
            Portofolio & Suasana
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Galeri Portofolio & Suasana Toko
          </h2>
          <p className="max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Enam sudut visual yang mencerminkan mutu hasil kerja dan kenyamanan ruang kami di Senopati.
          </p>
        </div>

        {/* Gallery Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY_DATA.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface shadow-md transition-all duration-300 hover:border-primary/60 hover:shadow-xl hover:shadow-black/50"
            >
              {/* Aspect Ratio Box with Textured Graphic Canvas */}
              <div
                className={cn(
                  "relative w-full overflow-hidden bg-gradient-to-br transition-transform duration-500 group-hover:scale-105",
                  item.aspect,
                  item.accentColor
                )}
              >
                {/* Visual Pattern & Watermark Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-15 transition-opacity duration-300 group-hover:opacity-25">
                  <Camera className="size-24 text-primary" />
                </div>

                {/* Ambient Top Tag */}
                <div className="absolute top-4 left-4 z-10">
                  <Badge variant="primary" className="text-[11px] shadow-sm">
                    {item.tag}
                  </Badge>
                </div>

                {/* Hover Eye Trigger */}
                <div className="absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full bg-surface/80 text-foreground opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                  <Eye className="size-4 text-primary" />
                </div>

                {/* Bottom Overlay Gradient */}
                <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-background via-background/80 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col gap-1.5 z-10">
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md transition-opacity"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative max-w-xl w-full rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-xl border border-border bg-surface-elevated text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Tutup Dialog"
            >
              <X className="size-5" />
            </button>

            <Badge variant="primary" className="mb-3">
              {selectedItem.tag}
            </Badge>

            <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">
              {selectedItem.title}
            </h3>

            <div className="my-4 h-48 w-full rounded-xl bg-gradient-to-br from-amber-950/40 via-surface-elevated to-surface flex items-center justify-center border border-border">
              <Camera className="size-16 text-primary/40" />
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {selectedItem.description}
            </p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-xl border border-border bg-surface-elevated px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-surface cursor-pointer"
              >
                Tutup Tampilan
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
