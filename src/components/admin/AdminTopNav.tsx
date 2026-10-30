"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchResultItem {
  id: string;
  bookingCode: string;
  customerName: string;
  phoneE164: string;
  barberName: string;
  chairNumber: number;
  startTime: string;
  status: string;
  totalIdr: number;
}

interface AdminTopNavProps {
  role: string;
  today: string;
}

export function AdminTopNav({ role, today }: AdminTopNavProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd+K / Ctrl+K to focus search bar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(trimmed)}&limit=8`);
        if (res.ok) {
          const json = await res.json();
          setResults(json.data || []);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery("");
    // Redirect to overview with search query or direct customer view
    router.push(`/admin/overview?q=${encodeURIComponent(item.bookingCode)}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-line bg-ink/90 px-6 backdrop-blur-md lg:px-10">
      {/* Search Bar Container */}
      <div ref={containerRef} className="relative w-full max-w-md sm:max-w-lg">
        <div className="relative flex items-center">
          <svg
            className="pointer-events-none absolute left-3.5 h-4 w-4 text-ghost"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (!val.trim()) {
                setResults([]);
                setLoading(false);
              }
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Cari kode booking, nama tamu, no hp, atau barber..."
            className="h-10 w-full rounded-[3px] border border-line bg-surface-2/60 pl-10 pr-16 font-mono text-xs text-text placeholder:text-ghost/60 focus:border-brass/80 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-brass/60"
            aria-label="Cari transaksi dan tamu di dashboard"
          />

          <div className="pointer-events-none absolute right-3 hidden items-center gap-1 font-mono text-[10px] text-ghost sm:flex">
            <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-bold">⌘K</kbd>
          </div>
        </div>

        {/* Live Search Popup Dropdown */}
        {isOpen && query.trim() && (
          <div className="absolute top-12 left-0 z-50 w-full overflow-hidden rounded-[4px] border border-line bg-surface shadow-2xl">
            <div className="border-b border-line px-4 py-2 font-mono text-[10px] tracking-wider text-muted uppercase">
              {loading ? "Mencari data..." : `Hasil Pencarian (${results.length})`}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading && results.length === 0 ? (
                <div className="px-4 py-6 text-center font-mono text-xs text-muted">
                  Memuat data dari database...
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-6 text-center font-mono text-xs text-muted">
                  Tidak ditemukan booking dengan kata kunci &quot;{query}&quot;
                </div>
              ) : (
                results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-center justify-between border-b border-line/50 px-4 py-3 text-left transition-colors hover:bg-surface-2 focus:bg-surface-2 focus:outline-none"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brass">
                          {item.bookingCode}
                        </span>
                        <span className="font-display text-sm font-semibold text-text">
                          {item.customerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-muted">
                        <span>{item.phoneE164}</span>
                        <span>·</span>
                        <span>{item.barberName} (Kursi {item.chairNumber})</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-[2px] border border-line px-2 py-0.5 font-mono text-[10px] font-bold text-ghost uppercase">
                        {item.status}
                      </span>
                      <span className="font-mono text-[11px] text-brass">
                        Rp {item.totalIdr.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {results.length > 0 && (
              <div className="border-t border-line bg-ink/40 px-4 py-2 text-right">
                <Link
                  href={`/admin/overview?q=${encodeURIComponent(query)}`}
                  onClick={() => setIsOpen(false)}
                  className="font-mono text-[11px] text-brass hover:underline"
                >
                  Buka semua di halaman Overview →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Status Admin di Pojok Kanan Atas */}
      <div className="flex items-center gap-4">
        <div className="hidden flex-col items-end sm:flex">
          <div className="flex items-center gap-1.5 font-mono text-xs text-text">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="font-bold uppercase">{role}</span>
          </div>
          <span className="font-mono text-[10px] text-muted">{today} WIB</span>
        </div>

        <Link
          href="/"
          target="_blank"
          className="inline-flex h-9 items-center gap-1.5 rounded-[3px] border border-line bg-surface px-3 font-mono text-xs text-text transition-colors hover:border-brass/60"
          title="Buka Website Publik di Tab Baru"
        >
          <span>Web Publik</span>
          <svg className="h-3 w-3 text-ghost" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
