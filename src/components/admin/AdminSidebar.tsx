"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MonoLabel } from "@/components/ui/plate";

type NavItem = {
  href: string;
  label: string;
  tag: string;
  description: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Matriks Kursi",
    tag: "LIVE",
    description: "SOP kasir & meja operasional",
  },
  {
    href: "/admin/overview",
    label: "Statistik & Tamu",
    tag: "DATA",
    description: "Overall metrik & daftar booking",
  },
];

export function AdminSidebar({
  role,
  today,
}: {
  role: string;
  today: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-line bg-surface lg:min-h-screen lg:w-64 lg:border-r lg:border-b-0">
      {/* Brand Header */}
      <div className="flex flex-col gap-1 border-b border-line px-6 py-6">
        <MonoLabel tone="brass">Damez Management</MonoLabel>
        <span className="font-display text-xl font-bold tracking-tight text-text">
          Portal Gerai
        </span>
        <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted">
          <span>{today} WIB</span>
          <span className="rounded-[2px] bg-surface-2 px-2 py-0.5 uppercase text-brass">
            {role}
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <nav aria-label="Menu Admin" className="flex flex-1 flex-col gap-1 p-3">
        <div className="px-3 py-2">
          <MonoLabel>Navigasi Utama</MonoLabel>
        </div>

        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col gap-0.5 rounded-[3px] border px-3 py-2.5 transition-colors ${
                active
                  ? "border-brass/40 bg-brass/10 text-text"
                  : "border-transparent text-muted hover:border-line-2 hover:bg-surface-2 hover:text-text"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold">{item.label}</span>
                <span
                  className={`font-mono text-[9px] font-bold uppercase tracking-wider ${
                    active ? "text-brass" : "text-ghost"
                  }`}
                >
                  {item.tag}
                </span>
              </div>
              <span className="font-mono text-[11px] text-muted">{item.description}</span>
            </Link>
          );
        })}

        <div className="mt-4 px-3 py-2 border-t border-line-2">
          <MonoLabel>Akses Eksternal</MonoLabel>
        </div>

        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between rounded-[3px] border border-transparent px-3 py-2 text-xs font-mono text-muted hover:border-line-2 hover:bg-surface-2 hover:text-text"
        >
          <span>Lihat Website Publik</span>
          <span className="text-brass">↗</span>
        </Link>
      </nav>

      {/* Sign Out Action */}
      <div className="border-t border-line p-4">
        <form action="/api/admin/auth/sign-out" method="post">
          <button
            type="submit"
            className="flex min-h-10 w-full items-center justify-center rounded-[3px] border border-line bg-surface-2 font-mono text-xs text-muted transition-colors hover:border-danger/40 hover:text-danger"
          >
            Keluar Sesi
          </button>
        </form>
      </div>
    </aside>
  );
}
