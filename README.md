# Damez Barbershop v2

Rebuild dari nol sistem booking Damez Barbershop Jakarta (3 kursi, 3 master barber, satu gerai).
v1 tetap ada di `main` (tag `v1-archive`); pekerjaan v2 berjalan di branch `dev`.

Alasan rebuild dan temuan audit v1: `IDEA.md` §1–§2 dan `docs/adr/ADR-000-rebuild-rationale.md`.
Rencana per milestone: `IDEA.md` §11. Rencana teknis R0: `docs/superpowers/plans/`.

## Status

Milestone yang sedang dikerjakan: **R0 — Fondasi**. Yang sudah nyata ada di repo ini:
skema database inti + constraint anti double-booking, fungsi hold 15 menit, audit log
append-only, rate limit persisten, seed katalog, lint batas modul, runner migrasi, dan
pipeline CI 6 tahap. Belum ada UI booking maupun portal admin — itu R1–R4.

## Prasyarat

- Node.js ≥ 22 (dikembangkan di 22.23.4)
- PostgreSQL 16 (lokal atau container). VPS pengembangan tidak punya Docker, jadi ada
  skrip bootstrap: `scripts/pg-local-setup.sh`.
- Tidak ada akun cloud yang dibutuhkan untuk R0.

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
| `npm run coverage` | Test unit + ambang coverage 80% |
| `npm run migrate` | Terapkan migrasi `supabase/migrations` ke `DATABASE_URL` |
| `npm run seed` | Isi katalog layanan, barber, jam kerja, istirahat (idempoten) |
| `npm run verify` | Gate lokal: typecheck → lint → coverage → test integrasi → build |

Langkah setup dari nol ada di `docs/runbook/local-setup.md`.

## Struktur

```
src/app          route + shell UI
src/features     satu folder per domain (booking, payment, slots, notifications, admin)
src/lib          db/, auth/, security/, time/, config/  — tanpa dependensi ke features/
supabase/migrations   SQL murni, dijalankan oleh scripts/migrate.ts
tests            unit (tanpa DB), integration (Postgres nyata), e2e (Playwright)
tools/eslint-rules    aturan batas modul, diuji di tests/unit/eslint-rules.test.ts
```

## Dokumentasi

- `IDEA.md` — spesifikasi rebuild, temuan audit, aturan bisnis terkunci, milestone.
- `docs/adr/ADR-000-rebuild-rationale.md` — kenapa v2 ditulis ulang.
- `docs/adr/ADR-001..003` — keputusan bisnis v1 yang masih berlaku (DP, slot, WhatsApp).
- `docs/runbook/local-setup.md` — setup dan penggunaan dua database.
- `docs/reference/v1/` — runbook deployment, SOP kasir, dan benchmark harga v1 sebagai acuan.

## Lisensi

Hak milik eksklusif Damez Barbershop Jakarta.
