# Runbook: setup lokal

Semua perintah dari root repo. Dikembangkan dan diuji di Node 22.23.4 + PostgreSQL 16.

## 1. Database

Dua database terpisah supaya menjalankan test tidak menghapus data kerja:

| Database | Dipakai oleh | Isi |
|---|---|---|
| `damez_dev` | `npm run dev`, `npm run migrate`, `npm run seed` | data kerja |
| `damez_test` | `npm run test:integration` (`TEST_DATABASE_URL`) | di-drop dan dibuat ulang tiap test file |

Bootstrap otomatis (butuh sudo; membuat role `damez` + dua database):

```bash
bash scripts/pg-local-setup.sh
```

Manual, kalau Postgres sudah ada:

```bash
sudo -u postgres psql -c "CREATE ROLE damez LOGIN PASSWORD '<pilih-sendiri>' SUPERUSER;"
sudo -u postgres createdb -O damez damez_dev
sudo -u postgres createdb -O damez damez_test
```

Password di skrip bootstrap hanya untuk loopback pengembangan. Bisa diganti dengan
`DAMEZ_DB_PASSWORD=... bash scripts/pg-local-setup.sh`.

## 2. Berkas `.env`

`.env` tidak ikut git. Isi minimal untuk pekerjaan database:

```
DATABASE_URL=postgresql://damez:<password>@127.0.0.1:5432/damez_dev
TEST_DATABASE_URL=postgresql://damez:<password>@127.0.0.1:5432/damez_test
```

`.env.example` memuat seluruh nama variabel yang dibaca `src/lib/config/env.ts` (Midtrans,
Supabase, cron secret, WhatsApp). Untuk R0 tidak ada yang dibutuhkan selain dua di atas.
Nilai kosong di `.env.example` disengaja — jangan menaruh kredensial di repo.

Test integrasi membaca `TEST_DATABASE_URL`; kalau kosong, `tests/helpers/db.ts` jatuh ke
`DATABASE_URL`.

## 3. Install dan jalankan

```bash
npm install
set -a && . ./.env && set +a
npm run migrate
npm run seed
npm run verify
npm run dev
```

`npm run verify` = `typecheck && lint && coverage && test:integration && build`. Ini gate
yang sama dengan CI (CI menambah E2E Playwright).

## 4. Catatan mesin kecil

VPS pengembangan ini 2 vCPU / RAM ~1,9 GB. Dua hal yang perlu diingat:

- **Build Next.js 16 + Turbopack** bisa lambat kalau root project tidak dipin. `next.config.ts`
  sudah memuat `turbopack.root` agar Next tidak memindai direktori home. Kalau build tetap
  kehabisan memori: `NODE_OPTIONS=--max-old-space-size=1024 npm run build`.
- **E2E Playwright** tidak dijalankan di `verify` lokal (browser + server produksi sekaligus).
  Jalankan manual: `npm run build && npm run test:e2e`. Chromium di-install sekali dengan
  `npx playwright install chromium`.

## 5. Migrasi

`npm run migrate` membaca `supabase/migrations/*.sql` berurutan, satu transaksi per berkas,
dan mencatat versi + checksum di `public.schema_migrations`.

- Menjalankan ulang = tidak ada perubahan (idempoten).
- Mengubah migrasi yang **sudah** diterapkan akan ditolak dengan pesan checksum mismatch.
  Perubahan skema selalu lewat berkas migrasi baru.
- Melihat riwayat: `psql "$DATABASE_URL" -c "select version, applied_at from schema_migrations order by version"`.

## 6. Test

```bash
npm run test:unit          # tanpa database
npm run test:integration   # butuh TEST_DATABASE_URL ke Postgres nyata
npm run coverage           # unit + ambang coverage pada src/lib/**
```

Test integrasi melakukan `DROP SCHEMA public CASCADE` pada `TEST_DATABASE_URL` tiap berkas
test. **Jangan** arahkan `TEST_DATABASE_URL` ke database kerja atau database produksi.

## 7. Menjalankan migrasi ke Supabase (hosted)

Skema v2 dipasang ke project Supabase dengan perintah yang sama, hanya berbeda URL:

```bash
cd /home/ubuntu/project-utama/damez-barbershop-v2
PG_SSL_INSECURE=true DATABASE_URL="$SUPABASE_DB_URL" npm run migrate
PG_SSL_INSECURE=true DATABASE_URL="$SUPABASE_DB_URL" npm run seed
```

Simpan URL-nya di `.env` sebagai `SUPABASE_DB_URL` (pakai host **Session pooler**:
`<region>.pooler.supabase.com:5432`, user `postgres.<project-ref>`). Jangan memakai
*Direct connection* (hanya IPv6) atau *Transaction pooler* (6543) — transaksi
dipindah antar koneksi sehingga `FOR UPDATE`, `pg_advisory_xact_lock`, dan DDL bisa patah.

**Catatan TLS.** `createPgPool` mewajibkan TLS untuk host non-lokal dan memverifikasi
sertifikat secara default. Pooler Supabase mengirim rantai yang memuat sertifikat
self-signed sehingga Node menolaknya walau root sebenarnya ada di trust store; karena itu
bootstrap sekali jalan memakai `PG_SSL_INSECURE=true`. **Jangan** pakai variabel itu di
runtime produksi — perbaikan yang benar (pin root pooler atau jalur koneksi dari Vercel)
adalah tugas R5.

Jangan arahkan `TEST_DATABASE_URL` ke Supabase: test integrasi melakukan
`DROP SCHEMA public CASCADE`.
