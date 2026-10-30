import { z } from "zod";
import { buildDailyReport, toCsv } from "@/features/admin/report";
import { requireAdmin } from "@/lib/auth/require-admin";
import { verifySupabaseToken } from "@/lib/auth/supabase-verifier";
import { jakartaDateString } from "@/lib/time/jakarta";

export const runtime = "nodejs";

/** Rekap kas hanya untuk owner: berisi data pelanggan dan uang. */
const ALLOWED_ROLES = ["owner"] as const;
const querySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() });

export async function GET(request: Request): Promise<Response> {
  const guard = await requireAdmin(request, { verify: verifySupabaseToken }, ALLOWED_ROLES);
  if (!guard.ok) {
    return Response.json(guard.body, { status: guard.status });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ date: url.searchParams.get("date") ?? undefined });
  if (!parsed.success) {
    return Response.json({ error: "Tanggal harus format YYYY-MM-DD." }, { status: 400 });
  }

  const dateJakarta = parsed.data.date ?? jakartaDateString(new Date());
  const report = await buildDailyReport(dateJakarta);
  const csv = toCsv(report);

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="damez-kas-${dateJakarta}.csv"`,
      "cache-control": "no-store",
    },
  });
}