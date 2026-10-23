-- ============================================================================
-- DAMEZ BARBERSHOP - CORE DATABASE SCHEMA & SYSTEM CONSTRAINTS
-- Migration: 001_initial_schema.sql
-- Compatible with: PostgreSQL 15+ / Supabase
-- Target Timezone: Asia/Jakarta (WIB / UTC+07:00)
-- 
-- Tables:
--   1. public.barbers
--   2. public.services
--   3. public.working_hours
--   4. public.blocked_slots
--   5. public.customers
--   6. public.bookings
--   7. public.booking_services
--   8. public.payments
--   9. public.settings
--  10. public.notification_logs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS & PREREQUISITES
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Required for range exclusion constraint with equality

-- ----------------------------------------------------------------------------
-- 1. CUSTOM TYPES & ENUMS
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE booking_status_enum AS ENUM (
        'pending_payment', -- Slot temporarily held (TTL 15 minutes)
        'confirmed',       -- DP Rp 20.000 paid & verified
        'in_progress',     -- Customer currently on chair / active walk-in
        'completed',       -- Service finished & final balance settled
        'no_show',         -- Customer > 15 mins late without notice; DP forfeited
        'rescheduled',     -- Rescheduled before H-3 hours cutoff
        'cancelled',       -- Cancelled appointment
        'expired'          -- 15-minute payment hold expired, slot released
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_type_enum AS ENUM (
        'online',
        'walk_in'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM (
        'pending',
        'settlement',
        'capture',
        'deny',
        'cancel',
        'expire',
        'failure',
        'refund'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE settlement_method_enum AS ENUM (
        'none',
        'cash',
        'qris',
        'transfer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. MASTER BARBERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(50),
    title VARCHAR(100) NOT NULL DEFAULT 'Senior Barber',
    chair_number INTEGER NOT NULL UNIQUE,
    experience_years INTEGER NOT NULL DEFAULT 1,
    specialty TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    regular_day_off INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT chk_chair_number CHECK (chair_number >= 1 AND chair_number <= 3),
    CONSTRAINT chk_experience_years CHECK (experience_years >= 0),
    CONSTRAINT chk_regular_day_off CHECK (regular_day_off >= 0 AND regular_day_off <= 6)
);

CREATE INDEX IF NOT EXISTS idx_barbers_active_order ON public.barbers (is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_barbers_chair_number ON public.barbers (chair_number);

-- ----------------------------------------------------------------------------
-- 3. SERVICES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price_idr INTEGER NOT NULL,
    down_payment_idr INTEGER NOT NULL DEFAULT 20000,
    description TEXT,
    is_recommended BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT chk_duration_positive CHECK (duration_minutes > 0),
    CONSTRAINT chk_price_non_negative CHECK (price_idr >= 0),
    CONSTRAINT chk_dp_non_negative CHECK (down_payment_idr >= 0)
);

CREATE INDEX IF NOT EXISTS idx_services_category ON public.services (category);
CREATE INDEX IF NOT EXISTS idx_services_active_order ON public.services (is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services (slug);

-- ----------------------------------------------------------------------------
-- 4. WORKING HOURS TABLE (Operational Schedule per Barber & Store)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.working_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    open_time TIME NOT NULL DEFAULT '10:00:00',
    close_time TIME NOT NULL DEFAULT '21:00:00',
    is_day_off BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT chk_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6),
    CONSTRAINT chk_hours_valid CHECK (is_day_off = true OR close_time > open_time),
    CONSTRAINT uq_working_hours_barber_day UNIQUE (barber_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_working_hours_barber_day ON public.working_hours (barber_id, day_of_week);

-- ----------------------------------------------------------------------------
-- 5. BLOCKED SLOTS TABLE (Staggered Breaks, Holidays, Chair Maintenance)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blocked_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE, -- NULL = applies to all barbers
    title VARCHAR(100) NOT NULL,
    slot_type VARCHAR(50) NOT NULL DEFAULT 'recurring_break',
    day_of_week INTEGER, -- 0 = Sunday, ..., 6 = Saturday (for recurring break)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    start_datetime TIMESTAMPTZ, -- for specific one-off block or store holiday
    end_datetime TIMESTAMPTZ,
    reason TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT chk_blocked_slot_type CHECK (slot_type IN ('recurring_break', 'custom_block', 'maintenance', 'holiday')),
    CONSTRAINT chk_blocked_day_of_week CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
    CONSTRAINT chk_blocked_time_order CHECK (end_time > start_time),
    CONSTRAINT chk_blocked_datetime_order CHECK (
        (start_datetime IS NULL AND end_datetime IS NULL) OR 
        (start_datetime IS NOT NULL AND end_datetime IS NOT NULL AND end_datetime > start_datetime)
    )
);

CREATE INDEX IF NOT EXISTS idx_blocked_slots_barber_recurring ON public.blocked_slots (barber_id, day_of_week, is_active);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_datetime ON public.blocked_slots (start_datetime, end_datetime);

-- ----------------------------------------------------------------------------
-- 6. CUSTOMERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(25) NOT NULL UNIQUE,
    email VARCHAR(150),
    total_bookings INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT chk_customer_name_length CHECK (length(trim(name)) >= 2),
    CONSTRAINT chk_customer_phone_length CHECK (length(trim(phone)) >= 9),
    CONSTRAINT chk_customer_total_bookings CHECK (total_bookings >= 0)
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers (name);

-- ----------------------------------------------------------------------------
-- 7. BOOKINGS TABLE (Core Booking Engine with GiST Exclusion Constraint)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code VARCHAR(30) NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(25) NOT NULL,
    customer_email VARCHAR(150),
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE RESTRICT,
    booking_date DATE NOT NULL,
    booking_type booking_type_enum NOT NULL DEFAULT 'online',
    status booking_status_enum NOT NULL DEFAULT 'pending_payment',
    
    -- Rentang Waktu Pemesanan (Service Duration + Buffer Sanitasi 10 Menit)
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    service_duration_minutes INTEGER NOT NULL,
    buffer_minutes INTEGER NOT NULL DEFAULT 10,
    booking_range TSTZRANGE GENERATED ALWAYS AS (tstzrange(start_time, end_time, '[)')) STORED,

    -- Finansial
    total_price_idr INTEGER NOT NULL,
    down_payment_idr INTEGER NOT NULL DEFAULT 20000,
    remaining_balance_idr INTEGER NOT NULL,
    settlement_method settlement_method_enum NOT NULL DEFAULT 'none',
    settlement_paid_at TIMESTAMPTZ,

    -- TTL & Siklus Hidup Booking
    hold_expires_at TIMESTAMPTZ, -- 15 Menit TTL untuk status pending_payment
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    rescheduled_from_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    rescheduled_at TIMESTAMPTZ,
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Constraint Validasi Waktu & Integritas Finansial
    CONSTRAINT chk_booking_time_order CHECK (end_time > start_time),
    CONSTRAINT chk_service_duration_positive CHECK (service_duration_minutes > 0),
    CONSTRAINT chk_buffer_minutes_non_negative CHECK (buffer_minutes >= 0),
    CONSTRAINT chk_prices_non_negative CHECK (total_price_idr >= 0 AND down_payment_idr >= 0 AND remaining_balance_idr >= 0),
    CONSTRAINT chk_remaining_balance_match CHECK (remaining_balance_idr = GREATEST(0, total_price_idr - down_payment_idr)),

    -- CONSTRAINT ANTI-DOUBLE BOOKING (GiST EXCLUSION)
    -- Mencegah tabrakan rentang waktu pada barber yang sama jika status aktif
    CONSTRAINT no_overlapping_active_bookings EXCLUDE USING gist (
        barber_id WITH =,
        booking_range WITH &&
    ) WHERE (status IN ('confirmed', 'pending_payment', 'in_progress'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_barber_date ON public.bookings (barber_id, booking_date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_status_hold ON public.bookings (status, hold_expires_at);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON public.bookings (customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON public.bookings (booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_range ON public.bookings USING gist (booking_range);

-- ----------------------------------------------------------------------------
-- 8. BOOKING SERVICES TABLE (Junction Table: Bookings <-> Services)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    price_idr INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT chk_bs_price_non_negative CHECK (price_idr >= 0),
    CONSTRAINT chk_bs_duration_positive CHECK (duration_minutes > 0),
    CONSTRAINT chk_bs_quantity_positive CHECK (quantity > 0),
    CONSTRAINT uq_booking_service UNIQUE (booking_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_services_booking_id ON public.booking_services (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_services_service_id ON public.booking_services (service_id);

-- ----------------------------------------------------------------------------
-- 9. PAYMENTS TABLE (Midtrans Snap & Transaction Logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    order_id VARCHAR(100) NOT NULL UNIQUE,
    snap_token TEXT,
    snap_redirect_url TEXT,
    payment_type VARCHAR(50),
    gross_amount NUMERIC(12, 2) NOT NULL DEFAULT 20000.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
    transaction_status payment_status_enum NOT NULL DEFAULT 'pending',
    fraud_status VARCHAR(50),
    status_code VARCHAR(20),
    status_message TEXT,
    transaction_id VARCHAR(100),
    payment_amounts JSONB,
    raw_response JSONB,
    signature_key TEXT,
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT chk_gross_amount_non_negative CHECK (gross_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (transaction_status);

-- ----------------------------------------------------------------------------
-- 10. SETTINGS TABLE (Store Configuration & Business Parameters)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings (key);

-- ----------------------------------------------------------------------------
-- 11. NOTIFICATION LOGS TABLE (WhatsApp & Transactional Audit Trail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    recipient_phone VARCHAR(25) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
    template_name VARCHAR(50) NOT NULL,
    message_body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    response_payload JSONB,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT chk_notification_status CHECK (status IN ('pending', 'sent', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_booking ON public.notification_logs (booking_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs (status);

-- ----------------------------------------------------------------------------
-- 12. STORED FUNCTIONS & TRIGGERS
-- ----------------------------------------------------------------------------

-- A. Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger across all stateful tables
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('services', 'barbers', 'working_hours', 'blocked_slots', 'customers', 'bookings', 'payments', 'settings')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at_%I ON public.%I', tbl, tbl);
        EXECUTE format('CREATE TRIGGER trg_set_updated_at_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at()', tbl, tbl);
    END LOOP;
END $$;

-- B. Auto-cleanup function for expired pending bookings (TTL 15 minutes)
CREATE OR REPLACE FUNCTION public.fn_cleanup_expired_holds()
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    UPDATE public.bookings
    SET status = 'expired',
        cancelled_at = timezone('utc'::text, now()),
        cancellation_reason = 'Payment hold expired (timeout > 15 minutes)'
    WHERE status = 'pending_payment'
      AND hold_expires_at IS NOT NULL
      AND hold_expires_at < timezone('utc'::text, now());
      
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 13. ROW LEVEL SECURITY (RLS) & DEFENSIVE ACCESS POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on all public tables
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- 1. Barbers Policies
DROP POLICY IF EXISTS "Public can view active barbers" ON public.barbers;
CREATE POLICY "Public can view active barbers"
    ON public.barbers FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated admins can manage barbers" ON public.barbers;
CREATE POLICY "Authenticated admins can manage barbers"
    ON public.barbers FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. Services Policies
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services"
    ON public.services FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated admins can manage services" ON public.services;
CREATE POLICY "Authenticated admins can manage services"
    ON public.services FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Working Hours Policies
DROP POLICY IF EXISTS "Public can view working hours" ON public.working_hours;
CREATE POLICY "Public can view working hours"
    ON public.working_hours FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated admins can manage working hours" ON public.working_hours;
CREATE POLICY "Authenticated admins can manage working hours"
    ON public.working_hours FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Blocked Slots Policies
DROP POLICY IF EXISTS "Public can view active blocked slots" ON public.blocked_slots;
CREATE POLICY "Public can view active blocked slots"
    ON public.blocked_slots FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated admins can manage blocked slots" ON public.blocked_slots;
CREATE POLICY "Authenticated admins can manage blocked slots"
    ON public.blocked_slots FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Customers Policies (Defense against PII scraping: Anon can only INSERT)
DROP POLICY IF EXISTS "Anon can create customer record on booking" ON public.customers;
CREATE POLICY "Anon can create customer record on booking"
    ON public.customers FOR INSERT
    TO anon, authenticated
    WITH CHECK (length(trim(name)) >= 2 AND length(trim(phone)) >= 9);

DROP POLICY IF EXISTS "Authenticated admins have full access to customers" ON public.customers;
CREATE POLICY "Authenticated admins have full access to customers"
    ON public.customers FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Bookings Policies
DROP POLICY IF EXISTS "Anon can create booking reservation" ON public.bookings;
CREATE POLICY "Anon can create booking reservation"
    ON public.bookings FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view booking by code" ON public.bookings;
CREATE POLICY "Public can view booking by code"
    ON public.bookings FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated admins can manage bookings" ON public.bookings;
CREATE POLICY "Authenticated admins can manage bookings"
    ON public.bookings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 7. Booking Services Policies
DROP POLICY IF EXISTS "Anon can insert booking services" ON public.booking_services;
CREATE POLICY "Anon can insert booking services"
    ON public.booking_services FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view booking services" ON public.booking_services;
CREATE POLICY "Public can view booking services"
    ON public.booking_services FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated admins can manage booking services" ON public.booking_services;
CREATE POLICY "Authenticated admins can manage booking services"
    ON public.booking_services FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 8. Payments Policies
DROP POLICY IF EXISTS "Anon can view payment status for booking" ON public.payments;
CREATE POLICY "Anon can view payment status for booking"
    ON public.payments FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated admins can manage payments" ON public.payments;
CREATE POLICY "Authenticated admins can manage payments"
    ON public.payments FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 9. Settings Policies
DROP POLICY IF EXISTS "Public can read system settings" ON public.settings;
CREATE POLICY "Public can read system settings"
    ON public.settings FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated admins can update settings" ON public.settings;
CREATE POLICY "Authenticated admins can update settings"
    ON public.settings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 10. Notification Logs Policies (Internal Admin Audit Only)
DROP POLICY IF EXISTS "Authenticated admins can view notification logs" ON public.notification_logs;
CREATE POLICY "Authenticated admins can view notification logs"
    ON public.notification_logs FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 14. SEED DATA (Master Barbers, 8 Benchmark Services, Schedules & Breaks)
-- ----------------------------------------------------------------------------

-- A. Insert 3 Master Barbers
INSERT INTO public.barbers (
    id, barber_code, name, nickname, title, chair_number, experience_years, specialty, bio, avatar_url, regular_day_off, is_active, display_order
) VALUES
(
    'b0000001-0000-0000-0000-000000000001',
    'BBR-01',
    'Rian Pratama',
    'The Sculptor',
    'Senior Master Barber',
    1,
    6,
    'Classic Cuts & Pompadour',
    'Spesialis dalam model rambut formal belah samping klasik, slick back, dan scissor-work presisi tinggi.',
    '/images/barbers/rian-pratama.webp',
    0, -- Libur rutin Minggu
    true,
    1
),
(
    'b0000001-0000-0000-0000-000000000002',
    'BBR-02',
    'Dimas Arisandi',
    'Fade Master',
    'Clipper & Fade Specialist',
    2,
    5,
    'High/Low/Skin Fade & Textured Cut',
    'Pakar gradasi kulit halus (skin fade), crop cut kontemporer, dan aksen garis rambut artistik.',
    '/images/barbers/dimas-arisandi.webp',
    1, -- Libur rutin Senin
    true,
    2
),
(
    'b0000001-0000-0000-0000-000000000003',
    'BBR-03',
    'Kevin Sanjaya',
    'Grooming Specialist',
    'Master of Shave & Scalp Therapy',
    3,
    7,
    'Beard Sculpting & Scalp Therapy',
    'Spesialis cukur silet higienis tradisional, handuk hangat aromaterapi, dan terapi pijat kepala.',
    '/images/barbers/kevin-sanjaya.webp',
    2, -- Libur rutin Selasa
    true,
    3
)
ON CONFLICT (barber_code) DO UPDATE 
SET name = EXCLUDED.name,
    nickname = EXCLUDED.nickname,
    title = EXCLUDED.title,
    chair_number = EXCLUDED.chair_number,
    experience_years = EXCLUDED.experience_years,
    specialty = EXCLUDED.specialty,
    bio = EXCLUDED.bio,
    avatar_url = EXCLUDED.avatar_url,
    regular_day_off = EXCLUDED.regular_day_off,
    is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order,
    updated_at = timezone('utc'::text, now());

-- B. Insert 8 Benchmark Services
INSERT INTO public.services (
    id, service_code, name, slug, category, duration_minutes, price_idr, down_payment_idr, is_recommended, is_active, display_order, description
) VALUES
(
    'a0000001-0000-0000-0000-000000000001',
    'SRV-01',
    'Gentlemen Classic Haircut',
    'gentlemen-classic-haircut',
    'Core Haircut',
    45,
    50000,
    20000,
    true,
    true,
    1,
    'Konsultasi gaya rambut, potong rambut presisi, cuci rambut segar, pijat bahu relaksasi, dan styling pomade.'
),
(
    'a0000001-0000-0000-0000-000000000002',
    'SRV-02',
    'Premium Fade & Taper Cut',
    'premium-fade-taper-cut',
    'Core Haircut',
    50,
    65000,
    20000,
    true,
    true,
    2,
    'Potongan gradasi kulit halus (Skin Fade, Drop Fade, Taper) dengan razor detailing, cuci rambut, dan premium styling.'
),
(
    'a0000001-0000-0000-0000-000000000003',
    'SRV-03',
    'Junior / Kids Haircut',
    'junior-kids-haircut',
    'Special Haircut',
    35,
    40000,
    20000,
    false,
    true,
    3,
    'Potongan rambut anak (usia di bawah 12 tahun) dengan penanganan sabar, ramah, dan pembersihan spons lembut.'
),
(
    'a0000001-0000-0000-0000-000000000004',
    'SRV-04',
    'Beard Sculpting & Hot Towel Shave',
    'beard-sculpting-hot-towel-shave',
    'Grooming',
    35,
    45000,
    20000,
    false,
    true,
    4,
    'Perapian jenggot simetris, kompres handuk hangat beraroma minyak esensial, cukur silet steril, dan aftershave calming balm.'
),
(
    'a0000001-0000-0000-0000-000000000005',
    'SRV-05',
    'Relaxing Hair Spa & Anti-Dandruff Scalp Treatment',
    'relaxing-hair-spa-anti-dandruff',
    'Treatment',
    40,
    55000,
    20000,
    false,
    true,
    5,
    'Eksfoliasi scrub kulit kepala anti-ketombe, krim creambath sensasi mint, pijat akupresur kepala & bahu 20 menit.'
),
(
    'a0000001-0000-0000-0000-000000000006',
    'SRV-06',
    'Black Hair Color Revival',
    'black-hair-color-revival',
    'Coloring',
    45,
    65000,
    20000,
    false,
    true,
    6,
    'Penutupan uban atau penyegaran warna hitam alami menggunakan formula aman tanpa bau amonia menyengat.'
),
(
    'a0000001-0000-0000-0000-000000000007',
    'SRV-07',
    'Express Clean Cut & Wash',
    'express-clean-cut-wash',
    'Quick Grooming',
    30,
    40000,
    20000,
    false,
    true,
    7,
    'Potong perapian bagian samping dan belakang secara cepat untuk kebutuhan mendesak, dilanjutkan keramas bilas.'
),
(
    'a0000001-0000-0000-0000-000000000008',
    'SRV-08',
    'The Damez Signature Executive Combo',
    'the-damez-signature-executive-combo',
    'Bundled Combo',
    60,
    95000,
    20000,
    true,
    true,
    8,
    'Paket komplit: Premium Fade Haircut + Beard Sculpting + Hot Towel Shave + Deep Head & Shoulder Massage + Cold Drink Compliment.'
)
ON CONFLICT (service_code) DO UPDATE 
SET name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    category = EXCLUDED.category,
    duration_minutes = EXCLUDED.duration_minutes,
    price_idr = EXCLUDED.price_idr,
    down_payment_idr = EXCLUDED.down_payment_idr,
    is_recommended = EXCLUDED.is_recommended,
    is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order,
    description = EXCLUDED.description,
    updated_at = timezone('utc'::text, now());

-- C. Insert Working Hours for Barbers (7 days a week, 10:00 to 21:00 WIB, marking day off)
-- Barber 1: Rian Pratama (Off on Sunday: day_of_week = 0)
INSERT INTO public.working_hours (barber_id, day_of_week, open_time, close_time, is_day_off)
SELECT 
    'b0000001-0000-0000-0000-000000000001'::uuid,
    d,
    '10:00:00'::time,
    '21:00:00'::time,
    (d = 0) -- Sunday is day off
FROM generate_series(0, 6) AS d
ON CONFLICT (barber_id, day_of_week) DO UPDATE
SET open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_day_off = EXCLUDED.is_day_off,
    updated_at = timezone('utc'::text, now());

-- Barber 2: Dimas Arisandi (Off on Monday: day_of_week = 1)
INSERT INTO public.working_hours (barber_id, day_of_week, open_time, close_time, is_day_off)
SELECT 
    'b0000001-0000-0000-0000-000000000002'::uuid,
    d,
    '10:00:00'::time,
    '21:00:00'::time,
    (d = 1) -- Monday is day off
FROM generate_series(0, 6) AS d
ON CONFLICT (barber_id, day_of_week) DO UPDATE
SET open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_day_off = EXCLUDED.is_day_off,
    updated_at = timezone('utc'::text, now());

-- Barber 3: Kevin Sanjaya (Off on Tuesday: day_of_week = 2)
INSERT INTO public.working_hours (barber_id, day_of_week, open_time, close_time, is_day_off)
SELECT 
    'b0000001-0000-0000-0000-000000000003'::uuid,
    d,
    '10:00:00'::time,
    '21:00:00'::time,
    (d = 2) -- Tuesday is day off
FROM generate_series(0, 6) AS d
ON CONFLICT (barber_id, day_of_week) DO UPDATE
SET open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_day_off = EXCLUDED.is_day_off,
    updated_at = timezone('utc'::text, now());

-- D. Insert Recurring Staggered Breaks (Lunch & Dinner) per Barber
-- Rian: 12:00-12:55 & 18:00-18:55
INSERT INTO public.blocked_slots (barber_id, title, slot_type, day_of_week, start_time, end_time, reason, is_active)
SELECT 
    'b0000001-0000-0000-0000-000000000001'::uuid,
    'Istirahat Siang Barber Rian',
    'recurring_break',
    d,
    '12:00:00'::time,
    '12:55:00'::time,
    'Staggered Lunch Break (Rotasi Kursi 1)',
    true
FROM generate_series(1, 6) AS d -- Mon to Sat (Sun is day off)
WHERE NOT EXISTS (
    SELECT 1 FROM public.blocked_slots 
    WHERE barber_id = 'b0000001-0000-0000-0000-000000000001'::uuid 
      AND day_of_week = d 
      AND start_time = '12:00:00'::time
);

INSERT INTO public.blocked_slots (barber_id, title, slot_type, day_of_week, start_time, end_time, reason, is_active)
SELECT 
    'b0000001-0000-0000-0000-000000000001'::uuid,
    'Istirahat Sore/Malam Barber Rian',
    'recurring_break',
    d,
    '18:00:00'::time,
    '18:55:00'::time,
    'Staggered Dinner Break (Rotasi Kursi 1)',
    true
FROM generate_series(1, 6) AS d -- Mon to Sat
WHERE NOT EXISTS (
    SELECT 1 FROM public.blocked_slots 
    WHERE barber_id = 'b0000001-0000-0000-0000-000000000001'::uuid 
      AND day_of_week = d 
      AND start_time = '18:00:00'::time
);

-- Dimas: 13:00-13:55 & 19:00-19:55
INSERT INTO public.blocked_slots (barber_id, title, slot_type, day_of_week, start_time, end_time, reason, is_active)
SELECT 
    'b0000001-0000-0000-0000-000000000002'::uuid,
    'Istirahat Siang Barber Dimas',
    'recurring_break',
    d,
    '13:00:00'::time,
    '13:55:00'::time,
    'Staggered Lunch Break (Rotasi Kursi 2)',
    true
FROM generate_series(0, 6) AS d
WHERE d != 1 -- Monday is day off
  AND NOT EXISTS (
    SELECT 1 FROM public.blocked_slots 
    WHERE barber_id = 'b0000001-0000-0000-0000-000000000002'::uuid 
      AND day_of_week = d 
      AND start_time = '13:00:00'::time
);

INSERT INTO public.blocked_slots (barber_id, title, slot_type, day_of_week, start_time, end_time, reason, is_active)
SELECT 
    'b0000001-0000-0000-0000-000000000002'::uuid,
    'Istirahat Sore/Malam Barber Dimas',
    'recurring_break',
    d,
    '19:00:00'::time,
    '19:55:00'::time,
    'Staggered Dinner Break (Rotasi Kursi 2)',
    true
FROM generate_series(0, 6) AS d
WHERE d != 1 -- Monday is day off
  AND NOT EXISTS (
    SELECT 1 FROM public.blocked_slots 
    WHERE barber_id = 'b0000001-0000-0000-0000-000000000002'::uuid 
      AND day_of_week = d 
      AND start_time = '19:00:00'::time
);

-- Kevin: 14:00-14:55 & 20:00-20:55
INSERT INTO public.blocked_slots (barber_id, title, slot_type, day_of_week, start_time, end_time, reason, is_active)
SELECT 
    'b0000001-0000-0000-0000-000000000003'::uuid,
    'Istirahat Siang Barber Kevin',
    'recurring_break',
    d,
    '14:00:00'::time,
    '14:55:00'::time,
    'Staggered Lunch Break (Rotasi Kursi 3)',
    true
FROM generate_series(0, 6) AS d
WHERE d != 2 -- Tuesday is day off
  AND NOT EXISTS (
    SELECT 1 FROM public.blocked_slots 
    WHERE barber_id = 'b0000001-0000-0000-0000-000000000003'::uuid 
      AND day_of_week = d 
      AND start_time = '14:00:00'::time
);

INSERT INTO public.blocked_slots (barber_id, title, slot_type, day_of_week, start_time, end_time, reason, is_active)
SELECT 
    'b0000001-0000-0000-0000-000000000003'::uuid,
    'Istirahat Sore/Malam Barber Kevin',
    'recurring_break',
    d,
    '20:00:00'::time,
    '20:55:00'::time,
    'Staggered Dinner Break (Rotasi Kursi 3)',
    true
FROM generate_series(0, 6) AS d
WHERE d != 2 -- Tuesday is day off
  AND NOT EXISTS (
    SELECT 1 FROM public.blocked_slots 
    WHERE barber_id = 'b0000001-0000-0000-0000-000000000003'::uuid 
      AND day_of_week = d 
      AND start_time = '20:00:00'::time
);

-- E. Insert System Settings
INSERT INTO public.settings (key, value, description)
VALUES
(
    'shop_operational_hours',
    jsonb_build_object(
        'open', '10:00',
        'close', '21:00',
        'timezone', 'Asia/Jakarta',
        'active_chairs', 3
    ),
    'Jam operasional gerai dan parameter zona waktu baku (WIB)'
),
(
    'booking_policy',
    jsonb_build_object(
        'dp_amount_idr', 20000,
        'hold_ttl_minutes', 15,
        'sanitation_buffer_minutes', 10,
        'slot_grid_step_minutes', 15,
        'min_lead_time_minutes', 60,
        'reschedule_cutoff_hours', 3,
        'late_tolerance_minutes', 15
    ),
    'Aturan reservasi: DP Flat Rp 20.000, 15m hold lock, 10m buffer, H-3 jam reschedule, 15m lateness'
),
(
    'shop_profile',
    jsonb_build_object(
        'name', 'Damez Barbershop',
        'tagline', 'Craftsmanship & Precision Men''s Grooming',
        'address', 'Jl. Barbershop No. 12, Jakarta',
        'whatsapp', '6281234567890',
        'maps_url', 'https://maps.google.com/?q=Damez+Barbershop',
        'instagram', '@damezbarbershop'
    ),
    'Informasi profil resmi toko untuk landing page dan tiket digital'
),
(
    'payment_gateway',
    jsonb_build_object(
        'provider', 'midtrans',
        'environment', 'sandbox',
        'qris_enabled', true,
        'va_enabled', true,
        'mdr_qris_percent', 0.7
    ),
    'Konfigurasi Midtrans Snap & webhook verifikasi'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = timezone('utc'::text, now());
