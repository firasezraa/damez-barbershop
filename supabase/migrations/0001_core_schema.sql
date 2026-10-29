-- 0001_core_schema.sql
-- Skema inti Damez Barbershop v2. Ditulis dari nol mengikuti IDEA.md §6.
-- Yang dipertahankan dari v1 (§2.4): EXCLUDE USING gist di bookings, zona waktu
-- Asia/Jakarta di tampilan + timestamptz di DB, dan pemisahan layanan per booking.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- btree_gist wajib: EXCLUDE dengan "=" pada kolom uuid butuh indeks btree di GiST.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ---------------------------------------------------------------------------
-- 1. ENUM
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.booking_status_enum AS ENUM (
    'pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.booking_type_enum AS ENUM ('online', 'walk_in');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'expired', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.settlement_method_enum AS ENUM ('none', 'cash', 'qris', 'transfer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 2. MASTER: barbers & services
-- ---------------------------------------------------------------------------
CREATE TABLE public.barbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_code varchar(20) NOT NULL UNIQUE,
  full_name varchar(100) NOT NULL,
  nickname varchar(50),
  title varchar(80),
  chair_number integer NOT NULL,
  experience_years integer NOT NULL DEFAULT 0,
  specialty varchar(120),
  bio text,
  photo_url text,
  day_off integer NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_barber_chair CHECK (chair_number BETWEEN 1 AND 3),
  CONSTRAINT chk_barber_day_off CHECK (day_off BETWEEN 0 AND 6),
  CONSTRAINT chk_barber_experience CHECK (experience_years >= 0)
);

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code varchar(20) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  slug varchar(120) NOT NULL UNIQUE,
  category varchar(60) NOT NULL,
  duration_minutes integer NOT NULL,
  price_idr integer NOT NULL,
  description text,
  is_recommended boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_service_duration CHECK (duration_minutes > 0),
  CONSTRAINT chk_service_price CHECK (price_idr >= 0)
);

-- ---------------------------------------------------------------------------
-- 3. JADWAL: working_hours & blocked_slots
-- ---------------------------------------------------------------------------
CREATE TABLE public.working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL,
  open_time time NOT NULL DEFAULT '10:00',
  close_time time NOT NULL DEFAULT '21:00',
  is_day_off boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_working_hours_barber_day UNIQUE (barber_id, day_of_week),
  CONSTRAINT chk_working_hours_dow CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT chk_working_hours_order CHECK (is_day_off OR close_time > open_time)
);

-- Dua bentuk blokir dalam satu tabel:
--   recurring_break -> day_of_week + start_time/end_time (istirahat harian)
--   custom_block|maintenance|holiday -> start_at/end_at (blokir satu kali)
CREATE TABLE public.blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  slot_type varchar(20) NOT NULL,
  day_of_week integer,
  start_time time,
  end_time time,
  start_at timestamptz,
  end_at timestamptz,
  title varchar(120) NOT NULL,
  reason text,
  created_by uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_blocked_type CHECK (
    slot_type IN ('recurring_break', 'custom_block', 'maintenance', 'holiday')
  ),
  CONSTRAINT chk_blocked_shape CHECK (
    (
      slot_type = 'recurring_break'
      AND day_of_week IS NOT NULL AND day_of_week BETWEEN 0 AND 6
      AND start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time
      AND start_at IS NULL AND end_at IS NULL
    ) OR (
      slot_type <> 'recurring_break'
      AND day_of_week IS NULL AND start_time IS NULL AND end_time IS NULL
      AND start_at IS NOT NULL AND end_at IS NOT NULL AND end_at > start_at
    )
  )
);

CREATE INDEX idx_blocked_slots_recurring ON public.blocked_slots (barber_id, day_of_week, is_active);
CREATE INDEX idx_blocked_slots_window ON public.blocked_slots (start_at, end_at);

-- ---------------------------------------------------------------------------
-- 4. PELANGGAN (UU PDP: nama + nomor WA saja, IDEA.md §8.10)
-- ---------------------------------------------------------------------------
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name varchar(100) NOT NULL,
  phone_e164 varchar(20) NOT NULL UNIQUE,
  email varchar(150),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_customer_name CHECK (length(trim(full_name)) >= 2),
  CONSTRAINT chk_customer_phone CHECK (phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);

-- ---------------------------------------------------------------------------
-- 5. BOOKINGS — inti anti double-booking
-- ---------------------------------------------------------------------------
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code varchar(30) NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE RESTRICT,
  booking_type public.booking_type_enum NOT NULL DEFAULT 'online',
  status public.booking_status_enum NOT NULL DEFAULT 'pending_payment',

  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  service_duration_minutes integer NOT NULL,
  buffer_minutes integer NOT NULL DEFAULT 10,
  booking_range tstzrange GENERATED ALWAYS AS (tstzrange(start_time, end_time, '[)')) STORED,

  total_idr integer NOT NULL,
  dp_idr integer NOT NULL DEFAULT 20000,
  remaining_idr integer NOT NULL,
  settlement_method public.settlement_method_enum NOT NULL DEFAULT 'none',
  settlement_paid_at timestamptz,

  hold_expires_at timestamptz,
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  no_show_at timestamptz,
  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_booking_time_order CHECK (end_time > start_time),
  CONSTRAINT chk_booking_duration CHECK (service_duration_minutes > 0),
  CONSTRAINT chk_booking_buffer CHECK (buffer_minutes >= 0),
  CONSTRAINT chk_booking_prices CHECK (total_idr >= 0 AND dp_idr >= 0 AND remaining_idr >= 0),
  CONSTRAINT chk_booking_remaining CHECK (remaining_idr = GREATEST(0, total_idr - dp_idr)),

  -- Anti double-booking di level kernel. Jangan dilepas (IDEA.md §6).
  CONSTRAINT no_overlapping_active_bookings EXCLUDE USING gist (
    barber_id WITH =,
    booking_range WITH &&
  ) WHERE (status IN ('pending_payment', 'confirmed', 'in_progress'))
);

CREATE INDEX idx_bookings_barber_start ON public.bookings (barber_id, start_time);
CREATE INDEX idx_bookings_status_hold ON public.bookings (status, hold_expires_at);
CREATE INDEX idx_bookings_range ON public.bookings USING gist (booking_range);

-- ---------------------------------------------------------------------------
-- 6. LAYANAN PER BOOKING — harga & durasi dibekukan saat booking
-- ---------------------------------------------------------------------------
CREATE TABLE public.booking_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  price_snapshot_idr integer NOT NULL,
  duration_snapshot_minutes integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_booking_service UNIQUE (booking_id, service_id),
  CONSTRAINT chk_bs_price CHECK (price_snapshot_idr >= 0),
  CONSTRAINT chk_bs_duration CHECK (duration_snapshot_minutes > 0),
  CONSTRAINT chk_bs_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_booking_services_booking ON public.booking_services (booking_id);

-- ---------------------------------------------------------------------------
-- 7. PAYMENTS — idempotency_key UNIQUE adalah pertahanan replay webhook
-- ---------------------------------------------------------------------------
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  provider varchar(20) NOT NULL DEFAULT 'midtrans',
  provider_ref varchar(120) NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  amount_idr integer NOT NULL,
  status public.payment_status_enum NOT NULL DEFAULT 'pending',
  method varchar(30),
  raw_payload jsonb,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_payment_amount CHECK (amount_idr > 0)
);

CREATE INDEX idx_payments_booking ON public.payments (booking_id);
CREATE INDEX idx_payments_provider_ref ON public.payments (provider, provider_ref);

-- ---------------------------------------------------------------------------
-- 8. NOTIFICATIONS — pengganti fire-and-forget v1 (IDEA.md §6)
-- ---------------------------------------------------------------------------
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  kind varchar(40) NOT NULL,
  recipient_type varchar(20) NOT NULL,
  provider varchar(20) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_notification_status CHECK (status IN ('pending', 'sent', 'failed')),
  CONSTRAINT chk_notification_recipient CHECK (recipient_type IN ('customer', 'admin', 'barber')),
  CONSTRAINT chk_notification_attempts CHECK (attempts >= 0)
);

CREATE INDEX idx_notifications_queue ON public.notifications (status, scheduled_at);
CREATE INDEX idx_notifications_booking ON public.notifications (booking_id);

-- ---------------------------------------------------------------------------
-- 9. SETTINGS & AUDIT LOG
-- ---------------------------------------------------------------------------
CREATE TABLE public.settings (
  key varchar(80) PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_log (
  id bigserial PRIMARY KEY,
  actor_id uuid,
  actor_role text NOT NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_audit_actor_role CHECK (actor_role IN ('owner', 'cashier', 'barber', 'system'))
);

CREATE INDEX idx_audit_log_entity ON public.audit_log (entity, entity_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 10. updated_at otomatis
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'barbers', 'services', 'working_hours', 'blocked_slots', 'customers',
    'bookings', 'payments', 'notifications'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at()', tbl, tbl
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 11. RLS aktif (kebijakan per peran ditulis di migrasi 0004, milestone R1)
-- ---------------------------------------------------------------------------
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
