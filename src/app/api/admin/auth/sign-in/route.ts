import {
  createSupabaseSignIn,
  handleSignIn,
  LOGIN_RATE_LIMIT,
  type SignInResult,
} from "@/features/admin/login";
import { clientKeyFrom, createRateLimiter } from "@/lib/security/rate-limit";
import { buildSessionCookie } from "@/lib/auth/session-cookie";

export const runtime = "nodejs";

/**
 * Formulir masuk adalah form HTML biasa: kegagalan harus kembali ke halaman login
 * dengan kode galat supaya pengguna membaca pesan, bukan JSON mentah. Klien API
 * (Accept: application/json) tetap menerima status + body JSON.
 */
const prefersHtml = (request: Request): boolean =>
  (request.headers.get("accept") ?? "").includes("text/html");

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
    if (prefersHtml(request)) {
      return new Response(null, {
        status: 303,
        headers: { location: `/admin/login?error=${result.code}` },
      });
    }

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

    return buildSignInResponse(
      {
        kind: "failure",
        status: 503,
        code: "config",
        body: { error: "Layanan masuk sedang tidak tersedia. Coba lagi sebentar lagi." },
      },
      request,
    );
  }
}
