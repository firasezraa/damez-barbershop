import { isAuthorizedCronRequest } from "@/lib/security/cron-auth";
import { dispatchPendingNotifications, providerFor } from "@/features/notifications/sender";

export const runtime = "nodejs";

/**
 * Worker pengiriman notifikasi WhatsApp. Dijalankan penjadwal dengan
 * `Authorization: Bearer <CRON_SECRET>`; tanpa header yang benar → 401 dan
 * database tidak disentuh.
 */
export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCronRequest(request, process.env["CRON_SECRET"])) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const summary = await dispatchPendingNotifications(
      providerFor({
        MOCK_WHATSAPP: process.env["MOCK_WHATSAPP"],
        FONNTE_TOKEN: process.env["FONNTE_TOKEN"],
      }),
    );

    return Response.json(summary, { status: 200 });
  } catch {
    return Response.json({ error: "Layanan sedang tidak tersedia." }, { status: 503 });
  }
}