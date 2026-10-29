import {
  ADMIN_ROLES,
  readAdminSession,
  type AdminRole,
  type AdminSession,
  type SessionVerifier,
} from "./session.ts";

export type AdminGuardResult =
  | { ok: true; session: AdminSession }
  | { ok: false; status: 401 | 403; body: { error: string; message: string } };

export type AdminGuardDeps = { verify: SessionVerifier };

/**
 * Satu-satunya pintu masuk untuk route `/api/admin/*` (IDEA.md §8.3). Tanpa sesi
 * server-side yang tervalidasi → 401. Role di luar daftar yang diizinkan → 403.
 * Tidak ada fallback, tidak ada sesi demo, tidak ada pengecualian.
 */
export async function requireAdmin(
  request: Request,
  deps: AdminGuardDeps,
  allowedRoles: readonly AdminRole[] = ADMIN_ROLES,
): Promise<AdminGuardResult> {
  const result = await readAdminSession(request, deps);

  if (!result.ok) {
    return {
      ok: false,
      status: 401,
      body: {
        error: "UNAUTHENTICATED",
        message: "Sesi admin tidak ditemukan atau tidak sah. Silakan masuk kembali.",
      },
    };
  }

  if (!allowedRoles.includes(result.session.role)) {
    return {
      ok: false,
      status: 403,
      body: {
        error: "FORBIDDEN_ROLE",
        message: "Peran akun ini tidak berwenang untuk aksi tersebut.",
      },
    };
  }

  return { ok: true, session: result.session };
}
