import { describe, expect, it } from "vitest";
import * as C from "../../src/lib/config/constants.ts";

describe("business baseline (IDEA.md §3)", () => {
  it("locks the flat down payment at Rp 20.000", () => {
    expect(C.DOWN_PAYMENT_IDR).toBe(20000);
  });

  it("locks the hold TTL at 15 minutes", () => {
    expect(C.HOLD_TTL_SECONDS).toBe(900);
  });

  it("locks the cancellation cutoff at H-3 hours", () => {
    expect(C.CANCEL_CUTOFF_HOURS).toBe(3);
  });

  it("locks late tolerance at 15 minutes", () => {
    expect(C.LATE_TOLERANCE_MINUTES).toBe(15);
  });

  it("locks 3 chairs, 10:00-21:00 Asia/Jakarta", () => {
    expect(C.CHAIR_COUNT).toBe(3);
    expect(C.OPENING_HOUR).toBe(10);
    expect(C.CLOSING_HOUR).toBe(21);
    expect(C.TIMEZONE).toBe("Asia/Jakarta");
  });

  it("locks the slot grid, buffer and lead time", () => {
    expect(C.SLOT_GRID_STEP_MINUTES).toBe(15);
    expect(C.TURNAROUND_BUFFER_MINUTES).toBe(10);
    expect(C.MIN_LEAD_TIME_MINUTES).toBe(30);
  });

  it("locks the anti-hoarding cap at 2 active holds per phone", () => {
    expect(C.MAX_ACTIVE_HOLDS_PER_PHONE).toBe(2);
  });
});
