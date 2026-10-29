import { Pool, type PoolConfig } from "pg";
// Ekstensi .ts wajib: scripts/* dijalankan lewat `node --experimental-strip-types`,
// yang tidak me-resolve impor tanpa ekstensi. Next.js/Turbopack menerima keduanya.
import { TIMEZONE } from "../config/constants.ts";

/**
 * Pool Postgres untuk skrip (migrasi, seed, worker) dan route handler server.
 * Hanya dipakai di server — lihat aturan lint `damez-boundaries/no-direct-db-in-api-route`.
 *
 * `options` memin TimeZone sesi ke Asia/Jakarta untuk setiap koneksi. Tanpa ini
 * `date_trunc('day', ...)`, `to_char(...)` dan cast `::date` mengikuti zona mesin
 * (VPS: Asia/Shanghai, runner CI: UTC) sehingga batas hari pada rekap kas bisa
 * berbeda antara lokal, CI dan produksi.
 *
 * TLS: host non-lokal (mis. pooler Supabase) mewajibkan TLS dan verifikasi aktif
 * secara default. `PG_SSL_INSECURE=true` mematikannya untuk bootstrap sekali jalan:
 * pooler Supabase mengirim rantai yang memuat sertifikat self-signed, dan Node
 * menolaknya walaupun root sebenarnya ada di trust store.
 */

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "0.0.0.0"]);

function hostOf(connectionString: string): string | null {
  try {
    return new URL(connectionString).hostname;
  } catch {
    return null;
  }
}

export function sslFor(connectionString: string): PoolConfig["ssl"] | undefined {
  const host = hostOf(connectionString);
  if (host === null || LOCAL_HOSTS.has(host)) {
    return undefined;
  }

  return { rejectUnauthorized: process.env["PG_SSL_INSECURE"] !== "true" };
}

export function createPgPool(connectionString: string, max = 5): Pool {
  const ssl = sslFor(connectionString);

  return new Pool({
    connectionString,
    max,
    options: `-c timezone=${TIMEZONE}`,
    ...(ssl === undefined ? {} : { ssl }),
  });
}