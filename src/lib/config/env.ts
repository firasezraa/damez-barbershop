import { z } from "zod";

/**
 * Variabel lingkungan server. Nilai tidak pernah dicetak — pesan error hanya
 * menyebut NAMA variabel, supaya log/CI tidak membocorkan koneksi atau secret.
 */
export const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  MIDTRANS_SERVER_KEY: z.string().min(1),
  MOCK_MIDTRANS: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  MOCK_WHATSAPP: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  CRON_SECRET: z.string().min(16),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Sumber env apa pun yang berbentuk pasangan nama/nilai string — `process.env`
 * memenuhi ini. Tidak memakai `NodeJS.ProcessEnv` supaya pemanggil (test, CLI)
 * bisa mengirim objek biasa tanpa harus menyertakan `NODE_ENV`.
 */
export type EnvSource = Record<string, string | undefined>;

export function readServerEnv(source: EnvSource = process.env): ServerEnv {
  const parsed = serverEnvSchema.safeParse(source);

  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(`Konfigurasi env tidak valid. Periksa variabel: ${fields.sort().join(", ")}`);
  }

  return parsed.data;
}
