/**
 * Konfigurasi pembayaran Midtrans, dibaca terpisah dari env lain supaya route
 * publik (slot, booking) tidak ikut gagal hanya karena kunci Midtrans belum diisi.
 *
 * Lingkungan Snap **tidak** ditentukan oleh `NODE_ENV`. Build produksi dengan kunci
 * sandbox akan mengirim kunci sandbox ke endpoint produksi dan hanya menghasilkan
 * 401 tanpa petunjuk; karena itu lingkungan datang dari `MIDTRANS_IS_PRODUCTION`
 * dan pasangan kunci/lingkungan yang tidak cocok ditolak saat dibaca (gagal cepat,
 * sebelum ada pelanggan yang menekan tombol bayar).
 */

/** Kunci sandbox Midtrans berawalan `SB-Mid-server-`; kunci produksi `Mid-server-`. */
const SANDBOX_KEY_PREFIX = "SB-Mid-server-";
const PRODUCTION_KEY_PREFIX = "Mid-server-";

export type PaymentEnv = {
  serverKey: string;
  isProduction: boolean;
  mock: boolean;
  appBaseUrl?: string;
};

export function readPaymentEnv(
  source: Record<string, string | undefined> = process.env,
): PaymentEnv {
  const serverKey = source["MIDTRANS_SERVER_KEY"] ?? "";
  const isProduction = source["MIDTRANS_IS_PRODUCTION"] === "true";
  const mock = source["MOCK_MIDTRANS"] === "true";
  const baseUrl = source["APP_BASE_URL"];

  if (serverKey.startsWith(SANDBOX_KEY_PREFIX) && isProduction) {
    throw new Error(
      "MIDTRANS_IS_PRODUCTION=true tetapi MIDTRANS_SERVER_KEY adalah kunci sandbox (SB-Mid-server-...). " +
        "Set MIDTRANS_IS_PRODUCTION=false atau ganti ke kunci produksi.",
    );
  }

  if (serverKey.startsWith(PRODUCTION_KEY_PREFIX) && !isProduction) {
    throw new Error(
      "MIDTRANS_SERVER_KEY adalah kunci produksi (Mid-server-...) tetapi MIDTRANS_IS_PRODUCTION bukan true. " +
        "Set MIDTRANS_IS_PRODUCTION=true kalau memang menerima transaksi nyata.",
    );
  }

  let appBaseUrl: string | undefined;
  if (baseUrl !== undefined && baseUrl.length > 0) {
    let parsed: URL;
    try {
      parsed = new URL(baseUrl);
    } catch {
      throw new Error("APP_BASE_URL bukan URL yang sah. Contoh: https://damez.example");
    }
    appBaseUrl = parsed.origin + parsed.pathname.replace(/\/+$/, "");
  }

  return {
    serverKey,
    isProduction,
    mock,
    ...(appBaseUrl === undefined ? {} : { appBaseUrl }),
  };
}