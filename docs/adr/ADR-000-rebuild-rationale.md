# ADR-000: Menulis ulang Damez Barbershop (v1 → v2)

- Status: diterima
- Tanggal: 2026-10-30
- Konteks kode: audit `firasezraa/damez-barbershop` @ `921fb26` (branch `main`), angka dari pengukuran langsung clone lokal.

## Konteks

v1 berjalan sebagai demo: fiturnya lengkap di atas kertas (landing, wizard booking, dashboard
kasir, webhook Midtrans, template WhatsApp), tapi tidak layak produksi. Badge "31/31 passing"
di README v1 tidak membuktikan sistem berjalan, karena test suite-nya tidak menyentuh sistem
sungguhan. Keputusan yang diambil: **rebuild di repo yang sama, branch `dev`**, dengan kontrak
perilaku v1 sebagai spesifikasi — bukan port berkas v1. v1 dipertahankan utuh di `main` dengan
tag `v1-archive` supaya bisa dirujuk dan dikembalikan.

## Alasan 1 — lubang auth kritis (CRITICAL)

Portal admin bisa dipakai tanpa login. Bukti dari kode v1:

| Temuan | Berkas |
|---|---|
| Guard admin hanya client-side, dan **membuat sesi demo owner otomatis** saat sesi kosong | `app/(admin)/layout.tsx` — `getLocalAdminSession()` null → `setUser({ role: 'owner', ... })` |
| Tidak ada `middleware.ts` di root maupun `app/` | `ls middleware.ts app/middleware.ts` → tidak ada |
| **4 dari 4** route API admin tanpa marker auth apa pun | `app/api/admin/bookings/route.ts`, `bookings/[id]/status/route.ts`, `blocked-slots/route.ts`, `reports/daily-csv/route.ts` |
| Password demo hardcoded, dipakai tombol "quick demo login" | `app/(admin)/login/page.tsx` — literal `damez123`; akun di `DEMO_ADMIN_USERS` (`lib/admin/auth.ts:157`) |
| Sesi disimpan di `localStorage` (`damez_admin_session`) | `lib/admin/auth.ts` — bisa dipalsukan dari console |

Dampaknya bukan "kurang rapi": siapa pun bisa membaca daftar booking, mengubah status booking,
memblokir slot, dan mengunduh CSV rekonsiliasi kas harian. Ini kebocoran data operasional
sekaligus jalur manipulasi.

Tindakan v2: R1 mengganti seluruh mekanisme ini dengan Supabase Auth cookie-based,
`middleware.ts` di edge, helper `requireAdmin(request)` untuk setiap route `/api/admin/*`,
RLS aktif dan diuji negatif, serta penghapusan total kredensial/sesi demo.

## Alasan 2 — test suite tidak memverifikasi sistem

v1: 34 berkas test, 11.175 baris, dijalankan lewat rangkaian `node --experimental-strip-types`
berurutan di dalam satu string `npm test`. Tidak ada test runner, tidak ada coverage, tidak ada
browser. Database diuji dengan `pg-mem` — simulasi in-memory yang **tidak menegakkan**
`EXCLUDE USING gist`, jadi jaminan anti double-booking yang jadi inti bisnis tidak pernah
diuji di engine yang benar-benar memakainya.

Tindakan v2: Vitest (unit + integrasi terhadap Postgres 16 nyata), Playwright (E2E, dua
viewport), ambang coverage 80% pada `src/lib/**`, dan gate CI yang gagal kalau test tidak
punya assertion nyata. Test konkurensi 20 hold paralel harus membuktikan tepat satu slot
menang.

## Alasan 3 — god files dan struktur yang kabur

Ukuran v1 terukur: `lib/notifications/whatsapp.ts` 1.836 baris, `lib/admin/service.ts` 1.202,
`lib/payment/webhook.ts` 1.168, `components/ui/icons.ts` 1.125, `tests/concurrency-stress-test.ts`
864. Enam berkas melewati 600 baris. Selain itu ada dua pohon route untuk alur yang sama
(`app/(public)/booking/*` dan `app/(public)/book/*`), satu Supabase client yang dipakai server
dan browser sekaligus (dengan fallback ke `SUPABASE_SERVICE_ROLE_KEY`), rate limiter berbasis
`Map` yang tidak berlaku di serverless, Tailwind v4 bercampur `tailwind.config.ts`, dan artefak
build (`preview-enhanced.html`) ikut ter-commit.

Tindakan v2: struktur `features/*` per domain dengan aturan dependensi yang ditegakkan lint,
dua client database terpisah (`lib/db/server.ts` vs `lib/db/browser.ts`), rate limit persisten
di Postgres, satu sumber token Tailwind, plafon lunak 800 baris per berkas, dan gate yang
menolak berkas di atas plafon.

## Yang dipertahankan dari v1

1. `EXCLUDE USING gist` pada `booking_range TSTZRANGE` — solusi kernel-level yang tepat untuk
   zero double-booking (`001_initial_schema.sql:227,258,268`). Dipakai apa adanya di v2.
2. Temporary hold 15 menit + auto-expire sebagai konsep.
3. Webhook Midtrans SHA-512 + `timingSafeEqual` + idempoten — model serangan dan pertahanannya
   sudah benar.
4. Auth cron lewat `CRON_SECRET` — satu-satunya endpoint v1 yang auth-nya benar.
5. Zona waktu strict `Asia/Jakarta` di server dan database.
6. Pemisahan `content/` untuk copy dan template WhatsApp.
7. Aturan bisnis yang sudah dikunci owner (DP Rp 20.000, hold 15 menit, batas batal H-3 jam,
   toleransi 15 menit, 3 kursi, 10:00–21:00 WIB) — lihat ADR-001..003.

## Konsekuensi

- Tidak ada migrasi data: v1 belum pernah tayang produksi (URL produksi kosong di README v1).
- Seluruh `lib/*`, `components/*`, `tests/*`, `docs/*` hasil generasi multi-agent v1 **tidak**
  diambil alih. Yang disalin hanya `content/*` dan `docs/decisions/ADR-001..003` plus tiga
  dokumen acuan operasional (`docs/reference/v1/`).
- Domain, SSL, dan Vercel dikonfigurasi ulang mengikuti `docs/reference/v1/DEPLOYMENT.md`.
- Sebelum semua gate §9 hijau, tidak ada fitur baru di luar `IDEA.md` §4 (anti-goal).
