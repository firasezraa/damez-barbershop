import { expireStaleHolds } from "@/features/slots/expire";
import { isAuthorizedCronRequest } from "@/lib/security/cron-auth";

export const runtime = "nodejs";

/**
 * Perbandingan panjang-tetap: panjang berbeda langsung ditolak (tidak ada
 * informasi yang bocor lewat waktu), isi dibandingkan dengan `timingSafeEqual`.
 */
/**
 * Worker pelepasan hold kedaluwarsa. Dipanggil penjadwal (Vercel Cron) dengan
 * `Authorization: Bearer <CRON_SECRET>`. Tanpa header yang benar: 401 dan
 * database tidak disentuh sama sekali.
 */
export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCronRequest(request, process.env.CRON_SECRET)) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const expired = await expireStaleHolds();
    return Response.json({ expired }, { status: 200 });
  } catch {
    return Response.json({ error: "Layanan sedang tidak tersedia." }, { status: 503 });
  }
}
