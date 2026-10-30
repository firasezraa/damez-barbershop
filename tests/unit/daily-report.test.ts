import { describe, expect, it } from "vitest";
import { toCsv, type DailyReport } from "../../src/features/admin/report.ts";

const report: DailyReport = {
  dateJakarta: "2026-11-02",
  rows: [
    {
      bookingCode: "DMZ-20261102-0001",
      startTime: new Date("2026-11-02T03:00:00Z"), // 10:00 WIB
      customerName: "Budi, Santoso",
      barberName: "Rian Pratama",
      chairNumber: 1,
      services: "Gentlemen Classic Haircut + Beard Sculpt",
      status: "completed",
      totalIdr: 95000,
      dpIdr: 20000,
      paidIdr: 95000,
      dpPaidIdr: 20000,
      settleMethod: "cash",
    },
    {
      bookingCode: "DMZ-20261102-0002",
      startTime: new Date("2026-11-02T04:00:00Z"),
      customerName: 'Ani "Poni"',
      barberName: "Kevin Sanjaya",
      chairNumber: 3,
      services: "Junior / Kids Haircut",
      status: "no_show",
      totalIdr: 40000,
      dpIdr: 20000,
      paidIdr: 20000,
      dpPaidIdr: 20000,
      settleMethod: null,
    },
  ],
  summary: {
    bookings: 2,
    completed: 1,
    noShow: 1,
    dpTotalIdr: 40000,
    cashTotalIdr: 75000,
    revenueIdr: 115000,
    noShowRate: 50,
    completionRate: 50,
  },
};

describe("toCsv", () => {
  it("starts with the documented header and one line per booking", () => {
    const lines = toCsv(report).split("\n");

    expect(lines[0]).toBe(
      "kode_booking,tanggal_wib,jam_wib,nama_pelanggan,kursi,barber,layanan,status,total_idr,dp_idr,dibayar_di_kasir_idr,metode_pelunasan",
    );
    expect(lines).toHaveLength(4); // header + 2 booking + total
  });

  it("quotes values that contain commas or quotes", () => {
    const csv = toCsv(report);

    expect(csv).toContain('"Budi, Santoso"');
    expect(csv).toContain('"Ani ""Poni"""');
  });

  it("writes cash actually taken, not the price snapshot", () => {
    const csv = toCsv(report);
    const [firstBooking] = csv.split("\n").slice(1, 2);

    // 95.000 total, 20.000 DP, sisanya 75.000 masuk kas.
    expect(firstBooking).toContain(",95000,20000,75000,cash");
  });

  it("ends with a totals row that matches the summary", () => {
    const last = toCsv(report).split("\n").at(-1) ?? "";

    expect(last).toContain("TOTAL");
    expect(last).toContain("2 booking");
    expect(last).toContain(",135000,40000,75000,");
  });

  it("writes time in Jakarta, not on the machine timezone", () => {
    expect(toCsv(report)).toContain(",10:00,");
  });

  it("still emits a header and totals when the day is empty", () => {
    const empty = toCsv({
      dateJakarta: "2026-11-03",
      rows: [],
      summary: {
        bookings: 0,
        completed: 0,
        noShow: 0,
        dpTotalIdr: 0,
        cashTotalIdr: 0,
        revenueIdr: 0,
        noShowRate: 0,
        completionRate: 0,
      },
    });

    expect(empty.split("\n")).toHaveLength(2);
    expect(empty).toContain("0 booking");
  });
});