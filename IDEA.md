# idea.md — Rebuild Damez Barbershop (v2)

> Titik awal rebuild. Basis: audit kode `firasezraa/damez-barbershop` @ `921fb26` (branch `main`).
> Angka di dokumen ini **hasil pengukuran langsung** dari clone lokal, bukan estimasi.
> Nilai bertanda **[ASUMSI]** = keputusan agen, perlu konfirmasi Firas sebelum dikunci.
> Nilai bertanda **[LOCKED v1]** = keputusan bisnis yang sudah dikunci owner, jangan diubah tanpa persetujuan ulang.

---

## 1. Alasan Rebuild

v1 berfungsi secara demo, tapi tidak layak produksi. Bukan masalah fitur — masalah **struktur, keamanan, dan test yang tidak menguji apa pun yang nyata**.

Tiga alasan utama:

1. **Ada lubang auth kritis.** Portal admin bisa diakses tanpa login. Detail di §2.1.
2. **Test suite 34 berkas / 11.175 baris tidak memverifikasi sistem sungguhan.** Dijalankan lewat `node --experimental-strip-types` berurutan dalam satu string `npm test`, tanpa test runner, tanpa coverage, tanpa database nyata (`pg-mem`), tanpa browser. Badge "31/31 passing" bukan bukti sistem jalan.
3. **God files.** 6 berkas di atas 600 baris; terbesar 1.836 baris. Batas sehat 200–400, plafon lunak 800.

Rebuild = tulis ulang dari nol dengan **kontrak perilaku v1 sebagai spesifikasi**, bukan port kode v1.

---

## 2. Temuan Audit v1 (bukti terukur)

### 2.1 CRITICAL — Portal admin tidak terproteksi

| Temuan | Bukti |
|---|---|
| Guard admin hanya client-side, dan **membuat sesi demo owner otomatis** kalau sesi kosong | `app/(admin)/layout.tsx` — `getLocalAdminSession()` null → `setUser({ role: 'owner', ... })` |
| Tidak ada `middleware.ts` di root maupun `app/` | `ls middleware.ts app/middleware.ts` → not found |
| **4 dari 4** route API admin punya 0 marker auth | `app/api/admin/bookings/route.ts`, `bookings/[id]/status/route.ts`, `blocked-slots/route.ts`, `reports/daily-csv/route.ts` |
| Kredensial demo hardcoded, dipakai tombol "quick demo login" | `app/(admin)/login/page.tsx` — password literal `damez123`; akun di `DEMO_ADMIN_USERS` (`lib/admin/auth.ts`) |
| Sesi disimpan di `localStorage` (`damez_admin_session`) | `lib/admin/auth.ts` — bisa dipalsukan dari console |

Dampak: siapa pun bisa membaca daftar booking, mengubah status booking, memblokir slot, dan mengunduh CSV rekonsiliasi kas harian. Ini bukan "kurang rapi" — ini kebocoran data operasional dan jalur manipulasi.

**Wajib dibereskan sebelum fitur apa pun di v2.** Lihat §8.

### 2.2 Arsitektur & ukuran kode (terukur)

```
app         27 file    3.591 baris
components  51 file   11.038 baris
lib         20 file    8.521 baris
tests       34 file   11.175 baris
supabase     6 file    1.841 baris
docs        69 file
```

Berkas pelanggar plafon lunak 800 baris:

```
1.836  lib/notifications/whatsapp.ts
1.202  lib/admin/service.ts
1.168  lib/payment/webhook.ts
1.125  components/ui/icons.ts
  864  tests/concurrency-stress-test.ts
  648  components/admin/TelemetryDashboardView.tsx
  632  lib/slots/auto-expire.ts
  615  lib/analytics/telemetry.ts
```

### 2.3 Cacat lain

| # | Temuan | Bukti |
|---|---|---|
| 1 | Pohon route duplikat untuk alur yang sama | `app/(public)/booking/*` **dan** `app/(public)/book/*`, termasuk dua `success` terpisah |
| 2 | Rate limiter in-memory | `lib/security/rate-limit.ts:30` — `Map<string, RequestRecord>`. Di Vercel serverless tiap instance punya Map sendiri → limit praktis tidak berlaku |
| 3 | Satu Supabase client untuk server dan client, fallback ke `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/client.ts`; diimpor juga oleh `app/(admin)/layout.tsx`, `app/(admin)/login/page.tsx`, `components/admin/AdminHeader.tsx` yang semuanya `'use client'`. Satu salah impor → service role bocor ke bundle browser |
| 4 | Tidak ada test runner | `package.json` `test` = rangkaian `node --experimental-strip-types` berurutan. Tidak ada vitest/jest/playwright, tidak ada coverage, `*.spec.ts` bukan test browser |
| 5 | DB test pakai `pg-mem` | Simulasi in-memory tidak menegakkan `EXCLUDE USING gist` seperti Postgres asli → jaminan anti double-booking tidak pernah diuji di engine nyata |
| 6 | Artefak build ikut ter-commit | `preview-enhanced.html` di root |
| 7 | Konfigurasi Tailwind campur | `tailwindcss@^4.3.3` + `@tailwindcss/postcss` (v4, CSS-first) **dan** `tailwind.config.ts` |
| 8 | RLS tidak diuji | 42 `POLICY` di `001_initial_schema.sql`, 1 di `003`, 0 di `002`/`004` — tidak ada test yang membuktikan policy benar-benar menolak akses anon |

### 2.4 Yang di v1 sudah benar — pertahankan

1. **`EXCLUDE USING gist` pada `booking_range TSTZRANGE`** (`001_initial_schema.sql:227,258,268`). Ini solusi kernel-level yang tepat untuk zero double-booking. Pertahankan apa adanya.
2. **Temporary hold 15 menit + auto-expire** sebagai konsep. Implementasi ditulis ulang.
3. **Webhook Midtrans SHA-512 + `timingSafeEqual` + idempoten** (`lib/payment/webhook.ts`). Model serangan & pertahanannya sudah benar.
4. **Auth cron via `CRON_SECRET`** (`app/api/cron/*/route.ts`). Satu-satunya endpoint yang authnya benar.
5. **Zona waktu strict `Asia/Jakarta`** di server dan DB.
6. **Pemisahan `content/`** untuk copy dan template WhatsApp.

---

## 3. Baseline Bisnis [LOCKED v1]

Jangan berubah. Semua keputusan produk v2 diturunkan dari sini.

| Aturan | Nilai |
|---|---|
| DP | Flat **Rp 20.000** per booking, dipotong dari total saat pelunasan di kasir |
| Hold slot | **15 menit** (900 detik), auto-expire |
| Batas batal/reschedule | **H-3 jam** sebelum jadwal |
| Toleransi keterlambatan | **15 menit**; lewat itu → `no_show`, slot dilepas |
| No-show | DP hangus |
| Kursi | 3 kursi, 3 master barber |
| Jam operasional | 10:00–21:00 WIB |
| Payment | Midtrans Snap — QRIS prioritas (MDR 0,7% = Rp 140), VA bank |
| Notifikasi | WhatsApp gateway (Fonnte/Wablas), SLA < 5 detik, 0 emoji |
| Zona waktu | `Asia/Jakarta` di DB, server, dan tampilan |

---

## 4. Scope v2

**Masuk:**
- Landing profile + booking wizard end-to-end (layanan → barber → jadwal → kontak → DP → tiket).
- Auth admin **server-side** dengan Supabase Auth + RLS sebagai batas data tunggal.
- Dashboard kasir (matriks 3 kursi, walk-in cepat, potong DP, no-show, tutup kas).
- Worker auto-expire slot.
- Rekap kas CSV + telemetri no-show/konversi.
- Feature flag `MOCK_MIDTRANS` / `MOCK_WHATSAPP` untuk dev & E2E tanpa biaya.

**Keluar (fase berikutnya, jangan kerjakan sekarang):**
- Akun customer & riwayat cukur.
- Loyalitas/poin/voucher, merchandise.
- Pelunasan online penuh, multi-cabang, aplikasi native.

**Anti-goal** (kalau ini terjadi, rebuild dianggap gagal meski fiturnya jalan):
- Ada route admin yang bisa diakses tanpa sesi server-side tervalidasi.
- Ada klaim "passing" yang tidak berasal dari test runner nyata.
- Ada berkas > 800 baris tanpa alasan tertulis.
- Featurisme: menambah fitur di luar §4 sementara DoD §13 belum semua hijau.

---

## 5. Arsitektur Target

**[ASUMSI]** Stack dipertahankan (Next.js App Router + Supabase + Midtrans + Vercel) — sesuai keputusan owner v1 dan sejalan dengan proyek `portfolio_v2` yang sudah pakai Next.js 16.

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js 16 App Router, TypeScript strict | Server Components + Route Handlers; align dengan portfolio_v2 |
| Styling | Tailwind v4 CSS-first, **satu** sumber token (`globals.css` `@theme`) | Buang `tailwind.config.ts` campur |
| UI primitif | shadcn/ui, ikon satu set saja | v1 pakai Tabler **dan** lucide — pilih satu |
| DB | Supabase Postgres 15+ | `TSTZRANGE` + GiST wajib ada |
| Auth | **Supabase Auth (cookie-based, `@supabase/ssr`) + `middleware.ts`** | Mengganti localStorage demo |
| Data access | Dua client terpisah, berkas terpisah: `lib/db/server.ts` (service role, `import 'server-only'`) dan `lib/db/browser.ts` (anon) | Tidak ada satu client yang bisa dipakai dua-duanya |
| Payment | Midtrans Snap + webhook idempoten | Dipertahankan |
| Notifikasi | WhatsApp multi-gateway + retry queue di DB | Dipertahankan, dipecah dari 1.836 baris |
| Job | Worker auto-expire sebagai proses terpisah + Route Handler cron ber-`CRON_SECRET` | Dipertahankan |
| Test | **Vitest** (unit/integrasi) + **Playwright** (E2E) + Postgres nyata (Supabase lokal) untuk test konkurensi | Menggantikan `node --experimental-strip-types` + `pg-mem` |
| CI | GitHub Actions: typecheck → lint → unit → integrasi (DB nyata) → E2E → build → coverage gate | v1 CI tidak punya E2E maupun coverage |

### Pembagian modul (target, tiap berkas < 400 baris)

```
src/
├── app/
│   ├── (public)/            landing + /booking/*
│   ├── (admin)/             /login, /dashboard, /bookings, /reports
│   ├── api/
│   │   ├── booking/         hold, checkout
│   │   ├── slots/           available
│   │   ├── webhooks/midtrans/
│   │   ├── cron/            expire-slots, reminders
│   │   └── admin/           SELURUH route di sini wajib lewat guard §8
│   └── middleware.ts        proteksi /(admin)/* di edge
├── features/                satu folder per domain, bukan folder per tipe berkas
│   ├── booking/             wizard, komponen, hook, skema
│   ├── payment/             snap client, signature, idempotensi, state
│   ├── slots/               engine, hold, expire, konflik
│   ├── notifications/       provider, template, queue, humanizer
│   └── admin/               kasir, kalender, laporan, auth
├── lib/
│   ├── db/                  server.ts | browser.ts (terpisah)
│   ├── auth/                guard, session, role
│   ├── security/            rate-limit (persisten), price-guard, bot
│   └── time/                Asia/Jakarta saja
└── types/                   database.types.ts hasil generate
```

Aturan dependensi (**enforced lint**): `features/*` boleh impor `lib/*`; `lib/*` tidak boleh impor `features/*`; tidak ada `app/api/*` yang menulis query langsung — semua lewat `features/*/queries`.

---

## 6. Model Data

Pertahankan inti v1, perbaiki yang terbukti kurang.

| Entitas | Catatan v2 |
|---|---|
| `services` | id, nama, slug, durasi_menit, harga, aktif, urutan |
| `barbers` | id, nama, foto_url, spesialisasi, aktif, kursi (1–3) |
| `working_hours` | barber_id, dow, jam_mulai, jam_selesai, istirahat_mulai, istirahat_selesai (staggered) |
| `blocked_slots` | barber_id, rentang, alasan, dibuat_oleh |
| `customers` | id, nama, nomor_wa (E.164), email nullable. **Tanpa** data lain |
| `bookings` | id, kode, customer_id, barber_id, `start_time`/`end_time`, `booking_range` generated, status, total_harga, nominal_dp, expired_at, `created_at` |
| `booking_services` | booking_id, service_id, harga_saat_booking, durasi_saat_booking |
| `payments` | id, booking_id, provider, ref, jumlah, status, metode, paid_at, **`idempotency_key` UNIQUE** |
| `notifications` | **BARU** — booking_id, jenis, provider, status, attempt, last_error, sent_at. Menggantikan fire-and-forget + retry di memori |
| `settings` | key/value untuk aturan DP, batas batal, jam buka |
| `audit_log` | **BARU** — aktor, aksi, entitas, sebelum/sesudah, waktu. Wajib untuk mutasi status booking & kas |
| `testimonials` / `gallery` / `faqs` | konten profile |

Constraint wajib (jangan dilepas):

```sql
CONSTRAINT no_overlapping_active_bookings EXCLUDE USING gist (
  barber_id WITH =,
  booking_range WITH &&
) WHERE (status IN ('pending_payment','confirmed'));
```

Aturan: `harga_saat_booking` dan `durasi_saat_booking` disalin saat booking — perubahan harga tidak boleh mengubah riwayat.

---

## 7. Alur Booking

```
pilih layanan → pilih barber → pilih tanggal/jam
   → POST /api/booking/hold      (slot terkunci 15 menit, status pending_payment)
   → isi kontak
   → tinjau ringkasan + setujui kebijakan
   → POST /api/booking/checkout  (Snap token, nominal DP dari server, bukan dari client)
   → Midtrans webhook (SHA-512, idempoten)
   → status confirmed + enqueue notifikasi WA
   → tiket /booking/success/[kode]
```

Aturan tetap:
- Konfirmasi **hanya** dari webhook tervalidasi. Redirect browser tidak pernah mengubah status.
- Nominal DP dihitung server. Client tidak boleh mengirim harga.
- Hold yang sudah ada tidak memperpanjang TTL saat checkout diulang (idempoten).
- Satu kode booking = satu baris; webhook duplikat tidak membuat baris kedua.

---

## 8. Keamanan — Kontrol Wajib

Perbaikan langsung dari §2.1. Semua butir ini **blocking** untuk rilis.

1. **Auth server-side.** `middleware.ts` memeriksa sesi Supabase dan mengalihkan `/(admin)/*` ke `/login` sebelum render. Guard client hanya untuk UX, bukan keamanan.
2. **Tidak ada demo fallback.** Hapus `DEMO_ADMIN_USERS`, hapus tombol quick login berpassword literal. Seed user admin lewat script CLI saat setup, password dari env.
3. **Setiap route `/api/admin/*` memanggil satu helper `requireAdmin(request)`** yang memvalidasi sesi dari cookie dan mengecek role. Tidak ada pengecualian. Test: tanpa cookie → 401; role salah → 403.
4. **RLS aktif dan diuji.** Tabel `bookings`, `payments`, `customers`, `audit_log`, `settings` hanya bisa dibaca peran terautentikasi. Service role **hanya** dipakai di `lib/db/server.ts` (dengan `import 'server-only'`). Test negatif: anon key tidak bisa `select` tabel-tabel itu.
5. **Client browser tidak pernah menyentuh service role.** `lib/db/browser.ts` hanya memakai anon key. Tambahkan lint rule yang menolak impor `lib/db/server.ts` dari berkas `'use client'`.
6. **Rate limit persisten** (tabel Postgres atau Redis/Upstash), bukan `Map` in-memory. Batas pada `/api/booking/hold`, `/api/booking/checkout`, `/api/webhooks/*`, `/api/notifications/*`.
7. **Price guard** di server: harga dihitung ulang dari `services` + `booking_services`, bukan dari payload.
8. **Webhook**: signature SHA-512 + `timingSafeEqual`, tolak bila `order_id` tidak dikenal, idempoten lewat `idempotency_key` UNIQUE.
9. **Validasi boundary** dengan satu library skema (Zod) untuk semua route handler — body, query, dan header.
10. **Privasi (UU PDP)**: simpan nama + nomor WA saja, kebijakan privasi tampil sebelum form kontak, log tidak menulis nomor WA penuh.
11. **Admin pakai role** (`owner` | `cashier` | `barber`) — kasir tidak boleh mengubah harga layanan; barber hanya melihat jadwal sendiri.

---

## 9. Testing & Quality Gate

Ganti harness v1 sepenuhnya.

| Lapis | Alat | Cakupan |
|---|---|---|
| Unit | Vitest | slot engine, staggered break, timezone, kalkulasi harga/DP, humanizer template |
| Integrasi | Vitest + Postgres nyata (Supabase lokal) | constraint GiST, hold/expire, webhook idempoten, RLS positif & negatif, rate limit |
| Konkurensi | Vitest + 50 request paralel ke DB nyata | 0 double booking, tidak ada kebocoran koneksi |
| E2E | Playwright (mobile viewport 390×844 + tablet 1024) | booking < 2 menit, pembayaran mock, tiket muncul, admin login → ubah status → ekspor CSV |
| A11y | axe-core di Playwright | 0 violation critical/serious, kontras AA, touch target ≥ 44px |

Gate yang harus lulus di CI:

- Coverage ≥ 80% baris pada `lib/` dan `features/*/queries`.
- 0 error `tsc --noEmit` (strict).
- 0 error lint, termasuk aturan dependensi §5.
- E2E hijau di CI (bukan skrip yang mencetak "PASS").
- Build produksi bersih.
- **Tidak boleh ada test yang lulus tanpa assertion.** Test yang hanya mencetak pesan dihapus.

Aturan: kalau sebuah perilaku tidak punya test yang gagal saat perilakunya dirusak, perilaku itu belum selesai.

---

## 10. Performa & Budget

| Metrik | Target |
|---|---|
| LCP mobile (4G, mid-range) | < 2,5 detik |
| CLS | < 0,05 |
| INP | < 200 ms |
| Respons `/api/slots/available` (p95) | < 150 ms |
| Waktu booking end-to-end di HP | < 2 menit |
| Kirim notifikasi WA (p95) | < 5 detik |
| Berkas sumber maksimum | 800 baris, target 400 |

---

## 11. Milestone

Setiap milestone punya gate: tidak boleh lanjut kalau gate belum hijau.

| M | Isi | Gate |
|---|---|---|
| **R0 — Fondasi** | Repo baru, Next 16 + TS strict, Tailwind v4 token tunggal, Vitest + Playwright, CI 6 tahap, Supabase lokal, skema + constraint GiST, seed data | `npm run verify` jalan lokal & di CI; migrasi naik dari nol di DB kosong |
| **R1 — Auth & RLS** | Supabase Auth cookie-based, `middleware.ts`, `requireAdmin()`, RLS + test negatif, hilangkan demo creds | Test membuktikan `/api/admin/*` → 401 tanpa sesi dan anon key tidak bisa baca tabel sensitif |
| **R2 — Public & Booking Core** | Landing (SEO LocalBusiness), wizard tanpa pembayaran, slot engine + staggered break, hold 15 menit, worker expire | Booking internal end-to-end; 2 pelanggan tidak bisa ambil slot sama (test DB nyata) |
| **R3 — Pembayaran DP** | Snap checkout, webhook SHA-512 idempoten, tiket, notifikasi WA + queue retry | Alur DP penuh dengan `MOCK_MIDTRANS=true`; replay webhook tidak menghasilkan data ganda |
| **R4 — Dashboard Kasir** | Matriks 3 kursi, walk-in < 15 detik, potong DP, no-show 15 menit, tutup kas, CSV, telemetri | SOP kasir dieksekusi penuh di Playwright; CSV cocok dengan total di layar |
| **R5 — Hardening & Peluncuran** | Rate limit persisten, bot protection, audit aksesibilitas, uji beban, runbook + backup/DR, latihan kasir | Semua gate §9 hijau, 0 temuan kritis, owner & kasir bisa pakai tanpa pendampingan |
| **R6 — Iterasi** | Ukur no-show & konversi, perbaikan | Laporan sebelum/sesudah vs baseline v1 |

---

## 12. Migrasi & Cutover

v1 belum pernah tayang produksi (Live Production URL kosong di README) → **[ASUMSI]** tidak perlu migrasi data pelanggan.

- Bangun v2 di repo baru, bukan branch dari v1.
- Ambil alih: `content/*` (copy, FAQ, 8 template WhatsApp), dokumen ADR-001..003, aturan bisnis §3, dan constraint DB §6.
- **Jangan** ambil alih: `lib/*`, `components/*`, `tests/*`, `docs/*` hasil generasi multi-agent, `KANBAN.md`, `preview-enhanced.html`.
- Domain/SSL/Vercel: konfigurasi ulang dari `docs/DEPLOYMENT.md` v1 sebagai acuan.
- Arsipkan repo v1 dengan tag `v1-archive`, jangan dihapus.

---

## 13. Definition of Done (v2 MVP)

- [ ] Customer bisa menyelesaikan booking + DP dari HP tanpa membuat akun, < 2 menit.
- [ ] Dua pelanggan tidak bisa memesan slot yang sama — dibuktikan test konkurensi di Postgres nyata.
- [ ] Booking tak dibayar kedaluwarsa dan slot kembali tersedia, dibuktikan test waktu.
- [ ] Webhook terverifikasi, idempoten, dan replay tidak menduplikasi data.
- [ ] **Setiap route `/api/admin/*` menolak permintaan tanpa sesi server-side (401) dan role salah (403).**
- [ ] RLS teruji: anon key tidak bisa membaca tabel sensitif.
- [ ] Tidak ada kredensial, password, atau sesi demo di dalam bundle.
- [ ] Owner bisa lihat jadwal, ubah status, dan ekspor rekap kas; aksi tercatat di `audit_log`.
- [ ] Coverage `lib/` ≥ 80%, seluruh gate §9 hijau di CI.
- [ ] Lighthouse mobile: LCP < 2,5s, CLS < 0,05; axe-core 0 violation critical/serious.
- [ ] Tidak ada berkas sumber > 800 baris tanpa alasan tertulis.
- [ ] Kebijakan DP/pembatalan & kebijakan privasi tampil jelas sebelum pembayaran.
- [ ] Backup harian + alert kegagalan aktif; runbook DR diuji sekali.
- [ ] Kasir dan owner sudah dilatih dengan SOP tertulis.

---

## 14. Keputusan Terbuka

| # | Pertanyaan | Default kalau tidak dijawab **[ASUMSI]** |
|---|---|---|
| 1 | Repo baru atau rewrite di repo yang sama? | Repo baru (`damez-barbershop-v2`), v1 diarsipkan |
| 2 | Stack tetap Next.js 16 + Supabase + Midtrans + Vercel? | Ya, tetap |
| 3 | Ganti WhatsApp gateway ke provider resmi (WABA) atau tetap Fonnte/Wablas? | Tetap Fonnte/Wablas + fallback Wablas |
| 4 | Kasir perlu login akun sendiri (role `cashier`) atau satu akun owner? | Ya, tiga role seperti §8.11 |
| 5 | Nominal DP tetap Rp 20.000? | Ya, tetap |
| 6 | Bahasa antarmuka: Indonesia saja atau dwibahasa? | Indonesia saja dulu |
| 7 | Dashboard kasir tablet: PWA offline-tolerant atau web biasa? | Web biasa dulu, PWA di fase 2 |

---

*Versi 0.1 — disusun dari audit kode v1. Menunggu konfirmasi Firas atas §14 dan §5 [ASUMSI].*

---

## 15. Keputusan Dikunci — 2026-10-30

Dikonfirmasi Firas sebelum eksekusi. Bagian ini menutup §14 dan menambah satu keputusan yang tidak tercakup di sana.

### 15.1 §14 — semua default [ASUMSI] berlaku

| # | Keputusan |
|---|---|
| 1 | Repo baru `damez-barbershop-v2`; v1 diarsipkan dengan tag `v1-archive` |
| 2 | Stack tetap: Next.js 16 App Router + Supabase + Midtrans + Vercel |
| 3 | Gateway WhatsApp tetap Fonnte/Wablas + fallback Wablas |
| 4 | Tiga role: `owner` \| `cashier` \| `barber` |
| 5 | DP flat Rp 20.000 |
| 6 | Bahasa antarmuka: Indonesia saja |
| 7 | Dashboard kasir: web biasa (PWA ditunda ke fase 2) |

### 15.2 Keputusan baru — harness DB untuk test

**Postgres 16 native (apt) di VPS ini + service container `postgres:16` di GitHub Actions.**

Alasan: VPS tanpa Docker (Supabase CLI `supabase start` butuh Docker + ~2 GB RAM yang tidak tersedia). Konsekuensi yang diterima: GoTrue/Supabase Auth tidak berjalan lokal, sehingga test auth R1 memakai Supabase Auth yang di-stub pada boundary + verifikasi sesungguhnya di CI/preview. Test DB, RLS, dan konkurensi tetap berjalan di Postgres nyata — `pg-mem` dilarang.

### 15.3 Keputusan agen (bisa dibatalkan Firas)

1. Nama kolom/tabel Inggris `snake_case`, bukan label Indonesia literal di §6. Pemetaan: `nama`→`full_name`, `nomor_wa`→`phone_e164`, `kode`→`booking_code`, `harga`→`price_idr`, `durasi_menit`→`duration_minutes`, `aktif`→`is_active`, `urutan`→`display_order`, `total_harga`→`total_idr`, `nominal_dp`→`dp_idr`, `expired_at`→`hold_expires_at`.
2. Satu set ikon: `lucide-react` (Tabler dibuang).
3. Token warna tema gelap tunggal: `--color-ink #0B0B0C`, `--color-surface #141417`, `--color-surface-2 #1D1D21`, `--color-brass #C8A24A`, `--color-text #F5F1E8`, `--color-muted #9A958C`, `--color-danger #D9534F`, `--color-ok #4E9F6A` — belum ada brand kit dari owner.
4. Constraint GiST memakai tiga status aktif: `pending_payment`, `confirmed`, `in_progress` (v1 juga memakai `in_progress`; §6 menulis hanya dua).

### 15.4 Rencana implementasi

Plan R0 (fondasi) ada di `docs/superpowers/plans/2026-10-30-damez-v2-r0-foundation.md`. Milestone R1–R5 masing-masing mendapat plan sendiri setelah gate milestone sebelumnya hijau (§11).

### 15.1 Project Supabase (dibuat 2026-10-30)

| Item | Nilai |
|---|---|
| Project | `damez-barbershop` |
| Ref | `jhsoxrojsgdgmchxglit` |
| Region | `ap-southeast-1` (Singapore) |
| Biaya | $0/bulan (free tier) — dikutip lewat `get_cost` sebelum dibuat |
| Auth | GoTrue aktif; diverifikasi dari mesin lokal: `/auth/v1/health` → 200, token palsu → 403 `bad_jwt` |
| Status skema aplikasi | **belum diterapkan** — `npm run migrate` dengan connection string Supabase dijalankan setelah owner mengisi `.env` |

Kunci `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` sudah ada di `.env` lokal
(tidak di-commit; `.env` diabaikan git). `SUPABASE_SERVICE_ROLE_KEY` dan connection string DB
diisi owner langsung di `.env` — tidak pernah lewat chat.

---

## 16. Keputusan Dikunci (lanjutan 2026-10-30)

1. **Tidak ada hosting.** Proyek ini hanya hidup di repo GitHub (`firasezraa/damez-barbershop`,
   branch `dev`). Tidak ada Vercel, tidak ada URL publik, tidak ada deployment otomatis.
2. **Merge `dev` → `main` dilakukan pemilik**, bukan agen. Riwayat branch tidak ditulis ulang
   dan tidak ada `git push --force`.
3. **Lingkungan Snap dari env eksplisit** `MIDTRANS_IS_PRODUCTION`, bukan `NODE_ENV`. Pasangan
   kunci/lingkungan yang tidak cocok ditolak saat env dibaca (503 sebelum pelanggan menekan
   tombol bayar), bukan 401 dari Midtrans.
4. **Autentikasi admin tetap di Supabase hosted**; data operasional tetap Postgres. E2E kasir
   memakai akun nyata lewat GitHub Actions secrets, bukan tiruan.
