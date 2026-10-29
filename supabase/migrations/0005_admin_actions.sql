-- 0005_admin_actions.sql
-- Aksi kasir (IDEA.md §11 R4). Semua mutasi status booking dan uang lewat fungsi
-- di database supaya: (1) transisi status tidak bisa dilewati dari klien,
-- (2) nominal selalu dihitung server, (3) setiap perubahan meninggalkan jejak
-- di audit_log yang append-only.

-- ---------------------------------------------------------------------------
-- Perubahan status oleh staf. Status dari webhook (pending_payment -> confirmed)
-- tidak lewat sini: konfirmasi tetap hanya milik webhook (§7).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_admin_set_booking_status(
  p_booking_id uuid,
  p_new_status public.booking_status_enum,
  p_actor_role text,
  p_actor_id uuid,
  p_reason text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_current public.booking_status_enum;
  v_allowed boolean := false;
BEGIN
  IF p_actor_role NOT IN ('owner', 'cashier', 'barber') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_ACTOR_ROLE');
  END IF;

  SELECT status INTO v_current FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'BOOKING_NOT_FOUND');
  END IF;

  v_allowed := CASE v_current
    WHEN 'pending_payment' THEN p_new_status IN ('cancelled')
    WHEN 'confirmed'       THEN p_new_status IN ('in_progress', 'cancelled')
    WHEN 'in_progress'     THEN p_new_status IN ('completed', 'no_show', 'cancelled')
    ELSE false
  END;

  IF NOT v_allowed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_TRANSITION',
      'message', format('Tidak bisa memindahkan %s menjadi %s.', v_current, p_new_status)
    );
  END IF;

  UPDATE public.bookings
     SET status = p_new_status, updated_at = now()
   WHERE id = p_booking_id;

  PERFORM public.fn_write_audit(
    p_actor_id, p_actor_role, 'booking.status_changed', 'bookings', p_booking_id::text,
    jsonb_build_object('status', v_current),
    jsonb_build_object('status', p_new_status, 'reason', p_reason)
  );

  RETURN jsonb_build_object('success', true, 'status', p_new_status);
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Pelunasan di kasir: DP yang sudah dibayar dipotong dari total, sisa dibayar
-- tunai/QRIS, kursi ditutup. Idempoten lewat satu kunci unik per booking.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_admin_settle_booking(
  p_booking_id uuid,
  p_method varchar,
  p_actor_role text,
  p_actor_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_remaining integer;
  v_status public.booking_status_enum;
  v_key text := 'settle:' || p_booking_id::text;
BEGIN
  IF p_actor_role NOT IN ('owner', 'cashier') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_ACTOR_ROLE');
  END IF;

  IF p_method NOT IN ('cash', 'qris', 'transfer') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_METHOD');
  END IF;

  SELECT status, remaining_idr INTO v_status, v_remaining
    FROM public.bookings WHERE id = p_booking_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'BOOKING_NOT_FOUND');
  END IF;

  -- Idempotensi diperiksa lebih dulu: kasir yang menekan tombol dua kali harus
  -- mendapat jawaban "sudah lunas", bukan pesan status yang membingungkan.
  IF EXISTS (SELECT 1 FROM public.payments WHERE idempotency_key = v_key) OR v_remaining <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_SETTLED');
  END IF;

  IF v_status NOT IN ('confirmed', 'in_progress') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_STATE', 'status', v_status);
  END IF;

  INSERT INTO public.payments
    (booking_id, provider, provider_ref, idempotency_key, amount_idr, status, method, paid_at)
  VALUES
    (p_booking_id, 'cashier', v_key, v_key, v_remaining, 'paid', p_method, now());

  -- `remaining_idr` sengaja TIDAK diubah: nilainya snapshot turunan
  -- (total_idr - dp_idr, constraint chk_booking_remaining) dan riwayat uang
  -- hidup di tabel payments. Yang berubah hanya status kursi.
  UPDATE public.bookings
     SET status = 'completed', updated_at = now()
   WHERE id = p_booking_id;

  PERFORM public.fn_write_audit(
    p_actor_id, p_actor_role, 'booking.settled', 'bookings', p_booking_id::text,
    jsonb_build_object('remainingIdr', v_remaining),
    jsonb_build_object('amountIdr', v_remaining, 'method', p_method)
  );

  RETURN jsonb_build_object('success', true, 'status', 'completed', 'amountIdr', v_remaining);
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Walk-in: tamu yang datang langsung. Kursi langsung terisi (tanpa hold 15
-- menit), harga tetap dihitung dari katalog, dan benturan slot tetap ditolak
-- oleh exclusion constraint yang sama.
--
-- DP tidak dipungut untuk walk-in: tidak ada kursi yang perlu dikunci, jadi
-- `dp_idr = 0` dan seluruh tagihan dibayar di kasir. Kalau DP ikut dicatat,
-- rekap kas akan mengira ada uang masuk yang tidak pernah diterima.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_admin_schedule_walk_in(
  p_full_name varchar,
  p_phone_e164 varchar,
  p_barber_id uuid,
  p_start_time timestamptz,
  p_service_ids uuid[],
  p_actor_role text,
  p_actor_id uuid
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
  v_buffer constant integer := 10;
BEGIN
  IF p_actor_role NOT IN ('owner', 'cashier', 'barber') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_ACTOR_ROLE');
  END IF;

  SELECT true INTO v_barber_active
    FROM public.barbers WHERE id = p_barber_id AND is_active FOR UPDATE;

  IF v_barber_active IS NOT TRUE THEN
    RETURN jsonb_build_object('success', false, 'error', 'BARBER_NOT_FOUND');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_barber_id::text || p_start_time::text));

  IF p_service_ids IS NULL OR array_length(p_service_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_SERVICE');
  END IF;

  SELECT count(DISTINCT requested.service_id)::integer INTO v_requested
    FROM unnest(p_service_ids) AS requested(service_id);

  SELECT COALESCE(sum(s.price_idr), 0), COALESCE(sum(s.duration_minutes), 0), count(*)::integer
    INTO v_total, v_duration, v_matched
    FROM public.services s
   WHERE s.id = ANY(p_service_ids) AND s.is_active;

  IF v_matched <> v_requested THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_SERVICE');
  END IF;

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
    total_idr, dp_idr, remaining_idr, hold_expires_at
  ) VALUES (
    v_booking_code, v_customer_id, p_barber_id, 'walk_in', 'confirmed',
    p_start_time, p_start_time + make_interval(mins => v_duration + v_buffer),
    v_duration, v_buffer,
    v_total, 0, v_total, NULL
  )
  RETURNING id INTO v_booking_id;

  INSERT INTO public.booking_services (booking_id, service_id, price_snapshot_idr, duration_snapshot_minutes)
  SELECT v_booking_id, s.id, s.price_idr, s.duration_minutes
    FROM public.services s
   WHERE s.id = ANY(p_service_ids);

  PERFORM public.fn_write_audit(
    p_actor_id, p_actor_role, 'booking.walk_in', 'bookings', v_booking_id::text,
    NULL,
    jsonb_build_object('bookingCode', v_booking_code, 'totalIdr', v_total, 'startTime', p_start_time)
  );

  RETURN jsonb_build_object(
    'success', true,
    'bookingId', v_booking_id,
    'bookingCode', v_booking_code,
    'status', 'confirmed',
    'totalIdr', v_total,
    'dpIdr', 0,
    'remainingIdr', v_total
  );
EXCEPTION
  WHEN exclusion_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'SLOT_TAKEN');
END;
$$ LANGUAGE plpgsql;