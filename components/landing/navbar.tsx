"use client";

import * as React from "react";
import Link from "next/link";
import { Scissors, Menu, X, Clock, Calendar } from "lucide-react";
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

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b",
        scrolled
          ? "border-border/80 bg-background/95 backdrop-blur-md shadow-lg shadow-black/30"
          : "border-border/40 bg-background/80 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-surface border border-primary/40 group-hover:border-primary transition-colors shadow-sm">
              <Scissors className="size-5 text-primary rotate-45 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg sm:text-xl font-bold tracking-wider text-foreground group-hover:text-primary transition-colors">
                DAMEZ BARBERSHOP
              </span>
              <span className="text-[11px] text-muted-foreground tracking-tight">
                Senopati, Jakarta Selatan (Est. 2024)
              </span>
            </div>
          </Link>

          {/* Desktop Live Status Badge */}
          <div className="hidden lg:block ml-4 pl-4 border-l border-border">
            <LiveStatusBadge showDescription />
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-primary transition-colors py-2"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Header Actions */}
        <div className="hidden md:flex items-center gap-3">
          <a href="#layanan">
            <Button variant="primary" size="default" className="gap-2 font-semibold shadow-md">
              <Calendar className="size-4" />
              <span>Booking Jadwal</span>
            </Button>
          </a>
        </div>

        {/* Mobile Status & Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <LiveStatusBadge />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-11 items-center justify-center rounded-xl border border-border bg-surface text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            aria-label="Buka Menu Navigasi"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface-elevated/98 backdrop-blur-xl px-4 py-6 shadow-2xl transition-all">
          <div className="flex flex-col gap-4">
            <div className="pb-3 border-b border-border/60">
              <LiveStatusBadge showDescription />
            </div>
            <nav className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-surface hover:text-primary transition-colors"
                >
                  <span>{link.label}</span>
                </a>
              ))}
            </nav>
            <div className="pt-2">
              <a
                href="#layanan"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="primary" size="lg" className="w-full gap-2">
                  <Calendar className="size-5" />
                  <span>Booking Jadwal Sekarang</span>
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
