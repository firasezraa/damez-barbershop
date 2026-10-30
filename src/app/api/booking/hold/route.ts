import { z } from "zod";
import { createHold, HOLD_ERROR_STATUS } from "@/features/booking/hold";
import { clientKeyFrom, createRateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const HOLD_RATE_LIMIT = { limit: 10, windowSeconds: 60 } as const;
const rateLimit = createRateLimiter({ name: "hold", ...HOLD_RATE_LIMIT });

const holdSchema = z.object({
  fullName: z.string().trim().min(3).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\+62\d{8,13}$/, "nomor harus format E.164 Indonesia, contoh +6281234567890"),
  barberId: z.string().uuid(),
  startTime: z.string().datetime({ offset: true }),
  serviceIds: z.array(z.string().uuid()).min(1).max(3),
  notes: z.string().trim().max(300).optional(),
});

/**
 * Membuat hold 15 menit. Semua aturan bisnis ada di `fn_create_booking_hold`
 * (migrasi 0002): harga dan waktu selesai dihitung server, slot dikunci tiga
 * lapis, anti-hoarding per nomor telepon.
 */
export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Body harus JSON." }, { status: 400 });
  }

  const parsed = holdSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Data booking tidak valid." }, { status: 400 });
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

  const result = await createHold({
    fullName: parsed.data.fullName,
    phoneE164: parsed.data.phone,
    barberId: parsed.data.barberId,
    startTime: parsed.data.startTime,
    serviceIds: parsed.data.serviceIds,
    ...(parsed.data.notes === undefined ? {} : { notes: parsed.data.notes }),
  });

  if (!result.ok) {
    return Response.json(
      { error: result.failure.error, message: result.failure.message },
      { status: HOLD_ERROR_STATUS[result.failure.error] },
    );
  }

  return Response.json(
    {
      bookingId: result.hold.bookingId,
      bookingCode: result.hold.bookingCode,
      holdExpiresAt: result.hold.holdExpiresAt,
      totalIdr: result.hold.totalIdr,
      dpIdr: result.hold.dpIdr,
      remainingIdr: result.hold.remainingIdr,
    },
    { status: 201 },
  );
}