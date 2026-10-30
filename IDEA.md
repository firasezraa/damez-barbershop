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


---

## 17. Redesign — arah, sistem visual, dan spesifikasi permukaan (2026-10-30)

Menutup permintaan redesign. Bagian ini **spesifikasi, bukan kode**: implementasinya milestone R6,
dijalankan setelah Firas menyetujui dokumen ini.

### 17.1 Keputusan pemilik yang mengikat

| # | Keputusan | Konsekuensi |
|---|---|---|
| 1 | Ruang lingkup: **semua permukaan** — beranda, wizard booking, halaman tiket, login admin, dasbor kasir | satu sistem, lima permukaan; tidak ada halaman yang "menyusul nanti" |
| 2 | **Token gelap + brass dipertahankan** | palet lama jadi batas, bukan bahan perombakan; yang diganti komposisi, tipografi, dan bahasa keadaan |
| 3 | **Belum ada aset** (logo, foto barber, foto gerai) | kekuatan pada tipografi, warna, komposisi; materi visual dibuat sendiri dan ditandai sintetis sampai foto asli ada |
| 4 | Penyerahan: **spec dulu**, kode setelah disetujui | implementasi dipisah ke R6 |
| 5 | Komposisi terpilih: **kartu 1 — meja kerja & gulungan alat** | grid berlubang jam × kursi jadi pembuka, dan bahasanya turun ke empat permukaan lain |

Aturan lama yang tetap berlaku tanpa perubahan: tanpa emoji, bahasa Indonesia, DP Rp 20.000,
hold 15 menit, toleransi 15 menit, batal H-3 jam, zona waktu Asia/Jakarta (§3), dan seluruh
kontrol keamanan §8.

### 17.2 Bagaimana arah ini dipilih (jejak keputusan)

Dijalankan lewat alur redesign: fakta produk dikunci di `PRODUCT.md`, tujuh struktur grounded
disusun, lalu undian membagikan tiga di antaranya ke meja. Undian: `seed:c8462c0e1d575567`,
indeks **6, 7, 2** (indeks 6 memimpin). Tiga kartu dirender 1440×900, diperiksa dengan mata pada
PNG hasil render, dan diperbaiki dalam dua putaran sebelum disodorkan.

Yang diajukan, dalam urutan peringkat saya: (1) kursi hari ini sebagai pembuka, (2) papan harga
gerai, (3) buku janji, (4) tiga lempeng kuningan, (5) struk panjang, **(6) meja kerja & gulungan
alat**, (7) tiket antrian. Undian membagikan 6, 7, dan 2.

Vonis penantang katalog, diputuskan sebelum meminjam apa pun:

| Penantang | Vonis | Yang dipakai / sebab ditolak |
|---|---|---|
| jacquard punch-card | kompetitif | **naik**: baris instruksi berlubang yang membentuk pola → grid berlubang jam × kursi |
| brodovitch spread | kompetitif | **naik**: jurang sebagai jahitan pose–jawaban → dipakai di papan harga (R6 lanjutan) |
| daylight section | kompetitif | **naik**: skala jam posisi sekarang → kepala papan |
| algorave floor | ditolak | tanpa panggung dan audio; satu disiplin tetap diambil: keadaan menunggu terlihat sebelum mengikat → dipetakan ke hold 15 menit dan `pending_payment` |
| fight poster | ditolak | arena bukan dunia gerai ini; disiplin yang diambil: baris mengecil menurut kedekatan waktu |
| seven-segment / skor papan | ditolak | membutuhkan LED dan konteks malam; tidak ada di gerai ini |
| VU meter bridge | ditolak | butuh sinyal audio sebagai bahan; tidak ada |

Catatan kejujuran: kartu yang dipilih adalah **kartu pimpinan undian**, bukan pilihan kedua
terbaik. Itu memang yang saya susun sebagai struktur peringkat 6.

### 17.3 Arah: grid berlubang

**Tesis.** Satu layar menampilkan seluruh hari gerai seperti apa adanya — jam × kursi × layanan —
dan susunannya menolak pola hero judul-lalu-tombol dengan deretan kartu seragam di bawahnya.

**Pembuka (viewport pertama, 1440×900 dan 390×844).**
- Kiri 392 px: plat gerai (nama, tiga kursi, satu gerai), aturan bisnis dalam baris mono, satu
  tombol brass "Kunci kursi saya" berisi DP di sisi kanan.
- Kanan: kepala papan (tanggal WIB, jam sekarang, jumlah slot terjadwal), tiga plat nama barber
  sebagai kepala kolom, lalu grid jam × kursi. Baris jam 40 px, tiap baris punya tiga sel.
- Bawah: gulungan delapan layanan — nama, durasi, kategori, harga; tiga penanda "paling sering".

**Bahasa keadaan (inti sistem ini).** Setiap sel membawa satu dari keadaan berikut, dan
**tidak pernah hanya lewat warna**:

| Keadaan | Bentuk | Warna/teks |
|---|---|---|
| terjadwal | bidang arsir 135°, garis atas solid | `#2A2416`/`#1D1A10`, teks `#B79546` |
| bebas | kotak garis putus 1 px | garis `#3D3D46`, teks `#ABA69C` |
| istirahat | kotak garis putus, teks huruf besar | garis `#4A3F22`, teks `#C2A25C` |
| pilihan Anda | bingkai solid 1 px + latar brass 8% | `#C8A24A` |
| menahan (hold) | bidang arsip + garis putus berjalan (dash animation) + sisa waktu mono | brass |
| selesai | bidang arsir penuh tanpa teks kode, hanya jam | teks `#8B8781` |
| tidak hadir | bingkai solid `#D9534F` + label teks "TIDAK HADIR" | danger |
| dibatalkan | bekas arsir redup + label "DIBATALKAN" | muted |

**Interaksi tanda tangan.** Memilih satu sel bebas: sel itu berubah dari garis putus menjadi
bingkai brass, waktu selesai muncul di dalamnya, dan tombol di kolom kiri berganti teks dari
"Kunci kursi saya" menjadi "Kunci 14:00 di kursi 03" — satu gerakan 180 ms, tanpa perpindahan
tata letak. Setelah hold dibuat, sel menampilkan hitung mundur 15 menit. Ini pemetaan langsung
dari permintaan pelanggan: "kursi mana, jam berapa, berapa lama".

**Risiko jujur.** Grid padat berarti di layar besar ruang harus dijaga disiplin; kalau jarak
dilonggarkan sembarangan, bagian bawah (gulungan layanan) akan tenggelam dan halaman terbaca
seperti tabel, bukan seperti papan gerai.

### 17.4 Sistem warna (rasio kontras diukur, bukan dikira)

Token tetap dari §15.3, ditambah empat token baru. Angka di bawah hasil perhitungan rumus WCAG
terhadap `#0B0B0C` (kecuali dicatat lain):

| Token | Nilai | Rasio | Pakai untuk |
|---|---|---|---|
| `--color-ink` | `#0B0B0C` | — | dinding halaman |
| `--color-surface` | `#141417` | — | plat, kartu, panel |
| `--color-surface-2` | `#1D1D21` | — | lapis kedua, kepala papan |
| `--color-brass` | `#C8A24A` | 8,17 | bidang aksi, bingkai pilihan, angka penting |
| `--color-text` | `#F5F1E8` | 17,45 | teks utama; juga *kertas* tiket (lawan teks `#15151A`, 16,3) |
| `--color-muted` | `#9A958C` | 6,61 | label, keterangan |
| `--color-danger` | `#D9534F` | 4,97 | tidak hadir, galat |
| `--color-ok` | `#4E9F6A` | 6,08 | terkirim, lunas |
| `--color-brass-deep` **(baru)** | `#C2A25C` | 8,07 | keadaan istirahat dan pasif — menggantikan `#7A6A3F` yang **gagal** AA (3,71) |
| `--color-ghost` **(baru)** | `#ABA69C` | 8,12 | sel bebas, teks nonaktif |
| `--color-punched` **(baru)** | `#B79546` | 7,3 | teks kode di dalam bidang arsir |
| `--color-paper` **(baru)** | `#F5F1E8` | 16,3 vs `#15151A` | dasar tiket cetak |

Temuan yang harus diperbaiki saat implementasi: sketsa keputusan memakai `#7A6A3F` untuk teks
ISTIRAHAT dan `#8B8781` untuk sel bebas; keduanya di bawah ambang untuk teks kecil. Ganti ke
`#C2A25C` dan `#ABA69C`. Brass **tidak** dipakai sebagai glow atau bayangan berwarna di mana pun —
kedalaman datang dari bidang, arsir, dan garis.

### 17.5 Tipografi

| Peran | Huruf | Ukuran | Catatan |
|---|---|---|---|
| Papan & plat (display) | **Archivo** (variable, sumbu lebar 62–125) | 52 px / 800 / `wdth 112` | huruf papan toko; satu keluarga melayani display dan teks, jadi beban unduhan kecil |
| Judul bagian | Archivo | 31 px / 700 / `wdth 104` | |
| Teks isi | Archivo | 16,5 px / 400 | `line-height` 1,52 |
| Label & keterangan | Archivo | 13 px / 500 | huruf besar 0,18em untuk label papan |
| Data: jam, kode, harga, durasi | **Spline Sans Mono** | 11–15 px / 400–600 | angka tidak pernah proporsional; kolom harga rata kanan sehingga bisa dibandingkan |
| Angka besar (nomor antrean, rekap) | Spline Sans Mono | 120 px / 600 | hanya di panel Operate |

Mengganti `Plus Jakarta Sans` + `Inter` dari §15.3. Alasan: keduanya huruf antarmuka generik
tanpa karakter papan/plat, dan keduanya adalah pilihan default yang muncul di mana-mana; Archivo
punya sumbu lebar yang membuat huruf bisa "membentang" seperti huruf papan tanpa membeli keluarga
kedua. Angka wajib mono karena kolom harga dan jam harus bisa dibandingkan secara vertikal.

### 17.6 Ruang, sudut, garis

- Satuan dasar 4 px; jarak antar blok 16 / 20 / 24 / 32 / 48.
- Sudut: 3 px untuk tombol dan plat, 2 px untuk sel grid. Tidak ada sudut membulat besar.
- Garis: 1 px `#26262B` sebagai pemisah struktur, 1 px `#232329` untuk baris grid, 1 px putus
  untuk keadaan bebas. Tidak ada bayangan berwarna; bayangan hanya untuk mengangkat panel (satu
  tingkat, hitam 40%).
- Ikon: `lucide-react`, ukuran 20 px, ketebalan 1,5. Ikon tidak pernah menggantikan label teks.

### 17.7 Spesifikasi per permukaan

**17.7.1 Beranda `/` (Persuade).** Struktur: plat gerai + aturan + aksi (kolom kiri 392 px);
papan hari (kepala, plat barber, grid jam × kursi, legenda); gulungan delapan layanan; blok
"cara kerja" tiga langkah (pilih → kunci dengan DP → datang, toleransi 15 menit); FAQ dari
`content/faq-and-microcopy.md`; kaki dengan jam buka, alamat, kontak WhatsApp, dan kebijakan
privasi. Yang **dihapus**: hero foto besar, kartu layanan seragam, testimoni karangan, badge
"terbaik di Jakarta".

**17.7.2 Wizard booking `/booking` (Persuade→Operate).** Empat langkah tetap, tetapi diringkas
jadi satu layar per langkah dengan kemajuan mono `01/04 … 04/04`. Langkah 3 memakai grid yang sama
dengan beranda, bukan pemilih waktu terpisah. Ringkasan langkah 4 memakai bentuk struk: layanan
per baris, subtotal, DP, sisa di kasir. Aturan hold terlihat sebagai hitung mundur, bukan pesan
samping.

**17.7.3 Tiket `/booking/success/[kode]` (Read).** Satu kartu kertas `#F5F1E8` di atas ink:
kode booking, kursi, barber, jam WIB, daftar layanan, DP, sisa, dan aturan toleransi dalam
kalimat. Keadaan pembayaran memakai bahasa §17.3. Tombol aksi tunggal: "Tunjukkan kode di kasir".
Struk tidak memakai foto atau ilustrasi.

**17.7.4 Masuk admin `/admin/login` (Operate).** Panel tengah 420 px, bidang `#141417`, judul
Archivo, dua medan, satu tombol brass, dan kotak galat yang menyebut sebabnya
(`credentials` / `config` / `rate` / `session` — lihat perilaku yang sudah jalan di §16.3).
Tidak ada kredensial contoh, tidak ada ilustrasi.

**17.7.5 Dasbor kasir `/admin/dashboard` (Operate).** Tiga kolom kursi dengan kepala plat nama,
daftar booking hari ini di dalam kolomnya (bukan tabel terpisah), tombol aksi besar ≥ 48 px:
Mulai, Selesai, Tidak hadir, Lunas tunai, Lunas QRIS. Rekap hari sebagai strip angka mono di
atas, form walk-in di bawah kolom kursi. Kunci desain: keadaan sel yang sama dengan beranda
sehingga kasir dan pelanggan melihat bahasa yang sama. Tautan unduh CSV hanya untuk owner.

### 17.8 Gerak

Satu gerakan tanda tangan saja: sel terisi saat dipilih (180 ms, `ease-out`), lalu hitung mundur
hold menggantikannya. Transisi keadaan lain (mulai → selesai → lunas) memakai durasi 140 ms tanpa
perpindahan tata letak. `prefers-reduced-motion: reduce` menghapus animasi dan menyisakan
perubahan warna/bingkai instan. Tidak ada parallax, tidak ada kursor kustom, tidak ada animasi
masuk per elemen.

### 17.9 Aksesibilitas (target AA, diuji bukan diklaim)

- Kontras: seluruh kombinasi teks di §17.4 lulus 4,5:1; `#7A6A3F` dan `#8B8781` dilarang untuk
  teks kecil dan diganti.
- Target sentuh ≥ 44×44 px, tombol kasir ≥ 48 px.
- Fokus: `outline: 2px solid var(--color-brass)` dengan `outline-offset: 2px`; urutan fokus
  mengikuti urutan visual; tidak ada `outline: none`.
- Grid kursi dapat dioperasikan keyboard: satu `tabindex` per sel, Enter/Space memilih.
- Keadaan tidak pernah hanya warna: selalu ada teks atau bentuk (lihat tabel §17.3).
- Teks alternatif untuk SVG ikon; `aria-live="polite"` untuk pengumuman hold dan sisa waktu.
- Uji: `@axe-core/playwright` 0 pelanggaran critical/serious; satu test unit kontras yang membaca
  token dari `globals.css` dan menghitung rasio — jadi palet yang gagal tampil sebagai test gagal.

### 17.10 Performa & materi

- Tanpa raster di build pertama: seluruh materi dari tipografi, warna, dan CSS. Foto barber/gerai
  masuk hanya bila owner memberi berkas asli; setiap raster yang dikirim wajib membawa asal
  (provenance).
- Dua keluarga huruf, empat berkas maksimum (Archivo variable + Spline Sans Mono 400/600),
  `font-display: swap`, subset latin.
- Target: LCP < 2,5 s (4G, mid-range), CLS < 0,05, INP < 200 ms.
- Tidak ada ikon atau ilustrasi pihak ketiga yang diunduh saat runtime.

### 17.11 Konten & nada

Nama layanan tetap Inggris (katalog v1), semua label antarmuka Indonesia, sapaan "Anda", tanpa
emoji. Angka yang tampil wajib berasal dari data nyata (harga katalog, jam operasional) — tidak
ada klaim, testimoni, atau angka karangan. Materi yang dibuat sendiri dan bisa disalahartikan
sebagai dokumentasi nyata diberi tanda.

### 17.12 Rencana implementasi R6 dan kriteria terima

Urutan yang saya usulkan (satu commit per langkah, seperti R0–R5):

1. **R6.1 Sistem**: token baru di `globals.css`, huruf Archivo + Spline Sans Mono, komponen dasar
   (plat, tombol, sel grid, label mono), test kontras yang membaca token.
2. **R6.2 Beranda**: grid berlubang + gulungan layanan, data nyata dari `listChairMatrix` dan
   katalog; a11y + performa dinilai.
3. **R6.3 Wizard + tiket**: langkah diringkas, grid yang sama, ringkasan bentuk struk, hitung
   mundur hold.
4. **R6.4 Login + dasbor kasir**: bahasa keadaan yang sama, tombol ≥ 48 px, keyboard penuh.
5. **R6.5 Verifikasi**: axe 0 critical/serious, screenshot 390 dan 1440 diperiksa, detector
   desain dijalankan sekali, `DESIGN.md` + `.impeccable/design.json` ditulis dari hasil build.

Kriteria terima: seluruh permukaan memakai satu bahasa keadaan; tidak ada teks di bawah 4,5:1;
target sentuh terpenuhi; tidak ada raster tanpa provenance; suite hijau; dan `DESIGN.md` ada.

### 17.13 Yang belum tertutup

- Logo, foto barber, foto gerai: belum ada. Sampai dikirim, materi dibuat sendiri dan ditandai.
- Sejarah gerai ("sejak 2019") belum diverifikasi owner — jangan dipakai sampai dikonfirmasi.
- Nama layanan Inggris di antarmuka Indonesia: keputusan sementara, menunggu pendapat owner.
- `DESIGN.md` baru ditulis di akhir R6, dari hasil build, bukan dari dokumen ini.

### 17.14 Aturan yang lahir dari pemeriksaan mekanis

Sketsa keputusan diperiksa dengan detektor desain (`impeccable detect`) sebelum disetujui. 33
temuan awal, 31 diperbaiki; dua yang tersisa adalah keputusan sadar dan dicatat di sini. Aturan
berikut masuk ke sistem, bukan hanya ke sketsa:

1. **Tidak ada label kecil berhuruf jarang di atas judul.** Informasi seperti "Barber & Grooming ·
   Jakarta Selatan" pindah ke baris aturan, bukan menggantung di atas wordmark.
2. **Ukuran huruf minimum.** Teks fungsional (kode booking, label sel, keterangan) tidak pernah di
   bawah 12 px; teks isi 14 px ke atas; label huruf besar boleh 12 px dengan `letter-spacing`
   0,10–0,14em.
3. **`letter-spacing` pada kalimat maksimum 0,04em.** Huruf jarang hanya untuk huruf besar.
4. **Sel tidak menempel garis.** Tiap sel punya inset 4 px atas–bawah sehingga arsir dan bingkai
   tidak menempel garis baris.
5. **Arsir diagonal hanya menandai keadaan terjadwal**, tidak pernah dipakai sebagai hiasan.
   Detektor menandai pola arsir sebagai dekorasi; di sini fungsinya menyatakan "terisi" dan selalu
   disertai teks, jadi temuan itu **dikecualikan dengan alasan tertulis**. Kalau nanti arsir muncul
   di tempat yang bukan keadaan kursi, aturan ini dilanggar.
6. **Tinggi baris papan eksplisit.** Papan memakai tinggi baris tetap dan tidak boleh meluber dari
   900 px pada 1440×900; verifikasi dilakukan dengan mengukur `getBoundingClientRect` tiap blok,
   bukan dengan mata.
