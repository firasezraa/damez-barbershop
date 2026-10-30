import { describe, expect, it } from "vitest";
import {
  boardHours,
  formatHour,
  shortServiceLabel,
  slotStateForHour,
  type SlotInterval,
} from "../../src/features/catalogue/day-board.ts";

/**
 * Bagian papan hari yang murni diuji di sini: jam mana yang tampil, dan keadaan
 * selnya. Aturannya sederhana tetapi mudah salah: booking menang atas blokir,
 * blokir menang atas bebas, dan jam yang sudah lewat tidak ditampilkan.
 */

const booking = (startMinutes: number, endMinutes: number, label = "Premium Fade & Taper Cut"): SlotInterval => ({
  startMinutes,
  endMinutes,
  label,
});

const rest = (startMinutes: number, endMinutes: number): SlotInterval => ({
  startMinutes,
  endMinutes,
  label: "ISTIRAHAT",
});

describe("boardHours", () => {
  it("starts at the running hour and stops before closing", () => {
    expect(boardHours(14 * 60 + 20)).toEqual([14, 15, 16, 17, 18, 19, 20]);
  });

  it("rounds down inside the hour, so the current slot is still bookable", () => {
    expect(boardHours(10 * 60 + 59)[0]).toBe(10);
  });

  it("never starts before opening, even long before the shop opens", () => {
    expect(boardHours(5 * 60)[0]).toBe(10);
  });

  it("keeps the last hour visible at closing time instead of an empty board", () => {
    expect(boardHours(21 * 60 + 30)).toEqual([20]);
  });

  it("formats hours as HH:00", () => {
    expect(formatHour(9)).toBe("09:00");
    expect(formatHour(20)).toBe("20:00");
  });
});

describe("slotStateForHour", () => {
  it("marks a booked hour as scheduled with the service name, never the booking code", () => {
    const result = slotStateForHour(14, {
      bookings: [booking(14 * 60, 14 * 60 + 50)],
      blocks: [],
    });

    expect(result.state).toBe("scheduled");
    expect(result.text).toBe("Premium Fade & Taper Cut");
  });

  it("marks an hour touched by a booking that started earlier", () => {
    const result = slotStateForHour(15, {
      bookings: [booking(14 * 60 + 30, 15 * 60 + 30)],
      blocks: [],
    });

    expect(result.state).toBe("scheduled");
  });

  it("marks recurring breaks as rest", () => {
    const result = slotStateForHour(12, { bookings: [], blocks: [rest(12 * 60, 12 * 60 + 55)] });

    expect(result.state).toBe("rest");
    expect(result.text).toBe("ISTIRAHAT");
  });

  it("prefers the booking when a booking and a block overlap", () => {
    const result = slotStateForHour(12, {
      bookings: [booking(12 * 60, 13 * 60, "The Damez Signature Executive Combo")],
      blocks: [rest(12 * 60, 12 * 60 + 55)],
    });

    expect(result.state).toBe("scheduled");
    expect(result.text).toBe("The Damez Signature Executive Combo");
  });

  it("treats the end of a booking as free, because half-open intervals do not overlap", () => {
    const result = slotStateForHour(15, { bookings: [booking(14 * 60, 15 * 60)], blocks: [] });

    expect(result.state).toBe("free");
    expect(result.text).toBe("BEBAS");
  });

  it("is free when nothing covers the hour", () => {
    expect(slotStateForHour(19, { bookings: [], blocks: [] })).toEqual({
      state: "free",
      text: "BEBAS",
    });
  });
});

describe("shortServiceLabel", () => {
  it("keeps the first service and appends its duration", () => {
    expect(shortServiceLabel("Premium Fade & Taper Cut", 50)).toBe("Premium Fade · 50′");
  });

  it("takes the first of several services, so the cell stays readable", () => {
    // 25 karakter melebihi plafon sel, jadi dipotong di batas kata — bukan di
    // tengah kata seperti "Gentlemen Classic Hair".
    expect(shortServiceLabel("Gentlemen Classic Haircut + Beard Sculpting", 80)).toBe(
      "Gentlemen Classic · 80′",
    );
  });

  it("never returns an empty cell for a booking without services", () => {
    expect(shortServiceLabel(null, 45)).toBe("TERISI · 45′");
  });

  it("shortens a long catalog name at a separator, never mid-word", () => {
    const label = shortServiceLabel("Relaxing Hair Spa & Anti-Dandruff Scalp Treatment", 40);

    expect(label).toBe("Relaxing Hair Spa · 40′");
    expect(label).not.toContain("…");
  });

  it("cuts at a word boundary, never mid-word, when there is no category", () => {
    const label = shortServiceLabel("Black Hair Color Revival Extra", 45);

    expect(label).toBe("Black Hair Color · 45′");
  });

  it("falls back to the catalog category when there is no separator to cut at", () => {
    const label = shortServiceLabel("The Damez Signature Executive Combo", 60, "Bundled Combo");

    expect(label).toBe("Bundled Combo · 60′");
    expect(label.length).toBeLessThan(22);
  });
});
