import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { bookingPool } from "@/features/slots/services";
import { formatRupiah } from "@/features/catalogue/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tiket Booking — Damez Barbershop",
  robots: { index: false, follow: false },
};

type TicketRow = {
  booking_code: string;
  status: string;
  start_time: Date;
  end_time: Date;
  total_idr: number;
  dp_idr: number;
  remaining_idr: number;
  hold_expires_at: Date | null;
  barber_name: string;
  chair_number: number;
  services: string[] | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Menunggu pembayaran DP",
  confirmed: "Terkonfirmasi",
  in_progress: "Sedang dilayani",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
  no_show: "Tidak hadir",
};

async function loadTicket(code: string): Promise<TicketRow | null> {
  const result = await bookingPool().query<TicketRow>(
    `SELECT b.booking_code, b.status::text AS status, b.start_time, b.end_time,
            b.total_idr, b.dp_idr, b.remaining_idr, b.hold_expires_at,
            bar.full_name AS barber_name, bar.chair_number,
            array_agg(s.name ORDER BY s.display_order) AS services
       FROM public.bookings b
       JOIN public.barbers bar ON bar.id = b.barber_id
       LEFT JOIN public.booking_services bs ON bs.booking_id = b.id
       LEFT JOIN public.services s ON s.id = bs.service_id
      WHERE b.booking_code = $1
      GROUP BY b.id, bar.full_name, bar.chair_number`,
    [code],
  );

  return result.rows[0] ?? null;
}

export default async function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const ticket = await loadTicket(code);

  if (ticket === null) {
    notFound();
  }

  const start = new Date(ticket.start_time);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-2">
        <p className="font-display text-sm tracking-[0.2em] text-brass uppercase">Damez</p>
        <h1 className="font-display text-3xl text-text">Tiket Booking</h1>
        <p className="text-sm text-muted">
          {STATUS_LABEL[ticket.status] ?? ticket.status} · kode {ticket.booking_code}
        </p>
      </header>

      <dl className="grid gap-3 rounded-card border border-surface-2 bg-surface p-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Jadwal</dt>
          <dd className="text-text">
            {start.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "Asia/Jakarta",
            })}
            ,{" "}
            {start.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Jakarta",
            })}{" "}
            WIB
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Barber</dt>
          <dd className="text-text">
            {ticket.barber_name} (kursi {ticket.chair_number})
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Layanan</dt>
          <dd className="text-right text-text">{(ticket.services ?? []).join(", ")}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Total layanan</dt>
          <dd className="text-text">{formatRupiah(ticket.total_idr)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">DP</dt>
          <dd className="text-text">{formatRupiah(ticket.dp_idr)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Sisa dibayar di kasir</dt>
          <dd className="text-text">{formatRupiah(ticket.remaining_idr)}</dd>
        </div>
        {ticket.status === "pending_payment" && ticket.hold_expires_at !== null ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Bayar sebelum</dt>
            <dd className="text-brass">
              {new Date(ticket.hold_expires_at).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Jakarta",
              })}{" "}
              WIB
            </dd>
          </div>
        ) : null}
      </dl>

      <p className="text-sm text-muted">
        Tunjukkan tiket ini di kasir. DP dipotong dari nota saat pelunasan. Pembatalan paling lambat
        3 jam sebelum jadwal.
      </p>

      <Link href="/booking" className="text-sm text-brass underline underline-offset-4">
        Booking kursi lain
      </Link>
    </main>
  );
}