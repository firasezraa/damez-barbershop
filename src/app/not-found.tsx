import Link from "next/link";
import { MonoLabel, Plate } from "@/components/ui/plate";

/**
 * 404 dalam sistem sendiri. Rute yang paling mungkin salah ketik adalah tautan
 * tiket (`/booking/success/<kode>`), jadi halaman ini menjelaskan bentuk kode
 * booking — bukan sekadar "halaman tidak ditemukan" — supaya pelanggan tahu apa
 * yang harus diperiksa.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <MonoLabel tone="brass">404</MonoLabel>
        <h1 className="font-display text-3xl font-bold text-text">Halaman ini tidak ada</h1>
      </div>

      <Plate className="flex flex-col gap-3 p-5">
        <p className="text-sm leading-relaxed text-muted">
          Kalau Anda membuka tautan tiket, periksa kodenya: bentuknya{" "}
          <span className="font-mono text-text">DMZ-XXXXXXXX-XXXX</span>, dan hanya ada kalau
          booking-nya benar-benar terbit.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Kode yang sudah kedaluwarsa tidak berlaku lagi, tetapi kursinya bisa dipesan ulang
          selama masih ada jam kosong.
        </p>
      </Plate>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
        <Link href="/booking" className="font-mono text-xs text-brass underline underline-offset-4">
          Kunci kursi
        </Link>
        <Link href="/" className="font-mono text-xs text-muted underline underline-offset-4">
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}