import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ChairBoard } from "@/components/admin/ChairBoard";
import { MonoLabel, Plate } from "@/components/ui/plate";
import { listChairMatrix, summarizeDay } from "@/features/admin/day-view";
import { listActiveServices } from "@/features/catalogue/queries";
import { formatRupiah } from "@/features/catalogue/types";
import { readAdminSession } from "@/lib/auth/session";
import { verifySupabaseToken } from "@/lib/auth/supabase-verifier";
import { jakartaDateString } from "@/lib/time/jakarta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kasir — Damez Barbershop",
  robots: { index: false, follow: false },
};

/**
 * Dashboard kasir: matriks 3 kursi untuk hari ini (WIB) plus form walk-in.
 * Dilengkapi dengan navigation sidebar portal admin.
 */
export default async function CashierDashboardPage() {
  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get("dmz_admin_sidebar")?.value === "true";
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const session = await readAdminSession(
    new Request("http://internal/admin/dashboard", { headers: { cookie: cookieHeader } }),
    { verify: verifySupabaseToken },
  ).catch(() => ({ ok: false as const, reason: "invalid" as const }));

  if (!session.ok) {
    redirect("/admin/login?error=session&next=%2Fadmin%2Fdashboard");
  }

  const today = jakartaDateString(new Date());
  const [chairs, services] = await Promise.all([listChairMatrix(today), listActiveServices()]);
  const summary = summarizeDay(chairs);

  return (
    <AdminShell role={session.session.role} today={today} initialCollapsed={initialCollapsed}>
      <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex flex-col gap-2">
            <MonoLabel tone="brass">Kasir & Meja Kerja</MonoLabel>
            <h1 className="font-display text-3xl font-bold text-text">Matriks kursi hari ini</h1>
            <p className="font-mono text-xs text-muted">
              {today} WIB · masuk sebagai {session.session.role}
            </p>
            {session.session.role === "owner" ? (
              <a
                href={`/api/admin/reports/daily-csv?date=${today}`}
                className="inline-flex min-h-12 items-center self-start rounded-[3px] border border-brass px-5 font-mono text-xs tracking-[0.08em] text-brass uppercase transition-colors duration-150 hover:bg-brass/10"
              >
                Unduh rekap kas hari ini (CSV)
              </a>
            ) : null}
          </header>

          {/* Strip angka mono di atas papan: kasir membaca uang masuk lebih dulu daripada daftar. */}
          <Plate className="grid gap-px overflow-hidden bg-line sm:grid-cols-4">
            <SummaryCell label="Booking hari ini" value={`${summary.bookings}`} />
            <SummaryCell label="DP terkumpul" value={formatRupiah(summary.dpiTotalIdr)} />
            <SummaryCell label="Tunai/QRIS masuk" value={formatRupiah(summary.cashTotalIdr)} />
            <SummaryCell label="Tidak hadir" value={`${summary.noShow}`} />
          </Plate>

          <ChairBoard
            chairs={chairs}
            services={services.map((service) => ({
              id: service.id,
              name: service.name,
              priceIdr: service.priceIdr,
            }))}
            dateJakarta={today}
          />
        </div>
      </main>
    </AdminShell>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 bg-surface px-4 py-3">
      <MonoLabel>{label}</MonoLabel>
      <p className="font-mono text-xl font-semibold text-text">{value}</p>
    </div>
  );
}
