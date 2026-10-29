import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Membuat akun admin awal lewat Admin API Supabase (jalur resmi). Password TIDAK
 * pernah ada di kode: diambil dari env `ADMIN_SEED_PASSWORD`. Peran disimpan di
 * `app_metadata` — `user_metadata` bisa ditulis pemilik akun sendiri, jadi peran di
 * sana sama dengan membiarkan siapa pun menaikkan dirinya menjadi owner.
 *
 * Idempoten: akun yang sudah ada diperbarui (password + peran), bukan digandakan.
 */

export type AdminSeedUser = {
  email: string;
  role: "owner" | "cashier" | "barber";
  label: string;
};

export const ADMIN_SEED_USERS: AdminSeedUser[] = [
  { email: "owner@damez.id", role: "owner", label: "Owner gerai" },
  { email: "kasir@damez.id", role: "cashier", label: "Kasir" },
  { email: "barber@damez.id", role: "barber", label: "Barber" },
];

export type SeedAdminSummary = { created: string[]; updated: string[] };

/** Klien dengan hak service role; hanya dipakai skrip setup ini. */
type AdminClient = SupabaseClient;

export async function seedAdminUsers(
  admin: AdminClient,
  users: AdminSeedUser[],
  password: string,
): Promise<SeedAdminSummary> {
  const existing = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (existing.error !== null) {
    throw new Error(`Gagal membaca daftar pengguna: ${existing.error.message}`);
  }

  const byEmail = new Map(existing.data.users.map((user) => [user.email ?? "", user.id]));
  const summary: SeedAdminSummary = { created: [], updated: [] };

  for (const user of users) {
    const knownId = byEmail.get(user.email);

    if (knownId === undefined) {
      const created = await admin.auth.admin.createUser({
        email: user.email,
        password,
        email_confirm: true,
        app_metadata: { role: user.role },
      });

      if (created.error !== null) {
        throw new Error(`Gagal membuat ${user.email}: ${created.error.message}`);
      }

      summary.created.push(user.email);
      continue;
    }

    const updated = await admin.auth.admin.updateUserById(knownId, {
      password,
      email_confirm: true,
      app_metadata: { role: user.role },
    });

    if (updated.error !== null) {
      throw new Error(`Gagal memperbarui ${user.email}: ${updated.error.message}`);
    }

    summary.updated.push(user.email);
  }

  return summary;
}

async function main(): Promise<void> {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  const password = process.env["ADMIN_SEED_PASSWORD"];

  if (url === undefined || serviceRoleKey === undefined || password === undefined || password.length < 12) {
    console.error(
      "Butuh NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan ADMIN_SEED_PASSWORD (minimal 12 karakter) di .env",
    );
    process.exit(1);
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const summary = await seedAdminUsers(admin, ADMIN_SEED_USERS, password);

  console.error(
    `Akun admin siap. Dibuat: ${summary.created.join(", ") || "tidak ada"}. ` +
      `Diperbarui: ${summary.updated.join(", ") || "tidak ada"}. ` +
      `Peran: ${ADMIN_SEED_USERS.map((user) => `${user.email}=${user.role}`).join(", ")}.`,
  );
}

const invokedDirectly =
  process.argv[1] !== undefined && process.argv[1].endsWith("seed-admin-users.ts");

if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
