import {
  createSupabaseSignIn,
  handleSignIn,
  LOGIN_RATE_LIMIT,
  type SignInResult,
} from "@/features/admin/login";
import { clientKeyFrom, createRateLimiter } from "@/lib/security/rate-limit";
import { buildSessionCookie } from "@/lib/auth/session-cookie";

export const runtime = "nodejs";

const isSecureRequest = (request: Request): boolean =>
  new URL(request.url).protocol === "https:" ||
  request.headers.get("x-forwarded-proto") === "https";

/**
 * Response dibuat manual, bukan `Response.redirect()`: header response hasil
 * `Response.redirect()` bersifat immutable sehingga `Set-Cookie` tidak bisa
 * ditambahkan (bug yang tertangkap job E2E di CI, bukan di mesin lokal).
 */
export function buildSignInResponse(result: SignInResult, request: Request): Response {
  if (result.kind !== "success") {
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(null, {
    status: 303,
    headers: {
      // Location relatif, bukan URL absolut dari `request.url`: kalau hostname
      // permintaan berbeda dari hostname yang dibuka browser (mis. 127.0.0.1 vs
      // localhost), redirect absolut memindahkan origin dan cookie sesi yang
      // host-only ikut hilang sehingga pengguna terlempar kembali ke halaman masuk.
      location: result.redirectTo,
      "set-cookie": buildSessionCookie(result.accessToken, { secure: isSecureRequest(request) }),
    },
  });
}

/**
 * Masuk admin, server-side (IDEA.md §8.1–8.2). Tidak ada fallback demo: salah
 * kredensial → 401, percobaan berlebih → 429, penyimpanan pembatas tidak bisa
 * dihubungi → 503 tanpa cookie. Cookie sesi HttpOnly hanya dipasang kalau Supabase
 * benar-benar mengembalikan sesi.
 */
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();

  try {
    const result = await handleSignIn(form, {
      signIn: createSupabaseSignIn(),
      rateLimit: createRateLimiter({ name: "login", ...LOGIN_RATE_LIMIT }),
      clientKey: clientKeyFrom(request),
    });

    return buildSignInResponse(result, request);
  } catch (error) {
    // Konfigurasi belum lengkap atau database tidak bisa dihubungi: tutup pintu
    // tanpa cookie dan tanpa membocorkan detail ke pemanggil.
    console.error("sign-in gagal:", error instanceof Error ? error.message : "error tidak dikenal");

    return new Response(
      JSON.stringify({ error: "Layanan masuk sedang tidak tersedia. Coba lagi sebentar lagi." }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }
}
