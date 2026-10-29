# Rencana R1 — Auth & RLS (Damez v2)

Basis: `IDEA.md` §8 (kontrol wajib) dan §11 milestone R1. Melanjutkan R0 yang sudah hijau
(79/79 test, CI 6/6, tag `v1-archive` di `origin/main`).

## Batasan nyata yang membentuk rencana ini

1. **Tidak ada Docker** di VPS ini → `supabase start` (GoTrue) tidak bisa dijalankan lokal.
2. **CI hanya punya service `postgres:16`**, tanpa GoTrue. Jadi verifikasi token Supabase
   sungguhan tidak mungkin di dua lingkungan itu.
3. Konsekuensi yang sudah dikunci (`IDEA.md` §15): **RLS diuji terhadap Postgres nyata**
   (itu bisa, dan itu inti keamanannya), sedangkan **verifikasi sesi Supabase diuji di batas
   modul dengan transport yang disuntik**, plus verifikasi nyata saat preview/deployment.

Aturan yang tidak boleh dilanggar: tidak ada route admin yang lolos tanpa sesi server-side
tervalidasi (`IDEA.md` §4 anti-goal), dan tidak ada klaim "teruji" untuk hal yang hanya
di-stub.

## Task

### R1.1 — Peran DB + RLS + test negatif anon (Postgres nyata)

**Files:** `supabase/migrations/0004_roles_rls.sql`, `tests/integration/rls.test.ts`.
Modify: `tests/integration/migrate-runner.test.ts` (daftar versi).

- Peran `anon`, `authenticated`, `service_role` dibuat idempoten (`DO $$ ... IF NOT EXISTS`),
  NOLOGIN, tanpa password — sama seperti peran yang sudah ada di Supabase.
- `GRANT USAGE ON SCHEMA public` + DML pada semua tabel ke `anon`/`authenticated`, supaya
  penolakan yang diuji benar-benar datang dari **policy RLS**, bukan dari grant yang hilang.
- RLS diaktifkan di **semua** tabel `public`, termasuk yang belum: `barbers`, `services`,
  `working_hours`, `blocked_slots`, `rate_limits`, `schema_migrations`.
- Baca publik (`anon`): hanya `services WHERE is_active`, `barbers WHERE is_active`,
  `working_hours`, `blocked_slots WHERE is_active`. Tidak ada policy `anon` lain.
- `authenticated`: **tanpa** policy apa pun di R1. Semua akses data admin lewat
  `lib/db/server.ts` (service role) setelah `requireAdmin()`. Alasan: `auth.uid()` milik
  Supabase tidak ada di Postgres polos; menirunya di sini akan menyimpang dari produksi.
- Bukti wajib: `SET ROLE anon` → `SELECT` dari `bookings`, `payments`, `customers`,
  `audit_log`, `settings`, `notifications`, `booking_services`, `rate_limits`,
  `schema_migrations` ditolak; `SELECT` dari `services`/`barbers` aktif **berhasil**;
  `INSERT`/`UPDATE`/`DELETE` oleh `anon` di semua tabel ditolak.

### R1.2 — Verifikasi sesi server-side

**Files:** `src/lib/auth/session.ts`, `tests/unit/auth-session.test.ts`.

- `readAdminSession(request, deps)`: ambil cookie sesi → verifikasi lewat `SessionVerifier`
  yang disuntik (`deps.verify`). Default produksi memanggil Supabase `getUser()`; test
  mengirim verifier palsu.
- Menolak: cookie hilang, token kedaluwarsa, error jaringan → **fail closed** (tanpa sesi).
- Tidak pernah membaca `localStorage` (cacat v1: `damez_admin_session`).
- Bukti: unit test untuk sesi valid, tanpa cookie, cookie kosong, verifier gagal, dan
  `role` tidak dikenal.

### R1.3 — `requireAdmin()` + route admin pertama

**Files:** `src/lib/auth/require-admin.ts`, `src/app/api/admin/health/route.ts`,
`tests/unit/require-admin.test.ts`, `tests/e2e/admin-guard.spec.ts`.

- `requireAdmin(request, deps)`: `{ ok: true, session }` atau `{ ok: false, status: 401 | 403, body }`.
  `401` tanpa sesi valid, `403` role di luar `owner | cashier | barber`.
- Route contoh `/api/admin/health` memakai helper ini — dibuktikan 401 tanpa cookie dalam test
  integrasi HTTP, dan `curl` nyata terhadap server produksi di E2E.
- Aturan lint sudah ada: `/api/admin/**` tidak boleh menyentuh DB langsung.

### R1.4 — `middleware.ts`

**Files:** `src/middleware.ts`, `src/lib/auth/guard-paths.ts`, `tests/unit/guard-paths.test.ts`.

- Keputusan redirect ditulis sebagai fungsi murni (`guardDecision(pathname, hasSession)`) supaya
  bisa diuji tanpa edge runtime; `middleware.ts` hanya merangkai cookie + fungsi itu.
- `/admin/**` tanpa sesi → redirect `/admin/login?next=<path>`; `/admin/login` tetap boleh
  diakses; route publik dan `/api/*` tidak disentuh.

### R1.5 — Login admin server-side (butuh project Supabase)

**Blocker:** butuh project Supabase untuk GoTrue. Belum diputuskan owner (lihat §Keputusan).
Sampai itu ada, R1.5 **tidak dikerjakan** dan tidak diklaim selesai.

- `src/app/admin/login/page.tsx` (form) + `src/app/api/admin/auth/sign-in/route.ts`
  (server-side `signInWithPassword`, cookie httpOnly via `@supabase/ssr`).
- Password admin tidak pernah ada di kode; seeding akun lewat script CLI dengan password dari env.

### R1.6 — Penjaga "tidak ada jejak demo"

**Files:** `tests/unit/no-demo-auth.test.ts`.

- Menolak keberadaan: `DEMO_ADMIN_USERS`, password literal (`damez123`, `admin123`),
  `localStorage` untuk sesi, dan tombol quick-login.
- Menggantikan klaim "sudah dihapus" dengan pemeriksaan yang gagal kalau jejaknya kembali.

## Gate R1

- Migrasi naik dari nol termasuk 0004 dan idempoten saat dijalankan ulang.
- `SET ROLE anon` gagal membaca seluruh tabel sensitif, berhasil membaca katalog publik.
- `/api/admin/*` → 401 tanpa cookie, 403 untuk role tidak dikenal (test nyata, bukan deskripsi).
- `npm run verify` hijau; CI 6/6 hijau.
- Tidak ada kredensial/sesi demo di bundle: `grep -r "damez123\|DEMO_ADMIN_USERS" src/ .next/static` → 0.

## Keputusan yang menunggu owner

| # | Pertanyaan | Dampak |
|---|---|---|
| 1 | Provision project Supabase untuk damez sekarang (via MCP, kemungkinan berbiaya) atau tunda verifikasi GoTrue sampai preview deployment? | Tanpa project, R1.5 tertunda; R1.1–R1.4, R1.6 tetap bisa selesai penuh dengan bukti nyata. |
| 2 | Akun admin pertama: satu akun owner atau tiga akun (owner/cashier/barber) sejak awal? | Menentukan bentuk script seed akun. |
