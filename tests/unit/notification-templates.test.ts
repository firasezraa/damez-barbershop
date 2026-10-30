import { describe, expect, it } from "vitest";
import { buildBookingConfirmedMessage } from "../../src/features/notifications/templates.ts";

const input = {
  fullName: "Budi Santoso",
  bookingCode: "DMZ-20261102-0007",
  startTime: new Date("2026-11-02T03:00:00Z"), // 10:00 WIB
  barberName: "Rian Pratama",
  chairNumber: 1,
  dpIdr: 20000,
  remainingIdr: 30000,
};

describe("buildBookingConfirmedMessage", () => {
  it("states the code, the schedule in WIB and the money plainly", () => {
    const message = buildBookingConfirmedMessage(input);

    expect(message).toContain("DMZ-20261102-0007");
    expect(message).toContain("10.00 WIB");
    expect(message).toContain("Rian Pratama");
    expect(message).toContain("Rp 20.000");
    expect(message).toContain("Rp 30.000");
    expect(message).toContain("Budi Santoso");
  });

  it("carries no emoji, per the owner policy", () => {
    const message = buildBookingConfirmedMessage(input);

    expect(/\p{Extended_Pictographic}/u.test(message)).toBe(false);
  });

  it("keeps the cancellation and lateness rules in the message", () => {
    const message = buildBookingConfirmedMessage(input);

    expect(message).toContain("15 menit");
    expect(message).toContain("3 jam");
  });

  it("does not leak a full phone number, because none is passed in", () => {
    const message = buildBookingConfirmedMessage(input);

    expect(message).not.toMatch(/\+62\d{8,}/);
  });
});