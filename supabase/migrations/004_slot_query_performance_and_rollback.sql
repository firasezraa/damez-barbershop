-- ============================================================================
-- DAMEZ BARBERSHOP - BACKEND REMEDIATION: SLOT INTEGRITY, PERFORMANCE & ROLLBACK
-- Migration: 004_slot_query_performance_and_rollback.sql
-- Compatible with: PostgreSQL 15+ / Supabase
-- Target Timezone: Asia/Jakarta (WIB / UTC+07:00)
-- 
-- Features:
--   1. Composite index optimizations for slot availability queries (latency < 5ms)
--   2. Atomic rollback transaction on Midtrans payment failure/denial/cancellation
--   3. Late settlement reconciler function for auto-expired hold recovery
--   4. Idempotency index on payments table
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. COMPOSITE INDEXES FOR SLOT QUERY OPTIMIZATION (< 5ms LATENCY)
-- ----------------------------------------------------------------------------

-- Indeks komposit optimal untuk pencarian slot berdasarkan tanggal & status:
-- Mendukung filter .eq('booking_date', date).in('status', ['confirmed', 'in_progress', 'pending_payment'])
-- baik dengan maupun tanpa filter barber_id.
CREATE INDEX IF NOT EXISTS idx_bookings_date_status_barber 
    ON public.bookings (booking_date, status, barber_id);

-- Indeks komposit terbalik jika query difilter barber_id terlebih dahulu:
CREATE INDEX IF NOT EXISTS idx_bookings_barber_date_status 
    ON public.bookings (barber_id, booking_date, status);

-- Indeks untuk lookup pembayaran pending dan verifikasi idempotensi checkout:
CREATE INDEX IF NOT EXISTS idx_payments_booking_status_created 
    ON public.payments (booking_id, transaction_status, created_at DESC);

-- ----------------------------------------------------------------------------
-- 2. STORED PROCEDURE: fn_rollback_failed_payment_hold()
-- ----------------------------------------------------------------------------
-- Menjalankan rollback atomik ketika pembayaran Midtrans mengalami kegagalan,
-- pembatalan, penolakan (deny), atau timeout:
-- 1. Memperbarui status booking dari 'pending_payment' menjadi 'cancelled'
-- 2. Mencatat waktu pembatalan dan alasan pembatalan
-- 3. Melepaskan slot kursi barber secara seketika sehingga dapat langsung dipesan pelanggan lain
-- 4. Memperbarui status pada tabel payments
-- 5. Mencatat security audit log
CREATE OR REPLACE FUNCTION public.fn_rollback_failed_payment_hold(
    p_booking_id UUID,
    p_order_id VARCHAR(100),
    p_reason TEXT DEFAULT 'Payment failed or cancelled via Midtrans'
)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    -- 1. Cari record booking
    SELECT id, booking_code, status, barber_id, booking_date, start_time, customer_phone
    INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'BOOKING_NOT_FOUND',
            'message', 'Record booking tidak ditemukan.'
        );
    END IF;

    -- 2. Hanya booking berstatus pending_payment yang di-rollback
    IF v_booking.status = 'pending_payment' THEN
        UPDATE public.bookings
        SET status = 'cancelled',
            cancelled_at = v_now,
            cancellation_reason = p_reason,
            hold_expires_at = NULL,
            updated_at = v_now
        WHERE id = p_booking_id;

        -- 3. Perbarui payment record jika ada
        UPDATE public.payments
        SET transaction_status = 'cancel',
            status_message = p_reason,
            updated_at = v_now
        WHERE booking_id = p_booking_id AND order_id = p_order_id;

        -- 4. Catat event log audit
        INSERT INTO public.security_audit_logs (
            event_type, severity, endpoint, booking_code, customer_phone, details
        ) VALUES (
            'payment_rollback_executed', 'info', '/api/webhooks/midtrans',
            v_booking.booking_code, v_booking.customer_phone,
            'Slot hold atomically rolled back to cancelled due to: ' || p_reason
        );

        RETURN jsonb_build_object(
            'success', true,
            'action', 'rolled_back',
            'booking_id', p_booking_id,
            'booking_code', v_booking.booking_code,
            'status', 'cancelled'
        );
    ELSE
        RETURN jsonb_build_object(
            'success', true,
            'action', 'ignored',
            'message', 'Booking status is not pending_payment; no rollback needed.',
            'status', v_booking.status
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ----------------------------------------------------------------------------
-- 3. STORED PROCEDURE: fn_reconcile_late_settlement()
-- ----------------------------------------------------------------------------
-- Menangani kondisi balapan (race condition) ekstrem di mana webhook settlement Midtrans
-- tiba beberapa saat setelah booking di-expire otomatis oleh cron sweeper:
-- 1. Jika kursi barber pada tanggal dan jam tersebut masih kosong:
--    Memulihkan status booking menjadi 'confirmed' secara atomik.
-- 2. Jika kursi barber sudah diambil orang lain:
--    Menandai booking untuk pengembalian dana (refund) darurat di kasir offline.
CREATE OR REPLACE FUNCTION public.fn_reconcile_late_settlement(
    p_booking_id UUID,
    p_order_id VARCHAR(100),
    p_gross_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
    v_conflict_count INTEGER := 0;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_remaining_balance INTEGER;
BEGIN
    SELECT id, booking_code, barber_id, booking_date, start_time, end_time, total_price_idr, status, customer_phone
    INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'BOOKING_NOT_FOUND',
            'message', 'Record booking tidak ditemukan.'
        );
    END IF;

    -- Hitung sisa pelunasan
    v_remaining_balance := GREATEST(0, v_booking.total_price_idr - p_gross_amount);

    -- Kasus A: Booking masih pending_payment (normal settlement)
    IF v_booking.status = 'pending_payment' THEN
        UPDATE public.bookings
        SET status = 'confirmed',
            confirmed_at = v_now,
            down_payment_idr = p_gross_amount,
            remaining_balance_idr = v_remaining_balance,
            hold_expires_at = NULL,
            updated_at = v_now
        WHERE id = p_booking_id;

        RETURN jsonb_build_object(
            'success', true,
            'action', 'confirmed',
            'booking_code', v_booking.booking_code,
            'status', 'confirmed'
        );
    END IF;

    -- Kasus B: Booking berstatus 'expired' (Late settlement desync)
    IF v_booking.status = 'expired' THEN
        -- Cek apakah ada booking lain yang sedang aktif dan tumpang tindih
        SELECT COUNT(*) INTO v_conflict_count
        FROM public.bookings
        WHERE barber_id = v_booking.barber_id
          AND booking_date = v_booking.booking_date
          AND id <> p_booking_id
          AND status IN ('confirmed', 'in_progress', 'pending_payment')
          AND tstzrange(start_time, end_time, '[)') && tstzrange(v_booking.start_time, v_booking.end_time, '[)');

        IF v_conflict_count = 0 THEN
            -- Slot masih aman: pulihkan booking ke confirmed
            UPDATE public.bookings
            SET status = 'confirmed',
                confirmed_at = v_now,
                down_payment_idr = p_gross_amount,
                remaining_balance_idr = v_remaining_balance,
                hold_expires_at = NULL,
                cancelled_at = NULL,
                cancellation_reason = NULL,
                updated_at = v_now
            WHERE id = p_booking_id;

            INSERT INTO public.security_audit_logs (
                event_type, severity, endpoint, booking_code, customer_phone, details
            ) VALUES (
                'late_settlement_recovered', 'info', '/api/webhooks/midtrans',
                v_booking.booking_code, v_booking.customer_phone,
                'Expired booking recovered to confirmed state. Slot was still vacant.'
            );

            RETURN jsonb_build_object(
                'success', true,
                'action', 'recovered_to_confirmed',
                'booking_code', v_booking.booking_code,
                'status', 'confirmed'
            );
        ELSE
            -- Kursi sudah diisi pelanggan lain: tandai untuk refund kasir
            UPDATE public.bookings
            SET status = 'cancelled',
                cancellation_reason = 'Late settlement conflict: slot was booked by another customer. Flagged for cashier refund.',
                updated_at = v_now
            WHERE id = p_booking_id;

            INSERT INTO public.security_audit_logs (
                event_type, severity, endpoint, booking_code, customer_phone, details
            ) VALUES (
                'late_settlement_conflict_refund', 'high', '/api/webhooks/midtrans',
                v_booking.booking_code, v_booking.customer_phone,
                'Late settlement arrived but chair already occupied. Status marked cancelled for cashier refund.'
            );

            RETURN jsonb_build_object(
                'success', true,
                'action', 'conflict_refund_needed',
                'booking_code', v_booking.booking_code,
                'status', 'cancelled',
                'refund_needed', true
            );
        END IF;
    END IF;

    -- Kasus C: Booking sudah confirmed sebelumnya (idempoten)
    RETURN jsonb_build_object(
        'success', true,
        'action', 'already_confirmed',
        'booking_code', v_booking.booking_code,
        'status', v_booking.status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
