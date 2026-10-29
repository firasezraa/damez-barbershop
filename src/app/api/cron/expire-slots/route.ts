import { timingSafeEqual } from "node:crypto";
import { expireStaleHolds } from "@/features/slots/expire";

export const runtime = "nodejs";

/**
 * Perbandingan panjang-tetap: panjang berbeda langsung ditolak (tidak ada
 * informasi yang bocor lewat waktu), isi dibandingkan dengan `timingSafeEqual`.
 */
export function isAuthorizedCronRequest(request: Request, secret: string | undefined): boolean {
  const header = request.headers.get("authorization");
  if (secret === undefined || secret.length === 0 || header === null) {
    return false;
  }

  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  const received = Buffer.from(header, "utf8");

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

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
