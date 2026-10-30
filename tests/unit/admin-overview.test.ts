import { describe, expect, it } from "vitest";
import { getOverallStats, listRecentBookings } from "../../src/features/admin/overview.ts";
import { bookingPool } from "../../src/features/slots/services.ts";

describe("overview queries", () => {
  it("getOverallStats returns non-negative numbers", async () => {
    const stats = await getOverallStats(bookingPool());

    expect(stats.totalBookings).toBeGreaterThanOrEqual(0);
    expect(stats.confirmedBookings).toBeGreaterThanOrEqual(0);
    expect(stats.completedBookings).toBeGreaterThanOrEqual(0);
    expect(stats.cancelledBookings).toBeGreaterThanOrEqual(0);
    expect(stats.totalRevenueIdr).toBeGreaterThanOrEqual(0);
    expect(stats.totalDpIdr).toBeGreaterThanOrEqual(0);
  });

  it("listRecentBookings returns an array with valid shapes", async () => {
    const list = await listRecentBookings(10, bookingPool());

    expect(Array.isArray(list)).toBe(true);
    for (const item of list) {
      expect(item.bookingCode).toMatch(/^DMZ-\d{8}-\d{4}$/);
      expect(item.customerName).toBeTruthy();
      expect(item.totalIdr).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(item.services)).toBe(true);
    }
  });
});
