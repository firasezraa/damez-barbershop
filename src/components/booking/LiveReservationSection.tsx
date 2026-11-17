"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  Armchair,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Coffee,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { SlotCell } from "@/components/ui/slot-cell";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import type { BoardChair, BoardSlot, DayBoard } from "@/features/catalogue/day-board";
import { formatRupiah, type PublicBarber } from "@/features/catalogue/types";
import {
  CANCEL_CUTOFF_HOURS,
  DOWN_PAYMENT_IDR,
  HOLD_TTL_SECONDS,
  LATE_TOLERANCE_MINUTES,
} from "@/lib/config/constants";

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

interface LiveReservationSectionProps {
  board: DayBoard;
  barbers: PublicBarber[];
}

type ViewMode = "cards" | "matrix";

export function LiveReservationSection({
  board,
  barbers,
}: LiveReservationSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const headingId = useId();

  const holdMinutes = Math.round(HOLD_TTL_SECONDS / 60);

  // Find barber details matching chair
  const getBarberDetails = (chairNumber: number) => {
    return barbers.find((b) => b.chairNumber === chairNumber);
  };

  // Count available slots for a chair
  const getAvailableSlotCount = (chair: BoardChair) => {
    if (chair.off) return 0;
    return chair.slots.filter((s) => s.state === "free").length;
  };

  // Total available slots across all active chairs
  const totalFreeSlots = board.chairs
    .flatMap((c) => (c.off ? [] : c.slots))
    .filter((s) => s.state === "free").length;

  // Partition slots into natural, comfortable time-of-day buckets
  const categorizeSlots = (slots: BoardSlot[]) => {
    return {
      morning: slots.filter((s) => s.hour >= 10 && s.hour < 14),
      afternoon: slots.filter((s) => s.hour >= 14 && s.hour < 18),
      evening: slots.filter((s) => s.hour >= 18 && s.hour <= 21),
    };
  };

  return (
    <section
      id="papan-jadwal"
      aria-labelledby={headingId}
      className="relative overflow-hidden border-b border-line bg-ink py-20 lg:py-28 scroll-mt-28"
    >
      {/* Subtle ambient lighting */}
      <div
        className="pointer-events-none absolute -top-48 right-1/4 h-[500px] w-[500px] rounded-full bg-brass/5 blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-48 left-12 h-[450px] w-[450px] rounded-full bg-brass/5 blur-[120px]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* 1. SECTION HEADER: Calm, refined, confident hierarchy                     */}
        {/* ========================================================================= */}
        <ScrollReveal duration={0.8}>
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-brass/30 bg-brass/10 px-4 py-1.5 text-xs font-medium text-brass">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono uppercase tracking-wider text-[11px]">
                Jadwal Real-Time Hari Ini
              </span>
              <span className="text-muted/60">•</span>
              <span className="font-mono text-text/90">{board.label}</span>
            </div>

            <h2
              id={headingId}
              className="mt-5 font-display text-3xl font-extrabold tracking-tight text-text sm:text-4xl lg:text-5xl"
            >
              Ketersediaan Kursi & Reservasi
            </h2>

            <p className="mt-3.5 max-w-2xl text-base text-muted sm:text-lg">
              Pilih master barber dan jam kedatangan Anda. Kursi ditahan otomatis selama {holdMinutes} menit
              begitu slot dipilih, menjamin kedatangan tanpa antre.
            </p>

            {/* Clean Assurance Strip: 3 concise rules in a balanced line */}
            <div className="mt-7 flex flex-wrap items-center justify-start gap-x-6 gap-y-2 font-mono text-xs text-muted sm:text-[13px]">
              <span className="flex items-center gap-1.5 text-text">
                <ShieldCheck className="h-4 w-4 text-brass" />
                <span>DP Flat <strong className="text-brass">{formatRupiah(DOWN_PAYMENT_IDR)}</strong> (Potong di Kasir)</span>
              </span>
              <span className="hidden sm:inline text-line">•</span>
              <span className="flex items-center gap-1.5 text-text">
                <Zap className="h-4 w-4 text-brass" />
                <span>Kunci Kursi <strong>{holdMinutes} Menit</strong></span>
              </span>
              <span className="hidden sm:inline text-line">•</span>
              <span className="flex items-center gap-1.5 text-text">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Tanpa Akun (Tiket via WhatsApp)</span>
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* ========================================================================= */}
        {/* 2. SCHEDULE CONSOLE: View Switcher & Live Station Cards / Matrix           */}
        {/* ========================================================================= */}
        <ScrollReveal delay={0.15} duration={0.8} className="mt-12">
          <div className="rounded-2xl border border-line bg-surface/70 p-6 sm:p-8 backdrop-blur-md">
          {/* Header Bar inside Schedule Console */}
          <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <div>
                <h3 className="font-display text-base font-bold text-text">
                  3 Kursi Master Barber Damez
                </h3>
                <p className="font-mono text-xs text-muted">
                  {totalFreeSlots} slot tersedia untuk dipesan hari ini (10:00 – 21:00 WIB)
                </p>
              </div>
            </div>

            {/* View Mode Toggle: Kartu vs Matriks */}
            <div className="flex items-center gap-3">
              {/* Legend preview */}
              <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono text-muted mr-2">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Bebas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brass-deep" />
                  Istirahat
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-line-2" />
                  Terisi
                </span>
              </div>

              <div className="flex items-center rounded-lg border border-line bg-ink/80 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`rounded-md px-3.5 py-1.5 font-medium transition-all ${
                    viewMode === "cards"
                      ? "bg-surface-2 text-brass font-semibold shadow-sm"
                      : "text-muted hover:text-text"
                  }`}
                >
                  Tampilan Kursi
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("matrix")}
                  className={`rounded-md px-3.5 py-1.5 font-medium transition-all ${
                    viewMode === "matrix"
                      ? "bg-surface-2 text-brass font-semibold shadow-sm"
                      : "text-muted hover:text-text"
                  }`}
                >
                  Tabel Jadwal
                </button>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: ELEGANT MASTER BARBER STATIONS (DEFAULT) */}
          {viewMode === "cards" ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {board.chairs.map((chair) => {
                const barber = getBarberDetails(chair.chairNumber);
                const freeCount = getAvailableSlotCount(chair);
                const { morning, afternoon, evening } = categorizeSlots(chair.slots);

                return (
                  <div
                    key={chair.chairNumber}
                    className={`flex flex-col justify-between rounded-xl border transition-all duration-200 ${
                      chair.off
                        ? "border-line bg-surface/40 opacity-80"
                        : "border-line bg-surface hover:border-brass/50 shadow-sm"
                    }`}
                  >
                    {/* Station Card Header: High contrast, uncrowded layout */}
                    <div className="border-b border-line p-5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs uppercase tracking-wider text-brass font-semibold">
                          Kursi {chair.chairNumber}
                        </span>
                        {chair.off ? (
                          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-mono text-[11px] text-ghost">
                            Libur
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 rounded-full border border-emerald-800/40 bg-emerald-950/40 px-2.5 py-0.5 font-mono text-[11px] text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            {freeCount} Slot Bebas
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${
                            chair.off
                              ? "border-line bg-surface-2 text-ghost"
                              : "border-brass/30 bg-brass/10 text-brass"
                          }`}
                        >
                          <Armchair className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-display text-lg font-bold text-text truncate">
                              {chair.barberName}
                            </h4>
                            {barber?.nickname ? (
                              <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">
                                &quot;{barber.nickname}&quot;
                              </span>
                            ) : null}
                          </div>
                          <p className="font-mono text-xs text-muted truncate">
                            {chair.barberTitle ?? barber?.specialty ?? "Master Barber & Styling"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Station Card Body: Compact 4-Column Time Buckets */}
                    <div className="flex-1 p-5">
                      {chair.off ? (
                        <div className="flex h-56 flex-col items-center justify-center text-center px-4">
                          <Coffee className="h-8 w-8 text-ghost/60" />
                          <p className="mt-3 font-display text-sm font-semibold text-text">
                            Libur Jadwal Mingguan
                          </p>
                          <p className="mt-1.5 text-xs leading-relaxed text-muted">
                            {chair.barberName} sedang beristirahat hari ini. Silakan pilih kursi master barber lain yang siap melayani.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {/* Bucket: Siang (4 slots on 1 neat line) */}
                          {morning.length > 0 && (
                            <div>
                              <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                                Siang (10:00 – 13:00)
                              </span>
                              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                                {morning.map((slot) => (
                                  <SlotButton
                                    key={slot.hour}
                                    slot={slot}
                                    barberId={barber?.id}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Bucket: Sore (4 slots on 1 neat line) */}
                          {afternoon.length > 0 && (
                            <div>
                              <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                                Sore (14:00 – 17:00)
                              </span>
                              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                                {afternoon.map((slot) => (
                                  <SlotButton
                                    key={slot.hour}
                                    slot={slot}
                                    barberId={barber?.id}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Bucket: Malam (3 slots on 1 neat line) */}
                          {evening.length > 0 && (
                            <div>
                              <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                                Malam (18:00 – 20:00)
                              </span>
                              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                                {evening.map((slot) => (
                                  <SlotButton
                                    key={slot.hour}
                                    slot={slot}
                                    barberId={barber?.id}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Station Card Footer: Primary CTA */}
                    <div className="border-t border-line bg-surface-2/30 p-4">
                      {chair.off ? (
                        <div className="py-2 text-center font-mono text-xs text-ghost">
                          Pilih Kursi 2 atau Kursi 3
                        </div>
                      ) : (
                        <Link
                          href={`/booking?barber=${barber?.id ?? ""}`}
                          className="flex items-center justify-center gap-2 w-full rounded-lg bg-brass/15 border border-brass/40 py-2.5 text-center text-xs font-bold text-brass hover:bg-brass hover:text-ink transition-all"
                        >
                          <span>Kunci Kursi {chair.chairNumber} ({chair.barberName.split(" ")[0]})</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* VIEW MODE 2: SPACIOUS ATELIER MATRIX TIMETABLE */
            <div className="mt-6 overflow-x-auto">
              <div className="min-w-[640px]">
                {/* Table Header */}
                <div className="grid grid-cols-[88px_repeat(3,1fr)] border-b border-line pb-3">
                  <div className="font-mono text-xs font-semibold uppercase text-muted">Jam</div>
                  {board.chairs.map((chair) => (
                    <div key={chair.chairNumber} className="border-l border-line pl-4">
                      <div className="font-mono text-xs text-brass font-semibold">Kursi {chair.chairNumber}</div>
                      <div className="font-display text-sm font-bold text-text">
                        {chair.barberName}
                      </div>
                      <div className="font-mono text-[11px] text-muted">
                        {chair.off ? "Libur Hari Ini" : `${getAvailableSlotCount(chair)} slot bebas`}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table Rows: 10:00 to 20:00 */}
                <div className="divide-y divide-line-2">
                  {Array.from({ length: board.endHour - board.startHour }, (_, index) => {
                    const hour = board.startHour + index;
                    return (
                      <div
                        key={hour}
                        className="grid grid-cols-[88px_repeat(3,1fr)] items-center py-2.5 hover:bg-surface-2/40 transition-colors"
                      >
                        <div className="font-mono text-xs font-semibold text-muted">
                          {formatHour(hour)}
                        </div>
                        {board.chairs.map((chair) => {
                          const barber = getBarberDetails(chair.chairNumber);
                          const slot = chair.slots.find((s) => s.hour === hour);
                          const isFree = slot?.state === "free";

                          return (
                            <div key={chair.chairNumber} className="border-l border-line px-3">
                              {isFree ? (
                                <Link
                                  href={`/booking?barber=${barber?.id ?? ""}&time=${formatHour(hour)}`}
                                  className="group block"
                                  title={`Pesan ${chair.barberName} jam ${formatHour(hour)}`}
                                >
                                  <SlotCell
                                    state="free"
                                    text="BEBAS (KLIK)"
                                    className="group-hover:border-brass group-hover:text-brass transition-colors"
                                  />
                                </Link>
                              ) : (
                                <SlotCell state={slot?.state ?? "free"} text={slot?.text} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>

        {/* ========================================================================= */}
        {/* 3. TIGA LANGKAH MUDAH & DIRECT ACTION CTA                                 */}
        {/* ========================================================================= */}
        <ScrollReveal delay={0.25} duration={0.8} className="mt-16">
          <div className="rounded-2xl border border-brass/30 bg-gradient-to-br from-surface via-surface to-brass/10 p-6 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brass font-mono">
                  <Calendar className="h-4 w-4" />
                  <span>Alur Pemesanan Cepat & Praktis</span>
                </div>
                <h3 className="mt-2 font-display text-2xl font-extrabold text-text sm:text-3xl">
                  Tiga Langkah Mengunci Kursi Anda
                </h3>
                <p className="mt-2 max-w-xl text-sm text-muted">
                  Tanpa perlu mendaftar akun atau instalasi aplikasi. Cukup tentukan waktu, bayar DP, dan kursi siap menyambut Anda.
                </p>

                {/* 3 Connected Step Cards */}
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-line bg-surface/80 p-4">
                    <span className="font-mono text-xs font-bold text-brass">01</span>
                    <h4 className="mt-1 font-display text-sm font-bold text-text">Pilih Barber & Jam</h4>
                    <p className="mt-1 text-xs text-muted leading-relaxed">
                      Lihat slot bebas barber di atas dan tentukan jam kedatangan yang sesuai.
                    </p>
                  </div>

                  <div className="rounded-xl border border-line bg-surface/80 p-4">
                    <span className="font-mono text-xs font-bold text-brass">02</span>
                    <h4 className="mt-1 font-display text-sm font-bold text-text">Kunci dengan DP</h4>
                    <p className="mt-1 text-xs text-muted leading-relaxed">
                      DP {formatRupiah(DOWN_PAYMENT_IDR)} via QRIS/VA. Kursi ditahan aman selama {holdMinutes} menit.
                    </p>
                  </div>

                  <div className="rounded-xl border border-line bg-surface/80 p-4">
                    <span className="font-mono text-xs font-bold text-brass">03</span>
                    <h4 className="mt-1 font-display text-sm font-bold text-text">Duduk & Selesai</h4>
                    <p className="mt-1 text-xs text-muted leading-relaxed">
                      Tiba di gerai tepat waktu. DP langsung memotong total nota tagihan di kasir.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Booking CTA Card */}
              <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase text-brass">Booking Gerai</span>
                  <span className="rounded bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                    {totalFreeSlots} Slot Hari Ini
                  </span>
                </div>

                <div>
                  <span className="font-mono text-xs text-muted">DP Kunci Kursi Flat</span>
                  <p className="font-display text-2xl font-extrabold text-text">
                    {formatRupiah(DOWN_PAYMENT_IDR)}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-ghost">
                    Toleransi hadir {LATE_TOLERANCE_MINUTES} menit · Reschedule H-{CANCEL_CUTOFF_HOURS} jam
                  </p>
                </div>

                <Link
                  href="/booking"
                  className="group flex h-14 w-full items-center justify-between rounded-lg bg-brass px-5 font-display text-base font-bold text-ink shadow-md transition-all hover:brightness-105"
                >
                  <span>Kunci Kursi Sekarang</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>

                <p className="text-center font-mono text-[10.5px] text-muted">
                  Tanpa registrasi · Tiket instan dikirim ke nomor WhatsApp Anda
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/**
 * Clean, compact, highly legible interactive slot button
 */
function SlotButton({
  slot,
  barberId,
}: {
  slot: BoardSlot;
  barberId?: string | undefined;
}) {
  const isFree = slot.state === "free";
  const isRest = slot.state === "rest";

  if (isFree) {
    return (
      <Link
        href={`/booking?barber=${barberId ?? ""}&time=${formatHour(slot.hour)}`}
        className="group flex flex-col items-center justify-center rounded-md border border-dashed border-emerald-500/40 bg-emerald-950/10 py-2 px-1 transition-all hover:border-brass hover:bg-brass/15 hover:shadow-sm"
        title={`Pilih jam ${formatHour(slot.hour)}`}
      >
        <span className="font-mono text-xs font-bold text-text group-hover:text-brass">
          {formatHour(slot.hour)}
        </span>
        <span className="text-[9px] font-mono text-emerald-400 group-hover:text-brass">
          Bebas
        </span>
      </Link>
    );
  }

  if (isRest) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-md border border-dashed border-line-rest bg-brass-deep/5 py-2 px-1 text-ghost opacity-60"
        title="Barber Sedang Istirahat"
      >
        <span className="font-mono text-xs text-muted">{formatHour(slot.hour)}</span>
        <span className="text-[9px] font-mono text-brass-deep">Rehat</span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center rounded-md border border-line bg-surface-2/60 py-2 px-1 text-ghost opacity-50"
      title={slot.text || "Terjadwal"}
    >
      <span className="font-mono text-xs text-muted">{formatHour(slot.hour)}</span>
      <span className="text-[9px] font-mono text-ghost">Terisi</span>
    </div>
  );
}
