"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Scissors, Sparkles } from "lucide-react";
import { formatRupiah, type PublicService } from "@/features/catalogue/types";

interface ServicesCatalogSectionProps {
  services: PublicService[];
}

export function ServicesCatalogSection({ services }: ServicesCatalogSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const headingId = useId();

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => set.add(s.category));
    return ["all", ...Array.from(set)];
  }, [services]);

  // Filter services by category
  const filteredServices = useMemo(() => {
    if (selectedCategory === "all") return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  return (
    <section
      id="layanan"
      aria-labelledby={headingId}
      className="border-b border-line px-6 py-16 lg:px-16 lg:py-24 scroll-mt-28"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header Bar */}
        <div className="flex flex-col border-b border-line pb-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brass font-mono">
              <Scissors className="h-4 w-4" />
              <span>Katalog Layanan & Tarif</span>
            </div>
            <h2
              id={headingId}
              className="mt-3 font-display text-3xl font-extrabold text-text sm:text-4xl"
            >
              Perawatan Rambut & Wajah Pria
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-muted leading-relaxed">
              Pangkas presisi anatomis, gradasi fade halus, cukur jenggot handuk hangat, dan terapi kepala.
              Durasi waktu dan harga pasti tanpa biaya tersembunyi.
            </p>
          </div>

          {/* Category Filter Pills (Placed cleanly underneath the text) */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              const count =
                cat === "all"
                  ? services.length
                  : services.filter((s) => s.category === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 font-display text-xs font-semibold capitalize transition-all ${
                    isActive
                      ? "bg-brass text-ink shadow-sm"
                      : "border border-line bg-surface text-muted hover:border-line-2 hover:text-text"
                  }`}
                >
                  <span>{cat === "all" ? "Semua Layanan" : cat}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                      isActive
                        ? "bg-ink/20 text-ink font-bold"
                        : "bg-surface-2 text-ghost"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Services Cards Grid */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`group flex flex-col justify-between rounded-xl border bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brass/60 hover:shadow-lg ${
                service.recommended
                  ? "border-brass/40 shadow-[0_0_20px_rgba(200,162,74,0.06)]"
                  : "border-line"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted">
                    {service.category}
                  </span>
                  {service.recommended ? (
                    <span className="flex items-center gap-1 rounded-full bg-brass/15 px-2.5 py-0.5 text-[10px] font-bold text-brass border border-brass/30">
                      <Sparkles className="h-2.5 w-2.5" />
                      Favorit
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-3.5 font-display text-base font-bold text-text group-hover:text-brass transition-colors">
                  {service.name}
                </h3>

                <div className="mt-2 flex items-center gap-1.5 font-mono text-xs text-muted">
                  <Clock className="h-3.5 w-3.5 text-ghost" />
                  <span>{service.durationMinutes} menit pengerjaan</span>
                </div>

                {service.description ? (
                  <p className="mt-2.5 text-xs text-muted leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                ) : null}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                <div>
                  <span className="font-mono text-[10px] uppercase text-ghost">Tarif Gerai</span>
                  <p className="font-mono text-base font-bold text-brass">
                    {formatRupiah(service.priceIdr)}
                  </p>
                </div>

                <Link
                  href={`/booking?service=${service.id}`}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-brass/40 bg-brass/10 px-3 text-xs font-semibold text-brass hover:bg-brass hover:text-ink transition-all"
                >
                  <span>Pilih</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
