import type { Pool } from "pg";
import { bookingPool } from "../slots/services.ts";
import { jakartaIso } from "../../lib/time/jakarta.ts";

/**
 * Rekap kas harian dan ekspor CSV. Angka yang tampil di layar dan yang diunduh
 * kasir harus berasal dari fungsi ini supaya tidak pernah berbeda.
 *
 * Catatan penting: uang yang benar-benar masuk = DP (payments dari webhook) +
 * pelunasan kasir (`settle:<booking>`), bukan `remaining_idr` (itu snapshot
 * harga, dijaga constraint chk_booking_remaining).
 */

export type ReportRow = {
  bookingCode: string;
  startTime: Date;
  customerName: string;
  barberName: string;
  chairNumber: number;
  services: string;
  status: string;
  totalIdr: number;
  dpIdr: number;
  paidIdr: number;
  dpPaidIdr: number;
  settleMethod: string | null;
};

export type DailyReport = {
  dateJakarta: string;
  rows: ReportRow[];
  summary: {
    bookings: number;
    completed: number;
    noShow: number;
    dpTotalIdr: number;
    cashTotalIdr: number;
    revenueIdr: number;
    noShowRate: number;
    completionRate: number;
  };
};

export async function buildDailyReport(
  dateJakarta: string,
  pool: Pool = bookingPool(),
): Promise<DailyReport> {
  const dayStart = jakartaIso(dateJakarta, 0);
  const dayEnd = jakartaIso(dateJakarta, 24 * 60);

  const result = await pool.query<{
    booking_code: string;
    start_time: Date;
    customer_name: string;
    barber_name: string;
    chair_number: number;
    services: string | null;
    status: string;
    total_idr: number;
    dp_idr: number;
    paid_idr: string;
    dp_paid_idr: string;
    settle_method: string | null;
  }>(
    `SELECT b.booking_code, b.start_time,
            c.full_name AS customer_name,
            bar.full_name AS barber_name, bar.chair_number,
            (SELECT string_agg(s.name, ' + ' ORDER BY s.display_order)
               FROM public.booking_services bs JOIN public.services s ON s.id = bs.service_id
              WHERE bs.booking_id = b.id) AS services,
            b.status::text AS status, b.total_idr, b.dp_idr,
            COALESCE((SELECT sum(p.amount_idr) FROM public.payments p WHERE p.booking_id = b.id), 0)::text AS paid_idr,
            COALESCE((SELECT sum(p.amount_idr) FROM public.payments p
                       WHERE p.booking_id = b.id AND p.provider <> 'cashier'), 0)::text AS dp_paid_idr,
            (SELECT p.method FROM public.payments p
              WHERE p.booking_id = b.id AND p.idempotency_key = 'settle:' || b.id::text) AS settle_method
       FROM public.bookings b
       JOIN public.customers c ON c.id = b.customer_id
       JOIN public.barbers bar ON bar.id = b.barber_id
      WHERE b.start_time >= $1::timestamptz AND b.start_time < $2::timestamptz
      ORDER BY b.start_time`,
    [dayStart, dayEnd],
  );

  const rows: ReportRow[] = result.rows.map((row) => ({
    bookingCode: row.booking_code,
    startTime: row.start_time,
    customerName: row.customer_name,
    barberName: row.barber_name,
    chairNumber: row.chair_number,
    services: row.services ?? "",
    status: row.status,
    totalIdr: row.total_idr,
    dpIdr: row.dp_idr,
    paidIdr: Number(row.paid_idr),
    dpPaidIdr: Number(row.dp_paid_idr),
    settleMethod: row.settle_method,
  }));

  const completed = rows.filter((row) => row.status === "completed").length;
  const noShow = rows.filter((row) => row.status === "no_show").length;
  // Kas yang benar-benar diterima di meja = baris pembayaran provider 'cashier'.
  // DP dihitung dari pembayaran provider lain (Midtrans). Memakai dp_idr akan
  // salah untuk walk-in, yang memang tidak memungut DP.
  const cashTotalIdr = rows.reduce((total, row) => total + (row.paidIdr - row.dpPaidIdr), 0);
  const dpTotalIdr = rows.reduce((total, row) => total + row.dpPaidIdr, 0);

  return {
    dateJakarta,
    rows,
    summary: {
      bookings: rows.length,
      completed,
      noShow,
      dpTotalIdr,
      cashTotalIdr,
      revenueIdr: rows.reduce((total, row) => total + row.paidIdr, 0),
      noShowRate: rows.length === 0 ? 0 : Number(((noShow / rows.length) * 100).toFixed(2)),
      completionRate: rows.length === 0 ? 0 : Number(((completed / rows.length) * 100).toFixed(2)),
    },
  };
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV tanpa BOM, pemisah koma, dengan baris total di bawah (bukan di atas). */
export function toCsv(report: DailyReport): string {
  const header = [
    "kode_booking",
    "tanggal_wib",
    "jam_wib",
    "nama_pelanggan",
    "kursi",
    "barber",
    "layanan",
    "status",
    "total_idr",
    "dp_idr",
    "dibayar_di_kasir_idr",
    "metode_pelunasan",
  ];

  const lines = report.rows.map((row) => {
    const time = new Date(row.startTime).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });

    return [
      row.bookingCode,
      report.dateJakarta,
      time.replace(".", ":"),
      row.customerName,
      row.chairNumber,
      row.barberName,
      row.services,
      row.status,
      row.totalIdr,
      row.dpIdr,
      Math.max(0, row.paidIdr - row.dpPaidIdr),
      row.settleMethod ?? "",
    ]
      .map(csvCell)
      .join(",");
  });

  const totals = [
    "TOTAL",
    report.dateJakarta,
    "",
    "",
    "",
    "",
    "",
    `${report.summary.bookings} booking`,
    report.rows.reduce((total, row) => total + row.totalIdr, 0),
    report.summary.dpTotalIdr,
    report.summary.cashTotalIdr,
    "",
  ]
    .map(csvCell)
    .join(",");

  return [header.join(","), ...lines, totals].join("\n");
}