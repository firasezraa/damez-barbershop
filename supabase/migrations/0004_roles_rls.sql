-- 0004_roles_rls.sql
-- Peran database + RLS. Ini pengganti langsung lubang auth v1 (IDEA.md §2.1, §8.4):
-- kunci anon tidak boleh membaca satu baris pun dari tabel operasional.

-- ---------------------------------------------------------------------------
-- Peran. Di Supabase ketiganya sudah ada; di Postgres lokal/CI dibuat di sini.
-- NOLOGIN: tidak ada koneksi langsung dengan peran-peran ini; klien masuk sebagai
-- pemilik database (jalur server) atau lewat peran aplikasi di Supabase.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('CREATE ROLE %I NOLOGIN', role_name);
    END IF;
  END LOOP;
END $$;

-- GRANT sengaja diberikan penuh supaya penolakan datang dari POLICY, bukan dari
-- hak akses yang lupa diberikan. Kalau RLS dimatikan, GRANT ini akan membuat
-- tabel terbuka — itulah sebabnya policy diuji (tests/integration/rls.test.ts).
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Tabel yang dibuat setelah migrasi ini otomatis mengikuti aturan yang sama.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS di semua tabel, termasuk yang belum diaktifkan di 0001.
-- ---------------------------------------------------------------------------
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;

-- service_role diberi perlakukan sama seperti Supabase: melewati RLS. NOLOGIN,
-- jadi tidak ada kredensial peran ini di repo dan tidak ada koneksi langsung.
-- Dipakai worker/backoffice kalau nanti butuh jalur terpisah.
ALTER ROLE service_role BYPASSRLS;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- FORCE ROW LEVEL SECURITY: pemilik tabel pun tunduk pada policy. Konsekuensinya
-- peran yang dipakai `lib/db/server.ts` (DATABASE_URL) WAJIB punya BYPASSRLS —
-- di Supabase itu `postgres`, di lokal/CI peran `damez` adalah superuser. Kalau
-- tidak, server akan terlihat "kosong" dan CI langsung gagal (bukan gagal senyap).
ALTER TABLE public.barbers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.services FORCE ROW LEVEL SECURITY;
ALTER TABLE public.booking_services FORCE ROW LEVEL SECURITY;
ALTER TABLE public.customers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bookings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;
ALTER TABLE public.settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Policy: SATU-SATUNYA akses yang diberi ke kunci anon adalah katalog publik.
-- Tabel operasional (bookings, payments, customers, audit_log, settings,
-- notifications, booking_services, rate_limits, schema_migrations) tidak punya
-- policy untuk anon maupun authenticated di R1 — jadi nol baris. Akses admin
-- lewat jalur server setelah requireAdmin(), bukan lewat kunci anon.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS anon_read_active_services ON public.services;
CREATE POLICY anon_read_active_services ON public.services
  FOR SELECT TO anon USING (is_active);

DROP POLICY IF EXISTS anon_read_active_barbers ON public.barbers;
CREATE POLICY anon_read_active_barbers ON public.barbers
  FOR SELECT TO anon USING (is_active);

DROP POLICY IF EXISTS anon_read_working_hours ON public.working_hours;
CREATE POLICY anon_read_working_hours ON public.working_hours
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS anon_read_active_blocked_slots ON public.blocked_slots;
CREATE POLICY anon_read_active_blocked_slots ON public.blocked_slots
  FOR SELECT TO anon USING (is_active);
