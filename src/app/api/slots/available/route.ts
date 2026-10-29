import { z } from "zod";
import { findAvailability } from "@/features/slots/availability";
import { bookingPool, loadServiceSummary } from "@/features/slots/services";
import { clientKeyFrom, createRateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const SLOT_RATE_LIMIT = { limit: 60, windowSeconds: 60 } as const;
const rateLimit = createRateLimiter({ name: "slots", ...SLOT_RATE_LIMIT });

const bodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "tanggal harus YYYY-MM-DD"),
  serviceIds: z.array(z.string().uuid()).min(1).max(3),
  barberId: z.string().uuid().optional(),
});

/**
 * Ketersediaan slot untuk tanggal tertentu. Durasi dan harga dihitung dari tabel
 * `services`, bukan dari payload (IDEA.md §8.7), dan pembatas laju memakai
 * penyimpanan persisten (§8.6).
 */
export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Body harus JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  let allowed: boolean;
  try {
    allowed = await rateLimit(clientKeyFrom(request));
  } catch {
    return Response.json({ error: "Layanan sedang tidak tersedia." }, { status: 503 });
  }

  if (!allowed) {
    return Response.json({ error: "Terlalu banyak permintaan. Coba lagi sebentar." }, { status: 429 });
  }

  const summary = await loadServiceSummary(parsed.data.serviceIds);
  if (summary === null) {
    return Response.json({ error: "Ada layanan yang tidak dikenal atau sudah tidak aktif." }, { status: 422 });
  }

  const barberId = parsed.data.barberId;
  const barbers = await findAvailability(
    bookingPool(),
    barberId === undefined
      ? { dateJakarta: parsed.data.date, durationMinutes: summary.durationMinutes }
      : { dateJakarta: parsed.data.date, durationMinutes: summary.durationMinutes, barberId },
  );

  return Response.json(
    {
      date: parsed.data.date,
      durationMinutes: summary.durationMinutes,
      totalIdr: summary.totalIdr,
      barbers,
    },
    { status: 200 },
  );
}