import type { Metadata } from "next";
import Link from "next/link";
import { MonoLabel, Plate } from "@/components/ui/plate";
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

const FIELD_CLASSES =
  "min-h-12 rounded-[3px] border border-line bg-surface px-4 text-base text-text outline-none focus:border-brass";

/**
 * Formulir masuk admin. Halaman ini hanya mengirim POST ke route handler; tidak
 * ada pemeriksaan kredensial, tidak ada sesi, dan tidak ada akun contoh di sini
 * (IDEA.md §8.2). Middleware selalu mengizinkan `/admin/login` supaya tidak
 * terjadi lingkaran redirect.
 *
 * Tombol utama sengaja hanya berbunyi "Masuk": spec E2E mencocokkan nama tombol
 * dengan `/^Masuk$/`, jadi tidak ada nilai mono tambahan di sisi kanan. Karena
 * hanya ada satu label, teksnya rata tengah — bukan bentuk aksi "label + nilai"
 * yang dipakai saat tombol membawa angka (IDEA.md §17.3).
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = normalizeNextPath(params.next ?? null);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col justify-center gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <MonoLabel tone="brass">Damez Barbershop</MonoLabel>
        <h1 className="font-display text-3xl font-bold text-text">Masuk Admin</h1>
        <p className="text-sm text-muted">
          Khusus staf gerai. Gunakan email dan kata sandi yang diberikan manajer.
        </p>
      </div>

      {params.error === undefined ? null : (
        <p
          role="alert"
          className="rounded-[3px] border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {ERROR_MESSAGES[params.error as LoginErrorCode] ??
            "Masuk gagal. Cek email dan kata sandi, lalu coba lagi."}
        </p>
      )}

      <Plate className="flex flex-col gap-4 p-5">
        <form action="/api/admin/auth/sign-in" method="post" className="flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />

          <label className="flex flex-col gap-2">
            <MonoLabel>Email</MonoLabel>
            <input
              type="email"
              name="email"
              required
              autoComplete="username"
              autoFocus
              className={FIELD_CLASSES}
            />
          </label>

          <label className="flex flex-col gap-2">
            <MonoLabel>Kata sandi</MonoLabel>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="current-password"
              className={FIELD_CLASSES}
            />
          </label>

          <button
            type="submit"
            className="flex h-[58px] w-full items-center justify-center rounded-[3px] bg-brass font-display text-[19px] font-bold text-ink transition-colors duration-150 hover:brightness-105"
          >
            Masuk
          </button>
          <p className="font-mono text-[11px] text-ghost">
            Lupa kata sandi? Hubungi pengelola gerai — pemulihan tidak lewat layar ini.
          </p>
        </form>
      </Plate>

      <Link href="/" className="font-mono text-xs text-muted underline underline-offset-4">
        Kembali ke halaman publik
      </Link>
    </main>
  );
}
