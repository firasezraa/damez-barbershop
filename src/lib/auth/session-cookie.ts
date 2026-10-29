import { ADMIN_SESSION_COOKIE } from "./session.ts";

/** Umur cookie = umur token akses Supabase (1 jam). */
export const SESSION_MAX_AGE_SECONDS = 3600;

type CookieOptions = { secure: boolean };

/**
 * Cookie sesi: HttpOnly (tidak bisa dibaca JavaScript halaman — inilah yang
 * membedakannya dari sesi `localStorage` v1), SameSite=Lax supaya tidak ikut
 * terkirim pada permintaan lintas situs, dan Path=/.
 */
export function buildSessionCookie(accessToken: string, options: CookieOptions): string {
  const attributes = [
    `${ADMIN_SESSION_COOKIE}=${accessToken}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];

  if (options.secure) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

export function buildClearSessionCookie(options: CookieOptions): string {
  const attributes = [
    `${ADMIN_SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];

  if (options.secure) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}
