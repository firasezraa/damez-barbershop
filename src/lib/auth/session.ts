/**
 * Verifikasi sesi admin di server. Menggantikan sesi `localStorage`
 * (`damez_admin_session`) v1 yang bisa dipalsukan dari console (IDEA.md §2.1).
 *
 * Modul ini tidak tahu apa pun tentang Supabase: verifikatornya disuntik, jadi
 * logika keputusan bisa diuji tanpa GoTrue (yang tidak bisa dijalankan di VPS
 * tanpa Docker). Implementasi produksi ada di `supabase-verifier.ts`.
 */

export const ADMIN_SESSION_COOKIE = "dmz_admin_session";

export const ADMIN_ROLES = ["owner", "cashier", "barber"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminSession = {
  userId: string;
  email: string | null;
  role: AdminRole;
};

/** Klaim yang dikembalikan verifikator; `null` berarti token tidak sah. */
export type VerifiedToken = {
  userId: string;
  email: string | null;
  role: string | null;
};

export type SessionVerifier = (accessToken: string) => Promise<VerifiedToken | null>;

export type SessionResult =
  | { ok: true; session: AdminSession }
  | { ok: false; reason: "missing" | "invalid" | "unknown_role" };

function parseCookieHeader(header: string): Map<string, string> {
  const jar = new Map<string, string>();

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name.length > 0) {
      jar.set(name, value);
    }
  }

  return jar;
}

/** Token sesi dari header Cookie, atau `null` kalau tidak ada/kosong. */
export function readAccessToken(
  request: Request,
  cookieName: string = ADMIN_SESSION_COOKIE,
): string | null {
  const header = request.headers.get("cookie");
  if (header === null) {
    return null;
  }

  const value = parseCookieHeader(header).get(cookieName);
  if (value === undefined || value.length === 0) {
    return null;
  }

  return value;
}

function isAdminRole(role: string | null): role is AdminRole {
  return role !== null && (ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * Fail closed: apa pun yang tidak membuktikan sesi yang sah — cookie hilang,
 * token kedaluwarsa, verifikator melempar karena jaringan mati — dijawab "tidak
 * ada sesi", bukan dibiarkan lewat.
 */
export async function readAdminSession(
  request: Request,
  deps: { verify: SessionVerifier },
): Promise<SessionResult> {
  const token = readAccessToken(request);
  if (token === null) {
    return { ok: false, reason: "missing" };
  }

  let verified: VerifiedToken | null = null;
  try {
    verified = await deps.verify(token);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (verified === null) {
    return { ok: false, reason: "invalid" };
  }

  if (!isAdminRole(verified.role)) {
    return { ok: false, reason: "unknown_role" };
  }

  return {
    ok: true,
    session: { userId: verified.userId, email: verified.email, role: verified.role },
  };
}
