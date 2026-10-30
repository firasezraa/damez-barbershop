import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Tanda tangan notifikasi Midtrans: SHA-512 dari
 * `order_id + status_code + gross_amount + server_key` (model v1 yang terbukti
 * benar, IDEA.md §2.4 no. 3). Modul murni supaya bisa diuji tanpa jaringan.
 */
export function midtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
): string {
  return createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest("hex");
}

export type SignatureInput = {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signature: string;
  serverKey: string;
};

/**
 * Perbandingan panjang-tetap. Panjang berbeda ditolak lebih dulu; isi
 * dibandingkan dengan `timingSafeEqual` supaya tanda tangan tidak bisa ditebak
 * lewat waktu respons.
 */
export function verifyMidtransSignature(input: SignatureInput): boolean {
  if (input.serverKey.length === 0 || input.signature.length === 0) {
    return false;
  }

  const expected = Buffer.from(
    midtransSignature(input.orderId, input.statusCode, input.grossAmount, input.serverKey),
    "utf8",
  );
  const received = Buffer.from(input.signature.toLowerCase(), "utf8");

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}