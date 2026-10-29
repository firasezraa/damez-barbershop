import { buildClearSessionCookie } from "@/lib/auth/session-cookie";

export const runtime = "nodejs";

const isSecureRequest = (request: Request): boolean =>
  new URL(request.url).protocol === "https:" ||
  request.headers.get("x-forwarded-proto") === "https";

/**
 * Response dibuat manual, bukan `Response.redirect()`: header hasil
 * `Response.redirect()` bersifat immutable sehingga `Set-Cookie` gagal dipasang.
 */
export function buildSignOutResponse(request: Request): Response {
  return new Response(null, {
    status: 303,
    headers: {
      location: new URL("/admin/login", request.url).toString(),
      "set-cookie": buildClearSessionCookie({ secure: isSecureRequest(request) }),
    },
  });
}

/** Keluar: hapus cookie sesi di server dan kembali ke halaman masuk. */
export async function POST(request: Request): Promise<Response> {
  return buildSignOutResponse(request);
}
