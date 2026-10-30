"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MonoLabel, Plate } from "@/components/ui/plate";
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

/**
 * Keadaan sel yang sama dengan papan di beranda (IDEA.md §18.5): kasir dan
 * pelanggan memakai bahasa visual yang sama, jadi tidak ada dua arti untuk
 * "terisi". Tiap keadaan membawa labelnya sendiri, bukan warna saja.
 */
const STATUS_TONE: Record<string, string> = {
  pending_payment: "border-brass/40 bg-brass/10 text-brass",
  confirmed: "border-line-2 bg-surface-2 text-text",
  in_progress: "border-brass bg-brass/15 text-brass",
  completed: "border-line bg-transparent text-ghost",
  no_show: "border-danger/40 bg-danger/10 text-danger",
  cancelled: "border-danger/40 bg-danger/10 text-danger",
  expired: "border-line bg-transparent text-ghost",
};

const ACTION_CLASSES =
  "flex min-h-12 items-center justify-center rounded-[3px] border px-4 text-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40";

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
    <div className="flex flex-col gap-5">
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

      <div className="grid gap-3 lg:grid-cols-3">
        {chairs.map((chair) => (
          <Plate key={chair.barberId} className="flex flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <h2
                id={`kursi-${chair.chairNumber}`}
                className="font-display text-base font-bold text-text"
              >
                Kursi {chair.chairNumber} · {chair.barberName}
              </h2>
              <MonoLabel tone={chair.bookings.length === 0 ? "ghost" : "brass"}>
                {`${chair.bookings.length} jadwal`}
              </MonoLabel>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-3">
              {chair.bookings.length === 0 ? (
                <p className="px-1 py-6 text-center font-mono text-xs text-ghost">
                  Kosong sepanjang hari
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {chair.bookings.map((booking) => {
                    const actions = actionsFor(booking);

                    return (
                      <li
                        key={booking.id}
                        className="flex flex-col gap-2 rounded-[3px] border border-line bg-surface-2/50 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono text-xs text-brass">
                            {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                          </span>
                          <span
                            className={`rounded-[2px] border px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] uppercase ${
                              STATUS_TONE[booking.status] ?? "border-line text-muted"
                            }`}
                          >
                            {STATUS_LABEL[booking.status] ?? booking.status}
                          </span>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span className="font-display text-[15px] leading-snug font-semibold text-text">
                            {booking.customerName}
                          </span>
                          <span className="font-mono text-[11px] text-muted">
                            {booking.services.join(", ")}{" "}
                            {/* Kode booking tidak boleh pecah di tengah token, dan
                                pemisahnya ikut menempel supaya tidak menggantung di
                                ujung baris: kasir membaca kode utuh. */}
                            <span className="whitespace-nowrap">· {booking.bookingCode}</span>
                            {booking.bookingType === "walk_in" ? (
                              <span className="whitespace-nowrap"> · walk-in</span>
                            ) : null}
                          </span>
                        </div>

                        <dl className="grid grid-cols-[auto_1fr] gap-x-3 font-mono text-[11px] text-muted">
                          <dt>Total</dt>
                          <dd className="text-right text-text">{formatRupiah(booking.totalIdr)}</dd>
                          <dt>DP</dt>
                          <dd className="text-right text-text">{formatRupiah(booking.dpIdr)}</dd>
                          <dt>{booking.settled ? "Lunas" : "Sisa"}</dt>
                          <dd className="text-right text-text">
                            {booking.settled
                              ? `lunas ${formatRupiah(booking.remainingIdr)}`
                              : formatRupiah(booking.remainingIdr)}
                          </dd>
                        </dl>

                        {actions.length === 0 ? null : (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {actions.map(({ label, action }) => (
                              <button
                                key={action}
                                type="button"
                                disabled={busy === `${booking.id}:${action}`}
                                onClick={() => void run(booking.id, action)}
                                className={`${ACTION_CLASSES} ${
                                  action === "no_show"
                                    ? "border-danger/40 text-danger hover:bg-danger/10"
                                    : "border-brass/60 text-brass hover:bg-brass/10"
                                }`}
                              >
                                {busy === `${booking.id}:${action}` ? "..." : label}
                              </button>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Plate>
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

  const field =
    "min-h-12 rounded-[3px] border border-line bg-surface px-3 text-base text-text focus:border-brass focus:outline-none";

  return (
    <Plate className="flex flex-col gap-3 border-brass/40 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-text">Tamu walk-in</h2>
        <MonoLabel>Tanpa DP · bayar penuh di kasir</MonoLabel>
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <MonoLabel>Nama</MonoLabel>
            <input
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <MonoLabel>WhatsApp</MonoLabel>
            <input
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={`${field} font-mono`}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <MonoLabel>Kursi</MonoLabel>
            <select
              value={barberId}
              onChange={(event) => setBarberId(event.target.value)}
              className={field}
            >
              {chairs.map((chair) => (
                <option key={chair.barberId} value={chair.barberId}>
                  Kursi {chair.chairNumber} · {chair.barberName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <MonoLabel>Jam</MonoLabel>
            <input
              required
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className={`${field} font-mono`}
            />
          </label>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Layanan</legend>
          <MonoLabel>Layanan</MonoLabel>
          <div className="flex flex-wrap gap-2">
            {services.map((service) => {
              const selected = serviceIds.includes(service.id);
              return (
                <label
                  key={service.id}
                  className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-[3px] border px-3 text-sm transition-colors duration-150 ${
                    selected ? "border-brass bg-brass/10 text-text" : "border-line text-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="size-5 accent-brass"
                    checked={selected}
                    onChange={() =>
                      setServiceIds((current) =>
                        current.includes(service.id)
                          ? current.filter((id) => id !== service.id)
                          : [...current, service.id],
                      )
                    }
                  />
                  <span className="font-mono text-xs">
                    {service.name} · {formatRupiah(service.priceIdr)}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={busy || serviceIds.length === 0}
          className="min-h-12 self-start rounded-[3px] bg-brass px-6 font-display text-base font-bold text-ink transition-colors duration-150 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Menyimpan..." : "Catat walk-in"}
        </button>
      </form>
    </Plate>
  );
}
