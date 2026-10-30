import type { Pool } from "pg";
import { bookingPool } from "../slots/services.ts";
import { buildBookingConfirmedMessage } from "./templates.ts";

/**
 * Pengirim notifikasi WhatsApp. v1 mengirim langsung di dalam request (fire and
 * forget, 1.836 baris di satu berkas). Di sini pengiriman diambil dari antrean
 * database, punya percobaan terbatas, dan kegagalannya tercatat — jadi pesan yang
 * gagal bisa diulang tanpa menggandakan.
 */

export type SendOutcome = { ok: true } | { ok: false; error: string };

export type MessageProvider = {
  name: string;
  send: (phoneE164: string, body: string) => Promise<SendOutcome>;
};

export const MAX_ATTEMPTS = 5;

/** Provider palsu untuk pengembangan, test, dan E2E: tidak keluar jaringan. */
export function mockProvider(log: string[] = []): MessageProvider {
  return {
    name: "mock",
    send: async (phone, body) => {
      log.push(`${phone}:${body.split("\n")[0] ?? ""}`);
      return { ok: true };
    },
  };
}

type PendingRow = {
  id: string;
  booking_id: string;
  kind: string;
  phone_e164: string;
  full_name: string;
  booking_code: string;
  start_time: Date;
  dp_idr: number;
  remaining_idr: number;
  barber_name: string;
  chair_number: number;
};

export type DispatchSummary = { sent: number; failed: number; drained: number };

/**
 * Mengirim notifikasi `pending` yang sudah waktunya. Satu baris = satu percobaan;
 * setelah MAX_ATTEMPTS baris ditandai `failed` dan tidak dicoba lagi.
 */
export async function dispatchPendingNotifications(
  provider: MessageProvider,
  options: { limit?: number; pool?: Pool } = {},
): Promise<DispatchSummary> {
  const pool = options.pool ?? bookingPool();
  const limit = options.limit ?? 20;

  const pending = await pool.query<PendingRow>(
    `SELECT n.id, n.booking_id, n.kind,
            c.phone_e164, c.full_name,
            b.booking_code, b.start_time, b.dp_idr, b.remaining_idr,
            bar.full_name AS barber_name, bar.chair_number
       FROM public.notifications n
       JOIN public.bookings b ON b.id = n.booking_id
       JOIN public.customers c ON c.id = b.customer_id
       JOIN public.barbers bar ON bar.id = b.barber_id
      WHERE n.status = 'pending' AND n.attempts < $2 AND n.scheduled_at <= now()
      ORDER BY n.scheduled_at
      LIMIT $1`,
    [limit, MAX_ATTEMPTS],
  );

  const summary: DispatchSummary = { sent: 0, failed: 0, drained: pending.rows.length };

  for (const row of pending.rows) {
    const body = buildBookingConfirmedMessage({
      fullName: row.full_name,
      bookingCode: row.booking_code,
      startTime: row.start_time,
      barberName: row.barber_name,
      chairNumber: row.chair_number,
      dpIdr: row.dp_idr,
      remainingIdr: row.remaining_idr,
    });

    let outcome: SendOutcome;
    try {
      outcome = await provider.send(row.phone_e164, body);
    } catch (error) {
      outcome = { ok: false, error: error instanceof Error ? error.message : "provider error" };
    }

    if (outcome.ok) {
      summary.sent += 1;
      await pool.query(
        `UPDATE public.notifications
            SET status = 'sent', attempts = attempts + 1, sent_at = now(), last_error = NULL,
                updated_at = now()
          WHERE id = $1`,
        [row.id],
      );
      continue;
    }

    summary.failed += 1;
    await pool.query(
      `UPDATE public.notifications
          SET status = CASE WHEN attempts + 1 >= $2 THEN 'failed' ELSE 'pending' END,
              attempts = attempts + 1,
              last_error = $3,
              updated_at = now()
        WHERE id = $1`,
      [row.id, MAX_ATTEMPTS, outcome.error.slice(0, 500)],
    );
  }

  return summary;
}

/** Provider nyata (Fonnte) dipakai hanya saat MOCK_WHATSAPP tidak aktif. */
export function fonnteProvider(token: string, fetchImpl: typeof fetch = fetch): MessageProvider {
  return {
    name: "fonnte",
    send: async (phone, body) => {
      try {
        const response = await fetchImpl("https://api.fonnte.com/send", {
          method: "POST",
          headers: { authorization: token, "content-type": "application/json" },
          body: JSON.stringify({ target: phone, message: body }),
        });

        if (!response.ok) {
          return { ok: false, error: `fonnte ${response.status}` };
        }

        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "fonnte error" };
      }
    },
  };
}

/** Provider aktif sesuai env; `mock` mencegah biaya dan ketergantungan jaringan. */
export function providerFor(env: {
  MOCK_WHATSAPP?: string | undefined;
  FONNTE_TOKEN?: string | undefined;
}): MessageProvider {
  if (env.MOCK_WHATSAPP === "true" || env.FONNTE_TOKEN === undefined || env.FONNTE_TOKEN.length === 0) {
    return mockProvider();
  }

  return fonnteProvider(env.FONNTE_TOKEN);
}