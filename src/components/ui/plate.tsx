import type { ReactNode } from "react";

/**
 * Plat: panel dasar sistem (IDEA.md §17.6). Satu tingkat permukaan di atas
 * dinding `ink`, garis 1 px, sudut 3 px, tanpa bayangan berwarna.
 */
export function Plate({
  children,
  className = "",
  tone = "surface",
}: {
  children: ReactNode;
  className?: string;
  tone?: "surface" | "surface-2" | "paper";
}) {
  const tones = {
    surface: "bg-surface border-line text-text",
    "surface-2": "bg-surface-2 border-line-2 text-text",
    paper: "bg-paper border-paper text-paper-ink",
  } as const;

  return (
    <div className={`rounded-[3px] border ${tones[tone]} ${className}`}>{children}</div>
  );
}

/** Label huruf besar berjarak kecil; informasi, bukan hiasan (IDEA.md §17.14). */
export function MonoLabel({
  children,
  tone = "muted",
  className = "",
}: {
  children: ReactNode;
  tone?: "muted" | "brass" | "ghost";
  className?: string;
}) {
  const tones = { muted: "text-muted", brass: "text-brass", ghost: "text-ghost" } as const;

  return (
    <span
      className={`font-mono text-xs uppercase tracking-[0.12em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Aksi utama: brass penuh, teks ink, satu nilai mono di sisi kanan (IDEA.md
 * §17.3). Satu tombol per permukaan; tidak ada tombol sekunder berwarna brass.
 */
/** Kelas aksi utama, dipakai tombol dan tautan supaya keduanya identik. */
export const ACTION_CLASSES =
  "flex h-[58px] w-full items-center justify-between rounded-[3px] bg-brass px-5 font-display text-[19px] font-bold text-ink transition-colors duration-150 hover:brightness-105 disabled:opacity-50";

export function ActionButton({
  children,
  value,
  type = "button",
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  value?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button type={type} disabled={disabled} className={`${ACTION_CLASSES} ${className}`}>
      <span>{children}</span>
      {value === undefined ? null : (
        <span className="font-mono text-xs font-semibold opacity-70">{value}</span>
      )}
    </button>
  );
}
