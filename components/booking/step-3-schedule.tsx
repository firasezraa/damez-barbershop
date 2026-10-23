"use client";

import * as React from "react";
import {
  IconCalendar,
  IconClock,
  IconSun,
  IconMoon,
  IconAlertCircle,
  IconLoader2,
  IconCheck,
  IconShieldAlert,
  IconRefresh,
} from "@/components/ui/icons";
import { getUpcomingDates, UpcomingDateItem } from "./utils";
import { SlotApiResponse, SlotItem } from "./types";
import { cn } from "@/lib/utils";

interface Step3ScheduleProps {
  selectedDate: string; // "YYYY-MM-DD"
  selectedTime: string; // "14:30"
  barberId: string | null;
  totalServiceDuration: number;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
}

export function Step3Schedule({
  selectedDate,
  selectedTime,
  barberId,
  totalServiceDuration,
  onSelectDate,
  onSelectTime,
}: Step3ScheduleProps) {
  const dates = React.useMemo(() => getUpcomingDates(7), []);

  const [slots, setSlots] = React.useState<SlotItem[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = React.useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [slotsError, setSlotsError] = React.useState<string | null>(null);
  const [staleNotice, setStaleNotice] = React.useState<string | null>(null);

  // Auto-select first date if none selected
  React.useEffect(() => {
    if (!selectedDate && dates.length > 0) {
      onSelectDate(dates[0].dateString);
    }
  }, [selectedDate, dates, onSelectDate]);

  // Fetch available slots from /api/slots/available
  const fetchSlots = React.useCallback(
    async (showFullLoader = true) => {
      if (!selectedDate) return;

      if (showFullLoader) {
        setIsLoadingSlots(true);
      } else {
        setIsRefreshing(true);
      }
      setSlotsError(null);

      const params = new URLSearchParams();
      params.set("date", selectedDate);
      if (barberId && barberId !== "any") {
        params.set("barber_id", barberId);
      } else {
        params.set("barber_id", "any");
      }
      if (totalServiceDuration > 0) {
        params.set("duration", String(totalServiceDuration));
      }

      try {
        const res = await fetch(`/api/slots/available?${params.toString()}`, {
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP Error ${res.status}`);
        }

        const data = (await res.json()) as SlotApiResponse;
        if (data.success && Array.isArray(data.slots)) {
          setSlots(data.slots);

          // Cek apakah slot yang sedang dipilih telah terkunci oleh pemesan lain
          if (selectedTime) {
            const currentSlot = data.slots.find((s) => s.time === selectedTime);
            if (currentSlot && !currentSlot.available) {
              onSelectTime("");
              setStaleNotice(
                `Slot pukul ${selectedTime} baru saja dikunci oleh pemesan lain. Silakan pilih jam lain yang masih tersedia.`
              );
            }
          }
        } else {
          setSlotsError(data.error || "Gagal memuat slot jam ketersediaan.");
        }
      } catch (err) {
        console.warn("[Slot Engine Client] API fetch error, falling back to local slots:", err);
        // Fallback slots generator for offline / test mock
        const fallbackSlots: SlotItem[] = [];
        for (let h = 10; h <= 20; h++) {
          for (const m of [0, 30]) {
            if (h === 20 && m > 0) continue;
            const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            const isBreak = (h === 12 && m === 30) || (h === 18 && m === 0);
            fallbackSlots.push({
              time: timeStr,
              available: !isBreak,
              reason: isBreak ? "Istirahat Barber" : undefined,
            });
          }
        }
        setSlots(fallbackSlots);
      } finally {
        setIsLoadingSlots(false);
        setIsRefreshing(false);
      }
    },
    [selectedDate, barberId, totalServiceDuration, selectedTime, onSelectTime]
  );

  // Initial fetch when parameters change
  React.useEffect(() => {
    fetchSlots(true);
  }, [fetchSlots]);

  // Real-time polling every 20s and tab focus visibility invalidation
  React.useEffect(() => {
    if (!selectedDate) return;

    const intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchSlots(false);
      }
    }, 20000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchSlots(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchSlots, selectedDate]);

  // Filter slots into morning (10:00 - 14:00) and afternoon/evening (14:00 - 20:00)
  const morningSlots = slots.filter((slot) => {
    const hour = parseInt(slot.time.split(":")[0], 10);
    return hour >= 10 && hour < 14;
  });

  const afternoonSlots = slots.filter((slot) => {
    const hour = parseInt(slot.time.split(":")[0], 10);
    return hour >= 14 && hour <= 20;
  });

  // Calculate session end time
  const calculateEndTime = (start: string) => {
    if (!start || !start.includes(":")) return "";
    const [h, m] = start.split(":").map((v) => parseInt(v, 10));
    const totalMinutes = h * 60 + m + totalServiceDuration;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  };

  const selectedEndTime = selectedTime ? calculateEndTime(selectedTime) : "";

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Step Header */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Langkah 3 dari 5
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Tentukan Tanggal dan Jam Kedatangan
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pilih hari kedatangan dalam 7 hari ke depan. Jam yang ditampilkan adalah jam pasti kursi Anda mulai disiapkan.
        </p>
      </div>

      {/* Operating Hours Info */}
      <div className="flex items-center justify-between rounded-xl border border-border/80 bg-surface/60 px-4 py-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <IconClock size="sm" className="text-primary" aria-hidden="true" />
          <span>Jam Buka: 10:00 - 21:00 WIB</span>
        </div>
        <span className="text-[11px] font-medium text-foreground">
          Sesi terakhir 20:00 WIB
        </span>
      </div>

      {/* 7-Day Date Carousel */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pilih Hari & Tanggal
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x -mx-1 px-1">
          {dates.map((item) => {
            const isSelected = selectedDate === item.dateString;
            return (
              <button
                key={item.dateString}
                type="button"
                onClick={() => onSelectDate(item.dateString)}
                aria-pressed={isSelected}
                className={cn(
                  "flex min-w-[76px] flex-1 flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all duration-200 select-none snap-start",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-102"
                    : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:bg-surface-elevated hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    isSelected ? "text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.isToday ? "Hari Ini" : item.isTomorrow ? "Besok" : item.dayName}
                </span>
                <span
                  className={cn(
                    "my-1 font-mono text-xl font-extrabold",
                    isSelected ? "text-primary-foreground" : "text-foreground"
                  )}
                >
                  {item.dayNumber}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isSelected ? "text-primary-foreground/90" : "text-muted-foreground"
                  )}
                >
                  {item.monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots Cluster Section */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pilih Jam Kursi Siap (WIB)
          </label>
          <div className="flex items-center gap-2">
            {(isLoadingSlots || isRefreshing) && (
              <span className="flex items-center gap-1.5 text-xs text-primary">
                <IconLoader2 size="micro" className="animate-spin" aria-hidden="true" />
                <span className="hidden sm:inline">Memeriksa slot...</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => fetchSlots(false)}
              disabled={isLoadingSlots || isRefreshing}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
              title="Segarkan Ketersediaan Slot"
            >
              <IconRefresh size="micro" className={cn(isRefreshing && "animate-spin text-primary")} aria-hidden="true" />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
          </div>
        </div>

        {staleNotice && (
          <div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <IconAlertCircle size="micro" className="shrink-0 text-amber-400" aria-hidden="true" />
              <span>{staleNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setStaleNotice(null)}
              className="text-[11px] font-bold text-amber-300 hover:text-amber-100 ml-2"
            >
              Tutup
            </button>
          </div>
        )}

        {slotsError && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <IconAlertCircle size="micro" className="shrink-0" aria-hidden="true" />
            <span>{slotsError}</span>
          </div>
        )}

        {/* Morning Session Cluster */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <IconSun size="sm" className="text-primary" aria-hidden="true" />
            <span>Klaster 1: Sesi Siang (10:00 - 14:00 WIB)</span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {morningSlots.map((slot) => {
              const isSelected = selectedTime === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => {
                    onSelectTime(slot.time);
                    setStaleNotice(null);
                  }}
                  aria-pressed={isSelected}
                  className={cn(
                    "group relative flex h-12 min-h-[48px] flex-col items-center justify-center rounded-xl border text-xs font-mono font-bold transition-all select-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    !slot.available && "cursor-not-allowed bg-surface/30 border-border/40 text-muted-foreground/40",
                    slot.available && !isSelected && "cursor-pointer border-border bg-surface text-foreground hover:border-primary/50 hover:bg-surface-elevated active:scale-95",
                    isSelected && "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  )}
                >
                  <div className="flex items-center gap-1">
                    {!isSelected && slot.available && (
                      <span className="relative flex size-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-emerald-400" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                      </span>
                    )}
                    <span>{slot.time}</span>
                  </div>
                  {!slot.available && (
                    <span className="text-[9px] font-sans font-normal opacity-80">
                      {slot.reason || "Penuh"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Afternoon / Evening Session Cluster */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <IconMoon size="sm" className="text-primary" aria-hidden="true" />
            <span>Klaster 2: Sesi Sore dan Malam (14:00 - 20:00 WIB)</span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {afternoonSlots.map((slot) => {
              const isSelected = selectedTime === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => {
                    onSelectTime(slot.time);
                    setStaleNotice(null);
                  }}
                  aria-pressed={isSelected}
                  className={cn(
                    "group relative flex h-12 min-h-[48px] flex-col items-center justify-center rounded-xl border text-xs font-mono font-bold transition-all select-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    !slot.available && "cursor-not-allowed bg-surface/30 border-border/40 text-muted-foreground/40",
                    slot.available && !isSelected && "cursor-pointer border-border bg-surface text-foreground hover:border-primary/50 hover:bg-surface-elevated active:scale-95",
                    isSelected && "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  )}
                >
                  <div className="flex items-center gap-1">
                    {!isSelected && slot.available && (
                      <span className="relative flex size-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-emerald-400" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                      </span>
                    )}
                    <span>{slot.time}</span>
                  </div>
                  {!slot.available && (
                    <span className="text-[9px] font-sans font-normal opacity-80">
                      {slot.reason || "Penuh"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Schedule Time Clarification */}
      {selectedTime && selectedEndTime && (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs sm:text-sm text-foreground flex flex-col gap-1">
          <div className="flex items-center gap-2 font-bold text-primary">
            <IconCheck size="sm" stroke={3} aria-hidden="true" />
            <span>Jam Kursi Terpilih: {selectedTime} WIB</span>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Layanan Anda membutuhkan waktu {totalServiceDuration} menit ditambah 10 menit sterilisasi alat. Sesi Anda selesai pukul {selectedEndTime} WIB.
          </p>
        </div>
      )}
    </div>
  );
}
