"use client";

import Link from "next/link";
import { useState } from "react";
import { ACTION_CLASSES, MonoLabel, Plate } from "@/components/ui/plate";
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

const STEP_ORDER = [1, 2, 3, 4] as const;

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

/** Plat pilihan: satu baris per item, nomor urut mono, bingkai brass saat dipilih. */
function optionClasses(selected: boolean): string {
  return `flex cursor-pointer items-center gap-4 rounded-[3px] border px-4 py-3.5 transition-colors duration-150 ${
    selected ? "border-brass bg-brass/10" : "border-line bg-surface hover:border-line-2"
  }`;
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

  const chosen = services.filter((service) => serviceIds.includes(service.id));
  const chosenBarber = barbers.find((barber) => barber.id === barberId) ?? null;

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
        const picked = body.barbers.find((entry) => entry.barberId === barberId);
        setSlots(picked?.slots ?? []);
        if (picked === undefined) {
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
    <div className="flex flex-col gap-5">
      {/* Empat langkah, satu baris: nomor mono jadi penanda posisi, bukan pil berwarna. */}
      <ol
        aria-label="Langkah pemesanan"
        className="grid grid-cols-4 gap-px border-y border-line bg-line-2"
      >
        {STEP_ORDER.map((value) => {
          const active = step === value;
          const done = step > value;
          return (
            <li
              key={value}
              aria-current={active ? "step" : undefined}
              className={`flex flex-col gap-1 px-3 py-3 ${
                active
                  ? "bg-surface-2 shadow-[inset_0_-2px_0_0_var(--color-brass)]"
                  : "bg-surface"
              }`}
            >
              <MonoLabel tone={active ? "brass" : done ? "muted" : "ghost"}>
                {String(value).padStart(2, "0")}
              </MonoLabel>
              <span className={`text-xs ${active ? "text-text" : "text-muted"}`}>
                {STEPS[value]}
              </span>
            </li>
          );
        })}
      </ol>

      {step === 5 ? (
        <p className="flex items-center gap-3 border-y border-brass/40 bg-brass/5 px-3 py-2">
          <MonoLabel tone="brass">Slot terkunci</MonoLabel>
          <span className="text-sm text-text">
            Bayar DP lewat halaman tiket untuk mengonfirmasi jadwal ini.
          </span>
        </p>
      ) : null}

      <div aria-live="polite" role="status" className="min-h-6 text-sm text-danger">
        {error}
      </div>

      {step === 1 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-display text-xl text-text">Pilih layanan</legend>
          <p className="mb-1 font-mono text-xs text-muted">
            Bisa pilih lebih dari satu layanan — total dan durasi dihitung otomatis.
          </p>
          {services.map((service, index) => {
            const selected = serviceIds.includes(service.id);
            return (
              <label key={service.id} className={optionClasses(selected)}>
                <MonoLabel tone={selected ? "brass" : "ghost"}>
                  {String(index + 1).padStart(2, "0")}
                </MonoLabel>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-display text-[15px] leading-snug font-semibold text-text">
                    {service.name}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {service.durationMinutes} menit · {formatRupiah(service.priceIdr)}
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="size-5 shrink-0 accent-brass"
                  checked={selected}
                  onChange={() => toggleService(service.id)}
                />
              </label>
            );
          })}
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-display text-xl text-text">Pilih barber</legend>
          {barbers.map((barber) => {
            const selected = barberId === barber.id;
            return (
              <label key={barber.id} className={optionClasses(selected)}>
                <MonoLabel tone={selected ? "brass" : "ghost"}>
                  {String(barber.chairNumber).padStart(2, "0")}
                </MonoLabel>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-display text-[15px] leading-snug font-semibold text-text">
                    {barber.fullName}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    Kursi {barber.chairNumber}
                    {barber.specialty === null ? "" : ` · ${barber.specialty}`}
                  </span>
                </span>
                <input
                  type="radio"
                  name="barber"
                  className="size-5 shrink-0 accent-brass"
                  checked={selected}
                  onChange={() => setBarberId(barber.id)}
                />
              </label>
            );
          })}
        </fieldset>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <MonoLabel>Tanggal</MonoLabel>
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
              className="min-h-12 rounded-[3px] border border-line bg-surface px-4 py-3 font-mono text-base text-text focus:border-brass focus:outline-none"
            />
          </label>

          <button
            type="button"
            onClick={() => void loadSlots()}
            disabled={busy}
            className="min-h-11 rounded-[3px] border border-brass px-4 py-3 font-mono text-xs tracking-[0.08em] text-brass uppercase transition-colors duration-150 hover:bg-brass/10 disabled:opacity-50"
          >
            {busy ? "Memuat jadwal..." : "Tampilkan jadwal tersedia"}
          </button>

          <MonoLabel>Jam dalam WIB · slot kelipatan 15 menit</MonoLabel>
          <p className="text-xs text-muted">
            Jam yang tidak muncul berarti barber sedang istirahat atau sudah terisi.
          </p>

          {slots.length === 0 ? (
            <p className="text-sm text-muted">
              Belum ada slot terbuka. Coba tanggal lain atau barber lain.
            </p>
          ) : (
            <ul className="grid grid-cols-4 gap-1 sm:grid-cols-6">
              {slots.map((option) => {
                const active = slot === option;
                return (
                  <li key={option}>
                    {/* Nama tombol hanya jam ("14.00") — E2E mencocokkannya persis
                        dengan /^\d{2}\.\d{2}$/, jadi jangan tambah teks di dalam. */}
                    <button
                      type="button"
                      onClick={() => setSlot(option)}
                      aria-pressed={active}
                      className={`flex h-11 w-full items-center justify-center font-mono text-[13px] transition-colors duration-150 ${
                        active
                          ? "border border-brass bg-brass/15 font-semibold text-brass shadow-[inset_0_0_0_1px_var(--color-brass)]"
                          : "border border-line bg-surface text-text hover:border-brass/60"
                      }`}
                    >
                      {formatTime(option)}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <MonoLabel>Nama lengkap</MonoLabel>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              className="min-h-12 rounded-[3px] border border-line bg-surface px-4 py-3 text-base text-text focus:border-brass focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <MonoLabel>Nomor WhatsApp (format +62)</MonoLabel>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+628****7890"
              autoComplete="tel"
              className="min-h-12 rounded-[3px] border border-line bg-surface px-4 py-3 font-mono text-base text-text focus:border-brass focus:outline-none"
            />
          </label>
          <p className="text-sm text-muted">
            Kami hanya menyimpan nama dan nomor WhatsApp Anda untuk keperluan tiket dan pengingat.
          </p>
        </div>
      )}

      {step === 5 && ticket !== null && (
        <section aria-labelledby="tiket" className="flex flex-col gap-4">
          <h2 id="tiket" className="font-display text-2xl text-text">
            Tiket Anda
          </h2>
          <Plate tone="paper" className="p-5">
            <div className="flex items-center justify-between gap-4 border-b border-paper/40 pb-3">
              <span className="font-mono text-xs tracking-[0.12em] uppercase opacity-70">
                Kode booking
              </span>
              <span className="font-mono text-lg font-semibold tracking-[0.06em]">
                {ticket.bookingCode}
              </span>
            </div>
            <dl className="mt-3 grid gap-2 font-mono text-[13px]">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-[11px] tracking-[0.1em] uppercase">Jadwal</dt>
                <dd>
                  {slot === null ? "—" : formatTime(slot)} WIB ·{" "}
                  {chosenBarber === null ? "barber" : chosenBarber.fullName}
                  {chosenBarber === null ? "" : ` · kursi ${chosenBarber.chairNumber}`}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-[11px] uppercase tracking-[0.1em]">Total layanan</dt>
                <dd>{formatRupiah(ticket.totalIdr)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-[11px] uppercase tracking-[0.1em]">DP saat ini</dt>
                <dd>{formatRupiah(ticket.dpIdr)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-[11px] uppercase tracking-[0.1em]">Sisa dibayar di kasir</dt>
                <dd>{formatRupiah(ticket.remainingIdr)}</dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-paper/40 pt-3 font-mono text-[11px] tracking-[0.06em] uppercase">
              Slot dikunci sampai{" "}
              {new Date(ticket.holdExpiresAt).toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Jakarta",
              })}{" "}
              WIB
            </p>
          </Plate>
          <Link
            href={`/booking/success/${ticket.bookingCode}`}
            className="inline-flex min-h-11 items-center rounded-[3px] border border-brass px-5 py-3 text-sm text-brass"
          >
            Buka halaman tiket &amp; bayar DP
          </Link>
        </section>
      )}

      {step < 5 && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          {step > 1 && (
            <button
              type="button"
              onClick={() => {
                setStep((step - 1) as Step);
                setError(null);
              }}
              className="min-h-11 rounded-[3px] border border-line px-4 py-3 text-sm text-muted transition-colors duration-150 hover:text-text"
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
              className={`${ACTION_CLASSES} sm:w-auto`}
            >
              <span>
                {step === 1
                  ? "Lanjut Pilih Barber"
                  : step === 2
                    ? "Lanjut Pilih Tanggal & Jam"
                    : "Lanjut Isi Data Diri"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              disabled={!canContinue || busy}
              onClick={() => void submitHold()}
              className={`${ACTION_CLASSES} gap-6 sm:w-auto`}
            >
              <span>{busy ? "Memproses..." : "Kunci Slot"}</span>
              <span className="font-mono text-xs font-semibold opacity-70">
                DP {formatRupiah(DOWN_PAYMENT_IDR)}
              </span>
            </button>
          )}
        </div>
      )}

      {step > 1 && step < 5 && (
        <p className="border-t border-dashed border-line pt-4 font-mono text-xs text-muted">
          {chosen.map((service) => service.name).join(", ")} · {durationMinutes} menit ·{" "}
          {formatRupiah(totalIdr)}
        </p>
      )}
    </div>
  );
}
