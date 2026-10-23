import type { BookingService, BookingBarber } from "./types.ts";

export const FLAT_DOWN_PAYMENT_IDR = 20000;
export const SANITATION_BUFFER_MINUTES = 10;
export const MAX_SERVICES_SELECTABLE = 2;
export const ANY_BARBER_ID = "any";

export const SHOP_METADATA = {
  brand: "Damez Barbershop",
  location: "Jl. Senopati Raya No. 42, Kebayoran Baru, Jakarta Selatan 12190",
  timezone: "Asia/Jakarta (WIB / UTC+07:00)",
  officialPhone: "+62 812-3456-7890",
  officialPhoneDigits: "6281234567890",
  googleMapsUrl: "https://maps.app.goo.gl/damezsenopati",
  siteUrl: "https://damezbarber.com",
} as const;

export const BOOKING_SERVICES: BookingService[] = [
  {
    id: "a0000001-0000-0000-0000-000000000001",
    code: "SRV-01",
    name: "Gentlemen Classic Haircut",
    category: "haircut",
    durationMinutes: 45,
    price: 50000,
    dpAmount: 20000,
    badgeLabel: "Paling Populer",
    isPopular: true,
    description:
      "Potongan rambut pria klasik disesuaikan dengan proporsi wajah. Termasuk cuci rambut 2x, handuk hangat, pijat bahu, dan pomade.",
  },
  {
    id: "a0000001-0000-0000-0000-000000000002",
    code: "SRV-02",
    name: "Premium Fade & Taper Cut",
    category: "haircut",
    durationMinutes: 50,
    price: 65000,
    dpAmount: 20000,
    badgeLabel: "Spesialis Fade",
    description:
      "Gradasi rambut tingkat tinggi dengan teknik zero fade, skin fade, atau taper clean cut. Garis tepi presisi tajam.",
  },
  {
    id: "a0000001-0000-0000-0000-000000000003",
    code: "SRV-03",
    name: "Junior Gentleman Cut",
    category: "haircut",
    durationMinutes: 35,
    price: 40000,
    dpAmount: 20000,
    badgeLabel: "Ramah Anak",
    description:
      "Layanan pangkas rambut anak dan remaja usia 3 sampai 12 tahun dengan pendekatan sabar, ramah, dan cekatan.",
  },
  {
    id: "a0000001-0000-0000-0000-000000000004",
    code: "SRV-04",
    name: "Classic Beard Sculpt & Hot Towel Shave",
    category: "grooming",
    durationMinutes: 35,
    price: 45000,
    dpAmount: 20000,
    badgeLabel: "Grooming Jenggot",
    description:
      "Perapian jenggot dan kumis presisi, kompres handuk hangat aromaterapi herbal, cukur silet higienis sekali pakai.",
  },
  {
    id: "a0000001-0000-0000-0000-000000000005",
    code: "SRV-05",
    name: "Beard Sculpting & Detailing",
    category: "grooming",
    durationMinutes: 25,
    price: 30000,
    dpAmount: 20000,
    badgeLabel: "Detailing",
    description:
      "Perapian kontur jenggot cepat dengan trimmer detail dan finishing aftershave soothing balm.",
  },
  {
    id: "a0000001-0000-0000-0000-000000000006",
    code: "SRV-06",
    name: "Scalp Therapy Treatment",
    category: "treatment",
    durationMinutes: 40,
    price: 60000,
    dpAmount: 20000,
    badgeLabel: "Perawatan Kulit Kepala",
    description:
      "Perawatan khusus ketombe, pembersihan residu minyak rambut berlebih, dan relaksasi pijat titik akupresur kepala.",
  },
  {
    id: "a0000001-0000-0000-0000-000000000007",
    code: "SRV-07",
    name: "Quick Express Clean Cut",
    category: "haircut",
    durationMinutes: 30,
    price: 35000,
    dpAmount: 20000,
    badgeLabel: "Cepat & Rapi",
    description:
      "Pilihan tepat untuk jadwal padat. Perapian bagian samping dan belakang tanpa mengurangi kualitas ketajaman garis.",
  },
  {
    id: "a0000001-0000-0000-0000-000000000008",
    code: "SRV-08",
    name: "Damez Signature Full Grooming Combo",
    category: "combo",
    durationMinutes: 60,
    price: 95000,
    dpAmount: 20000,
    badgeLabel: "Paket Kombo Terlengkap",
    description:
      "Kombinasi lengkap Gentlemen Haircut, Beard Sculpting, Hot Towel, dan Scalp Massage dalam satu sesi menyeluruh.",
  },
];

export const BOOKING_BARBERS: BookingBarber[] = [
  {
    id: "b0000001-0000-0000-0000-000000000001",
    code: "BBR-01",
    name: "Rian Pratama",
    nickname: "The Sculptor",
    title: "Senior Master Barber",
    chairNumber: 1,
    regularDayOff: 0, // Minggu
    dayOffName: "Minggu",
    specialty: "Classic Cuts, Pompadour, dan Scissor-over-comb",
    description:
      "Spesialis dalam model rambut formal belah samping klasik, slick back, dan guntingan tekstur presisi tinggi.",
    avatarUrl: "/images/barbers/rian-pratama.webp",
  },
  {
    id: "b0000001-0000-0000-0000-000000000002",
    code: "BBR-02",
    name: "Dimas Arisandi",
    nickname: "The Fade Master",
    title: "Clipper & Fade Specialist",
    chairNumber: 2,
    regularDayOff: 1, // Senin
    dayOffName: "Senin",
    specialty: "Low/Mid/High Skin Fade, Taper Cut, dan Sharp Line-up",
    description:
      "Pakar gradasi kulit halus (skin fade), crop cut kontemporer, dan aksen garis tepi rambut presisi tajam.",
    avatarUrl: "/images/barbers/dimas-arisandi.webp",
  },
  {
    id: "b0000001-0000-0000-0000-000000000003",
    code: "BBR-03",
    name: "Kevin Sanjaya",
    nickname: "The Classic Gentleman",
    title: "Master of Shave & Scalp Therapy",
    chairNumber: 3,
    regularDayOff: 2, // Selasa
    dayOffName: "Selasa",
    specialty: "Traditional Hot Towel Shave, Beard Trim, dan Pijat Relaksasi",
    description:
      "Spesialis cukur silet higienis tradisional, handuk hangat aromaterapi, dan terapi pijat relaksasi kepala.",
    avatarUrl: "/images/barbers/kevin-sanjaya.webp",
  },
];

export const STEP_METADATA = [
  { step: 1, label: "Layanan", shortDesc: "Pilih Layanan" },
  { step: 2, label: "Barber", shortDesc: "Pilih Master Barber" },
  { step: 3, label: "Jadwal", shortDesc: "Tanggal & Jam" },
  { step: 4, label: "Kontak", shortDesc: "Data Diri" },
  { step: 5, label: "Ringkasan", shortDesc: "Konfirmasi & Kunci" },
] as const;
