import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool, PoolClient } from "pg";
import { resetTestDb } from "../helpers/db.ts";
import {
  insertBarber,
  insertBooking,
  insertCustomer,
  insertService,
  uniquePhone,
} from "../helpers/fixtures.ts";

/**
 * RLS diuji terhadap Postgres nyata dengan peran sungguhan (`SET ROLE anon`),
 * bukan dengan memalsukan hasil. Peran `anon`/`authenticated` sudah diberi GRANT
 * DML penuh oleh migrasi 0004, jadi apa pun yang ditolak di sini ditolak oleh
 * *policy*, bukan karena kurang hak akses.
 */

/** Tabel yang tidak boleh terbaca oleh kunci anon (kunci publik). */
const SENSITIVE_TABLES = [
  "bookings",
  "booking_services",
  "payments",
  "customers",
  "audit_log",
  "settings",
  "notifications",
  "rate_limits",
  "schema_migrations",
] as const;

/** Tabel katalog yang memang publik, dengan filter `is_active`. */
const PUBLIC_TABLES = ["services", "barbers", "working_hours", "blocked_slots"] as const;

let pool: Pool;
let bookingId: string;
let barberId: string;
let customerId: string;

async function asRole<T>(role: string, work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query(`SET ROLE ${role}`);
    return await work(client);
  } finally {
    await client.query("RESET ROLE").catch(() => undefined);
    client.release();
  }
}

async function countAsRole(role: string, table: string): Promise<number> {
  const result = await asRole(role, (client) =>
    client.query<{ count: string }>(`SELECT count(*)::text AS count FROM public.${table}`),
  );
  return Number(result.rows[0]?.count ?? "-1");
}

beforeAll(async () => {
  pool = await resetTestDb();

  await insertService(pool);
  await insertService(pool, { isActive: false });
  barberId = await insertBarber(pool);
  await insertBarber(pool, { isActive: false, chair: 2 });
  customerId = await insertCustomer(pool);

  const booking = await insertBooking(pool, {
    barberId,
    customerId,
    startIso: "2026-11-02T10:00:00+07:00",
  });
  bookingId = booking.id;

  await pool.query(
    `INSERT INTO public.payments (booking_id, provider, provider_ref, amount_idr, status, idempotency_key)
     VALUES ($1, 'midtrans', 'REF-RLS', 20000, 'paid', 'IDEM-RLS-1')`,
    [bookingId],
  );
  await pool.query(
    `INSERT INTO public.notifications (booking_id, kind, recipient_type, provider)
     VALUES ($1, 'booking_confirmed', 'customer', 'fonnte')`,
    [bookingId],
  );
  await pool.query(
    `INSERT INTO public.settings (key, value) VALUES ('rls_probe', '{"a":1}'::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
  );
  await pool.query("SELECT public.fn_write_audit($1, 'system', 'rls.probe', 'bookings', $2, NULL, NULL)", [
    null,
    bookingId,
  ]);
  await pool.query("SELECT public.fn_rate_limit_hit('rls:probe', 5, 60)");

  await pool.query(
    `INSERT INTO public.working_hours (barber_id, day_of_week, open_time, close_time, is_day_off)
     VALUES ($1, 3, '10:00', '21:00', false)`,
    [barberId],
  );
  await pool.query(
    `INSERT INTO public.blocked_slots (barber_id, slot_type, day_of_week, start_time, end_time, title, is_active)
     VALUES ($1, 'recurring_break', 3, '12:00', '12:55', 'Istirahat probe', true),
            ($1, 'recurring_break', 4, '12:00', '12:55', 'Istirahat probe nonaktif', false)`,
    [barberId],
  );
});

afterAll(async () => {
  await pool.end();
});

describe("RLS: peran anon", () => {
  it("reads no rows from sensitive tables even though DML is granted", async () => {
    for (const table of SENSITIVE_TABLES) {
      expect(await countAsRole("anon", table)).toBe(0);
    }
  });

  it("reads only active rows from the public catalogue", async () => {
    for (const table of PUBLIC_TABLES) {
      expect(await countAsRole("anon", table)).toBeGreaterThan(0);
    }

    const services = await asRole("anon", (client) =>
      client.query<{ active: string; inactive: string }>(
        `SELECT count(*) FILTER (WHERE is_active)::text AS active,
                count(*) FILTER (WHERE NOT is_active)::text AS inactive
           FROM public.services`,
      ),
    );
    expect(services.rows[0]?.active).toBe("1");
    expect(services.rows[0]?.inactive).toBe("0");

    const breaks = await asRole("anon", (client) =>
      client.query<{ visible: string }>(
        "SELECT count(*)::text AS visible FROM public.blocked_slots WHERE title LIKE 'Istirahat probe%'",
      ),
    );
    expect(breaks.rows[0]?.visible).toBe("1");
  });

  it("cannot insert a booking", async () => {
    await expect(
      asRole("anon", (client) =>
        client.query(
          `INSERT INTO public.bookings
             (booking_code, customer_id, barber_id, start_time, end_time,
              service_duration_minutes, total_idr, dp_idr, remaining_idr)
           VALUES ('DMZ-ANON-INJECT', $1, $2, now() + interval '3 days', now() + interval '3 days 1 hour',
                   45, 50000, 20000, 30000)`,
          [customerId, barberId],
        ),
      ),
    ).rejects.toThrow(/row-level security|permission denied/i);

    const stored = await pool.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM public.bookings WHERE booking_code = 'DMZ-ANON-INJECT'",
    );
    expect(stored.rows[0]?.count).toBe("0");
  });

  it("cannot update or delete existing rows", async () => {
    const updated = await asRole("anon", (client) =>
      client.query("UPDATE public.settings SET value = '{\"hacked\":true}'::jsonb RETURNING key"),
    );
    const deleted = await asRole("anon", (client) =>
      client.query("DELETE FROM public.audit_log RETURNING id"),
    );

    expect(updated.rowCount).toBe(0);
    expect(deleted.rowCount).toBe(0);

    const settings = await pool.query<{ value: unknown }>(
      "SELECT value FROM public.settings WHERE key = 'rls_probe'",
    );
    expect(settings.rows[0]?.value).toEqual({ a: 1 });
    const audit = await pool.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM public.audit_log WHERE action = 'rls.probe'",
    );
    expect(audit.rows[0]?.count).toBe("1");
  });

  it("cannot read a booking by its own id, even knowing it", async () => {
    const direct = await asRole("anon", (client) =>
      client.query("SELECT id, booking_code FROM public.bookings WHERE id = $1", [bookingId]),
    );
    expect(direct.rowCount).toBe(0);
  });

  it("gets no access to the migration history", async () => {
    const rows = await asRole("anon", (client) =>
      client.query("SELECT version FROM public.schema_migrations"),
    );
    expect(rows.rowCount).toBe(0);
  });
});

describe("RLS: peran authenticated juga belum boleh membaca data operasional", () => {
  it("sees no rows in sensitive tables until policies for admin roles exist", async () => {
    for (const table of SENSITIVE_TABLES) {
      expect(await countAsRole("authenticated", table)).toBe(0);
    }
  });

  it("sees no rows in the public catalogue either: anon is the only key granted READ", async () => {
    // Sengaja: situs publik memakai kunci anon, sedangkan akun admin membaca
    // lewat jalur server setelah requireAdmin(). Memberi policy ke
    // `authenticated` berarti kunci mana pun yang bisa login (juga akun
    // pelanggan di kemudian hari) ikut membaca katalog lewat jalur itu.
    expect(await countAsRole("authenticated", "services")).toBe(0);
  });
});

describe("RLS: sanitasi nomor pelanggan", () => {
  it("does not expose customer rows to anon, even by phone lookup", async () => {
    const phone = uniquePhone();
    await pool.query("INSERT INTO public.customers (full_name, phone_e164) VALUES ('Probe', $1)", [phone]);

    const found = await asRole("anon", (client) =>
      client.query("SELECT id FROM public.customers WHERE phone_e164 = $1", [phone]),
    );
    expect(found.rowCount).toBe(0);
  });
});
