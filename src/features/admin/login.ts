import type { Pool } from "pg";
import { z } from "zod";
import { createPgPool } from "../../lib/db/pg.ts";
import { readSupabaseAuthEnv } from "../../lib/config/env.ts";
import { createClient } from "@supabase/supabase-js";

/**
 * Alur masuk admin. Semuanya server-side: formulir dikirim ke route handler,
 * token disimpan di cookie HttpOnly, dan verifikasinya di `lib/auth/session.ts`.
 * Tidak ada kredensial di kode, tidak ada sesi di browser storage.
 */

export const LOGIN_PATH_AFTER_SUCCESS = "/admin";
export const LOGIN_ERROR_MESSAGE = "Email atau kata sandi salah.";
export const LOGIN_RATE_LIMIT = { limit: 5, windowSeconds: 300 } as const;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

export type SignInOutcome = { ok: true; accessToken: string } | { ok: false; message: string };

export type SignInDeps = {
  signIn: (email: string, password: string) => Promise<SignInOutcome>;
  rateLimit: (clientKey: string) => Promise<boolean>;
  clientKey: string;
};

export type SignInResult =
  | { kind: "success"; status: 303; redirectTo: string; accessToken: string }
  | { kind: "failure"; status: 400 | 401 | 429 | 503; body: { error: string } };

/**
 * Hanya izinkan tujuan internal di bawah `/admin`. Tanpa ini, `?next=https://…`
 * menjadikan halaman login sebagai alat phishing (open redirect).
 */
export function normalizeNextPath(raw: unknown): string {
  if (typeof raw !== "string" || raw.length === 0) {
    return LOGIN_PATH_AFTER_SUCCESS;
  }

  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return LOGIN_PATH_AFTER_SUCCESS;
  }

  const [pathname = ""] = raw.split(/[?#]/);
  if (pathname !== "/admin" && !pathname.startsWith("/admin/")) {
    return LOGIN_PATH_AFTER_SUCCESS;
  }

  return raw;
}

export async function handleSignIn(form: FormData, deps: SignInDeps): Promise<SignInResult> {
  const parsed = loginSchema.safeParse({
    email: form.get("email") ?? "",
    password: form.get("password") ?? "",
  });

  if (!parsed.success) {
    return { kind: "failure", status: 400, body: { error: "Email dan kata sandi wajib diisi dengan benar." } };
  }

  // Kunci pembatas percobaan berasal dari klien (IP), bukan dari email yang
  // dikirim: kalau memakai email, penyerang bisa menyebar ke banyak akun.
  const allowed = await deps.rateLimit(deps.clientKey);
  if (!allowed) {
    return {
      kind: "failure",
      status: 429,
      body: { error: "Terlalu banyak percobaan masuk. Coba lagi beberapa menit lagi." },
    };
  }

  const outcome = await deps.signIn(parsed.data.email, parsed.data.password);
  if (!outcome.ok) {
    return { kind: "failure", status: 401, body: { error: outcome.message } };
  }

  return {
    kind: "success",
    status: 303,
    redirectTo: normalizeNextPath(form.get("next")),
    accessToken: outcome.accessToken,
  };
}

/** Pembatas percobaan masuk memakai penyimpanan persisten R0.8, bukan Map memori. */
export function createPostgresRateLimiter(): (clientKey: string) => Promise<boolean> {
  let pool: Pool | null = null;

  function getPool(): Pool {
    if (pool === null) {
      pool = createPgPool(readSupabaseAuthEnv().DATABASE_URL, 2);
    }
    return pool;
  }

  return async (clientKey: string): Promise<boolean> => {
    const result = await getPool().query<{ allowed: boolean }>(
      "SELECT public.fn_rate_limit_hit($1, $2, $3) AS allowed",
      [`login:${clientKey}`, LOGIN_RATE_LIMIT.limit, LOGIN_RATE_LIMIT.windowSeconds],
    );

    return (result.rows[0] as { allowed: boolean }).allowed;
  };
}

/** Klien Supabase memakai kunci anon: masuk bukan operasi istimewa. */
export function createSupabaseSignIn(): SignInDeps["signIn"] {
  return async (email, password) => {
    const env = readSupabaseAuthEnv();
    const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error !== null || data.session === null) {
      return { ok: false, message: LOGIN_ERROR_MESSAGE };
    }

    return { ok: true, accessToken: data.session.access_token };
  };
}

/** Kunci pembatas dari header proxy, bukan dari body. */
export function clientKeyFrom(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded !== null && forwarded.length > 0) {
    const [first] = forwarded.split(",");
    return (first ?? "unknown").trim();
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}
