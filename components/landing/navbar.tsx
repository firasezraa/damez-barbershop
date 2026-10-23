"use client";

import * as React from "react";
import Link from "next/link";
import {
  IconScissors,
  IconMenu2,
  IconX,
  IconCalendar,
  IconChevronRight,
} from "@/components/ui/icons";
import { LiveStatusBadge } from "./live-status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#layanan", label: "Layanan" },
  { href: "#barber", label: "Tim Barber" },
  { href: "#kisah-kami", label: "Kisah Kami" },
  { href: "#galeri", label: "Galeri" },
  { href: "#lokasi", label: "Lokasi" },
  { href: "#faq", label: "Ketentuan & FAQ" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Close mobile menu on viewport resize to desktop
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileMenuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b",
        scrolled
          ? "border-border/80 bg-background/95 backdrop-blur-md shadow-lg shadow-black/30"
          : "border-border/40 bg-background/80 backdrop-blur-sm"
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-300",
          scrolled ? "h-16" : "h-18 lg:h-20"
        )}
      >
        {/* Brand Logo & Identification */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
            aria-label="Damez Barbershop"
          >
            <div className="relative flex size-10 sm:size-11 items-center justify-center rounded-xl bg-surface/90 border border-primary/30 group-hover:border-primary group-hover:shadow-[0_0_16px_rgba(217,119,6,0.22)] transition-all duration-300 shadow-sm shrink-0">
              <IconScissors
                size="sm"
                className="text-primary rotate-45 group-hover:scale-110 transition-transform duration-300"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-display text-base sm:text-lg lg:text-xl font-bold tracking-wider text-foreground group-hover:text-primary transition-colors whitespace-nowrap">
                DAMEZ BARBERSHOP
              </span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground tracking-tight hidden sm:block truncate">
                Senopati, Jakarta Selatan (Est. 2024)
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Nav Links - Centered Island Capsule */}
        <nav
          className="hidden lg:flex items-center gap-1 xl:gap-1.5 rounded-full border border-border/60 bg-surface/40 p-1.5 backdrop-blur-md shadow-xs"
          aria-label="Navigasi Utama"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3 xl:px-3.5 py-1.5 text-xs xl:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-elevated/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Header Actions & Live Status */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <div className="hidden xl:block">
            <LiveStatusBadge showDescription />
          </div>
          <div className="xl:hidden">
            <LiveStatusBadge />
          </div>
          <a href="#layanan">
            <Button
              variant="primary"
              size="sm"
              className="gap-2 font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
            >
              <IconCalendar size="micro" aria-hidden="true" />
              <span>Booking Jadwal</span>
            </Button>
          </a>
        </div>

        {/* Tablet Controls (Live Status + Booking CTA + Toggle) */}
        <div className="hidden md:flex lg:hidden items-center gap-2.5">
          <LiveStatusBadge />
          <a href="#layanan">
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5 font-semibold shadow-sm"
            >
              <IconCalendar size="micro" aria-hidden="true" />
              <span>Booking</span>
            </Button>
          </a>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-11 items-center justify-center rounded-xl border border-border bg-surface text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition-colors"
            aria-label={mobileMenuOpen ? "Tutup Menu Navigasi" : "Buka Menu Navigasi"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <IconX size="sm" aria-hidden="true" />
            ) : (
              <IconMenu2 size="sm" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Status & Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <LiveStatusBadge />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-11 items-center justify-center rounded-xl border border-border bg-surface text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition-colors"
            aria-label={mobileMenuOpen ? "Tutup Menu Navigasi" : "Buka Menu Navigasi"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <IconX size="md" aria-hidden="true" />
            ) : (
              <IconMenu2 size="md" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-surface-elevated/98 backdrop-blur-xl px-4 py-5 shadow-2xl transition-all">
          <div className="mx-auto max-w-lg flex flex-col gap-4">
            <div className="rounded-xl border border-border/60 bg-surface/60 p-3 shadow-xs">
              <LiveStatusBadge showDescription />
            </div>

            <nav className="flex flex-col gap-1.5" aria-label="Navigasi Menu Mobile">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex items-center justify-between rounded-xl px-4 py-3 min-h-[48px] text-sm font-medium text-foreground bg-surface/40 hover:bg-surface hover:text-primary active:bg-surface-elevated border border-border/40 hover:border-primary/30 transition-all duration-200"
                >
                  <span className="font-medium tracking-wide">{link.label}</span>
                  <IconChevronRight
                    size="micro"
                    className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200"
                    aria-hidden="true"
                  />
                </a>
              ))}
            </nav>

            <div className="pt-2 flex flex-col gap-3">
              <a
                href="#layanan"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full gap-2 font-bold shadow-md shadow-primary/20"
                >
                  <IconCalendar size="sm" aria-hidden="true" />
                  <span>Booking Jadwal Sekarang</span>
                </Button>
              </a>
              <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-muted-foreground">
                <span>Senopati, Jakarta Selatan</span>
                <span>Buka 10:00 - 21:00 WIB</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
