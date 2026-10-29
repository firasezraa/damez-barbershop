# Damez Barbershop v2

Sistem booking Damez Barbershop Jakarta (3 kursi, 3 master barber, satu gerai): landing publik,
booking tanpa akun dengan DP Rp 20.000, dashboard kasir, rekap kas harian, dan notifikasi WhatsApp.

Rebuild dari nol. v1 tetap ada di `main` (tag `v1-archive`); pekerjaan v2 di branch `dev`.
Alasan rebuild dan temuan audit v1: `IDEA.md` §1–§2 dan `docs/adr/ADR-000-rebuild-rationale.md`.

## Status

| Milestone | Isi | Keadaan |
|---|---|---|
| R0 | Fondasi: skema inti + anti double-booking (GiST), hold 15 menit, audit log append-only, rate limit persisten, lint batas modul, runner migrasi, CI 6 tahap | selesai |
| R1 | Auth admin server-side + RLS sebagai satu-satunya batas data | selesai |
| R2 | Katalog publik, ketersediaan slot, hold, cron kedaluwarsa | selesai |
| R3 | Snap checkout DP, webhook bertanda tangan idempoten, antrean WhatsApp | selesai |
| R4 | Dashboard kasir (matriks 3 kursi, walk-in, pelunasan), rekap kas + CSV, E2E SOP kasir | selesai |
| R5 | Hardening: lingkungan Snap eksplisit, dokumentasi operasional repo-only | berjalan |

**Tidak ada hosting.** Proyek ini sengaja hidup di repo GitHub saja; merge `dev` → `main`
dilakukan pemilik. Tidak ada konfigurasi Vercel di repo ini.

## Prasyarat

- Node.js ≥ 22 (dikembangkan di 22.23.4)
- PostgreSQL 16 lokal (VPS pengembangan tidak punya Docker; pakai `scripts/pg-local-setup.sh`)
- Akun Supabase (hanya untuk autentikasi admin) dan Midtrans (hanya untuk DP)

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Jalankan server pengembangan |
| `npm run build` | Build produksi |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm run lint` | ESLint 9 termasuk 3 aturan batas modul lokal |
| `npm run test:unit` | Vitest, tanpa database |
| `npm run test:integration` | Vitest terhadap Postgres nyata (`TEST_DATABASE_URL`) |
| `npm run test:e2e` | Playwright, 2 viewport (butuh build dulu) |
| `npm run coverage` | Test unit + ambang coverage 80% pada `src/lib/**` |
| `npm run migrate` | Terapkan migrasi `supabase/migrations` ke `DATABASE_URL` |
| `npm run seed` | Isi katalog layanan, barber, jam kerja, istirahat (idempoten) |
| `npm run seed:admin` | Buat/perbarui 3 akun admin di Supabase (owner, kasir, barber) |
| `npm run verify` | Gate lokal: typecheck → lint → coverage → test integrasi → build |

Setup dari nol: `docs/runbook/local-setup.md`.

## Konfigurasi yang mudah salah

- `MIDTRANS_IS_PRODUCTION` menentukan endpoint Snap. **Bukan** `NODE_ENV`. Kunci sandbox
  (`SB-Mid-server-...`) dengan flag produksi — atau sebaliknya — ditolak saat env dibaca,
  jadi kesalahan ketahuan sebelum ada pelanggan yang menekan tombol bayar.
- `APP_BASE_URL` diisi kalau URL publik sudah ada; dipakai untuk `callbacks.finish` Snap.
  Tanpa itu Snap memakai pengaturan redirect di dasbor Midtrans.
- `MOCK_MIDTRANS=true` dan `MOCK_WHATSAPP=true` membuat alur DP dan notifikasi berjalan tanpa
  jaringan dan tanpa biaya. Dipakai E2E; tidak untuk produksi.
- `PG_SSL_INSECURE=true` hanya untuk bootstrap skema ke pooler Supabase, bukan untuk runtime.

## Struktur

```
src/app               route + shell UI
src/features          satu folder per domain (booking, payment, slots, notifications, admin, catalogue)
src/lib               db/, auth/, security/, time/, config/  — tanpa dependensi ke features/
supabase/migrations   SQL murni, dijalankan oleh scripts/migrate.ts
tests                 unit (tanpa DB), integration (Postgres nyata), e2e (Playwright)
tools/eslint-rules    aturan batas modul, diuji di tests/unit/eslint-rules.test.ts
```

## Dokumentasi

- `IDEA.md` — spesifikasi rebuild, temuan audit, aturan bisnis terkunci, milestone.
- `docs/adr/` — ADR-000 alasan rebuild, ADR-001..003 keputusan bisnis v1 yang masih berlaku.
- `docs/runbook/local-setup.md` — database, migrasi, test, menerapkan skema ke Supabase.
- `docs/runbook/windows-setup.md` — dari nol di Windows: install PostgreSQL, `.env`, jalan di IDE,
  menyambungkan alat database, masalah umum.
- `docs/runbook/operations.md` — operasional harian tanpa hosting: cron, backup, rilis.
- `docs/superpowers/plans/` — rencana teknis per milestone (R0, R1, R5, ...).
- `docs/reference/v1/` — runbook deployment, SOP kasir, benchmark harga v1 sebagai acuan.

## Lisensi

Hak milik eksklusif Damez Barbershop Jakarta.
