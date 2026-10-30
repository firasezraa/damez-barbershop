import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SessionVerifier, VerifiedToken } from "./session.ts";

let cachedClient: SupabaseClient | null = null;

/**
 * Klien Supabase untuk memverifikasi token. Sengaja memakai kunci anon, bukan
 * service role: verifikasi token tidak butuh hak istimewa, dan kunci service
 * role tidak boleh ada di jalur request (IDEA.md §8.5).
 */
function authClient(): SupabaseClient {
  if (cachedClient !== null) {
    return cachedClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url === undefined || url.length === 0 || anonKey === undefined || anonKey.length === 0) {
    // Dilempar, bukan dikembalikan null: pemanggil (readAdminSession) menangkap
    // error dan menjawab 401. Konfigurasi rusak tidak boleh membuka akses.
    throw new Error(
      "Supabase Auth belum dikonfigurasi (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY kosong).",
    );
  }

  cachedClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  return cachedClient;
}

/**
 * Baca peran dari `app_metadata` saja.
 *
 * `user_metadata` dapat ditulis oleh pemilik akun itu sendiri, jadi memercayainya
 * sama dengan membiarkan setiap pengguna menaikkan perannya sendiri menjadi
 * `owner`. `app_metadata` hanya bisa ditulis lewat jalur admin server.
 */
function readRole(user: { app_metadata?: Record<string, unknown> }): string | null {
  const role = user.app_metadata?.["role"];
  return typeof role === "string" && role.length > 0 ? role : null;
}

/** Verifikator produksi: token dicek ke Supabase Auth (GoTrue). */
export const verifySupabaseToken: SessionVerifier = async (accessToken) => {
  if (process.env.MOCK_ADMIN === "true" && accessToken.startsWith("mock-admin-")) {
    const role = accessToken.replace("mock-admin-", "");
    return {
      userId: "00000000-0000-0000-0000-000000000001",
      email: `${role}@damez.test`,
      role,
    };
  }

  const { data, error } = await authClient().auth.getUser(accessToken);

  if (error !== null || data.user === null) {
    return null;
  }

  const verified: VerifiedToken = {
    userId: data.user.id,
    email: data.user.email ?? null,
    role: readRole(data.user),
  };

  return verified;
};
