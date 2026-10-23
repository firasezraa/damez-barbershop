-- ============================================================================
-- DAMEZ BARBERSHOP - SECURITY HARDENING: CONCURRENCY, ROW LOCKS & AUDIT LOGS
-- Migration: 003_security_hardening_concurrency_and_locks.sql
-- Compatible with: PostgreSQL 15+ / Supabase
-- Target Timezone: Asia/Jakarta (WIB / UTC+07:00)
-- 
-- Features:
--   1. Strict Row-Level Lock (SELECT FOR UPDATE) on Barbers & Advisory Locks
--   2. Authoritative Price & DP Calculation inside fn_create_booking_hold()
--   3. Anti-Hoarding Guard (Max 2 Active Unpaid Holds per Customer Phone)
--   4. Security Audit Log Table (public.security_audit_logs)
--   5. Rate Limiting Support Table & Functions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SECURITY AUDIT LOGS TABLE
-- ----------------------------------------------------------------------------
-- Mencatat seluruh anomali keamanan: percobaan race condition, rate limit exceeded,
-- tampering harga/DP, spam honeypot bot, dan upaya eksploitasi lainnya.
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'low', -- 'info', 'low', 'medium', 'high', 'critical'
    ip_address VARCHAR(45),
    user_agent TEXT,
    endpoint VARCHAR(100) NOT NULL,
    booking_code VARCHAR(50),
    customer_phone VARCHAR(25),
    payload JSONB,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT chk_audit_severity CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_audit_ip_event ON public.security_audit_logs (ip_address, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_event_severity ON public.security_audit_logs (event_type, severity, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_phone ON public.security_audit_logs (customer_phone);

-- Aktifkan RLS pada tabel security_audit_logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can read and insert security audit logs"
    ON public.security_audit_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 2. RATE LIMIT STORAGE TABLE (Optional Persistent Backend)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key VARCHAR(150) PRIMARY KEY, -- e.g. "ip:192.168.1.1:checkout"
    request_count INTEGER NOT NULL DEFAULT 1,
    window_expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits (window_expires_at);

-- ----------------------------------------------------------------------------
-- 3. ENHANCED ATOMIC STORED PROCEDURE: fn_create_booking_hold()
-- ----------------------------------------------------------------------------
-- Peningkatan pertahanan keamanan:
-- A. Explicit Row Lock: SELECT ... FROM public.barbers WHERE id = p_barber_id FOR UPDATE
-- B. Transaction-level Advisory Lock: pg_advisory_xact_lock()
-- C. Anti-Hoarding Check: Maksimal 2 hold aktif per nomor telepon
-- D. Authoritative Price Check: Hitung ulang total harga dari tabel services
-- E. Hardcoded DP Rp 20.000: Mengabaikan nominal DP dari client
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
    v_calculated_total_price INTEGER := 0;
    v_authoritative_total_price INTEGER := 0;
    v_active_holds_count INTEGER := 0;
    v_barber_exists BOOLEAN := false;
    v_lock_key BIGINT;
    v_flat_dp_idr CONSTANT INTEGER := 20000; -- Locked Flat DP Business Policy
BEGIN
    -- 1. Bersihkan seluruh hold yang telah expired terlebih dahulu
    PERFORM public.fn_cleanup_expired_holds();

    -- 2. TIER 1 ROW-LEVEL LOCK:
    -- Kunci baris barber secara eksklusif menggunakan SELECT FOR UPDATE.
    -- Transaksi concurrent yang menargetkan barber yang sama akan diantrekan secara berurutan.
    SELECT true INTO v_barber_exists
    FROM public.barbers
    WHERE id = p_barber_id AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'BARBER_NOT_FOUND',
            'message', 'Barber tidak ditemukan atau sedang tidak aktif.'
        );
    END IF;

    -- 3. TIER 2 ADVISORY TRANSACTION LOCK:
    -- Kunci slot waktu spesifik menggunakan pg_advisory_xact_lock berbasis hash
    v_lock_key := ('x' || substr(md5(p_barber_id::text || p_booking_date::text || p_start_time::text), 1, 15))::bit(60)::bigint;
    PERFORM pg_advisory_xact_lock(v_lock_key);

    -- 4. ANTI-HOARDING GUARD (Denial-of-Inventory Protection):
    -- Batasi maksimal 2 hold aktif yang belum dibayar per nomor telepon dalam jendela 15 menit
    SELECT COUNT(*) INTO v_active_holds_count
    FROM public.bookings
    WHERE customer_phone = p_customer_phone
      AND status = 'pending_payment'
      AND hold_expires_at > timezone('utc'::text, now());

    IF v_active_holds_count >= 2 THEN
        INSERT INTO public.security_audit_logs (
            event_type, severity, endpoint, customer_phone, details
        ) VALUES (
            'anti_hoarding_blocked', 'medium', '/api/booking/hold', p_customer_phone,
            'Customer exceeded max 2 simultaneous active unpaid holds.'
        );

        RETURN jsonb_build_object(
            'success', false,
            'error', 'MAX_ACTIVE_HOLDS_EXCEEDED',
            'message', 'Anda memiliki reservasi yang masih menunggu pembayaran. Selesaikan pembayaran atau tunggu hingga slot kedaluwarsa.'
        );
    END IF;

    -- 5. AUTHORITATIVE PRICE & DP RECALCULATION (Anti-Tampering):
    -- Selalu kunci nominal DP tepat Rp 20.000, abaikan manipulasi dari client.
    IF p_service_ids IS NOT NULL AND array_length(p_service_ids, 1) > 0 THEN
        SELECT COALESCE(SUM(price_idr), 0)
        INTO v_calculated_total_price
        FROM public.services
        WHERE id = ANY(p_service_ids);

        IF v_calculated_total_price > 0 THEN
            v_authoritative_total_price := v_calculated_total_price;
        ELSE
            v_authoritative_total_price := GREATEST(v_flat_dp_idr, COALESCE(p_total_price_idr, 50000));
        END IF;
    ELSE
        v_authoritative_total_price := GREATEST(v_flat_dp_idr, COALESCE(p_total_price_idr, 50000));
    END IF;

    -- Deteksi apakah client mencoba melakukan tampering harga total
    IF p_total_price_idr IS NOT NULL AND p_total_price_idr <> v_authoritative_total_price THEN
        INSERT INTO public.security_audit_logs (
            event_type, severity, endpoint, customer_phone, payload, details
        ) VALUES (
            'price_tampering_detected', 'medium', '/api/booking/hold', p_customer_phone,
            jsonb_build_object('client_price', p_total_price_idr, 'authoritative_price', v_authoritative_total_price),
            'Client submitted price mismatch. Overriding with authoritative catalog sum.'
        );
    END IF;

    -- Hitung sisa tagihan pelunasan di kasir
    v_remaining_balance := GREATEST(0, v_authoritative_total_price - v_flat_dp_idr);

    -- 6. Hitung batas kedaluwarsa 15 menit presisi
    v_hold_expires_at := timezone('utc'::text, now()) + interval '15 minutes';

    -- 7. Generate booking code unik: DMZ-YYYYMMDD-XXXX
    v_booking_code := 'DMZ-' || to_char(p_booking_date, 'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

    -- 8. Daftarkan atau perbarui customer
    INSERT INTO public.customers (name, phone, email)
    VALUES (p_customer_name, p_customer_phone, p_customer_email)
    ON CONFLICT (phone) DO UPDATE
    SET name = EXCLUDED.name,
        email = COALESCE(EXCLUDED.email, customers.email),
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_customer_id;

    -- 9. TIER 3 DATABASE GIST EXCLUSION CONSTRAINT ENFORCEMENT:
    -- Insert booking baru. Jika terjadi race condition tumpang tindih waktu,
    -- GiST exclusion constraint 'no_overlapping_active_bookings' akan melempar exception 23P01
    BEGIN
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
            v_authoritative_total_price,
            v_flat_dp_idr,
            v_remaining_balance,
            v_hold_expires_at,
            p_notes
        ) RETURNING id INTO v_booking_id;
    EXCEPTION
        WHEN exclusion_violation THEN
            -- Tangkap race condition secara elegan
            INSERT INTO public.security_audit_logs (
                event_type, severity, endpoint, customer_phone, details
            ) VALUES (
                'concurrency_race_prevented', 'info', '/api/booking/hold', p_customer_phone,
                'GiST exclusion constraint prevented concurrent double booking.'
            );

            RETURN jsonb_build_object(
                'success', false,
                'error', 'SLOT_ALREADY_LOCKED',
                'message', 'Slot pada jam dan barber ini baru saja dipilih pemesan lain. Silakan pilih slot lain.'
            );
    END;

    -- 10. Insert booking_services junction table
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

    -- 11. Kembalikan detail reservasi slot hold yang telah terkunci
    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'booking_code', v_booking_code,
        'status', 'pending_payment',
        'barber_id', p_barber_id,
        'booking_date', p_booking_date,
        'start_time', p_start_time,
        'end_time', p_end_time,
        'service_duration_minutes', p_service_duration_minutes,
        'total_price_idr', v_authoritative_total_price,
        'down_payment_idr', v_flat_dp_idr,
        'remaining_balance_idr', v_remaining_balance,
        'hold_expires_at', v_hold_expires_at,
        'expires_in_seconds', 900
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
