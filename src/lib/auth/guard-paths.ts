/**
 * Keputusan proteksi halaman `/admin/*`. Fungsi murni supaya bisa diuji di Node
 * (bukan hanya di edge runtime Next), dan supaya `middleware.ts` tinggal
 * merangkai cookie + keputusan ini.
 */

export const ADMIN_LOGIN_PATH = "/admin/login";

export type GuardDecision = { type: "allow" } | { type: "redirect"; to: string };

const ALLOW: GuardDecision = { type: "allow" };

/** Cocok pada segmen `/admin`, bukan sekadar awalan teks (`/administrasi`). */
function isAdminArea(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function guardDecision(pathname: string, hasSession: boolean): GuardDecision {
  if (!isAdminArea(pathname)) {
    return ALLOW;
  }

  // Halaman login harus selalu bisa dibuka, kalau tidak akan terjadi lingkaran
  // redirect.
  if (pathname === ADMIN_LOGIN_PATH || pathname.startsWith(`${ADMIN_LOGIN_PATH}/`)) {
    return ALLOW;
  }

  if (hasSession) {
    return ALLOW;
  }

  return {
    type: "redirect",
    to: `${ADMIN_LOGIN_PATH}?next=${encodeURIComponent(pathname)}`,
  };
}
