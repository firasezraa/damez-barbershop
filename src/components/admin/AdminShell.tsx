"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MonoLabel } from "@/components/ui/plate";
import { AdminTopNav } from "./AdminTopNav";

type NavItem = {
  href: string;
  label: string;
  tag: string;
  description: string;
  icon: (props: { className?: string }) => ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Matriks Kursi",
    tag: "LIVE",
    description: "SOP kasir & meja operasional",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      </svg>
    ),
  },
  {
    href: "/admin/overview",
    label: "Statistik & Tamu",
    tag: "DATA",
    description: "Overall metrik & daftar booking",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
];

const SIDEBAR_COLLAPSED_STORAGE_KEY = "dmz_admin_sidebar_collapsed";
const SIDEBAR_COLLAPSED_COOKIE = "dmz_admin_sidebar";

interface AdminShellProps {
  role: string;
  today: string;
  initialCollapsed?: boolean;
  children: ReactNode;
}

export function AdminShell({ role, today, initialCollapsed = false, children }: AdminShellProps) {
  const pathname = usePathname();
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(() => {
    if (initialCollapsed) {
      return true;
    }
    if (typeof window !== "undefined") {
      try {
        if (document.cookie.includes(`${SIDEBAR_COLLAPSED_COOKIE}=true`)) {
          return true;
        }
        return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
      } catch {
        return false;
      }
    }
    return false;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleToggleDesktopSidebar = () => {
    setIsDesktopCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
        // Also persist as cookie so server-side HTML prerenders exactly collapsed
        document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-ink text-text">
      {/* 1. Backdrop Overlay untuk Mobile Drawer */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* 2. Admin Sidebar (Desktop Collapsible + Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-surface transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:shrink-0 ${
          // Mobile responsive: slide in from left
          isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        } ${
          // Desktop responsive: full 64 (256px) or icon-only 20 (80px)
          isDesktopCollapsed ? "lg:w-20" : "lg:w-64"
        }`}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center justify-between border-b border-line p-4 lg:p-5 ${
            isDesktopCollapsed ? "lg:justify-center" : ""
          }`}
        >
          <div className={`flex flex-col gap-0.5 ${isDesktopCollapsed ? "lg:hidden" : ""}`}>
            <MonoLabel tone="brass">Damez Management</MonoLabel>
            <span className="font-display text-lg font-bold tracking-tight text-text">
              Portal Gerai
            </span>
            <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-muted">
              <span>{today} WIB</span>
              <span className="rounded-[2px] bg-surface-2 px-1.5 py-0.5 uppercase text-brass font-bold">
                {role}
              </span>
            </div>
          </div>

          {/* Icon Badge when desktop collapsed */}
          {isDesktopCollapsed && (
            <div className="hidden lg:flex flex-col items-center gap-1 py-1">
              <span className="rounded-[3px] bg-brass/10 border border-brass/40 px-2 py-1 font-mono text-xs font-bold text-brass">
                DMZ
              </span>
              <span className="font-mono text-[9px] uppercase text-ghost font-bold">{role}</span>
            </div>
          )}

          {/* Close Button on Mobile Drawer */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-[3px] border border-line bg-surface-2 text-muted hover:text-text lg:hidden"
            aria-label="Tutup Menu Sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav Items */}
        <nav aria-label="Menu Admin" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {!isDesktopCollapsed && (
            <div className="px-3 py-1.5">
              <MonoLabel>Navigasi Utama</MonoLabel>
            </div>
          )}

          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                title={isDesktopCollapsed ? `${item.label} (${item.tag})` : undefined}
                className={`flex items-center gap-3 rounded-[3px] border transition-colors ${
                  isDesktopCollapsed
                    ? "justify-center p-3"
                    : "flex-col items-start gap-0.5 px-3 py-2.5"
                } ${
                  active
                    ? "border-brass/40 bg-brass/10 text-text"
                    : "border-transparent text-muted hover:border-line-2 hover:bg-surface-2 hover:text-text"
                }`}
              >
                {isDesktopCollapsed ? (
                  <div className="relative">
                    <Icon className={`h-5 w-5 ${active ? "text-brass" : "text-muted"}`} />
                    {active && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-brass" />
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${active ? "text-brass" : "text-ghost"}`} />
                        <span className="font-display text-sm font-semibold">{item.label}</span>
                      </div>
                      <span
                        className={`font-mono text-[9px] font-bold uppercase tracking-wider ${
                          active ? "text-brass" : "text-ghost"
                        }`}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <span className="pl-6 font-mono text-[11px] text-muted">
                      {item.description}
                    </span>
                  </>
                )}
              </Link>
            );
          })}

          <div className="mt-4 border-t border-line-2 pt-3">
            {!isDesktopCollapsed && (
              <div className="px-3 py-1.5">
                <MonoLabel>Akses Eksternal</MonoLabel>
              </div>
            )}

            <Link
              href="/"
              target="_blank"
              title={isDesktopCollapsed ? "Lihat Website Publik" : undefined}
              className={`flex items-center rounded-[3px] border border-transparent text-muted hover:border-line-2 hover:bg-surface-2 hover:text-text ${
                isDesktopCollapsed
                  ? "justify-center p-3"
                  : "justify-between px-3 py-2 text-xs font-mono"
              }`}
            >
              {isDesktopCollapsed ? (
                <svg className="h-5 w-5 text-ghost" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              ) : (
                <>
                  <span>Lihat Website Publik</span>
                  <span className="text-brass">↗</span>
                </>
              )}
            </Link>
          </div>
        </nav>

        {/* Bottom Actions: Sign Out & Desktop Collapse Toggle */}
        <div className="border-t border-line p-3 flex flex-col gap-2">
          {/* Sign Out Button */}
          <form action="/api/admin/auth/sign-out" method="post">
            <button
              type="submit"
              title={isDesktopCollapsed ? "Keluar Sesi" : undefined}
              className={`flex min-h-10 w-full items-center justify-center rounded-[3px] border border-line bg-surface-2 font-mono text-xs text-muted transition-colors hover:border-danger/40 hover:text-danger ${
                isDesktopCollapsed ? "px-2" : "px-3"
              }`}
            >
              {isDesktopCollapsed ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              ) : (
                "Keluar Sesi"
              )}
            </button>
          </form>

          {/* Desktop Collapse/Expand Toggle Button at bottom of sidebar */}
          <button
            type="button"
            onClick={handleToggleDesktopSidebar}
            title={isDesktopCollapsed ? "Perlebar Sidebar" : "Ciutkan Sidebar"}
            className="hidden lg:flex min-h-9 w-full items-center justify-center gap-2 rounded-[3px] border border-line-2 bg-ink/60 font-mono text-[11px] text-ghost hover:text-text hover:bg-surface-2 transition-colors"
          >
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${
                isDesktopCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!isDesktopCollapsed && <span>Ciutkan Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* 3. Main Content Wrapper */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Navigation Bar with Mobile Hamburger + Desktop Toggle */}
        <AdminTopNav
          role={role}
          today={today}
          onToggleMobileMenu={() => setIsMobileOpen((prev) => !prev)}
          onToggleDesktopSidebar={handleToggleDesktopSidebar}
          isDesktopCollapsed={isDesktopCollapsed}
        />

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
