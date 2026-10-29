import { describe, expect, it } from "vitest";
import { jakartaDateString, jakartaIso, jakartaMinutesOf } from "../../src/lib/time/jakarta.ts";
import { computeAvailableSlots, type Interval, type SlotRules } from "../../src/features/slots/engine.ts";

export type { Interval, SlotRules };

const BASE: SlotRules = {
  dateJakarta: "2026-11-02",
  openMinutes: 600,
  closeMinutes: 1260,
  breaks: [],
  busy: [],
  durationMinutes: 45,
  bufferMinutes: 10,
  gridStepMinutes: 15,
  leadTimeMinutes: 30,
  nowMinutes: null,
};

function minutesOf(iso: string): number {
  const match = /T(\d{2}):(\d{2})/.exec(iso);
  if (match === null) {
    throw new Error(`bukan ISO waktu yang diharapkan: ${iso}`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

describe("waktu Jakarta", () => {
  it("reads the same clock regardless of the machine timezone", () => {
    // 2026-11-02T03:30:00Z = 10:30 WIB.
    const instant = new Date("2026-11-02T03:30:00Z");

    expect(jakartaMinutesOf(instant)).toBe(10 * 60 + 30);
    expect(jakartaDateString(instant)).toBe("2026-11-02");
  });

  it("rolls the date over at Jakarta midnight, not UTC midnight", () => {
    // 2026-11-01T17:30:00Z sudah 00:30 tanggal 2 di Jakarta.
    expect(jakartaDateString(new Date("2026-11-01T17:30:00Z"))).toBe("2026-11-02");
    // 2026-11-02T16:30:00Z masih 23:30 tanggal 2 di Jakarta.
    expect(jakartaDateString(new Date("2026-11-02T16:30:00Z"))).toBe("2026-11-02");
  });

  it("renders an ISO timestamp with the +07:00 offset", () => {
    expect(jakartaIso("2026-11-02", 9 * 60 + 5)).toBe("2026-11-02T09:05:00+07:00");
  });
});

describe("computeAvailableSlots", () => {
  it("walks the grid from opening time until the last slot that still fits", () => {
    const slots = computeAvailableSlots(BASE);

    expect(minutesOf(slots[0] as string)).toBe(600);
    expect(minutesOf(slots[1] as string)).toBe(615);
    // 45 menit layanan + 10 menit buffer harus selesai sebelum 21:00 → slot terakhir 20:00.
    expect(minutesOf(slots[slots.length - 1] as string)).toBe(20 * 60);
  });

  it("emits ISO timestamps in Jakarta time", () => {
    const slots = computeAvailableSlots(BASE);

    expect(slots[0]).toBe("2026-11-02T10:00:00+07:00");
    expect(slots[0]).not.toContain("Z");
  });

  it("drops slots that would start inside the 30-minute lead time", () => {
    const slots = computeAvailableSlots({ ...BASE, nowMinutes: 9 * 60 + 45 });

    expect(slots[0]).toBe("2026-11-02T10:15:00+07:00");
  });

  it("returns nothing for a day that has already ended", () => {
    expect(computeAvailableSlots({ ...BASE, nowMinutes: 22 * 60 })).toEqual([]);
  });

  it("removes the staggered lunch break of chair 1 (12:00-12:55)", () => {
    const slots = computeAvailableSlots({
      ...BASE,
      breaks: [{ startMinutes: 12 * 60, endMinutes: 12 * 60 + 55 }],
    });

    const starts = slots.map(minutesOf);
    expect(starts).not.toContain(11 * 60 + 15); // 11:15 + 55 = 12:10, menabrak istirahat
    expect(starts).not.toContain(12 * 60);
    expect(starts).not.toContain(12 * 60 + 45); // 12:45 masih di dalam 12:00-12:55
    expect(starts).toContain(11 * 60);
    expect(starts).toContain(13 * 60);
  });

  it("keeps a slot that ends exactly when the break starts", () => {
    const slots = computeAvailableSlots({
      ...BASE,
      durationMinutes: 35,
      bufferMinutes: 0,
      breaks: [{ startMinutes: 12 * 60, endMinutes: 12 * 60 + 55 }],
    });

    expect(slots.map(minutesOf)).toContain(11 * 60 + 15);
  });

  it("removes slots that would overlap an existing booking", () => {
    const slots = computeAvailableSlots({
      ...BASE,
      busy: [{ startMinutes: 10 * 60, endMinutes: 10 * 60 + 55 }],
    });

    const starts = slots.map(minutesOf);
    expect(starts).not.toContain(10 * 60);
    expect(starts).not.toContain(10 * 60 + 30);
    expect(starts).toContain(11 * 60);
  });

  it("never offers a slot for a day off", () => {
    expect(computeAvailableSlots({ ...BASE, isDayOff: true })).toEqual([]);
  });

  it("offers fewer slots for a longer service", () => {
    expect(computeAvailableSlots({ ...BASE, durationMinutes: 60 }).length).toBeLessThan(
      computeAvailableSlots(BASE).length,
    );
  });

  it("invents nothing when the window is too short for the service", () => {
    expect(computeAvailableSlots({ ...BASE, openMinutes: 600, closeMinutes: 630 })).toEqual([]);
  });
});
