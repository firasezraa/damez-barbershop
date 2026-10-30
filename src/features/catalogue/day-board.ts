import type { Pool } from "pg";
import type { SlotState } from "../../components/ui/slot-cell.tsx";
import { bookingPool } from "../slots/services.ts";
import { CLOSING_HOUR, OPENING_HOUR } from "../../lib/config/constants.ts";
import { jakartaDateString, jakartaIso, jakartaMinutesOf } from "../../lib/time/jakarta.ts";

/**
 * Papan hari untuk beranda (IDEA.md §17.3): baris = jam, kolom = kursi.
 *
 * Privasi: papan publik **tidak** pernah menampilkan kode booking atau nama
 * pelanggan. Yang tampil hanya nama layanan yang sedang dikerjakan. Kode booking
 * cukup untuk membuka halaman tiket, jadi menampilkannya di beranda sama dengan
 * membocorkan nama dan jadwal orang lain.
 */

export type SlotInterval = {
  /** Menit dari tengah malam waktu Jakarta. */
  startMinutes: number;
  endMinutes: number;
  label: string;
};

export type BoardSlot = { hour: number; state: SlotState; text: string };

export type BoardChair = {
  chairNumber: number;
  barberName: string;
  barberTitle: string | null;
  /** Barber libur pada hari itu: seluruh jam ditandai istirahat. */
  off: boolean;
  slots: BoardSlot[];
};

export type DayBoard = {
  dateJakarta: string;
  label: string;
  startHour: number;
  endHour: number;
  /** Jam Jakarta saat papan dibuat, untuk ditampilkan sebagai "sekarang". */
  nowMinutes: number;
  scheduledCount: number;
  chairs: BoardChair[];
};

/**
 * Jam yang ditampilkan papan: dari jam berjalan (dibulatkan ke bawah) sampai jam
 * tutup. Jam yang sudah lewat tidak ditampilkan supaya papan tidak penuh sel mati.
 */
export function boardHours(nowMinutes: number, opening = OPENING_HOUR, closing = CLOSING_HOUR): number[] {
  const nowHour = Math.floor(nowMinutes / 60);
  const first = Math.min(Math.max(nowHour, opening), closing - 1);

  return Array.from({ length: closing - first }, (_, index) => first + index);
}

/** Keadaan satu sel: booking menang atas blokir, blokir menang atas bebas. */
export function slotStateForHour(
  hour: number,
  intervals: { bookings: SlotInterval[]; blocks: SlotInterval[] },
): { state: SlotState; text: string } {
  const start = hour * 60;
  const end = start + 60;

  const booking = intervals.bookings.find(
    (item) => item.startMinutes < end && item.endMinutes > start,
  );
  if (booking !== undefined) {
    return { state: "scheduled", text: booking.label };
  }

  const block = intervals.blocks.find(
    (item) => item.startMinutes < end && item.endMinutes > start,
  );
  if (block !== undefined) {
    return { state: "rest", text: block.label };
  }

  return { state: "free", text: "BEBAS" };
}

type BarberRow = {
  id: string;
  full_name: string;
  title: string | null;
  chair_number: number;
  day_off: number;
};

type BookingRow = {
  barber_id: string;
  start_time: Date;
  end_time: Date;
  services: string | null;
  category: string | null;
  duration_minutes: number;
};

/**
 * Label pendek untuk sel papan. Nama katalog panjang ("Relaxing Hair Spa &
 * Anti-Dandruff Scalp Treatment") tidak muat di satu sel; yang dipakai adalah
 * bagian pertama sebelum pemisah, lalu durasinya. Ini menjaga sel tetap terbaca
 * tanpa memotong kata di tengah.
 */
const MAX_CELL_LABEL = 22;

/** Potong di batas kata; kalau tidak ada spasi yang masuk akal, pakai kata pertama. */
function trimAtWord(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }

  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");

  return lastSpace >= 6 ? cut.slice(0, lastSpace) : (value.split(" ")[0] ?? value);
}

export function shortServiceLabel(
  services: string | null,
  durationMinutes: number,
  category: string | null = null,
): string {
  const raw = (services ?? "TERISI").split(" + ")[0] ?? "TERISI";
  const head = (raw.split(/ & | \/ |, /)[0] ?? raw).trim();

  // Nama yang masih panjang (mis. "The Damez Signature Executive Combo") tidak bisa
  // diringkas dengan aman tanpa memotong kata, jadi sel memakai kategorinya —
  // tetap informasi nyata dari katalog, bukan singkatan karangan.
  const label = head.length <= MAX_CELL_LABEL ? head : (category ?? trimAtWord(head, MAX_CELL_LABEL));

  return `${label} · ${durationMinutes}′`;
}

type BlockRow = {
  barber_id: string;
  slot_type: string;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
  start_at: Date | null;
  end_at: Date | null;
};

function minutesOf(iso: Date): number {
  return jakartaMinutesOf(iso);
}

/** Menit dari tengah malam untuk nilai `time` Postgres seperti `"12:55:00"`. */
function minutesOfTime(value: string): number {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

export function dayLabel(dateJakarta: string): string {
  const formatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${dateJakarta}T12:00:00+07:00`));

  return formatted;
}

export async function buildDayBoard(
  now: Date = new Date(),
  pool: Pool = bookingPool(),
): Promise<DayBoard> {
  const dateJakarta = jakartaDateString(now);
  const nowMinutes = jakartaMinutesOf(now);
  const dayOfWeek = new Date(`${dateJakarta}T12:00:00+07:00`).getUTCDay();
  const hours = boardHours(nowMinutes);

  const dayStart = jakartaIso(dateJakarta, 0);
  const dayEnd = jakartaIso(dateJakarta, 24 * 60);

  const [barbers, bookings, blocks] = await Promise.all([
    pool.query<BarberRow>(
      `SELECT id, full_name, title, chair_number, day_off
         FROM public.barbers
        WHERE is_active
        ORDER BY chair_number`,
    ),
    pool.query<BookingRow>(
      `SELECT b.barber_id, b.start_time, b.end_time, b.service_duration_minutes AS duration_minutes,
              (SELECT string_agg(s.name, ' + ' ORDER BY bs.duration_snapshot_minutes DESC)
                 FROM public.booking_services bs JOIN public.services s ON s.id = bs.service_id
                WHERE bs.booking_id = b.id) AS services,
              (SELECT min(s.category)
                 FROM public.booking_services bs JOIN public.services s ON s.id = bs.service_id
                WHERE bs.booking_id = b.id) AS category
         FROM public.bookings b
        WHERE b.start_time >= $1::timestamptz AND b.start_time < $2::timestamptz
          AND b.status::text IN ('pending_payment', 'confirmed', 'in_progress', 'completed')`,
      [dayStart, dayEnd],
    ),
    pool.query<BlockRow>(
      `SELECT barber_id, slot_type, day_of_week, start_time::text AS start_time,
              end_time::text AS end_time, start_at, end_at
         FROM public.blocked_slots
        WHERE is_active`,
    ),
  ]);

  const chairs: BoardChair[] = barbers.rows.map((barber) => {
    const off = barber.day_off === dayOfWeek;

    const chairBookings: SlotInterval[] = bookings.rows
      .filter((row) => row.barber_id === barber.id)
      .map((row) => ({
        startMinutes: minutesOf(row.start_time),
        endMinutes: minutesOf(row.end_time),
        label: shortServiceLabel(row.services, row.duration_minutes, row.category),
      }));

    const chairBlocks: SlotInterval[] = blocks.rows
      .filter((row) => row.barber_id === barber.id)
      .flatMap((row) => {
        if (row.slot_type === "recurring_break") {
          if (row.day_of_week !== dayOfWeek || row.start_time === null || row.end_time === null) {
            return [];
          }

          return [
            {
              startMinutes: minutesOfTime(row.start_time),
              endMinutes: minutesOfTime(row.end_time),
              label: "ISTIRAHAT",
            },
          ];
        }

        if (row.start_at === null || row.end_at === null) {
          return [];
        }

        return [
          {
            startMinutes: minutesOf(row.start_at),
            endMinutes: minutesOf(row.end_at),
            label: "ISTIRAHAT",
          },
        ];
      });

    return {
      chairNumber: barber.chair_number,
      barberName: barber.full_name,
      barberTitle: barber.title,
      off,
      slots: hours.map((hour) => {
        if (off) {
          return { hour, state: "rest" as SlotState, text: "LIBUR" };
        }

        const { state, text } = slotStateForHour(hour, {
          bookings: chairBookings,
          blocks: chairBlocks,
        });

        return { hour, state, text };
      }),
    };
  });

  return {
    dateJakarta,
    label: dayLabel(dateJakarta),
    startHour: hours[0] ?? OPENING_HOUR,
    endHour: CLOSING_HOUR,
    nowMinutes,
    scheduledCount: chairs
      .flatMap((chair) => chair.slots)
      .filter((slot) => slot.state === "scheduled").length,
    chairs,
  };
}

export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}
