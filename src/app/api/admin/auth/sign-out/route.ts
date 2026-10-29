import { buildClearSessionCookie } from "@/lib/auth/session-cookie";

export const runtime = "nodejs";

const isSecureRequest = (request: Request): boolean =>
  new URL(request.url).protocol === "https:" ||
  request.headers.get("x-forwarded-proto") === "https";

/** Keluar: hapus cookie sesi di server dan kembali ke halaman masuk. */
export async function POST(request: Request): Promise<Response> {
  const response = Response.redirect(new URL("/admin/login", request.url), 303);
  response.headers.append("set-cookie", buildClearSessionCookie({ secure: isSecureRequest(request) }));

  return response;
}
