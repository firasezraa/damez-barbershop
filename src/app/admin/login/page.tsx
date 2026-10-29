import type { Metadata } from "next";
import { normalizeNextPath, type LoginErrorCode } from "@/features/admin/login";

/**
 * Pesan per kode galat. Kode dikirim route sign-in lewat `?error=`, jadi pengguna
 * membaca kalimat di halaman ini, bukan JSON mentah hasil POST formulir.
 */
const ERROR_MESSAGES: Record<LoginErrorCode | "session", string> = {
  validation: "Email dan kata sandi wajib diisi dengan benar.",
  credentials: "Email atau kata sandi salah.",
  rate: "Terlalu banyak percobaan masuk. Coba lagi beberapa menit lagi.",
  config:
    "Layanan masuk belum dikonfigurasi di server (Supabase). Hubungi pengelola gerai.",
  session: "Sesi tidak bisa diverifikasi. Silakan masuk lagi.",
};

export const metadata: Metadata = {
  title: "Masuk Admin — Damez Barbershop",
  // Halaman internal tidak boleh diindeks mesin pencari.
  robots: { index: false, follow: false },
};

/**
 * Formulir masuk admin. Halaman ini hanya mengirim POST ke route handler; tidak
 * ada pemeriksaan kredensial, tidak ada sesi, dan tidak ada akun contoh di sini
 * (IDEA.md §8.2). Middleware selalu mengizinkan `/admin/login` supaya tidak
 * terjadi lingkaran redirect.
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = normalizeNextPath(params.next ?? null);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <p className="font-display text-sm tracking-[0.2em] text-brass uppercase">Damez</p>
        <h1 className="font-display text-3xl text-text">Masuk Admin</h1>
        <p className="text-sm text-muted">
          Khusus staf gerai. Gunakan email dan kata sandi yang diberikan manajer.
        </p>
      </div>

      {params.error === undefined ? null : (
        <p
          role="alert"
          className="rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {ERROR_MESSAGES[params.error as LoginErrorCode] ??
            "Masuk gagal. Cek email dan kata sandi, lalu coba lagi."}
        </p>
      )}

      <form action="/api/admin/auth/sign-in" method="post" className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />

        <label className="flex flex-col gap-1 text-sm text-muted">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="username"
            autoFocus
            className="rounded-card border border-surface-2 bg-surface px-4 py-3 text-base text-text outline-none focus:border-brass"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-muted">
          Kata sandi
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="current-password"
            className="rounded-card border border-surface-2 bg-surface px-4 py-3 text-base text-text outline-none focus:border-brass"
          />
        </label>

        <button
          type="submit"
          className="rounded-card bg-brass px-4 py-3 text-base font-medium text-ink transition hover:brightness-110"
        >
          Masuk
        </button>
      </form>
    </main>
  );
}
