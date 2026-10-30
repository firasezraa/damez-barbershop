import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { MonoLabel, Plate } from "@/components/ui/plate";
import { getOverallStats, listRecentBookings } from "@/features/admin/overview";
import { formatRupiah } from "@/features/catalogue/types";
import { readAdminSession } from "@/lib/auth/session";
import { verifySupabaseToken } from "@/lib/auth/supabase-verifier";
import { jakartaDateString } from "@/lib/time/jakarta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Statistik & Tamu — Damez Barbershop",
  robots: { index: false, follow: false },
};

const STATUS_BADGE: Record<string, { label: string; tone: string }> = {
  pending_payment: { label: "MENUNGGU DP", tone: "border-brass/40 bg-brass/10 text-brass" },
  confirmed: { label: "TERKONFIRMASI", tone: "border-line-2 bg-surface-2 text-text" },
  in_progress: { label: "SEDANG DILAYANI", tone: "border-brass bg-brass/15 text-brass" },
  completed: { label: "SELESAI", tone: "border-line bg-transparent text-ghost" },
  no_show: { label: "TIDAK HADIR", tone: "border-danger/40 bg-danger/10 text-danger" },
  cancelled: { label: "BATAL", tone: "border-danger/40 bg-danger/10 text-danger" },
  expired: { label: "KEDALUWARSA", tone: "border-line bg-transparent text-ghost" },
};

function formatJakartaTime(date: Date): string {
  return new Date(date).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AdminOverviewPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminOverviewPage({ searchParams }: AdminOverviewPageProps) {
  const { q } = await searchParams;
  const cookieHeader = (await cookies())
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const session = await readAdminSession(
    new Request("http://internal/admin/overview", { headers: { cookie: cookieHeader } }),
    { verify: verifySupabaseToken },
  ).catch(() => ({ ok: false as const, reason: "invalid" as const }));

  if (!session.ok) {
    redirect("/admin/login?error=session&next=%2Fadmin%2Foverview");
  }

  const today = jakartaDateString(new Date());
  const [stats, bookings] = await Promise.all([getOverallStats(), listRecentBookings(25, q)]);

  return (
    <AdminShell role={session.session.role} today={today}>
      <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex flex-col gap-2">
            <MonoLabel tone="brass">Laporan & Basis Tamu</MonoLabel>
            <h1 className="font-display text-3xl font-bold text-text">
              Statistik Keseluruhan & Tamu
            </h1>
            <p className="font-mono text-xs text-muted">
              Metrik kumulatif seluruh transaksi & daftar 25 pesanan terakhir
            </p>
          </header>

          {/* Grid Statistik Overall */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Plate className="flex flex-col gap-1 p-5">
              <MonoLabel>Total Pemesanan</MonoLabel>
              <p className="font-mono text-3xl font-bold text-text">{stats.totalBookings}</p>
              <p className="font-mono text-[11px] text-muted">Seluruh booking yang pernah tercatat</p>
            </Plate>

            <Plate className="flex flex-col gap-1 p-5">
              <MonoLabel tone="brass">Selesai Dilayani</MonoLabel>
              <p className="font-mono text-3xl font-bold text-brass">{stats.completedBookings}</p>
              <p className="font-mono text-[11px] text-muted">Tamu yang telah tuntas dipangkas</p>
            </Plate>

            <Plate className="flex flex-col gap-1 p-5">
              <MonoLabel>Total Omzet Selesai</MonoLabel>
              <p className="font-mono text-2xl font-bold text-text">
                {formatRupiah(stats.totalRevenueIdr)}
              </p>
              <p className="font-mono text-[11px] text-muted">Dari booking yang berstatus selesai</p>
            </Plate>

            <Plate className="flex flex-col gap-1 p-5">
              <MonoLabel>DP Masuk (Aktif+Selesai)</MonoLabel>
              <p className="font-mono text-2xl font-bold text-text">
                {formatRupiah(stats.totalDpIdr)}
              </p>
              <p className="font-mono text-[11px] text-muted">Uang muka berhasil terverifikasi</p>
            </Plate>
          </div>

          {/* Tabel / Daftar Orang yang Booking */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-text">Daftar Pemesan Terbaru</h2>
                <p className="font-mono text-xs text-muted">
                  Menampilkan riwayat reservasi terbaru beserta status pelunasan
                </p>
              </div>
              <MonoLabel>{bookings.length} Entri</MonoLabel>
            </div>

            {bookings.length === 0 ? (
              <Plate className="p-8 text-center font-mono text-sm text-muted">
                Belum ada data pemesanan di database.
              </Plate>
            ) : (
              <div className="overflow-x-auto rounded-[3px] border border-line bg-surface">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-line bg-surface-2 text-ghost uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Kode & Waktu</th>
                      <th className="px-4 py-3">Nama Tamu & Kontak</th>
                      <th className="px-4 py-3">Barber & Kursi</th>
                      <th className="px-4 py-3">Layanan</th>
                      <th className="px-4 py-3">Nilai Tagihan</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-2">
                    {bookings.map((item) => {
                      const badge = STATUS_BADGE[item.status] ?? {
                        label: item.status.toUpperCase(),
                        tone: "border-line text-muted",
                      };

                      return (
                        <tr key={item.id} className="hover:bg-surface-2/40 transition-colors">
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-brass block">{item.bookingCode}</span>
                            <span className="text-[11px] text-muted">
                              {formatJakartaTime(item.startTime)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-display text-sm font-semibold text-text block">
                              {item.customerName}
                            </span>
                            <span className="text-[11px] text-muted">{item.phoneE164}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-text block">{item.barberName}</span>
                            <span className="text-[11px] text-muted">Kursi {item.chairNumber}</span>
                          </td>
                          <td className="px-4 py-3.5 max-w-xs">
                            <span className="text-text line-clamp-1">
                              {item.services.join(", ")}
                            </span>
                            <span className="text-[10px] text-muted uppercase">
                              {item.bookingType}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-text block">{formatRupiah(item.totalIdr)}</span>
                            <span className="text-[11px] text-muted">
                              {item.settled ? "Lunas" : `Sisa ${formatRupiah(item.remainingIdr)}`}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span
                              className={`inline-block rounded-[2px] border px-2 py-0.5 text-[10px] font-bold tracking-wider ${badge.tone}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </AdminShell>
  );
}
