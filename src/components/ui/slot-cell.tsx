/**
 * Slot kursi: satu komponen untuk semua keadaan jadwal (IDEA.md §17.3).
 *
 * Aturan yang dijaga komponen ini: keadaan **tidak pernah hanya warna**. Setiap
 * keadaan membawa label teksnya sendiri, jadi pengunjung yang tidak bisa
 * membedakan arsir atau bingkai tetap tahu arti selnya.
 */

export type SlotState =
  | "scheduled"
  | "free"
  | "rest"
  | "chosen"
  | "held"
  | "done"
  | "no_show"
  | "cancelled";

export type SlotStateDefinition = {
  /** Label bawaan; dipakai pembaca layar dan sebagai teks sel bila tidak ada isi. */
  label: string;
  /** Kelas bentuk, bukan warna saja — arsir, garis putus, atau bingkai. */
  shape: string;
  /** Teks tambahan yang ditampilkan (kode booking, jam, atau sisa waktu). */
  defaultText: string;
};

const PUNCHED = "bg-[repeating-linear-gradient(135deg,var(--color-hold)_0_5px,var(--color-hold-2)_5px_10px)] border-t border-[#3d3420]";

export const SLOT_STATES: Record<SlotState, SlotStateDefinition> = {
  scheduled: {
    label: "Kursi terjadwal",
    shape: `${PUNCHED} flex-1 self-stretch px-2.5 font-mono text-xs text-punched`,
    defaultText: "",
  },
  free: {
    label: "Kursi bebas",
    shape: "flex-1 h-7 mx-2 rounded-[2px] border border-dashed border-[#3d3d46] font-mono text-xs text-ghost",
    defaultText: "BEBAS",
  },
  rest: {
    label: "Istirahat barber",
    shape: "flex-1 h-7 mx-2 rounded-[2px] border border-dashed border-line-rest font-mono text-xs text-brass-deep",
    defaultText: "ISTIRAHAT",
  },
  chosen: {
    label: "Pilihan Anda",
    shape: "flex-1 h-7 mx-2 rounded-[2px] border border-brass bg-brass/10 font-mono text-xs text-brass",
    defaultText: "",
  },
  held: {
    label: "Kursi sedang ditahan",
    shape:
      "flex-1 h-7 mx-2 rounded-[2px] border border-dashed border-brass bg-brass/5 font-mono text-xs text-brass",
    defaultText: "",
  },
  done: {
    label: "Selesai",
    shape: PUNCHED + " flex-1 self-stretch px-2.5 font-mono text-xs text-ghost",
    defaultText: "",
  },
  no_show: {
    label: "Tidak hadir",
    shape: "flex-1 h-7 mx-2 rounded-[2px] border border-danger font-mono text-xs text-danger",
    defaultText: "TIDAK HADIR",
  },
  cancelled: {
    label: "Dibatalkan",
    shape:
      "flex-1 h-7 mx-2 rounded-[2px] border border-dashed border-line-2 bg-surface-2/40 font-mono text-xs text-muted",
    defaultText: "DIBATALKAN",
  },
};

export function SlotCell({
  state,
  text,
  className = "",
}: {
  state: SlotState;
  text?: string;
  className?: string;
}) {
  const definition = SLOT_STATES[state];
  const shown = text ?? definition.defaultText;

  return (
    <div
      data-state={state}
      aria-label={shown.length > 0 ? `${definition.label}: ${shown}` : definition.label}
      className={`flex items-center justify-center ${definition.shape} ${className}`}
    >
      {shown}
    </div>
  );
}
