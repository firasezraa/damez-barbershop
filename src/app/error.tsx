"use client";

import Link from "next/link";
import { MonoLabel, Plate } from "@/components/ui/plate";

/**
 * Batas galat untuk seluruh rute. Pesan teknis tidak pernah ditampilkan ke
 * pelanggan; `error.digest` dicetak kecil supaya staf bisa mencocokkannya dengan
 * log server kalau perlu.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <MonoLabel tone="brass">Galat</MonoLabel>
        <h1 className="font-display text-3xl font-bold text-text">Halaman gagal dimuat</h1>
      </div>

      <Plate className="flex flex-col gap-3 p-5">
        <p className="text-sm leading-relaxed text-muted">
          Bukan kesalahan Anda. Coba muat ulang halaman ini; kalau tetap gagal, tunggu sebentar
          lalu buka lagi.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Booking yang sudah terbit tidak hilang — tiketnya tetap bisa dibuka lewat tautan yang
          Anda terima.
        </p>
        {error.digest === undefined ? null : (
          <p className="font-mono text-[11px] text-ghost">Kode galat: {error.digest}</p>
        )}
      </Plate>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
        <button
          type="button"
          onClick={reset}
          className="min-h-12 rounded-[3px] border border-brass px-5 font-mono text-xs tracking-[0.08em] text-brass uppercase transition-colors duration-150 hover:bg-brass/10"
        >
          Muat ulang
        </button>
        <Link href="/" className="font-mono text-xs text-muted underline underline-offset-4">
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}