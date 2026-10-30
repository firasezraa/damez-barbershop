import { z } from "zod";
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

/**
 * Kode galat dipakai halaman login untuk memilih pesan. Formulir masuk adalah form
 * HTML biasa, jadi kegagalan harus kembali ke halaman login dengan kode ini —
 * bukan menampilkan JSON mentah di browser.
 */
export type LoginErrorCode = "validation" | "rate" | "credentials" | "config";

export type SignInResult =
  | { kind: "success"; status: 303; redirectTo: string; accessToken: string }
  | {
      kind: "failure";
      status: 400 | 401 | 429 | 503;
      code: LoginErrorCode;
      body: { error: string };
    };

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
    return {
      kind: "failure",
      status: 400,
      code: "validation",
      body: { error: "Email dan kata sandi wajib diisi dengan benar." },
    };
  }

  // Kunci pembatas percobaan berasal dari klien (IP), bukan dari email yang
  // dikirim: kalau memakai email, penyerang bisa menyebar ke banyak akun.
  const allowed = await deps.rateLimit(deps.clientKey);
  if (!allowed) {
    return {
      kind: "failure",
      status: 429,
      code: "rate",
      body: { error: "Terlalu banyak percobaan masuk. Coba lagi beberapa menit lagi." },
    };
  }

  const outcome = await deps.signIn(parsed.data.email, parsed.data.password);
  if (!outcome.ok) {
    return { kind: "failure", status: 401, code: "credentials", body: { error: outcome.message } };
  }

  return {
    kind: "success",
    status: 303,
    redirectTo: normalizeNextPath(form.get("next")),
    accessToken: outcome.accessToken,
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
