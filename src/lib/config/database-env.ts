import { z } from "zod";

/**
 * Subset env untuk koneksi database. Dipisah supaya route publik (slot, booking)
 * dan pembatas laju tidak ikut mati hanya karena kunci Midtrans atau CRON_SECRET
 * belum diisi di lingkungan itu.
 */
export const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

export function readDatabaseEnv(source: Record<string, string | undefined> = process.env): DatabaseEnv {
  const parsed = databaseEnvSchema.safeParse(source);

  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(`Konfigurasi database belum lengkap. Periksa variabel: ${fields.sort().join(", ")}`);
  }

  return parsed.data;
}

export const cronEnvSchema = z.object({
  CRON_SECRET: z.string().min(16),
  DATABASE_URL: z.string().url(),
});

export type CronEnv = z.infer<typeof cronEnvSchema>;

export function readCronEnv(source: Record<string, string | undefined> = process.env): CronEnv {
  const parsed = cronEnvSchema.safeParse(source);

  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(`Konfigurasi cron belum lengkap. Periksa variabel: ${fields.sort().join(", ")}`);
  }

  return parsed.data;
}
