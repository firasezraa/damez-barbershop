import { handleMidtransNotification, type MidtransNotification } from "@/features/payment/webhook";

export const runtime = "nodejs";

/**
 * Webhook Midtrans. Satu-satunya jalur yang boleh mengubah status booking menjadi
 * `confirmed` (IDEA.md §7). Signature diverifikasi dulu, baru database disentuh;
 * pengiriman ulang menghasilkan `duplicate` tanpa efek samping.
 */
export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ status: "rejected", detail: "INVALID_BODY" }, { status: 400 });
  }

  const notification = payload as Partial<MidtransNotification>;
  const required: (keyof MidtransNotification)[] = [
    "order_id",
    "status_code",
    "gross_amount",
    "signature_key",
    "transaction_id",
    "transaction_status",
  ];

  for (const field of required) {
    if (typeof notification[field] !== "string" || notification[field].length === 0) {
      return Response.json({ status: "rejected", detail: "INVALID_BODY" }, { status: 400 });
    }
  }

  const result = await handleMidtransNotification(notification as MidtransNotification, {
    serverKey: process.env["MIDTRANS_SERVER_KEY"] ?? "",
    mockWhatsapp: process.env["MOCK_WHATSAPP"],
  });

  return Response.json(result.body, { status: result.status });
}