import { NextResponse, type NextRequest } from "next/server";
import { guardDecision } from "@/lib/auth/guard-paths";
import { readAdminSession } from "@/lib/auth/session";
import { verifySupabaseToken } from "@/lib/auth/supabase-verifier";

/**
 * Proteksi halaman `/admin/*` (IDEA.md §8.1). Guard di klien hanya untuk UX;
 * keputusan keamanan ada di sini dan di `requireAdmin()` untuk route API.
 *
 * Memakai jalur sesi yang sama dengan `requireAdmin()` — cookie `dmz_admin_session`
 * berisi token akses yang diverifikasi ke Supabase Auth. Fail closed: sesi yang
 * tidak bisa diverifikasi (cookie hilang, Supabase belum dikonfigurasi, jaringan
 * mati) diperlakukan sebagai tidak ada sesi.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const decision = guardDecision(request.nextUrl.pathname, false);

  if (decision.type === "allow") {
    return NextResponse.next({ request });
  }

  const session = await readAdminSession(request, { verify: verifySupabaseToken });
  if (session.ok) {
    return NextResponse.next({ request });
  }

  return NextResponse.redirect(new URL(decision.to, request.url));
}

export const config = {
  // Hanya halaman admin. Route API menjaga dirinya sendiri lewat requireAdmin()
  // supaya jawabannya JSON 401/403, bukan redirect HTML.
  matcher: ["/admin/:path*"],
};
