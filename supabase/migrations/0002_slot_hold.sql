-- 0002_slot_hold.sql
-- Hold slot 15 menit, anti-hoarding, harga otoritatif dari server, expiry.
-- Nilai 20000 / 900 / 10 / 2 disalin dari src/lib/config/constants.ts — SQL
-- tidak bisa mengimpor TS, jadi test integrasi yang menjaga keduanya sejalan.

CREATE SEQUENCE IF NOT EXISTS public.booking_code_seq START 1;

-- ---------------------------------------------------------------------------
-- Expire hold yang lewat TTL. Idempoten: baris yang sudah expired tidak dihitung.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_expire_stale_holds() RETURNS integer AS $$
DECLARE
  v_expired integer;
BEGIN
  WITH updated AS (
    UPDATE public.bookings
       SET status = 'expired',
           updated_at = now()
     WHERE status = 'pending_payment'
       AND hold_expires_at IS NOT NULL
       AND hold_expires_at < now()
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_expired FROM updated;

  RETURN v_expired;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Hold masih hidup?
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_hold_is_active(p_booking_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
     WHERE id = p_booking_id
       AND status = 'pending_payment'
       AND hold_expires_at IS NOT NULL
       AND hold_expires_at > now()
  );
$$ LANGUAGE sql STABLE;

-- ---------------------------------------------------------------------------
-- Buat hold booking. Tidak menerima harga maupun waktu selesai dari pemanggil:
-- total dihitung dari tabel services, end_time dihitung server dari durasi +
-- buffer. Pertahanan berlapis: row lock barber -> advisory lock slot -> GiST
-- exclusion constraint.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_create_booking_hold(
  p_full_name varchar(100),
  p_phone_e164 varchar(20),
  p_barber_id uuid,
  p_start_time timestamptz,
  p_service_ids uuid[],
  p_booking_type public.booking_type_enum DEFAULT 'online',
  p_notes text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_barber_active boolean := false;
  v_customer_id uuid;
  v_booking_id uuid;
  v_booking_code varchar(30);
  v_total integer := 0;
  v_duration integer := 0;
  v_matched integer := 0;
  v_requested integer := 0;
  v_active_holds integer := 0;
  v_end_time timestamptz;
  v_now timestamptz := now();
  v_dp constant integer := 20000;
  v_buffer constant integer := 10;
  v_ttl constant interval := interval '15 minutes';
  v_max_holds constant integer := 2;
BEGIN
  PERFORM public.fn_expire_stale_holds();

  -- Tier 1: kunci baris barber. Transaksi lain untuk barber yang sama mengantre.
  SELECT true INTO v_barber_active
    FROM public.barbers
   WHERE id = p_barber_id AND is_active
   FOR UPDATE;

  IF v_barber_active IS NOT TRUE THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'BARBER_NOT_FOUND',
      'message', 'Barber tidak ditemukan atau sedang tidak aktif.'
    );
  END IF;

  -- Tier 2: kunci slot spesifik (barber + jam mulai).
  PERFORM pg_advisory_xact_lock(hashtext(p_barber_id::text || p_start_time::text));

  IF p_service_ids IS NULL OR array_length(p_service_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_SERVICE',
      'message', 'Pilih minimal satu layanan.'
    );
  END IF;

  SELECT count(DISTINCT requested.service_id)::integer INTO v_requested
    FROM unnest(p_service_ids) AS requested(service_id);

  SELECT COALESCE(sum(s.price_idr), 0), COALESCE(sum(s.duration_minutes), 0), count(*)::integer
    INTO v_total, v_duration, v_matched
    FROM public.services s
   WHERE s.id = ANY(p_service_ids) AND s.is_active;

  IF v_matched <> v_requested THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_SERVICE',
      'message', 'Ada layanan yang tidak dikenal atau sudah tidak aktif.'
    );
  END IF;

  -- Anti-hoarding: maksimal 2 hold belum dibayar per nomor telepon.
  SELECT count(*)::integer INTO v_active_holds
    FROM public.bookings b
    JOIN public.customers c ON c.id = b.customer_id
   WHERE c.phone_e164 = p_phone_e164
     AND b.status = 'pending_payment'
     AND b.hold_expires_at > v_now;

  IF v_active_holds >= v_max_holds THEN
    INSERT INTO public.audit_log (actor_role, action, entity, after)
    VALUES (
      'system', 'hold.blocked', 'bookings',
      jsonb_build_object('reason', 'MAX_ACTIVE_HOLDS_EXCEEDED', 'active_holds', v_active_holds)
    );

    RETURN jsonb_build_object(
      'success', false,
      'error', 'MAX_ACTIVE_HOLDS_EXCEEDED',
      'message', 'Anda masih punya reservasi yang menunggu pembayaran. Selesaikan atau tunggu slot kedaluwarsa.'
    );
  END IF;

  -- Waktu selesai = mulai + durasi layanan + buffer sterilisasi. Server yang hitung.
  v_end_time := p_start_time + make_interval(mins => v_duration + v_buffer);

  INSERT INTO public.customers (full_name, phone_e164)
  VALUES (p_full_name, p_phone_e164)
  ON CONFLICT (phone_e164) DO UPDATE
    SET full_name = EXCLUDED.full_name, updated_at = now()
  RETURNING id INTO v_customer_id;

  v_booking_code := 'DMZ-'
    || to_char(p_start_time AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD')
    || '-' || lpad(nextval('public.booking_code_seq')::text, 4, '0');

  INSERT INTO public.bookings (
    booking_code, customer_id, barber_id, booking_type, status,
    start_time, end_time, service_duration_minutes, buffer_minutes,
    total_idr, dp_idr, remaining_idr, hold_expires_at, notes
  ) VALUES (
    v_booking_code, v_customer_id, p_barber_id, p_booking_type, 'pending_payment',
    p_start_time, v_end_time, v_duration, v_buffer,
    v_total, v_dp, GREATEST(0, v_total - v_dp), v_now + v_ttl, p_notes
  )
  RETURNING id INTO v_booking_id;

  INSERT INTO public.booking_services (booking_id, service_id, price_snapshot_idr, duration_snapshot_minutes)
  SELECT v_booking_id, s.id, s.price_idr, s.duration_minutes
    FROM public.services s
   WHERE s.id = ANY(p_service_ids);

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'booking_code', v_booking_code,
    'hold_expires_at', to_jsonb(v_now + v_ttl),
    'total_idr', v_total,
    'dp_idr', v_dp,
    'remaining_idr', GREATEST(0, v_total - v_dp)
  );
EXCEPTION
  WHEN exclusion_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SLOT_TAKEN',
      'message', 'Slot ini baru saja diambil pelanggan lain. Pilih jam lain.'
    );
END;
$$ LANGUAGE plpgsql;
