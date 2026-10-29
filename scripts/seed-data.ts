/**
 * Data katalog Damez. Nama, harga, dan durasi layanan disalin apa adanya dari
 * katalog v1 yang sudah disetujui owner
 * (docs/reference/v1/market-services-benchmark.md) — jangan menciptakan harga
 * baru di sini.
 */

export const OPEN_TIME = "10:00:00";
export const CLOSE_TIME = "21:00:00";

export type ServiceSeed = {
  code: string;
  name: string;
  slug: string;
  category: string;
  durationMinutes: number;
  priceIdr: number;
  description: string;
  recommended: boolean;
  order: number;
};

export const SERVICES: ServiceSeed[] = [
  {
    code: "SRV-01",
    name: "Gentlemen Classic Haircut",
    slug: "gentlemen-classic-haircut",
    category: "Core Haircut",
    durationMinutes: 45,
    priceIdr: 50000,
    description:
      "Konsultasi gaya rambut, potong rambut presisi, cuci rambut segar, pijat bahu relaksasi, dan styling pomade.",
    recommended: true,
    order: 1,
  },
  {
    code: "SRV-02",
    name: "Premium Fade & Taper Cut",
    slug: "premium-fade-taper-cut",
    category: "Core Haircut",
    durationMinutes: 50,
    priceIdr: 65000,
    description:
      "Potongan gradasi kulit halus (Skin Fade, Drop Fade, Taper) dengan razor detailing, cuci rambut, dan premium styling.",
    recommended: true,
    order: 2,
  },
  {
    code: "SRV-03",
    name: "Junior / Kids Haircut",
    slug: "junior-kids-haircut",
    category: "Special Haircut",
    durationMinutes: 35,
    priceIdr: 40000,
    description:
      "Potongan rambut anak (usia di bawah 12 tahun) dengan penanganan sabar, ramah, dan pembersihan spons lembut.",
    recommended: false,
    order: 3,
  },
  {
    code: "SRV-04",
    name: "Beard Sculpting & Hot Towel Shave",
    slug: "beard-sculpting-hot-towel-shave",
    category: "Grooming",
    durationMinutes: 35,
    priceIdr: 45000,
    description:
      "Perapian jenggot simetris, kompres handuk hangat beraroma minyak esensial, cukur silet steril, dan aftershave calming balm.",
    recommended: false,
    order: 4,
  },
  {
    code: "SRV-05",
    name: "Relaxing Hair Spa & Anti-Dandruff Scalp Treatment",
    slug: "relaxing-hair-spa-anti-dandruff",
    category: "Treatment",
    durationMinutes: 40,
    priceIdr: 55000,
    description:
      "Eksfoliasi scrub kulit kepala anti-ketombe, krim creambath sensasi mint, pijat akupresur kepala & bahu 20 menit.",
    recommended: false,
    order: 5,
  },
  {
    code: "SRV-06",
    name: "Black Hair Color Revival",
    slug: "black-hair-color-revival",
    category: "Coloring",
    durationMinutes: 45,
    priceIdr: 65000,
    description:
      "Penutupan uban atau penyegaran warna hitam alami menggunakan formula aman tanpa bau amonia menyengat.",
    recommended: false,
    order: 6,
  },
  {
    code: "SRV-07",
    name: "Express Clean Cut & Wash",
    slug: "express-clean-cut-wash",
    category: "Quick Grooming",
    durationMinutes: 30,
    priceIdr: 40000,
    description:
      "Potong perapian bagian samping dan belakang secara cepat untuk kebutuhan mendesak, dilanjutkan keramas bilas.",
    recommended: false,
    order: 7,
  },
  {
    code: "SRV-08",
    name: "The Damez Signature Executive Combo",
    slug: "the-damez-signature-executive-combo",
    category: "Bundled Combo",
    durationMinutes: 60,
    priceIdr: 95000,
    description:
      "Paket komplit: Premium Fade Haircut + Beard Sculpting + Hot Towel Shave + Deep Head & Shoulder Massage + Cold Drink Compliment.",
    recommended: true,
    order: 8,
  },
];

export type BarberSeed = {
  code: string;
  fullName: string;
  nickname: string;
  title: string;
  chair: number;
  experienceYears: number;
  specialty: string;
  bio: string;
  dayOff: number;
};

export const BARBERS: BarberSeed[] = [
  {
    code: "BBR-01",
    fullName: "Rian Pratama",
    nickname: "The Sculptor",
    title: "Senior Master Barber",
    chair: 1,
    experienceYears: 6,
    specialty: "Classic Cuts & Pompadour",
    bio: "Spesialis dalam model rambut formal belah samping klasik, slick back, dan scissor-work presisi tinggi.",
    dayOff: 0,
  },
  {
    code: "BBR-02",
    fullName: "Dimas Arisandi",
    nickname: "Fade Master",
    title: "Clipper & Fade Specialist",
    chair: 2,
    experienceYears: 5,
    specialty: "High/Low/Skin Fade & Textured Cut",
    bio: "Pakar gradasi kulit halus (skin fade), crop cut kontemporer, dan aksen garis rambut artistik.",
    dayOff: 1,
  },
  {
    code: "BBR-03",
    fullName: "Kevin Sanjaya",
    nickname: "Grooming Specialist",
    title: "Master of Shave & Scalp Therapy",
    chair: 3,
    experienceYears: 7,
    specialty: "Beard Sculpting & Scalp Therapy",
    bio: "Spesialis cukur silet higienis tradisional, handuk hangat aromaterapi, dan terapi pijat kepala.",
    dayOff: 2,
  },
];

/**
 * Istirahat bergilir: satu kursi libur per jam, jadi tidak pernah tiga kursi
 * kosong bersamaan. Jam berbeda per kursi (staggered) — sama seperti aturan v1.
 */
export const BREAKS: { startTime: string; endTime: string }[] = [
  { startTime: "12:00:00", endTime: "12:55:00" },
  { startTime: "18:00:00", endTime: "18:55:00" },
];

/** Kursi 2 mulai sejam setelah kursi 1, dst. */
export const BREAK_OFFSET_HOURS = 1;

export const SETTINGS: { key: string; value: unknown; description: string }[] = [
  { key: "dp_idr", value: 20000, description: "DP flat per booking (Rp), dipotong saat pelunasan" },
  { key: "hold_ttl_seconds", value: 900, description: "Masa hidup hold slot sebelum auto-expire" },
  { key: "cancel_cutoff_hours", value: 3, description: "Batas batal/reschedule sebelum jadwal" },
  { key: "late_tolerance_minutes", value: 15, description: "Toleransi keterlambatan sebelum no_show" },
  { key: "timezone", value: "Asia/Jakarta", description: "Zona waktu operasional tunggal" },
  { key: "chair_count", value: 3, description: "Jumlah kursi aktif" },
  { key: "opening_hour", value: 10, description: "Jam buka gerai (WIB)" },
  { key: "closing_hour", value: 21, description: "Jam tutup gerai (WIB)" },
];
