import { scheduleWalkIn, walkInSchema } from "@/features/admin/actions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { verifySupabaseToken } from "@/lib/auth/supabase-verifier";
import { clientKeyFrom, createRateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["owner", "cashier"] as const;
const rateLimit = createRateLimiter({ name: "admin-walk-in", limit: 30, windowSeconds: 60 });

/** Walk-in: tamu yang datang langsung, kursi langsung terisi tanpa hold. */
export async function POST(request: Request): Promise<Response> {
  const guard = await requireAdmin(request, { verify: verifySupabaseToken }, ALLOWED_ROLES);
  if (!guard.ok) {
    return Response.json(guard.body, { status: guard.status });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Body harus JSON." }, { status: 400 });
  }

  const parsed = walkInSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Data walk-in tidak valid." }, { status: 400 });
  }

  let allowed: boolean;
  try {
    allowed = await rateLimit(clientKeyFrom(request));
  } catch {
    return Response.json({ error: "Layanan sedang tidak tersedia." }, { status: 503 });
  }

  if (!allowed) {
    return Response.json({ error: "Terlalu banyak permintaan." }, { status: 429 });
  }

  const result = await scheduleWalkIn(parsed.data, {
    actorRole: guard.session.role as "owner" | "cashier",
    actorId: guard.session.userId,
  });

  return Response.json(result.body, { status: result.status });
}