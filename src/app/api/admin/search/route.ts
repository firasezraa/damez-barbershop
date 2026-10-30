import { requireAdmin } from "@/lib/auth/require-admin";
import { verifySupabaseToken } from "@/lib/auth/supabase-verifier";
import { listRecentBookings } from "@/features/admin/overview";

export async function GET(request: Request): Promise<Response> {
  const guard = await requireAdmin(request, { verify: verifySupabaseToken });
  if (!guard.ok) {
    return Response.json(guard.body, { status: guard.status });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const limitParam = Number(url.searchParams.get("limit") ?? "25");
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 25;

  const results = await listRecentBookings(limit, q);

  return Response.json({
    ok: true,
    data: results,
    count: results.length,
    query: q,
  });
}
