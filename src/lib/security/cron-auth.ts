import { timingSafeEqual } from "node:crypto";

/**
 * Otorisasi endpoint cron (IDEA.md §8). Perbandingan panjang-tetap: panjang
 * berbeda langsung ditolak, isi dibandingkan dengan `timingSafeEqual`.
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