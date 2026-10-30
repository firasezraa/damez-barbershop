"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type MegaMenuItem = {
  title: string;
  desc: string;
  href: string;
  tag?: string;
  image?: string;
};

export type NavCategory = {
  id: string;
  label: string;
  eyebrow: string;
  description: string;
  items: MegaMenuItem[];
  featuredLinks?: { label: string; href: string }[];
  policyLinks?: { label: string; href: string }[];
};

export const NAVIGATION_DATA: NavCategory[] = [
  {
    id: "layanan",
    label: "Layanan",
    eyebrow: "Katalog & Menu Perawatan",
    description: "Delapan paket pangkas presisi dan perawatan relaksasi pria modern.",
    items: [
      {
        title: "Gentlemen Classic Haircut",
        desc: "Potongan formal presisi tinggi, konsultasi anatomis, cuci rambut & styling.",
        href: "/layanan#classic-cut",
        tag: "45 Menit · Rp 50.000",
      },
      {
        title: "Premium Fade & Taper Cut",
        desc: "Gradasi kulit halus nol milimeter, outline tajam, dan tekstur mahkota.",
        href: "/layanan#premium-fade",
        tag: "50 Menit · Rp 65.000",
      },
      {
        title: "Beard Sculpting & Hot Towel",
        desc: "Cukur silet higienis sekali pakai, kompres handuk hangat & minyak aromaterapi.",
        href: "/layanan#beard-shave",
        tag: "35 Menit · Rp 45.000",
      },
      {
        title: "The Damez Signature Combo",
        desc: "Paket eksekutif komprehensif: haircut, beard sculpting, dan terapi pijat kepala.",
        href: "/layanan#signature-combo",
        tag: "60 Menit · Rp 95.000",
      },
    ],
    featuredLinks: [
      { label: "Lihat Semua 8 Layanan Lengkap", href: "/layanan" },
      { label: "Buku Panduan Potongan Rambut", href: "/kisah-kami#craftsmanship" },
    ],
    policyLinks: [
      { label: "DP Flat Rp 20.000 (Dipotong di Kasir)", href: "/#papan-jadwal" },
      { label: "Ketentuan Toleransi 15 Menit", href: "/#faq" },
    ],
  },
  {
    id: "barber",
    label: "Master Barber",
    eyebrow: "Keahlian Tiga Sosok Pengrajin",
    description: "Tiga master barber berpengalaman di setiap kursi pangkas Damez.",
    items: [
      {
        title: "Kursi 1 — Rian Pratama",
        desc: "Senior Master Barber. Spesialis potongan klasik formal, scissor-over-comb & belah samping.",
        href: "/barber#rian-pratama",
        tag: "The Sculptor",
      },
      {
        title: "Kursi 2 — Dimas Arisandi",
        desc: "Clipper & Fade Specialist. Pakar gradasi skin fade halus, crop cut & garis tepi tajam.",
        href: "/barber#dimas-arisandi",
        tag: "Fade Master",
      },
      {
        title: "Kursi 3 — Kevin Sanjaya",
        desc: "Master of Shave & Scalp Therapy. Spesialis cukur silet tradisional & terapi pijat kepala.",
        href: "/barber#kevin-sanjaya",
        tag: "Grooming Specialist",
      },
      {
        title: "Pilih Barber di Papan Real-time",
        desc: "Lihat slot kursi masing-masing barber yang masih terbuka hari ini dan kunci jadwal.",
        href: "/#papan-jadwal",
        tag: "Jadwal Live",
      },
    ],
    featuredLinks: [
      { label: "Profil Lengkap & Filosofi Tim Barber", href: "/barber" },
      { label: "Standar Kebersihan Alat 4 Tahap", href: "/kebersihan" },
    ],
    policyLinks: [
      { label: "Konsultasi Quiet Cut Tersedia", href: "/kisah-kami#ruang-tenang" },
      { label: "Garansi DP 100% Jika Barber Berhalangan", href: "/#faq" },
    ],
  },
  {
    id: "kisah",
    label: "Kisah Kami",
    eyebrow: "Filosofi & Ruang Tenang",
    description: "Menghadirkan kembali kehormatan waktu pria di tengah kesibukan Jakarta Selatan.",
    items: [
      {
        title: "Seni Pangkas Anatomis",
        desc: "Memadukan ketelitian gunting baja Jepang dengan geometri kontur kepala yang presisi.",
        href: "/kisah-kami#craftsmanship",
        tag: "Filosofi Pangkas",
      },
      {
        title: "Kenyamanan Ruang Tenang",
        desc: "Aroma cedarwood, alunan musik lo-fi jazzy, dan opsi Quiet Cut untuk istirahat optimal.",
        href: "/kisah-kami#ruang-tenang",
        tag: "Ambience Gerai",
      },
      {
        title: "Protokol Higienis & Sanitasi",
        desc: "Pisau silet sekali pakai, sterilisasi UV-C alat, dan jeda sanitasi 10 menit antar tamu.",
        href: "/kebersihan",
        tag: "Standar Medis",
      },
      {
        title: "Kemitraan Komunitas & Lokasi",
        desc: "Berakar di Jakarta Selatan, melayani pria urban yang menghargai ketelitian dan waktu.",
        href: "/kisah-kami#lokasi",
        tag: "Gerai Jakarta",
      },
    ],
    featuredLinks: [
      { label: "Baca Seluruh Narasi Brand Damez", href: "/kisah-kami" },
      { label: "Protokol Sterilisasi Peralatan", href: "/kebersihan" },
    ],
    policyLinks: [
      { label: "Kebijakan Privasi Data Tamu", href: "/kebijakan-privasi" },
      { label: "Syarat & Ketentuan Booking", href: "/#faq" },
    ],
  },
  {
    id: "kebersihan",
    label: "Higienis",
    eyebrow: "Dedikasi Kebersihan & Keamanan",
    description: "Standar sanitasi empat tahap ketat yang dijalankan pada setiap tamu.",
    items: [
      {
        title: "1. Pisau Silet Sekali Pakai",
        desc: "Mata pisau silet baru dibuka di depan tamu dan langsung dibuang ke wadah medis.",
        href: "/kebersihan#silet",
        tag: "100% Single-use",
      },
      {
        title: "2. Sterilisasi Ganda UV-C",
        desc: "Peralatan gunting dan clipper direndam antiseptik dan disterilkan di kabinet UV-C.",
        href: "/kebersihan#sterilisasi",
        tag: "Hospital Standard",
      },
      {
        title: "3. Kertas Leher Higienis",
        desc: "Disposable neck paper elastis mencegah kontak langsung kain penutup dengan kulit leher.",
        href: "/kebersihan#neck-paper",
        tag: "Anti Iritasi",
      },
      {
        title: "4. Handuk Hangat Aromaterapi",
        desc: "Dicuci suhu tinggi uap panas dan detergen antibakteri dengan minyak lemon & kayu putih.",
        href: "/kebersihan#handuk",
        tag: "Steamed Fresh",
      },
    ],
    featuredLinks: [
      { label: "Lihat Dokumentasi Lengkap Protokol", href: "/kebersihan" },
      { label: "Jeda Sanitasi 10 Menit di Sistem", href: "/#papan-jadwal" },
    ],
    policyLinks: [
      { label: "Jaminan Kursi Bersih & Siap", href: "/kebersihan#standar" },
      { label: "Pelaporan Kebersihan Meja Kasir", href: "/admin/login" },
    ],
  },
];

export function Navigation11() {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close mega menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveTab(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeCategory = NAVIGATION_DATA.find((c) => c.id === activeTab);

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-3 pb-2 transition-all">
      <div ref={navRef} className="mx-auto max-w-6xl">
        {/* Dark Top Nav Capsule (Pill Shape) */}
        <nav
          aria-label="Navigasi Utama Damez"
          className="relative flex h-14 w-full items-center justify-between rounded-full border border-line-2 bg-surface px-4 py-2 shadow-2xl backdrop-blur-md transition-all lg:px-6"
        >
          {/* Sisi Kiri: Menu Tabs Desktop */}
          <div className="hidden items-center gap-1 lg:flex">
            {NAVIGATION_DATA.map((tab) => {
              const isOpen = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(isOpen ? null : tab.id)}
                  aria-expanded={isOpen}
                  className={`rounded-full px-3.5 py-1.5 font-display text-xs font-semibold tracking-wide transition-all ${
                    isOpen
                      ? "bg-brass text-ink"
                      : "text-muted hover:bg-surface-2 hover:text-text"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1 inline-block text-[10px] transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▾
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tengah: Brand Name / Logo & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Buka menu navigasi"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex size-8 items-center justify-center rounded-full border border-line bg-surface-2 text-text transition-colors hover:border-brass lg:hidden"
            >
              {mobileOpen ? "✕" : "☰"}
            </button>

            <Link
              href="/"
              onClick={() => setActiveTab(null)}
              className="flex items-baseline gap-1.5 font-display text-base font-extrabold tracking-tight text-text hover:text-brass"
            >
              <span>DAMEZ</span>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-brass">
                Barbershop
              </span>
            </Link>
          </div>

          {/* Sisi Kanan: Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="hidden font-mono text-xs text-muted transition-colors hover:text-text sm:inline-block"
            >
              Portal Staf
            </Link>

            <Link
              href="/booking"
              onClick={() => setActiveTab(null)}
              className="inline-flex h-9 items-center justify-center rounded-full bg-brass px-4 font-display text-xs font-bold text-ink shadow transition-transform hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]"
            >
              Kunci Kursi
            </Link>
          </div>
        </nav>

        {/* Expanded White Mega-Menu Grid (React Bits Pro Navigation-11 Structure) */}
        {activeCategory ? (
          <div
            id="mega-menu-panel"
            className="mt-2 w-full overflow-hidden rounded-[4px] border border-stone-300 bg-[#FAF8F5] p-6 text-[#1A1816] shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex flex-col gap-6">
              {/* Header Mega Menu */}
              <div className="flex flex-wrap items-baseline justify-between border-b border-stone-200 pb-3">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#8C6D23]">
                    {activeCategory.eyebrow}
                  </span>
                  <span className="font-display text-lg font-bold text-[#141210]">
                    {activeCategory.label}
                  </span>
                </div>
                <p className="max-w-md font-mono text-xs text-stone-600">
                  {activeCategory.description}
                </p>
              </div>

              {/* Grid 4 Kartu Konten Utama */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {activeCategory.items.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setActiveTab(null)}
                    className="group flex flex-col justify-between rounded-[3px] border border-stone-200 bg-white p-4 transition-all hover:border-[#C8A24A] hover:shadow-md"
                  >
                    <div className="flex flex-col gap-1.5">
                      {item.tag ? (
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#8C6D23]">
                          {item.tag}
                        </span>
                      ) : null}
                      <span className="font-display text-sm font-bold text-[#141210] group-hover:text-[#8C6D23]">
                        {item.title}
                      </span>
                      <p className="text-xs leading-relaxed text-stone-600">{item.desc}</p>
                    </div>

                    <div className="mt-4 flex items-center gap-1 font-mono text-[11px] font-semibold text-[#8C6D23] transition-transform group-hover:translate-x-0.5">
                      <span>Buka detail</span>
                      <span>→</span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Sub-footer Mega Menu: Links & Policies */}
              <div className="flex flex-col justify-between gap-4 border-t border-stone-200 pt-4 font-mono text-xs text-stone-600 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-4">
                  {activeCategory.featuredLinks?.map((fl) => (
                    <Link
                      key={fl.label}
                      href={fl.href}
                      onClick={() => setActiveTab(null)}
                      className="font-semibold text-[#141210] hover:text-[#8C6D23] hover:underline"
                    >
                      {fl.label} ↗
                    </Link>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-500">
                  {activeCategory.policyLinks?.map((pl) => (
                    <Link
                      key={pl.label}
                      href={pl.href}
                      onClick={() => setActiveTab(null)}
                      className="hover:text-stone-800"
                    >
                      {pl.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Mobile Nav Accordion Menu */}
        {mobileOpen ? (
          <div className="mt-2 flex w-full flex-col gap-3 rounded-[3px] border border-line bg-surface p-4 shadow-xl lg:hidden">
            {NAVIGATION_DATA.map((cat) => (
              <div key={cat.id} className="flex flex-col border-b border-line-2 pb-2">
                <span className="font-display text-xs font-bold uppercase text-brass">
                  {cat.label}
                </span>
                <div className="mt-1 flex flex-col gap-1 pl-2">
                  {cat.items.map((it) => (
                    <Link
                      key={it.title}
                      href={it.href}
                      onClick={() => setMobileOpen(false)}
                      className="py-1 text-xs text-muted hover:text-text"
                    >
                      {it.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-line-2">
              <Link
                href="/admin/login"
                onClick={() => setMobileOpen(false)}
                className="font-mono text-xs text-muted hover:text-text"
              >
                Portal Staf Gerai →
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
