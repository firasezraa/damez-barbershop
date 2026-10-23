-- ============================================================================
-- DAMEZ BARBERSHOP - SLOT TEMPORARY LOCKING & AUTO-EXPIRE ENGINE
-- Migration: 002_slot_temporary_locking_and_auto_expire.sql
-- Compatible with: PostgreSQL 15+ / Supabase
-- Target Timezone: Asia/Jakarta (WIB / UTC+07:00)
-- 
-- Features:
--   1. 15-Minute Temporary Hold TTL Enforcement
--   2. Scheduled Function: public.fn_cleanup_expired_holds()
--   3. Database Trigger: Instant release of expired holds before booking insert
--   4. Stored Procedure: public.fn_create_booking_hold() (Atomic Slot Locking)
--   5. pg_cron Scheduled Job Configuration (* * * * *)
--   6. Monitoring View: public.v_active_holds
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENHANCED STORED FUNCTION: fn_cleanup_expired_holds()
-- ----------------------------------------------------------------------------
-- Menandai booking pending_payment yang telah melewati hold_expires_at sebagai 'expired'.
-- Melepaskan slot secara otomatis dan memperbarui payment terkait menjadi 'expire'.
CREATE OR REPLACE FUNCTION public.fn_cleanup_expired_holds()
RETURNS TABLE (
    expired_count INTEGER,
    released_booking_codes TEXT[]
) AS $$
DECLARE
    v_count INTEGER := 0;
    v_codes TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- 1. Ambil daftar booking_code yang kedaluwarsa untuk keperluan audit / logging
    SELECT ARRAY_AGG(booking_code)
    INTO v_codes
    FROM public.bookings
    WHERE status = 'pending_payment'
      AND hold_expires_at IS NOT NULL
      AND hold_expires_at <= timezone('utc'::text, now());

    -- 2. Transisi status booking dari pending_payment menjadi expired
    WITH expired_rows AS (
        UPDATE public.bookings
        SET status = 'expired',
            cancelled_at = timezone('utc'::text, now()),
            cancellation_reason = 'Payment hold expired (timeout > 15 minutes)',
            updated_at = timezone('utc'::text, now())
        WHERE status = 'pending_payment'
          AND hold_expires_at IS NOT NULL
          AND hold_expires_at <= timezone('utc'::text, now())
        RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM expired_rows;

    -- 3. Sinkronisasi tabel payments jika ada transaksi pending yang terkait
    IF v_count > 0 THEN
        UPDATE public.payments p
        SET transaction_status = 'expire',
            status_message = 'Booking hold timed out (> 15 minutes). Payment cancelled.',
            updated_at = timezone('utc'::text, now())
        FROM public.bookings b
        WHERE p.booking_id = b.id
          AND b.status = 'expired'
          AND p.transaction_status = 'pending';
    END IF;

    -- Kembalikan jumlah dan daftar booking yang berhasil dibatalkan
    RETURN QUERY SELECT COALESCE(v_count, 0), COALESCE(v_codes, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Berikan izin eksekusi kepada role database Supabase
GRANT EXECUTE ON FUNCTION public.fn_cleanup_expired_holds() TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. TRIGGER FUNCTION: fn_trigger_cleanup_expired_holds()
-- ----------------------------------------------------------------------------
-- Dijalankan pada tingkat STATEMENT sebelum INSERT pada tabel bookings.
-- Memastikan sebelum booking baru dievaluasi oleh GiST exclusion constraint,
-- seluruh slot hold yang telah melewati 15 menit sudah dilepas menjadi 'expired'.
CREATE OR REPLACE FUNCTION public.fn_trigger_cleanup_expired_holds()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.fn_cleanup_expired_holds();
    RETURN NULL; -- Statement-level trigger returns NULL
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Pasang statement-level trigger pada bookings
DROP TRIGGER IF EXISTS trg_auto_expire_holds_before_booking_insert ON public.bookings;
CREATE TRIGGER trg_auto_expire_holds_before_booking_insert
    BEFORE INSERT ON public.bookings
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.fn_trigger_cleanup_expired_holds();

-- ----------------------------------------------------------------------------
-- 3. TRIGGER FUNCTION: fn_enforce_booking_hold_ttl()
-- ----------------------------------------------------------------------------
-- Menjamin secara otomatis bahwa booking dengan status 'pending_payment'
-- memiliki nilai hold_expires_at presisi 15 menit dari saat pembuatan (now() + 15m),
-- kecuali jika telah ditentukan secara eksplisit.
CREATE OR REPLACE FUNCTION public.fn_enforce_booking_hold_ttl()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pending_payment' AND NEW.hold_expires_at IS NULL THEN
        NEW.hold_expires_at := timezone('utc'::text, now()) + interval '15 minutes';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_enforce_booking_hold_ttl ON public.bookings;
CREATE TRIGGER trg_enforce_booking_hold_ttl
    BEFORE INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_enforce_booking_hold_ttl();

-- ----------------------------------------------------------------------------
-- 4. ATOMIC STORED PROCEDURE: fn_create_booking_hold()
-- ----------------------------------------------------------------------------
-- Membuka dan mengunci slot booking baru secara atomik:
-- 1. Membersihkan expired holds
-- 2. Membuat/mencocokkan customer
-- 3. Menginsert booking dengan status 'pending_payment' dan TTL 15 menit
-- 4. Menginsert relasi booking_services
CREATE OR REPLACE FUNCTION public.fn_create_booking_hold(
    p_customer_name VARCHAR(100),
    p_customer_phone VARCHAR(25),
    p_customer_email VARCHAR(150),
    p_barber_id UUID,
    p_booking_date DATE,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_service_duration_minutes INTEGER,
    p_service_ids UUID[],
    p_total_price_idr INTEGER,
    p_down_payment_idr INTEGER DEFAULT 20000,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_customer_id UUID;
    v_booking_id UUID;
    v_booking_code VARCHAR(30);
    v_hold_expires_at TIMESTAMPTZ;
    v_remaining_balance INTEGER;
    v_service_id UUID;
    v_srv_price INTEGER;
    v_srv_duration INTEGER;
BEGIN
    -- 1. Bersihkan seluruh hold yang telah expired terlebih dahulu
    PERFORM public.fn_cleanup_expired_holds();

    -- 2. Hitung waktu kedaluwarsa 15 menit presisi
    v_hold_expires_at := timezone('utc'::text, now()) + interval '15 minutes';
    v_remaining_balance := GREATEST(0, p_total_price_idr - p_down_payment_idr);

    -- 3. Generate booking code unik: DMZ-YYYYMMDD-XXXX
    v_booking_code := 'DMZ-' || to_char(p_booking_date, 'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

    -- 4. Daftarkan atau perbarui customer
    INSERT INTO public.customers (name, phone, email)
    VALUES (p_customer_name, p_customer_phone, p_customer_email)
    ON CONFLICT (phone) DO UPDATE
    SET name = EXCLUDED.name,
        email = COALESCE(EXCLUDED.email, customers.email),
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_customer_id;

    -- 5. Insert booking baru (GiST exclusion constraint akan otomatis mencegah overlapping jika barber & waktu bertabrakan)
    INSERT INTO public.bookings (
        booking_code,
        customer_id,
        customer_name,
        customer_phone,
        customer_email,
        barber_id,
        booking_date,
        booking_type,
        status,
        start_time,
        end_time,
        service_duration_minutes,
        buffer_minutes,
        total_price_idr,
        down_payment_idr,
        remaining_balance_idr,
        hold_expires_at,
        notes
    ) VALUES (
        v_booking_code,
        v_customer_id,
        p_customer_name,
        p_customer_phone,
        p_customer_email,
        p_barber_id,
        p_booking_date,
        'online',
        'pending_payment',
        p_start_time,
        p_end_time,
        p_service_duration_minutes,
        10,
        p_total_price_idr,
        p_down_payment_idr,
        v_remaining_balance,
        v_hold_expires_at,
        p_notes
    ) RETURNING id INTO v_booking_id;

    -- 6. Insert booking_services junction table
    IF p_service_ids IS NOT NULL AND array_length(p_service_ids, 1) > 0 THEN
        FOREACH v_service_id IN ARRAY p_service_ids LOOP
            SELECT price_idr, duration_minutes 
            INTO v_srv_price, v_srv_duration
            FROM public.services 
            WHERE id = v_service_id;

            IF FOUND THEN
                INSERT INTO public.booking_services (
                    booking_id,
                    service_id,
                    price_idr,
                    duration_minutes,
                    quantity
                ) VALUES (
                    v_booking_id,
                    v_service_id,
                    COALESCE(v_srv_price, 0),
                    COALESCE(v_srv_duration, 0),
                    1
                ) ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END IF;

    -- 7. Kembalikan detail reservasi slot hold
    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'booking_code', v_booking_code,
        'status', 'pending_payment',
        'barber_id', p_barber_id,
        'start_time', p_start_time,
        'end_time', p_end_time,
        'hold_expires_at', v_hold_expires_at,
        'ttl_minutes', 15,
        'ttl_seconds', 900
    );
EXCEPTION
    WHEN exclusion_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'SLOT_ALREADY_LOCKED',
            'message', 'Slot pada jam dan barber ini sedang ditahan pemesan lain atau sudah terisi.'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.fn_create_booking_hold(
    VARCHAR, VARCHAR, VARCHAR, UUID, DATE, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, UUID[], INTEGER, INTEGER, TEXT
) TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5. MONITORING VIEW: v_active_holds
-- ----------------------------------------------------------------------------
-- View untuk melihat slot-slot yang saat ini sedang dikunci (temporary hold)
-- Dilengkapi penghitungan sisa waktu (seconds_remaining).
CREATE OR REPLACE VIEW public.v_active_holds WITH (security_invoker = true) AS
SELECT 
    b.id AS booking_id,
    b.booking_code,
    b.customer_name,
    b.customer_phone,
    b.barber_id,
    br.name AS barber_name,
    br.chair_number,
    b.booking_date,
    b.start_time,
    b.end_time,
    b.service_duration_minutes,
    b.buffer_minutes,
    b.hold_expires_at,
    ROUND(EXTRACT(EPOCH FROM (b.hold_expires_at - timezone('utc'::text, now())))) AS seconds_remaining,
    CASE 
        WHEN b.hold_expires_at <= timezone('utc'::text, now()) THEN true 
        ELSE false 
    END AS is_expired,
    b.created_at
FROM public.bookings b
JOIN public.barbers br ON b.barber_id = br.id
WHERE b.status = 'pending_payment'
  AND b.hold_expires_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 6. PG_CRON SCHEDULE CONFIGURATION (Scheduled Function every minute)
-- ----------------------------------------------------------------------------
-- Jika pg_cron tersedia di Supabase, daftarkan job cron yang mengeksekusi
-- public.fn_cleanup_expired_holds() setiap 1 menit (* * * * *).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        -- Batalkan job lama jika ada
        BEGIN
            PERFORM cron.unschedule('damez-auto-expire-holds');
        EXCEPTION
            WHEN others THEN NULL;
        END;

        -- Daftarkan cron job baru: run every minute
        PERFORM cron.schedule(
            'damez-auto-expire-holds',
            '* * * * *',
            'SELECT public.fn_cleanup_expired_holds();'
        );
        RAISE NOTICE 'pg_cron job "damez-auto-expire-holds" successfully registered.';
    ELSE
        RAISE NOTICE 'pg_cron extension not installed; scheduled cleanup will run via API/worker.';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Skipping cron.schedule registration: %', SQLERRM;
END $$;
