import { pathToFileURL } from "node:url";
import type { Pool } from "pg";
import { createPgPool } from "../src/lib/db/pg.ts";

/**
 * Data katalog Damez. Nama, harga, dan durasi layanan disalin apa adanya dari
 * katalog v1 yang sudah disetujui owner (docs/research/market-services-benchmark.md
 * pada repo v1) — jangan menciptakan harga baru di sini.
 */

const OPEN_TIME = "10:00:00";
const CLOSE_TIME = "21:00:00";

type ServiceSeed = {
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

const SERVICES: ServiceSeed[] = [
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

type BarberSeed = {
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

const BARBERS: BarberSeed[] = [
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
const BREAKS: { startTime: string; endTime: string }[] = [
  { startTime: "12:00:00", endTime: "12:55:00" },
  { startTime: "18:00:00", endTime: "18:55:00" },
];

const BREAK_OFFSET_HOURS = 1; // kursi 2 mulai sejam setelah kursi 1, dst.

const SETTINGS: { key: string; value: unknown; description: string }[] = [
  { key: "dp_idr", value: 20000, description: "DP flat per booking (Rp), dipotong saat pelunasan" },
  { key: "hold_ttl_seconds", value: 900, description: "Masa hidup hold slot sebelum auto-expire" },
  { key: "cancel_cutoff_hours", value: 3, description: "Batas batal/reschedule sebelum jadwal" },
  { key: "late_tolerance_minutes", value: 15, description: "Toleransi keterlambatan sebelum no_show" },
  { key: "timezone", value: "Asia/Jakarta", description: "Zona waktu operasional tunggal" },
  { key: "chair_count", value: 3, description: "Jumlah kursi aktif" },
  { key: "opening_hour", value: 10, description: "Jam buka gerai (WIB)" },
  { key: "closing_hour", value: 21, description: "Jam tutup gerai (WIB)" },
];

export type SeedSummary = {
  services: number;
  barbers: number;
  workingHours: number;
  blockedSlots: number;
};

function shiftTime(time: string, hours: number): string {
  const [rawHour = "0", rest = "00:00"] = time.split(":");
  return `${String(Number(rawHour) + hours).padStart(2, "0")}:${rest}`;
}

async function upsertServices(pool: Pool): Promise<void> {
  for (const service of SERVICES) {
    await pool.query(
      `INSERT INTO public.services
         (service_code, name, slug, category, duration_minutes, price_idr,
          description, is_recommended, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
       ON CONFLICT (service_code) DO UPDATE
         SET name = EXCLUDED.name,
             slug = EXCLUDED.slug,
             category = EXCLUDED.category,
             duration_minutes = EXCLUDED.duration_minutes,
             price_idr = EXCLUDED.price_idr,
             description = EXCLUDED.description,
             is_recommended = EXCLUDED.is_recommended,
             is_active = true,
             display_order = EXCLUDED.display_order,
             updated_at = now()`,
      [
        service.code,
        service.name,
        service.slug,
        service.category,
        service.durationMinutes,
        service.priceIdr,
        service.description,
        service.recommended,
        service.order,
      ],
    );
  }
}

async function upsertBarbers(pool: Pool): Promise<Map<number, string>> {
  const idsByChair = new Map<number, string>();

  for (const barber of BARBERS) {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO public.barbers
         (barber_code, full_name, nickname, title, chair_number, experience_years,
          specialty, bio, day_off, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $5, true)
       ON CONFLICT (barber_code) DO UPDATE
         SET full_name = EXCLUDED.full_name,
             nickname = EXCLUDED.nickname,
             title = EXCLUDED.title,
             chair_number = EXCLUDED.chair_number,
             experience_years = EXCLUDED.experience_years,
             specialty = EXCLUDED.specialty,
             bio = EXCLUDED.bio,
             day_off = EXCLUDED.day_off,
             display_order = EXCLUDED.display_order,
             is_active = true,
             updated_at = now()
       RETURNING id`,
      [
        barber.code,
        barber.fullName,
        barber.nickname,
        barber.title,
        barber.chair,
        barber.experienceYears,
        barber.specialty,
        barber.bio,
        barber.dayOff,
      ],
    );

    idsByChair.set(barber.chair, (result.rows[0] as { id: string }).id);
  }

  return idsByChair;
}

async function upsertWorkingHours(pool: Pool, barberId: string, dayOff: number): Promise<void> {
  for (let day = 0; day <= 6; day += 1) {
    await pool.query(
      `INSERT INTO public.working_hours (barber_id, day_of_week, open_time, close_time, is_day_off)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (barber_id, day_of_week) DO UPDATE
         SET open_time = EXCLUDED.open_time,
             close_time = EXCLUDED.close_time,
             is_day_off = EXCLUDED.is_day_off,
             updated_at = now()`,
      [barberId, day, OPEN_TIME, CLOSE_TIME, day === dayOff],
    );
  }
}

async function upsertBreaks(
  pool: Pool,
  barberId: string,
  chair: number,
  barberName: string,
  dayOff: number,
): Promise<void> {
  const offset = (chair - 1) * BREAK_OFFSET_HOURS;

  for (const lunch of BREAKS) {
    const isLunch = lunch.startTime.startsWith("12");
    const startTime = shiftTime(lunch.startTime, offset);
    const endTime = shiftTime(lunch.endTime, offset);

    for (let day = 0; day <= 6; day += 1) {
      if (day === dayOff) {
        continue;
      }

      await pool.query(
        `INSERT INTO public.blocked_slots
           (barber_id, slot_type, day_of_week, start_time, end_time, title, reason, is_active)
         VALUES ($1, 'recurring_break', $2, $3, $4, $5, $6, true)
         ON CONFLICT (barber_id, day_of_week, start_time, slot_type) DO UPDATE
           SET end_time = EXCLUDED.end_time,
               title = EXCLUDED.title,
               reason = EXCLUDED.reason,
               is_active = true,
               updated_at = now()`,
        [
          barberId,
          day,
          startTime,
          endTime,
          isLunch ? `Istirahat Siang Barber ${barberName}` : `Istirahat Malam Barber ${barberName}`,
          isLunch
            ? `Staggered Lunch Break (Rotasi Kursi ${chair})`
            : `Staggered Dinner Break (Rotasi Kursi ${chair})`,
        ],
      );
    }
  }
}

async function upsertSettings(pool: Pool): Promise<void> {
  for (const setting of SETTINGS) {
    await pool.query(
      `INSERT INTO public.settings (key, value, description)
       VALUES ($1, $2::jsonb, $3)
       ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = now()`,
      [setting.key, JSON.stringify(setting.value), setting.description],
    );
  }
}

/**
 * Isi katalog dasar. Idempoten: setiap INSERT memakai ON CONFLICT pada kunci
 * alaminya, jadi menjalankannya dua kali tidak menambah baris.
 */
export async function seed(pool: Pool): Promise<SeedSummary> {
  await upsertServices(pool);

  const idsByChair = await upsertBarbers(pool);

  for (const barber of BARBERS) {
    const barberId = idsByChair.get(barber.chair);
    if (barberId === undefined) {
      throw new Error(`Barber kursi ${barber.chair} tidak punya id setelah upsert`);
    }

    await upsertWorkingHours(pool, barberId, barber.dayOff);
    await upsertBreaks(pool, barberId, barber.chair, barber.fullName, barber.dayOff);
  }

  await upsertSettings(pool);

  const counts = await pool.query<{
    services: string;
    barbers: string;
    working_hours: string;
    blocked_slots: string;
  }>(
    `SELECT (SELECT count(*) FROM public.services)::text AS services,
            (SELECT count(*) FROM public.barbers)::text AS barbers,
            (SELECT count(*) FROM public.working_hours)::text AS working_hours,
            (SELECT count(*) FROM public.blocked_slots)::text AS blocked_slots`,
  );

  const row = counts.rows[0];
  if (row === undefined) {
    throw new Error("Query hitung seed tidak mengembalikan baris");
  }

  return {
    services: Number(row.services),
    barbers: Number(row.barbers),
    workingHours: Number(row.working_hours),
    blockedSlots: Number(row.blocked_slots),
  };
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined || databaseUrl.length === 0) {
    console.error("DATABASE_URL belum diset. Contoh: DATABASE_URL=postgresql://damez:***@127.0.0.1:5432/damez_dev npm run seed");
    process.exit(1);
  }

  const pool = createPgPool(databaseUrl, 2);
  try {
    const summary = await seed(pool);
    console.error(
      `Seed selesai: ${summary.services} layanan, ${summary.barbers} barber, ` +
        `${summary.workingHours} baris jam kerja, ${summary.blockedSlots} istirahat.`,
    );
  } finally {
    await pool.end();
  }
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
