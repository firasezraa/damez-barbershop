import {
  clientKeyFrom,
  createPostgresRateLimiter,
  createSupabaseSignIn,
  handleSignIn,
} from "@/features/admin/login";
import { buildSessionCookie } from "@/lib/auth/session-cookie";

export const runtime = "nodejs";

const isSecureRequest = (request: Request): boolean =>
  new URL(request.url).protocol === "https:" ||
  request.headers.get("x-forwarded-proto") === "https";

/**
 * Masuk admin, server-side (IDEA.md §8.1–8.2). Tidak ada fallback demo: salah
 * kredensial → 401, percobaan berlebih → 429, penyimpanan pembatas tidak bisa
 * dihubungi → 503 tanpa cookie. Cookie sesi HttpOnly hanya dipasang kalau Supabase
 * benar-benar mengembalikan sesi.
 */
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();

  let result;
  try {
    result = await handleSignIn(form, {
      signIn: createSupabaseSignIn(),
      rateLimit: createPostgresRateLimiter(),
      clientKey: clientKeyFrom(request),
    });
  } catch {
    return Response.json(
      { error: "Layanan masuk sedang tidak tersedia. Coba lagi sebentar lagi." },
      { status: 503 },
    );
  }

  if (result.status !== 303) {
    return Response.json(result.body, { status: result.status });
  }

  const response = Response.redirect(new URL(result.redirectTo, request.url), 303);
  response.headers.append(
    "set-cookie",
    buildSessionCookie(result.accessToken, { secure: isSecureRequest(request) }),
  );

  return response;
}
