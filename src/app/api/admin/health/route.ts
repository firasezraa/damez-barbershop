import { requireAdmin } from "@/lib/auth/require-admin";
import { verifySupabaseToken } from "@/lib/auth/supabase-verifier";

/**
 * Endpoint contoh yang memakai guard §8.3. Gunanya bukan sebagai fitur, tapi
 * sebagai bukti hidup: kalau guard dilepas, test integrasi HTTP dan E2E gagal.
 * Tanpa cookie sesi yang sah → 401; role di luar daftar → 403.
 */
export async function GET(request: Request): Promise<Response> {
  const guard = await requireAdmin(request, { verify: verifySupabaseToken });

  if (!guard.ok) {
    return Response.json(guard.body, { status: guard.status });
  }

  return Response.json({ status: "ok", role: guard.session.role });
}
