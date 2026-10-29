"use client";

import { useState } from "react";
import { formatRupiah, type PublicBarber, type PublicService } from "@/features/catalogue/types";
import { DOWN_PAYMENT_IDR } from "@/lib/config/constants";

/**
 * Wizard booking 4 langkah tanpa pembayaran (DP menyusul di R3). Semua keputusan
 * harga dan ketersediaan datang dari server: layanan dipilih dari katalog yang
 * dikirim server, slot diambil dari /api/slots/available, dan hold dibuat oleh
 * /api/booking/hold. Klien tidak pernah mengirim harga.
 */

type Slot = string;

type HoldResponse = {
  bookingCode: string;
  holdExpiresAt: string;
  totalIdr: number;
  dpIdr: number;
  remainingIdr: number;
};

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_ORDER = [1, 2, 3, 4, 5] as const;

const STEPS: Record<Step, string> = {
  1: "Pilih layanan",
  2: "Pilih barber",
  3: "Pilih tanggal dan jam",
  4: "Isi data diri",
  5: "Tiket Anda",
};

function formatTime(iso: string): string {
  const hours = iso.slice(11, 13);
  const minutes = iso.slice(14, 16);
  return `${hours}.${minutes}`;
}

function todayJakarta(): string {
  const shifted = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

export function BookingWizard({
  services,
  barbers,
}: {
  services: PublicService[];
  barbers: PublicBarber[];
}) {
  const [step, setStep] = useState<Step>(1);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(todayJakarta());
  const [slot, setSlot] = useState<Slot | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState<HoldResponse | null>(null);

  const durationMinutes = services
    .filter((service) => serviceIds.includes(service.id))
    .reduce((total, service) => total + service.durationMinutes, 0);
  const totalIdr = services
    .filter((service) => serviceIds.includes(service.id))
    .reduce((total, service) => total + service.priceIdr, 0);

  function toggleService(id: string): void {
    setServiceIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function loadSlots(): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/slots/available", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          date,
          serviceIds,
          ...(barberId === null ? {} : { barberId }),
        }),
      });

      if (response.status !== 200) {
        setError("Jadwal tidak bisa dimuat. Coba lagi sebentar.");
        setSlots([]);
        return;
      }

      const body = (await response.json()) as { barbers: { barberId: string; slots: string[] }[] };

      // Jangan pernah menampilkan slot barber lain saat pelanggan sudah memilih
      // barber tertentu: itu menyesatkan dan hold-nya akan ditolak server.
      if (barberId !== null) {
        const chosen = body.barbers.find((entry) => entry.barberId === barberId);
        setSlots(chosen?.slots ?? []);
        if (chosen === undefined) {
          setError("Barber ini tidak buka pada tanggal tersebut. Pilih tanggal lain atau ganti barber.");
        }
        return;
      }

      const fallback = body.barbers[0];
      setSlots(fallback?.slots ?? []);
      if (fallback !== undefined) {
        setBarberId(fallback.barberId);
      }
    } catch {
      setError("Koneksi terputus. Periksa jaringan lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function submitHold(): Promise<void> {
    if (slot === null) {
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/booking/hold", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          barberId,
          startTime: slot,
          serviceIds,
        }),
      });

      if (response.status === 201) {
        setTicket((await response.json()) as HoldResponse);
        setStep(5);
        return;
      }

      if (response.status === 409) {
        setError("Slot ini baru saja diambil pelanggan lain. Pilih jam lain.");
        setSlot(null);
        setStep(3);
        await loadSlots();
        return;
      }

      setError("Booking tidak bisa diproses. Periksa data Anda lalu coba lagi.");
    } catch {
      setError("Koneksi terputus. Periksa jaringan lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  const canContinue =
    (step === 1 && serviceIds.length > 0) ||
    (step === 2 && barberId !== null) ||
    (step === 3 && slot !== null) ||
    (step === 4 && fullName.trim().length >= 3 && /^\+62\d{8,13}$/.test(phone));

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-wrap gap-2 text-sm" aria-label="Langkah pemesanan">
        {STEP_ORDER.map((value) => {
          const active = step === value;
          return (
            <li
              key={value}
              aria-current={active ? "step" : undefined}
              className={`rounded-card px-3 py-2 ${
                active ? "bg-brass text-ink" : "bg-surface-2/60 text-muted"
              }`}
            >
              {value}. {STEPS[value]}
            </li>
          );
        })}
      </ol>

      <div aria-live="polite" role="status" className="min-h-6 text-sm text-danger">
        {error}
      </div>

      {step === 1 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-display text-xl text-text">Pilih layanan</legend>
          {services.map((service) => (
            <label
              key={service.id}
              className="flex cursor-pointer items-start justify-between gap-4 rounded-card border border-surface-2 bg-surface p-4"
            >
              <span className="flex flex-col">
                <span className="font-display text-base text-text">{service.name}</span>
                <span className="text-sm text-muted">{service.durationMinutes} menit</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-brass">{formatRupiah(service.priceIdr)}</span>
                <input
                  type="checkbox"
                  className="size-6 accent-brass"
                  checked={serviceIds.includes(service.id)}
                  onChange={() => toggleService(service.id)}
                />
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-display text-xl text-text">Pilih barber</legend>
          {barbers.map((barber) => (
            <label
              key={barber.id}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-card border border-surface-2 bg-surface p-4"
            >
              <span className="flex flex-col">
                <span className="font-display text-base text-text">{barber.fullName}</span>
                <span className="text-sm text-muted">
                  Kursi {barber.chairNumber}
                  {barber.specialty === null ? "" : ` · ${barber.specialty}`}
                </span>
              </span>
              <input
                type="radio"
                name="barber"
                className="size-6 accent-brass"
                checked={barberId === barber.id}
                onChange={() => setBarberId(barber.id)}
              />
            </label>
          ))}
        </fieldset>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-muted">
            Tanggal
            <input
              type="date"
              value={date}
              min={todayJakarta()}
              onChange={(event) => {
                setDate(event.target.value);
                setSlot(null);
                setSlots([]);
              }}
              onBlur={() => void loadSlots()}
              className="rounded-card border border-surface-2 bg-surface px-4 py-3 text-base text-text"
            />
          </label>

          <button
            type="button"
            onClick={() => void loadSlots()}
            disabled={busy}
            className="rounded-card border border-brass px-4 py-3 text-sm text-brass disabled:opacity-50"
          >
            {busy ? "Memuat jadwal..." : "Tampilkan jadwal tersedia"}
          </button>

          {slots.length === 0 ? (
            <p className="text-sm text-muted">
              Belum ada slot terbuka. Coba tanggal lain atau barber lain.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {slots.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => setSlot(option)}
                    aria-pressed={slot === option}
                    className={`min-h-11 rounded-card px-4 py-3 text-sm ${
                      slot === option ? "bg-brass text-ink" : "bg-surface-2/60 text-text"
                    }`}
                  >
                    {formatTime(option)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-muted">
            Nama lengkap
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              className="rounded-card border border-surface-2 bg-surface px-4 py-3 text-base text-text"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted">
            Nomor WhatsApp (format +62)
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+6281234567890"
              autoComplete="tel"
              className="rounded-card border border-surface-2 bg-surface px-4 py-3 text-base text-text"
            />
          </label>
          <p className="text-sm text-muted">
            Kami hanya menyimpan nama dan nomor WhatsApp Anda untuk keperluan tiket dan pengingat.
          </p>
        </div>
      )}

      {step === 5 && ticket !== null && (
        <section aria-labelledby="tiket" className="rounded-card border border-brass/40 bg-surface p-6">
          <h2 id="tiket" className="font-display text-2xl text-text">
            Tiket Anda
          </h2>
          <p className="mt-2 text-sm text-muted">
            Slot dikunci sampai {new Date(ticket.holdExpiresAt).toLocaleTimeString("id-ID")} WIB.
          </p>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Kode booking</dt>
              <dd className="font-display text-brass">{ticket.bookingCode}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Total layanan</dt>
              <dd className="text-text">{formatRupiah(ticket.totalIdr)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">DP saat ini</dt>
              <dd className="text-text">{formatRupiah(ticket.dpIdr)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Sisa dibayar di kasir</dt>
              <dd className="text-text">{formatRupiah(ticket.remainingIdr)}</dd>
            </div>
          </dl>
        </section>
      )}

      {step < 5 && (
        <div className="flex flex-wrap gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => {
                setStep((step - 1) as Step);
                setError(null);
              }}
              className="rounded-card border border-surface-2 px-4 py-3 text-sm text-text"
            >
              Kembali
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => {
                const next = (step + 1) as Step;
                setStep(next);
                if (next === 3) {
                  void loadSlots();
                }
              }}
              className="rounded-card bg-brass px-5 py-3 text-sm font-medium text-ink disabled:opacity-50"
            >
              {step === 1
                ? "Lanjut Pilih Barber"
                : step === 2
                  ? "Lanjut Pilih Tanggal & Jam"
                  : "Lanjut Isi Data Diri"}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canContinue || busy}
              onClick={() => void submitHold()}
              className="rounded-card bg-brass px-5 py-3 text-sm font-medium text-ink disabled:opacity-50"
            >
              {busy ? "Memproses..." : `Kunci Slot (DP ${formatRupiah(DOWN_PAYMENT_IDR)})`}
            </button>
          )}
        </div>
      )}

      {step > 1 && step < 5 && (
        <p className="text-sm text-muted">
          {services
            .filter((service) => serviceIds.includes(service.id))
            .map((service) => service.name)
            .join(", ")}{" "}
          · {durationMinutes} menit · {formatRupiah(totalIdr)}
        </p>
      )}
    </div>
  );
}