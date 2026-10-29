import type { Pool } from "pg";
import { bookingPool } from "../slots/services.ts";

/**
 * Antrean notifikasi di database (IDEA.md §6). v1 mengirim WhatsApp secara
 * fire-and-forget dari dalam request; di sini pengiriman dicatat sebagai baris
 * supaya bisa dicoba ulang oleh worker tanpa menggandakan pesan.
 */

export type NotificationKind = "booking_confirmed" | "booking_reminder" | "booking_cancelled";
export type NotificationRecipient = "customer" | "admin" | "barber";

export type EnqueueInput = {
  bookingId: string;
  kind: NotificationKind;
  recipientType: NotificationRecipient;
  provider: string;
};

/** Provider aktif: Fonnte/Wablas di produksi, `mock` saat MOCK_WHATSAPP aktif. */
export function whatsappProvider(env: { MOCK_WHATSAPP?: string | undefined }): string {
  return env.MOCK_WHATSAPP === "true" ? "mock" : "fonnte";
}

export async function enqueueNotification(
  input: EnqueueInput,
  target: Pool = bookingPool(),
): Promise<string> {
  const result = await target.query<{ id: string }>(
    `INSERT INTO public.notifications (booking_id, kind, recipient_type, provider, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING id`,
    [input.bookingId, input.kind, input.recipientType, input.provider],
  );

  return (result.rows[0] as { id: string }).id;
}
