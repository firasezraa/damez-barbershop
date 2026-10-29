"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ChairRow } from "@/features/admin/day-view";
import { formatRupiah } from "@/features/catalogue/types";

/**
 * Matriks 3 kursi untuk kasir. Setiap tombol memanggil route admin dan memuat
 * ulang data; tidak ada perubahan status yang dilakukan di sisi klien.
 */

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Belum bayar DP",
  confirmed: "Terkonfirmasi",
  in_progress: "Sedang dilayani",
  completed: "Selesai",
  no_show: "Tidak hadir",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
};

function formatTime(iso: string | Date): string {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

type ActionKind = "in_progress" | "completed" | "no_show" | "settle-cash" | "settle-qris";

export type ServiceOption = { id: string; name: string; priceIdr: number };

export function ChairBoard({
  chairs,
  services,
  dateJakarta,
}: {
  chairs: ChairRow[];
  services: ServiceOption[];
  dateJakarta: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function post(url: string, body: unknown, key: string): Promise<void> {
    setBusy(key);
    setMessage(null);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string; message?: string };
        setMessage(payload.message ?? payload.error ?? "Aksi gagal.");
        return;
      }

      router.refresh();
    } catch {
      setMessage("Koneksi terputus. Coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  function actionsFor(booking: ChairRow["bookings"][number]): { label: string; action: ActionKind }[] {
    const actions: { label: string; action: ActionKind }[] = [];

    if (booking.status === "confirmed") {
      actions.push({ label: "Mulai layani", action: "in_progress" });
    }
    if (booking.status === "in_progress") {
      actions.push({ label: "Selesai", action: "completed" });
      actions.push({ label: "Tidak hadir", action: "no_show" });
    }
    if (!booking.settled && (booking.status === "confirmed" || booking.status === "in_progress")) {
      actions.push({ label: "Lunas tunai", action: "settle-cash" });
      actions.push({ label: "Lunas QRIS", action: "settle-qris" });
    }

    return actions;
  }

  async function run(bookingId: string, action: ActionKind): Promise<void> {
    const key = `${bookingId}:${action}`;

    if (action === "settle-cash" || action === "settle-qris") {
      await post(
        "/api/admin/settle",
        { bookingId, method: action === "settle-cash" ? "cash" : "qris" },
        key,
      );
      return;
    }

    await post(`/api/admin/bookings/${bookingId}/status`, { status: action }, key);
  }

  return (
    <div className="flex flex-col gap-6">
      <div aria-live="polite" role="status" className="min-h-6 text-sm text-danger">
        {message}
      </div>

      <WalkInForm
        chairs={chairs}
        services={services}
        dateJakarta={dateJakarta}
        onDone={() => router.refresh()}
        onError={setMessage}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {chairs.map((chair) => (
          <section
            key={chair.barberId}
            aria-labelledby={`kursi-${chair.chairNumber}`}
            className="flex flex-col gap-3 rounded-card border border-surface-2 bg-surface p-4"
          >
            <h2 id={`kursi-${chair.chairNumber}`} className="font-display text-lg text-text">
              Kursi {chair.chairNumber} · {chair.barberName}
            </h2>

            {chair.bookings.length === 0 ? (
              <p className="text-sm text-muted">Belum ada jadwal.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {chair.bookings.map((booking) => (
                  <li key={booking.id} className="rounded-card bg-surface-2/40 p-3">
                    <p className="text-sm text-brass">
                      {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                    </p>
                    <p className="font-display text-base text-text">{booking.customerName}</p>
                    <p className="text-sm text-muted">
                      {booking.services.join(", ")} · {booking.bookingCode}
                      {booking.bookingType === "walk_in" ? " · walk-in" : ""}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {STATUS_LABEL[booking.status] ?? booking.status} · total{" "}
                      {formatRupiah(booking.totalIdr)} · DP {formatRupiah(booking.dpIdr)} ·{" "}
                      {booking.settled
                        ? `lunas ${formatRupiah(booking.remainingIdr)}`
                        : `sisa ${formatRupiah(booking.remainingIdr)}`}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {actionsFor(booking).map(({ label, action }) => (
                        <button
                          key={action}
                          type="button"
                          disabled={busy === `${booking.id}:${action}`}
                          onClick={() => void run(booking.id, action)}
                          className="min-h-11 rounded-card border border-surface-2 px-3 py-2 text-sm text-text transition hover:border-brass disabled:opacity-50"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function WalkInForm({
  chairs,
  services,
  dateJakarta,
  onDone,
  onError,
}: {
  chairs: ChairRow[];
  services: ServiceOption[];
  dateJakarta: string;
  onDone: () => void;
  onError: (message: string) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+62");
  const [barberId, setBarberId] = useState(chairs[0]?.barberId ?? "");
  const [startTime, setStartTime] = useState("10:00");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit(): Promise<void> {
    setBusy(true);

    try {
      const response = await fetch("/api/admin/walk-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          barberId,
          startTime: `${dateJakarta}T${startTime}:00+07:00`,
          serviceIds,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string; message?: string };
        onError(payload.message ?? payload.error ?? "Walk-in gagal.");
        return;
      }

      setFullName("");
      setPhone("+62");
      setServiceIds([]);
      onDone();
    } catch {
      onError("Koneksi terputus.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-card border border-brass/40 bg-surface p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <h2 className="font-display text-lg text-text">Tamu walk-in</h2>
      <p className="text-sm text-muted">
        Kursi langsung terisi tanpa DP. Isi data, lalu tandai lunas setelah cukur.
      </p>

      <div className="grid gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm text-muted">
          Nama
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="min-h-11 rounded-card border border-surface-2 bg-surface-2/40 px-3 text-base text-text"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          WhatsApp
          <input
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="min-h-11 rounded-card border border-surface-2 bg-surface-2/40 px-3 text-base text-text"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Kursi
          <select
            value={barberId}
            onChange={(event) => setBarberId(event.target.value)}
            className="min-h-11 rounded-card border border-surface-2 bg-surface-2/40 px-3 text-base text-text"
          >
            {chairs.map((chair) => (
              <option key={chair.barberId} value={chair.barberId}>
                Kursi {chair.chairNumber} · {chair.barberName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Jam
          <input
            required
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="min-h-11 rounded-card border border-surface-2 bg-surface-2/40 px-3 text-base text-text"
          />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm text-muted">Layanan</legend>
        <div className="flex flex-wrap gap-2">
          {services.map((service) => (
            <label
              key={service.id}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-card border border-surface-2 px-3 py-2 text-sm text-text"
            >
              <input
                type="checkbox"
                className="size-5 accent-brass"
                checked={serviceIds.includes(service.id)}
                onChange={() =>
                  setServiceIds((current) =>
                    current.includes(service.id)
                      ? current.filter((id) => id !== service.id)
                      : [...current, service.id],
                  )
                }
              />
              {service.name} · {formatRupiah(service.priceIdr)}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={busy || serviceIds.length === 0}
        className="min-h-11 self-start rounded-card bg-brass px-5 py-3 text-sm font-medium text-ink disabled:opacity-50"
      >
        {busy ? "Menyimpan..." : "Catat walk-in"}
      </button>
    </form>
  );
}