import type { Pool } from "pg";
import { bookingPool } from "../slots/services.ts";
import type { PublicBarber, PublicService } from "./types.ts";

/** Katalog publik. Hanya baris aktif, urut sesuai tampilan gerai. */

export type { PublicBarber, PublicService };
export { formatRupiah } from "./types.ts";

export async function listActiveServices(target: Pool = bookingPool()): Promise<PublicService[]> {
  const result = await target.query<{
    id: string;
    name: string;
    slug: string;
    category: string;
    duration_minutes: number;
    price_idr: number;
    description: string | null;
    is_recommended: boolean;
  }>(
    `SELECT id, name, slug, category, duration_minutes, price_idr, description, is_recommended
       FROM public.services
      WHERE is_active
      ORDER BY display_order, name`,
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    durationMinutes: row.duration_minutes,
    priceIdr: row.price_idr,
    description: row.description,
    recommended: row.is_recommended,
  }));
}

export async function listActiveBarbers(target: Pool = bookingPool()): Promise<PublicBarber[]> {
  const result = await target.query<{
    id: string;
    full_name: string;
    nickname: string | null;
    title: string | null;
    chair_number: number;
    specialty: string | null;
    bio: string | null;
    day_off: number;
  }>(
    `SELECT id, full_name, nickname, title, chair_number, specialty, bio, day_off
       FROM public.barbers
      WHERE is_active
      ORDER BY chair_number`,
  );

  return result.rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    nickname: row.nickname,
    title: row.title,
    chairNumber: row.chair_number,
    specialty: row.specialty,
    bio: row.bio,
    dayOff: row.day_off,
  }));
}