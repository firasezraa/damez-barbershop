-- 0003_audit_rate_limit.sql
-- audit_log append-only (tabelnya dibuat di 0001) + penyimpanan rate limit
-- persisten. Pengganti Map in-memory v1 (lib/security/rate-limit.ts) yang di
-- Vercel serverless tidak pernah berlaku lintas instance (IDEA.md §2.3 no. 2).

-- ---------------------------------------------------------------------------
-- audit_log: jejak yang tidak bisa disunting atau dihapus.
-- ---------------------------------------------------------------------------
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS ip inet;

CREATE OR REPLACE FUNCTION public.fn_audit_log_is_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_append_only ON public.audit_log;
CREATE TRIGGER trg_audit_log_append_only
  BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_is_append_only();

-- Satu pintu masuk untuk penulisan audit. Tabelnya tidak bisa disentuh setelah
-- baris ditulis, jadi semua penulisan wajib lewat sini.
CREATE OR REPLACE FUNCTION public.fn_write_audit(
  p_actor_id uuid,
  p_actor_role text,
  p_action text,
  p_entity text,
  p_entity_id text,
  p_before jsonb,
  p_after jsonb
) RETURNS void AS $$
BEGIN
  INSERT INTO public.audit_log (actor_id, actor_role, action, entity, entity_id, before, after)
  VALUES (p_actor_id, p_actor_role, p_action, p_entity, p_entity_id, p_before, p_after);
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- rate_limits: satu baris per kunci, jendela bergulir berbasis waktu.
-- Kenaikan hit dan reset jendela terjadi di satu statement upsert sehingga
-- tidak ada read-modify-write yang bisa balapan.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  hits integer NOT NULL DEFAULT 0,
  window_expires_at timestamptz NOT NULL,
  CONSTRAINT chk_rate_limits_hits CHECK (hits >= 0)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits (window_expires_at);

CREATE OR REPLACE FUNCTION public.fn_rate_limit_hit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
) RETURNS boolean AS $$
  INSERT INTO public.rate_limits AS rl (key, hits, window_expires_at)
  VALUES (p_key, 1, now() + make_interval(secs => p_window_seconds))
  ON CONFLICT (key) DO UPDATE
    SET hits = CASE
                 WHEN rl.window_expires_at <= now() THEN 1
                 ELSE rl.hits + 1
               END,
        window_expires_at = CASE
                 WHEN rl.window_expires_at <= now() THEN now() + make_interval(secs => p_window_seconds)
                 ELSE rl.window_expires_at
               END
  RETURNING hits <= p_limit;
$$ LANGUAGE sql;

-- ---------------------------------------------------------------------------
-- Pembersihan baris rate limit yang jendelanya sudah lama lewat. Dipanggil
-- worker/cron, bukan di jalur request.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_rate_limits_prune(p_older_than_seconds integer DEFAULT 86400) RETURNS integer AS $$
DECLARE
  v_deleted integer;
BEGIN
  WITH removed AS (
    DELETE FROM public.rate_limits
     WHERE window_expires_at < now() - make_interval(secs => p_older_than_seconds)
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_deleted FROM removed;

  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;
