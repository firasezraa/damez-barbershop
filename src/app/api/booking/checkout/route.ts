import { z } from "zod";
import { createCheckout } from "@/features/payment/checkout";
import { clientKeyFrom, createRateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const rateLimit = createRateLimiter({ name: "checkout", limit: 20, windowSeconds: 60 });

const bodySchema = z.object({
  bookingCode: z.string().regex(/^DMZ-\d{8}-\d{4}$/),
});

/** Membuat transaksi Snap untuk DP. Nominal berasal dari baris booking, bukan payload. */
export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Body harus JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Kode booking tidak valid." }, { status: 400 });
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

  const result = await createCheckout(parsed.data.bookingCode, {
    mock: process.env["MOCK_MIDTRANS"] === "true",
    serverKey: process.env["MIDTRANS_SERVER_KEY"] ?? "",
  });

  return Response.json(result.body, { status: result.status });
}