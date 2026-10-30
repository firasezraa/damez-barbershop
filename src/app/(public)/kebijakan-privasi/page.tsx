import type { Metadata } from "next";
import Link from "next/link";
import { MonoLabel, Plate } from "@/components/ui/plate";
import { formatRupiah } from "@/features/catalogue/types";
import {
  CANCEL_CUTOFF_HOURS,
  DOWN_PAYMENT_IDR,
  HOLD_TTL_SECONDS,
  LATE_TOLERANCE_MINUTES,
} from "@/lib/config/constants";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — Damez Barbershop",
  description:
    "Data apa yang disimpan saat booking kursi di Damez Barbershop, untuk apa dipakai, siapa yang bisa membukanya, dan cara meminta salinan atau penghapusan.",
  robots: { index: true, follow: true },
};

/**
 * Halaman ini menyebut apa yang benar-benar dilakukan sistem, bukan kebijakan
 * contoh: daftar di bawah disusun dari skema database dan alur booking yang jalan
 * (§17.7.1 meminta tautan privasi di kaki beranda, dan tautan tanpa halaman adalah
 * janji kosong).
 */
const ITEMS = [
  {
    label: "Saat Anda memesan",
    body: "Nama, nomor WhatsApp, layanan yang dipilih, dan jam kedatangan. Tidak ada akun, tidak ada email, tidak ada kata sandi untuk pelanggan.",
  },
  {
    label: "Selama Anda dilayani",
    body: "Status booking, kode booking, nominal DP, dan pelunasan di kasir. Catatan inilah yang tampil di papan kasir dan di rekap harian gerai.",
  },
  {
    label: "Untuk apa",
    body: "Menahan kursi pada jam yang Anda pilih, mengirim tiket serta pengingat lewat WhatsApp, dan menagih sisa tagihan saat Anda datang.",
  },
  {
    label: "Yang tidak kami lakukan",
    body: "Data tidak dijual dan tidak dipakai untuk iklan. Situs ini tidak memasang pelacak iklan maupun analitik pihak ketiga.",
  },
  {
    label: "Siapa yang bisa membuka",
    body: "Hanya staf gerai dengan akun berperan — kasir dan pemilik. Masuk staf diverifikasi di server, dan setiap tindakan kasir tercatat di jejak audit.",
  },
  {
    label: "Pembayaran",
    body: "DP diproses oleh Midtrans. Data kartu atau rekening Anda tidak pernah masuk ke sistem gerai; yang kami terima hanya status pembayaran dan nominalnya.",
  },
  {
    label: "Lama penyimpanan",
    body: "Catatan booking, pembayaran, dan jejak audit disimpan sebagai riwayat kas gerai. Kursi yang DP-nya tidak masuk dalam batas waktu dilepas dan ditandai kedaluwarsa.",
  },
  {
    label: "Permintaan Anda",
    body: "Balas pesan tiket WhatsApp Anda untuk meminta salinan, perbaikan, atau penghapusan data. Staf gerai yang memprosesnya.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-2">
        <MonoLabel tone="brass">Damez Barbershop</MonoLabel>
        <h1 className="font-display text-3xl font-bold text-text">Kebijakan privasi</h1>
        <p className="text-sm leading-relaxed text-muted">
          Booking kursi tidak butuh akun, jadi data yang kami simpan sesedikit mungkin: cukup untuk
          menahan kursi Anda, mengirim tiket, dan menagih sisa tagihan di kasir.
        </p>
      </header>

      <Plate className="grid gap-px overflow-hidden bg-line">
        {ITEMS.map((item) => (
          <div key={item.label} className="flex flex-col gap-1 bg-surface px-5 py-4">
            <MonoLabel>{item.label}</MonoLabel>
            <p className="text-sm leading-relaxed text-muted">{item.body}</p>
          </div>
        ))}
      </Plate>

      <section className="flex flex-col gap-2 border-t border-line pt-5">
        <MonoLabel>Cookie</MonoLabel>
        <p className="text-sm leading-relaxed text-muted">
          Halaman publik tidak memasang cookie. Cookie hanya muncul setelah staf masuk ke halaman
          admin, dan itu berisi sesi masuk staf — bukan pelacak.
        </p>
      </section>

      <section className="flex flex-col gap-2 border-t border-line pt-5">
        <MonoLabel>Aturan yang terkait</MonoLabel>
        <p className="text-sm leading-relaxed text-muted">
          Kursi ditahan {Math.round(HOLD_TTL_SECONDS / 60)} menit sampai DP
          {formatRupiah(DOWN_PAYMENT_IDR)} masuk.
          Pembatalan atau perubahan jadwal masih bisa dilakukan lebih dari {CANCEL_CUTOFF_HOURS} jam
          sebelum jadwal; keterlambatan lebih dari {LATE_TOLERANCE_MINUTES} menit dicatat sebagai
          tidak hadir.
        </p>
      </section>

      <div className="flex flex-wrap gap-4 border-t border-line pt-5">
        <Link href="/" className="font-mono text-xs text-muted underline underline-offset-4">
          Kembali ke beranda
        </Link>
        <Link href="/booking" className="font-mono text-xs text-brass underline underline-offset-4">
          Kunci kursi sekarang
        </Link>
      </div>
    </main>
  );
}
