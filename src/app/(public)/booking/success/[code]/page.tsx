import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { bookingPool } from "@/features/slots/services";
import { formatRupiah } from "@/features/catalogue/types";
import { PaymentPanel } from "@/components/booking/PaymentPanel";
import { MonoLabel, Plate } from "@/components/ui/plate";

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

function formatJakartaDate(value: Date): string {
  return value.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Jakarta",
  });
}

function formatJakartaTime(value: Date): string {
  return value.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

/**
 * Tiket = satu lembar struk. Warna kertas hanya dipakai di sini dan di kartu
 * tiket di dalam wizard: itu satu-satunya benda fisik di sistem ini, dan
 * membedakannya dari dinding `ink` membuat kode booking jadi hal pertama yang
 * dicari mata di layar kasir (IDEA.md §17.12).
 */
export default async function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const ticket = await loadTicket(code);

  if (ticket === null) {
    notFound();
  }

  const start = new Date(ticket.start_time);
  const status = STATUS_LABEL[ticket.status] ?? ticket.status;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-2">
        <MonoLabel tone="brass">Damez Barbershop</MonoLabel>
        <h1 className="font-display text-3xl font-bold text-text">Tiket Booking</h1>
      </header>

      <Plate tone="paper" className="p-6">
        <div className="flex flex-col gap-1 border-b border-paper/40 pb-4">
          <span className="font-mono text-[11px] tracking-[0.12em] uppercase">Kode booking</span>
          <p className="font-mono text-2xl font-semibold tracking-[0.08em]">{ticket.booking_code}</p>
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase">{status}</p>
        </div>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 font-mono text-[13px]">
          <dt className="text-[11px] uppercase tracking-[0.1em]">Jadwal</dt>
          <dd className="text-right">
            {formatJakartaDate(start)}, {formatJakartaTime(start)} WIB
          </dd>

          <dt className="text-[11px] uppercase tracking-[0.1em]">Barber</dt>
          <dd className="text-right">
            {ticket.barber_name} · kursi {ticket.chair_number}
          </dd>

          <dt className="text-[11px] uppercase tracking-[0.1em]">Durasi</dt>
          <dd className="text-right">
            {formatJakartaTime(start)} – {formatJakartaTime(new Date(ticket.end_time))} WIB
          </dd>

          <dt className="text-[11px] uppercase tracking-[0.1em]">Layanan</dt>
          <dd className="text-right">{(ticket.services ?? []).join(", ")}</dd>
        </dl>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 border-t border-paper/40 pt-4 font-mono text-[13px]">
          <dt className="text-[11px] uppercase tracking-[0.1em]">Total layanan</dt>
          <dd className="text-right">{formatRupiah(ticket.total_idr)}</dd>

          {ticket.dp_idr > 0 ? (
            <>
              <dt className="text-[11px] uppercase tracking-[0.1em]">DP</dt>
              <dd className="text-right">{formatRupiah(ticket.dp_idr)}</dd>
            </>
          ) : null}

          <dt className="font-semibold">Sisa dibayar di kasir</dt>
          <dd className="text-right font-semibold">{formatRupiah(ticket.remaining_idr)}</dd>

          {ticket.status === "pending_payment" && ticket.hold_expires_at !== null ? (
            <>
              <dt className="text-[11px] uppercase tracking-[0.1em]">Bayar sebelum</dt>
              <dd className="text-right">
                {formatJakartaTime(new Date(ticket.hold_expires_at))} WIB
              </dd>
            </>
          ) : null}
        </dl>
      </Plate>

      {ticket.status === "pending_payment" ? (
        <PaymentPanel bookingCode={ticket.booking_code} />
      ) : (
        <p className="rounded-[3px] border border-ok/40 bg-ok/10 px-4 py-3 text-sm text-ok">
          DP sudah diterima. Kursi Anda terkunci, tiket ini berlaku sebagai bukti.
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <p className="text-sm text-muted">
          Tunjukkan tiket ini di kasir. DP dipotong dari nota saat pelunasan. Pembatalan paling
          lambat 3 jam sebelum jadwal.
        </p>
        <Link href="/booking" className="text-sm text-brass underline underline-offset-4">
          Booking kursi lain
        </Link>
      </div>
    </main>
  );
}
