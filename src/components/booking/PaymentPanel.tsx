"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Panel pembayaran DP di halaman tiket. Nominal tidak dikirim klien; server
 * mengambilnya dari baris booking (IDEA.md §7). Setelah Snap mengembalikan
 * token, pelanggan diarahkan ke halaman pembayaran Midtrans; pada
 * `MOCK_MIDTRANS=true` server memberi token palsu dan panel ini memberi tahu
 * bahwa pembayaran disimulasikan, lalu status dicek ulang.
 */
export function PaymentPanel({ bookingCode }: { bookingCode: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function startPayment(): Promise<void> {
    setBusy(true);
    setNote(null);

    try {
      const response = await fetch("/api/booking/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookingCode }),
      });

      const body = (await response.json()) as {
        mock?: boolean;
        redirectUrl?: string;
        error?: string;
        detail?: string;
      };

      if (response.status === 200 && body.redirectUrl !== undefined) {
        if (body.mock === true) {
          setNote("Mode uji: pembayaran disimulasikan. Tekan Cek status setelah webhook diproses.");
          return;
        }

        window.location.assign(body.redirectUrl);
        return;
      }

      if (body.error === "HOLD_EXPIRED") {
        setNote("Waktu pembayaran habis. Slot dilepas, silakan booking ulang.");
        return;
      }

      setNote("Pembayaran belum bisa dimulai. Coba lagi sebentar lagi.");
    } catch {
      setNote("Koneksi terputus. Periksa jaringan lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => void startPayment()}
        disabled={busy}
        className="min-h-11 rounded-card bg-brass px-5 py-3 text-sm font-medium text-ink disabled:opacity-50"
      >
        {busy ? "Menyiapkan pembayaran..." : "Bayar DP Rp 20.000"}
      </button>

      <button
        type="button"
        onClick={() => router.refresh()}
        className="min-h-11 rounded-card border border-surface-2 px-5 py-3 text-sm text-text"
      >
        Cek status pembayaran
      </button>

      <div aria-live="polite" role="status" className="text-sm text-muted">
        {note}
      </div>
    </div>
  );
}