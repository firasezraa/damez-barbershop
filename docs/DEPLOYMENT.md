# Deployment Runbook, Environment Audit & Disaster Recovery Guide
## Damez Barbershop — Panduan Lengkap Deployment Produksi & Operasi Sistem

> **Dokumen**: Production Deployment Runbook & Infrastructure Audit v1.0  
> **Klasifikasi**: Technical Documentation & Operations Manual  
> **Target Pembaca**: DevOps Engineer, Backend Engineer, System Administrator, dan Lead Tech  
> **Status**: APPROVED FOR PRODUCTION & CLEAN REPOSITORY EXECUTION  
> **Lokasi File**: `docs/DEPLOYMENT.md`  
> **Referensi Kode**: `package.json`, `.env.example`, `supabase/migrations/`, `lib/`, `app/api/`  
> **Kepatuhan Regulasi**: UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP) & Standar Keamanan Bank Indonesia (QRIS MDR)

---

## Daftar Isi
1. [Ringkasan Arsitektur & Topologi Sistem](#1-ringkasan-arsitektur--topologi-sistem)
2. [Panduan Eksekusi dari Repositori Bersih (Clean Repository Setup)](#2-panduan-eksekusi-dari-repositori-bersih-clean-repository-setup)
3. [Audit & Spesifikasi Lengkap Environment Variables](#3-audit--spesifikasi-lengkap-environment-variables)
4. [Panduan Setup Akun Merchant Midtrans (Snap & Webhook)](#4-panduan-setup-akun-merchant-midtrans-snap--webhook)
5. [Panduan Setup WhatsApp Gateway Service (Fonnte & Wablas)](#5-panduan-setup-whatsapp-gateway-service-fonnte--wablas)
6. [Manajemen Database Supabase: Migrasi & Ekstensi](#6-manajemen-database-supabase-migrasi--ekstensi)
7. [Prosedur Pencadangan (Backup) & Pemulihan Bencana (Disaster Recovery)](#7-prosedur-pencadangan-backup--pemulihan-bencana-disaster-recovery)
8. [Konfigurasi Background Workers & Scheduled Jobs (Cron)](#8-konfigurasi-background-workers--scheduled-jobs-cron)
9. [Prosedur Rilis Produksi (Production Launch Checklist)](#9-prosedur-rilis-produksi-production-launch-checklist)

---

## 1. Ringkasan Arsitektur & Topologi Sistem

Sistem reservasi online Damez Barbershop mengadopsi arsitektur modern berbasis micro-service hybrid dengan Next.js 15 App Router sebagai orkestrator utama, Supabase PostgreSQL sebagai state store ACID-compliant, Midtrans Snap sebagai payment gateway, dan Fonnte/Wablas sebagai dispatcher notifikasi WhatsApp ber-SLA tinggi.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                 TOPOLOGI SISTEM                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

       [ Pelanggan Mobile / Desktop ]         [ Tablet Kasir & Admin Gerai ]
                     │                                       │
                     ▼                                       ▼
        ┌────────────────────────────────────────────────────────┐
        │            Next.js 15 Frontend & API Routes            │
        │          (Vercel Edge / Node.js 20+ LTS Runtime)       │
        └───────┬────────────────────────┬───────────────┬───────┘
                │                        │               │
       (Hold & Webhook)          (Queries & RLS)   (Async Event)
                │                        │               │
                ▼                        ▼               ▼
      ┌──────────────────┐     ┌──────────────────┐  ┌──────────────────┐
      │  Midtrans Snap   │     │  Supabase Cloud  │  │ WhatsApp Gateway │
      │  (QRIS Payment)  │     │ (PostgreSQL 15+) │  │ (Fonnte / Wablas)│
      │                  │     │                  │  │                  │
      │ • SNAP Pop-up    │     │ • GiST Exclusion │  │ • Sub-5s SLA     │
      │ • SHA-512 Hook   │     │ • Row-Lock (FOR  │  │ • 0 Emojis       │
      │ • Idempotent ACK │     │   UPDATE)        │  │ • Customer &     │
      └──────────────────┘     │ • Stored Procs   │  │   Barber Alerts  │
                               └──────────────────┘  └──────────────────┘
                                         ▲
                                         │ (Polling 15s / Bearer Cron)
                               ┌──────────────────┐
                               │ Background Jobs  │
                               │ • Expire Sweeper │
                               │ • H-2 & H-30m WA │
                               └──────────────────┘
```

### Komponen Inti & Versi Perangkat Lunak
- **Web Framework**: Next.js v15.2+ (React 19, TypeScript 5.8)
- **Styling**: Tailwind CSS v4 dengan PostCSS
- **Database Engine**: PostgreSQL 15+ / 17 (Supabase Managed Service)
- **Payment Gateway**: Midtrans Snap API (Spesifikasi Snap v1 & Core API)
- **Messaging Gateway**: REST Multi-Gateway Adapter (Fonnte primary, Wablas secondary failover, Mock offline)
- **Task Runner / Cron**: HTTP Bearer Route Handlers & Node.js Native Worker Process

---

## 2. Panduan Eksekusi dari Repositori Bersih (Clean Repository Setup)

Bagian ini memvalidasi *Definition of Done (DoD)*: sistem dapat di-clone dari repository bersih, dipasang dependensinya, dan seluruh test suite lolos 100% tanpa modifikasi manual yang berbelit-belit.

### 2.1 Kebutuhan Awal Lingkungan (Prerequisites)
Pastikan workstation atau server build Anda memiliki perangkat lunak berikut:
- **Node.js**: Versi `20.x` LTS atau lebih tinggi (`node -v` >= 20.18.0)
- **npm**: Versi `10.x` atau lebih baru (`npm -v` >= 10.8.0)
- **Git**: Versi 2.40+
- **OpenSSL / Libcrypto**: Untuk verifikasi kriptografi hash SHA-512

### 2.2 Langkah Instalasi & Uji Mandiri Step-by-Step

```bash
# 1. Clone repositori ke direktori kerja lokal
git clone https://github.com/damezbarbershop/damez-barber.git
cd damez-barber

# 2. Salin template konfigurasi environment variables
cp .env.example .env

# 3. Pasang seluruh dependensi proyek
npm install

# 4. Jalankan type checking statis TypeScript
npm run typecheck

# 5. Jalankan seluruh test suite otomatis (15 test suites komprehensif)
npm test

# 6. Jalankan build produksi lokal untuk verifikasi bundling Next.js
npm run build

# 7. Jalankan server development lokal
npm run dev
```

Buka peramban pada alamat `http://localhost:3000`. Halaman landing publik Damez Barbershop akan tampil responsif dengan katalog layanan, jadwal master barber, dan alur booking multi-step interaktif.

---

## 3. Audit & Spesifikasi Lengkap Environment Variables

File `.env.example` merupakan sumber kebenaran tunggal (*single source of truth*) konfigurasi runtime. Berikut adalah audit detail seluruh variabel lingkungan yang digunakan di codebase.

### 3.1 Matriks Audit Environment Variables

| Nama Variabel | Wajib/Opsional | Nilai Default | Lingkungan | Deskripsi Fungsional & Lokasi Akses |
|---|:---:|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Wajib** | `https://your-project.supabase.co` | Client & Server | URL endpoint REST/Realtime Supabase Cloud. Digunakan oleh `lib/supabase/client.ts`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Wajib** | `your-supabase-anon-key` | Client & Server | Kunci API publik dengan batasan Row Level Security (RLS). Digunakan untuk query publik dan sesi login admin. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Wajib** | `your-supabase-service-role-key` | Server Only | Kunci rahasia master dengan hak akses bypass RLS. Wajib dirahasiakan! Digunakan oleh webhook handler Midtrans dan cron worker. |
| `SUPABASE_URL` | Opsional | Nilai `NEXT_PUBLIC_SUPABASE_URL` | Server Only | Alias fallback URL jika diakses dari container non-Next.js. |
| `MIDTRANS_IS_PRODUCTION` | **Wajib** | `false` | Server Only | Sakelar mode Midtrans (`false` = Sandbox, `true` = Production). Digunakan oleh `lib/payment/midtrans.ts`. |
| `MIDTRANS_SERVER_KEY` | **Wajib** | `SB-Mid-server-xxxx` | Server Only | Kunci server rahasia untuk inisialisasi transaksi Snap dan verifikasi signature SHA-512 pada webhook. |
| `MIDTRANS_CLIENT_KEY` | **Wajib** | `SB-Mid-client-xxxx` | Client & Server | Kunci publik merchant Midtrans untuk memuat widget Snap.js. |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | **Wajib** | `SB-Mid-client-xxxx` | Client Side | Mirror client key untuk injeksi script Snap di browser. |
| `MOCK_MIDTRANS` | Opsional | `false` | Server Only | Jika `true`, transaksi Snap menghasilkan token simulasi lokal tanpa memanggil endpoint Midtrans. |
| `WHATSAPP_GATEWAY_PROVIDER` | **Wajib** | `fonnte` | Server Only | Pemilihan gateway WhatsApp aktif: `fonnte`, `wablas`, atau `mock`. Digunakan oleh `lib/notifications/whatsapp.ts`. |
| `WA_GATEWAY_PROVIDER` | Opsional | `fonnte` | Server Only | Alias kompatibilitas backward untuk `WHATSAPP_GATEWAY_PROVIDER`. |
| `FONNTE_API_TOKEN` | Kondisional | `your-fonnte-api-token` | Server Only | Token otentikasi API Fonnte. Wajib diisi jika provider adalah `fonnte`. |
| `FONNTE_TOKEN` / `WA_GATEWAY_TOKEN` | Opsional | Alias token Fonnte | Server Only | Fallback alias untuk kemudahan integrasi platform PaaS. |
| `FONNTE_API_URL` | Opsional | `https://api.fonnte.com/send` | Server Only | URL endpoint transmisi pesan Fonnte. |
| `WABLAS_TOKEN` | Kondisional | `your-wablas-token` | Server Only | Token otentikasi API Wablas. Wajib diisi jika provider adalah `wablas`. |
| `WABLAS_SECRET_KEY` | Kondisional | `your-wablas-secret-key` | Server Only | Secret key otentikasi paired Wablas v2 API. |
| `WABLAS_API_URL` | Opsional | `https://wablas.com/api/v2/send-message` | Server Only | Endpoint transmisi pesan Wablas API v2. |
| `MOCK_WHATSAPP` | Opsional | `false` | Server Only | Jika `true`, transmisi pesan disimpan di in-memory logger tanpa mengirim HTTP ke provider WA. |
| `WHATSAPP_TIMEOUT_MS` | Opsional | `4500` | Server Only | Batas timeout HTTP request ke gateway WA dalam ms. Melindungi SLA pengiriman < 5 detik. |
| `WHATSAPP_DEFAULT_ADMIN_PHONE` | **Wajib** | `081234567890` | Server Only | Nomor WhatsApp resmi Damez Barbershop untuk komunikasi pelanggan dan pelaporan darurat. |
| `WHATSAPP_DEFAULT_BARBER_PHONE` | **Wajib** | `081234567890` | Server Only | Nomor WhatsApp fallback untuk alert pemesanan barber jika data profil barber kosong. |
| `BARBER_RIAN_PHONE` | **Wajib** | `081234567801` | Server Only | Nomor WhatsApp Master Barber Rian Pratama (Kursi 1) untuk notifikasi booking masuk. |
| `BARBER_FAJAR_PHONE` | **Wajib** | `081234567802` | Server Only | Nomor WhatsApp Master Barber Fajar Ramadhan (Kursi 2) untuk notifikasi booking masuk. |
| `BARBER_BAGAS_PHONE` | **Wajib** | `081234567803` | Server Only | Nomor WhatsApp Master Barber Bagas Setiawan (Kursi 3) untuk notifikasi booking masuk. |
| `NEXT_PUBLIC_SITE_URL` | **Wajib** | `http://localhost:3000` | Client & Server | URL kanonikal publik (contoh: `https://damezbarber.com`). Digunakan untuk metadata SEO dan link konfirmasi WA. |
| `NEXT_PUBLIC_APP_URL` | Opsional | `http://localhost:3000` | Client Side | Alias aplikasi untuk link navigasi internal. |
| `NODE_ENV` | **Wajib** | `development` | System Runtime | Penentu mode runtime Node.js: `development`, `production`, atau `test`. |
| `CRON_SECRET` | **Wajib** | `damez_secret_cron_token_15m` | Server Only | Kunci rahasia Bearer untuk mengamankan route handler `/api/cron/*` dari eksekusi tanpa hak. |
| `EXPIRE_WORKER_INTERVAL_MS` | Opsional | `15000` | Server Only | Interval polling worker auto-expire dalam milidetik (default: 15 detik). |

### 3.2 Pedoman Keamanan Variabel Lingkungan
1. **Pemisahan Kunci Anon vs Service Role**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` aman di-expose ke browser karena diisolasi oleh RLS PostgreSQL. Sebaliknya, `SUPABASE_SERVICE_ROLE_KEY` dan `MIDTRANS_SERVER_KEY` **dilarang keras** diprefiks dengan `NEXT_PUBLIC_` karena memiliki akses tak terbatas ke basis data dan transaksi keuangan.
2. **Perlakuan Rahasia di Platform CI/CD**: Konfigurasikan seluruh kunci rahasia di menu *Environment Variables* Vercel / GitHub Secrets dengan enkripsi level repositori.

---

## 4. Panduan Setup Akun Merchant Midtrans (Snap & Webhook)

Integrasi Midtrans menangani Down Payment (DP) flat Rp 20.000 dengan kanal utama QRIS guna mengoptimalkan margin laba gerai (MDR 0,7% = Rp 140 per transaksi) dan mematuhi regulasi Bank Indonesia.

### 4.1 Pendaftaran & Aktivasi Akun Midtrans
1. Akses portal resmi Midtrans di `https://dashboard.midtrans.com/register`.
2. Lakukan pendaftaran akun bisnis Damez Barbershop dengan identitas legal usaha (KTP Owner, NPWP Badan/Perorangan, dan Rekening Bank Operasional Gerai).
3. Anda akan mendapatkan akses ke dua lingkungan terpisah:
   - **Environment Sandbox**: Untuk pengembangan dan simulasi (`https://dashboard.sandbox.midtrans.com`).
   - **Environment Production**: Untuk transaksi keuangan riil setelah proses verifikasi KYC disetujui.

### 4.2 Pengambilan Kredensial API Keys
1. Masuk ke Dashboard Midtrans (Sandbox / Production).
2. Pilih menu **Settings** > **Access Keys**.
3. Salin nilai berikut dan masukkan ke file `.env`:
   - **Merchant ID**: Simpan sebagai referensi identitas toko.
   - **Client Key**: Masukkan ke `MIDTRANS_CLIENT_KEY` dan `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`.
   - **Server Key**: Masukkan ke `MIDTRANS_SERVER_KEY`.

### 4.3 Konfigurasi Metode Pembayaran (Payment Channels)
Untuk menjaga efisiensi finansial dan mencegah pemotongan biaya flat Virtual Account (Rp 4.000) yang menggerus 20% nilai DP:
1. Masuk ke **Settings** > **Snap Preferences** > **Payment Channels**.
2. **Aktifkan**:
   - `QRIS` (GoPay, OVO, Dana, ShopeePay, LinkAja, dan seluruh aplikasi Mobile Banking berstandar QRIS).
   - `GoPay` dan `ShopeePay` (Direct E-Wallet).
3. **Non-aktifkan**:
   - `Bank Transfer / Virtual Account` (BCA VA, Mandiri VA, BNI VA, BRI VA, Permata VA) — *Kecuali jika manajemen memutuskan mengenakan biaya administrasi perbankan tambahan kepada pelanggan*.
   - `Credit Card / Debit Card Online` (Mencegah resiko dispute kartu dan biaya chargeback).

### 4.4 Konfigurasi Batas Waktu Transaksi (Expiry Duration)
Sistem Damez Barbershop menerapkan *temporary slot locking* selama 15 menit (900 detik). Konfigurasi batas kedaluwarsa Snap wajib diselaraskan agar selaras dengan TTL database:
1. Masuk ke **Settings** > **Snap Preferences** > **System Settings**.
2. Atur **Default Expiry Duration**:
   - Durasi: `15`
   - Satuan Unit: `minute`
3. Simpan perubahan konfigurasi.

### 4.5 Konfigurasi Payment Notification Webhook URL
Webhook berfungsi mengirimkan status pembayaran instan dari Midtrans ke backend Damez Barbershop secara asinkron.
1. Masuk ke **Settings** > **Configuration**.
2. Pada kolom **Payment Notification URL**, isi alamat endpoint produksi:
   ```text
   https://damezbarber.com/api/webhooks/midtrans
   ```
   *(Untuk pengujian lokal, gunakan tunneling HTTPS seperti Cloudflare Tunnel atau Ngrok: `https://<subdomain>.ngrok-free.app/api/webhooks/midtrans`)*.
3. Pada opsi **Notification Repetition (Retry)**, pastikan status diaktifkan (*Enable*). Midtrans akan melakukan percobaan ulang otomatis jika server Anda merespons lambat.
4. Simpan konfigurasi.

### 4.6 Logika Verifikasi Signature Key SHA-512
Backend Damez Barbershop di `lib/payment/midtrans.ts` dan `app/api/webhooks/midtrans/route.ts` memvalidasi signature webhook secara ketat sebelum memproses data:

$$\text{Signature} = \text{SHA512}(\text{order\_id} + \text{status\_code} + \text{gross\_amount} + \text{server\_key})$$

```typescript
// Implementasi verifikasi di lib/payment/midtrans.ts
export function verifyMidtransNotificationSignature(
  notification: MidtransNotificationPayload,
  serverKey: string
): boolean {
  const { order_id, status_code, gross_amount, signature_key } = notification
  if (!order_id || !status_code || !gross_amount || !signature_key || !serverKey) {
    return false
  }

  const rawString = `${order_id}${status_code}${gross_amount}${serverKey}`
  const calculatedHash = crypto.createHash('sha512').update(rawString).digest('hex')
  return calculatedHash.toLowerCase() === signature_key.toLowerCase()
}
```

> **Aturan Idempotensi**: Jika Midtrans mengirimkan notifikasi berulang untuk transaksi yang statusnya telah `confirmed`, server segera merespons `HTTP 200 OK` tanpa mengeksekusi mutasi ulang database atau mengirimkan WhatsApp duplikat.

### 4.7 Pengujian dengan Midtrans Simulator
1. Masuk ke `https://simulator.sandbox.midtrans.com/qris/index`.
2. Salin QR string atau kode bayar dari pop-up checkout Damez Barbershop.
3. Tempelkan ke simulator dan klik tombol **Pay**.
4. Periksa log server lokal: endpoint `/api/webhooks/midtrans` akan menerima HTTP POST dengan status `settlement`, slot reservasi berubah menjadi `confirmed`, dan pesan WhatsApp konfirmasi langsung terkirim dalam waktu < 5 detik.

---

## 5. Panduan Setup WhatsApp Gateway Service (Fonnte & Wablas)

WhatsApp Gateway bertindak sebagai dispatcher tiket reservasi digital pelanggan, peringatan kehadiran (H-2 jam dan H-30 menit), serta alert waktu nyata ke master barber yang bertugas.

### 5.1 Spesifikasi Kepatuhan & SLA Transmisi
- **Target SLA**: Pengiriman pesan berhasil dalam waktu **< 5 detik** setelah webhook pembayaran Midtrans diterima.
- **Standar Humanizer & Etika Brand**:
  - Dilarang menyertakan karakter emoji (0 emoji).
  - Dilarang menggunakan tanda baca em-dash atau en-dash berlebihan.
  - Bahasa lugas, ramah, profesional, dan berwibawa.
- **Kepatuhan Regulasi Privasi**: Mematuhi UU No. 27 Tahun 2022 (UU PDP) dengan menerapkan minimalisasi data (hanya nama dan nomor telepon aktif untuk kebutuhan reservasi langsung).

### 5.2 Opsi Provider: Fonnte (Utama) vs Wablas (Failover)
Sistem mendukung multi-gateway adapter di `lib/notifications/whatsapp.ts`. Konfigurasi default mengarahkan transmisi ke Fonnte, dengan dukungan failover otomatis ke Wablas jika terjadi kendala koneksi.

| Kriteria | Fonnte | Wablas | Mock Gateway |
|---|---|---|---|
| Endpoint URL | `https://api.fonnte.com/send` | `https://wablas.com/api/v2/send-message` | In-Memory Local Array |
| Format Autentikasi | `Authorization: <TOKEN>` | `Authorization: <TOKEN>.<SECRET>` | Tanpa Kunci Luar |
| Latensi Rata-Rata | 800 ms – 2.000 ms | 1.000 ms – 2.500 ms | < 15 ms |
| Penggunaan | Produksi & Staging | Alternatif Cadangan | CI/CD & Unit Testing |

### 5.3 Prosedur Registrasi & Pairing WhatsApp Fonnte
1. Kunjungi portal `https://fonnte.com` dan daftarkan akun baru.
2. Masuk ke menu **Device Manager** dan klik **Tambah Device**.
3. Beri label perangkat, misalnya: `Damez Barbershop Official`.
4. Buka aplikasi WhatsApp pada ponsel resmi gerai (`081234567890`), pilih **Perangkat Tertaut (Linked Devices)**, dan pindai QR Code yang tampil di layar dashboard Fonnte.
5. Setelah status perangkat berubah menjadi **Connected**:
   - Salin **API Token** yang tercantum pada kartu perangkat.
   - Masukkan token ke `.env` pada variabel `FONNTE_API_TOKEN`.
   - Pastikan `WHATSAPP_GATEWAY_PROVIDER=fonnte`.

### 5.4 Konfigurasi Nomor Seluler Master Barber
Notifikasi alert jadwal baru dikirim langsung ke masing-masing master barber agar mereka siap menyambut tamu tanpa perlu terus menatap tablet kasir:
```env
# Nomor HP Master Barber Damez Barbershop
BARBER_RIAN_PHONE=081234567801   # Rian Pratama (Kursi 1)
BARBER_FAJAR_PHONE=081234567802  # Fajar Ramadhan (Kursi 2)
BARBER_BAGAS_PHONE=081234567803  # Bagas Setiawan (Kursi 3)
WHATSAPP_DEFAULT_ADMIN_PHONE=081234567890 # Front Desk Gerai
```

### 5.5 Matriks 8 Template Pesan WhatsApp Resmi
Seluruh template pesan tersimpan pada `content/whatsapp-templates.json` dan terkelola secara modular di `lib/notifications/whatsapp.ts`:

1. `booking_confirmed`: Tiket konfirmasi DP lunas ke pelanggan (disertai kode reservasi, detail barber, dan link Google Maps).
2. `barber_booking_alert`: Notifikasi kilat ke ponsel master barber saat slot jadwalnya dipesan.
3. `arrival_reminder_h2`: Pengingat ramah H-2 jam sebelum jadwal potong rambut dimulai.
4. `arrival_reminder_h30m`: Pengingat mendesak H-30 menit sebelum sesi dimulai dengan peringatan toleransi hadir 15 menit.
5. `booking_rescheduled`: Konfirmasi pemindahan jadwal (diajukan sebelum batas H-3 jam).
6. `booking_cancelled_customer`: Konfirmasi pembatalan pemesanan oleh pelanggan.
7. `booking_no_show_alert`: Pemberitahuan toleransi keterlambatan 15 menit telah habis, status no-show ditetapkan, dan DP dinyatakan hangus.
8. `slot_hold_expired`: Pemberitahuan batas waktu pembayaran DP 15 menit terlewati dan slot kursi dilepas ke publik.

### 5.6 Pengujian Uji Emisi Notifikasi (CLI Verification)
Untuk menguji keandalan dispatcher tanpa menunggu transaksi real:
```bash
# Jalankan pengujian unit test dispatcher notifikasi WhatsApp
node --experimental-strip-types tests/whatsapp-notification.test.ts
```
Output test akan memvalidasi kepatuhan 0 emoji, akurasi timezone Asia/Jakarta (WIB), dan latensi pengiriman di bawah 5.000 ms.

---

## 6. Manajemen Database Supabase: Migrasi & Ekstensi

Damez Barbershop menggunakan arsitektur relasional tangguh yang memanfaatkan kapabilitas tingkat lanjut PostgreSQL: ekstensi range tipe waktu (`TSTZRANGE`) dan indeks penjamin ketiadaan bentrok (*GiST exclusion constraints*).

### 6.1 Prasyarat Ekstensi PostgreSQL
Skema awal memerlukan 3 ekstensi PostgreSQL yang terpasang otomatis pada migrasi pertama:
1. `uuid-ossp`: Untuk membangkitkan identifier unik UUID v4.
2. `pgcrypto`: Untuk fungsi hashing kriptografi dan digest data.
3. `btree_gist`: Ekstensi penting yang memungkinkan operator kesetaraan (`=`) digabungkan dengan operator tumpang tindih rentang waktu (`&&`) dalam satu *Exclusion Constraint*.

### 6.2 Struktur Urutan File Migrasi Database
Seluruh berkas migrasi SQL tersimpan di direktori `supabase/migrations/` dan wajib dieksekusi secara berurutan:

1. **`001_initial_schema.sql`**:
   - Membangun 10 tabel utama: `barbers`, `services`, `working_hours`, `blocked_slots`, `customers`, `bookings`, `booking_services`, `payments`, `settings`, `notification_logs`.
   - Mengaktifkan Row Level Security (RLS) di seluruh tabel publik.
   - Menerapkan *GiST Exclusion Constraint* pada tabel `bookings`:
     ```sql
     ALTER TABLE public.bookings ADD CONSTRAINT exclude_barber_slot_overlap
     EXCLUDE USING gist (
         barber_id WITH =,
         booking_range WITH &&
     ) WHERE (status IN ('pending_payment', 'confirmed', 'in_progress'));
     ```
   - Mengisi data awal master barber, 8 katalog layanan, jam operasional, dan parameter gerai.

2. **`002_slot_temporary_locking_and_auto_expire.sql`**:
   - Menerapkan mekanisme kunci sementara (*temporary hold*) TTL 15 menit (900 detik).
   - Stored procedure `fn_create_booking_hold()` untuk penguncian kursi secara atomik.
   - Trigger `trg_auto_expire_holds_before_booking_insert` untuk pembersihan otomatis slot usang sebelum slot baru dicatat.
   - Database view `v_active_holds` untuk monitoring kasir secara *real-time*.

3. **`003_security_hardening_concurrency_and_locks.sql`**:
   - Menambahkan tabel audit `security_audit_logs`.
   - Menerapkan row-lock `SELECT ... FOR UPDATE` dan *transaction advisory lock* untuk memblokir serangan race condition (*simultaneous stampede*).
   - Menambahkan proteksi *anti-hoarding* (maksimal 2 pending holds aktif per nomor HP/IP).

### 6.3 Prosedur Menjalankan Migrasi ke Supabase Cloud
#### Opsi A: Menggunakan Supabase CLI (Direkomendasikan untuk CI/CD)
```bash
# 1. Login ke akun Supabase
npx supabase login

# 2. Hubungkan proyek lokal dengan proyek cloud Supabase
npx supabase link --project-ref <your-supabase-project-id>

# 3. Dorong seluruh berkas migrasi ke database remote
npx supabase db push
```

#### Opsi B: Menggunakan SQL Editor di Supabase Dashboard
1. Buka dashboard proyek Supabase Anda: `https://supabase.com/dashboard/project/<project-id>/sql`.
2. Buka berkas `supabase/migrations/001_initial_schema.sql`, salin seluruh isinya, tempelkan ke SQL Editor, dan klik **Run**.
3. Ulangi proses yang sama untuk `002_slot_temporary_locking_and_auto_expire.sql`.
4. Ulangi proses yang sama untuk `003_security_hardening_concurrency_and_locks.sql`.

---

## 7. Prosedur Pencadangan (Backup) & Pemulihan Bencana (Disaster Recovery)

Pencadangan database yang teruji merupakan garis pertahanan terakhir kelangsungan bisnis gerai jika terjadi insiden kegagalan sistem, human error, atau bencana data.

### 7.1 Kebijakan Retensi & RPO / RTO
- **RPO (Recovery Point Objective)**: Maksimal 1 jam (data transaksi yang hilang tidak boleh melebihi 1 jam operasional).
- **RTO (Recovery Time Objective)**: Maksimal 30 menit (layanan gerai wajib kembali aktif dalam 30 menit pasca-insiden).
- **Jadwal Retensi Cadangan**:
  - Cadangan Harian: Disimpan selama 30 hari.
  - Cadangan Mingguan: Disimpan selama 12 minggu.
  - Cadangan Bulanan: Disimpan selama 12 bulan (untuk kebutuhan pembukuan pajak tahunan).

### 7.2 Pencadangan Otomatis Supabase Managed Backup
Supabase Cloud menyediakan pencadangan harian otomatis tingkat basis data (Daily Backup) dan fitur Point-in-Time Recovery (PITR) pada paket Pro/Enterprise.
1. Masuk ke **Supabase Dashboard** > **Settings** > **Database** > **Backups**.
2. Pastikan fitur **Daily Backups** berstatus aktif.
3. Untuk memulihkan status database ke titik waktu tertentu, pilih daftar snapshot yang tersedia dan klik **Restore**.

### 7.3 Prosedur Manual Database Dump (CLI)
Pencadangan manual dilakukan secara rutin oleh DevOps atau sebelum melakukan rilis fitur besar ke produksi.

#### Perintah Ekspor Cadangan Lengkap (Schema + Data)
Gunakan utilitas `pg_dump` bawaan PostgreSQL:
```bash
# Set connection parameters (sesuaikan dengan kredensial Supabase Anda)
export PGHOST="db.<your-project-ref>.supabase.co"
export PGPORT="5432"
export PGUSER="postgres"
export PGDATABASE="postgres"
export PGPASSWORD="<your-database-password>"

# Tentukan stempel waktu pencadangan
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# 1. Ekspor Cadangan Lengkap Format Custom (.dump terkompresi)
pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE \
  -F c -b -v -f "$BACKUP_DIR/damez_full_$TIMESTAMP.dump"

# 2. Ekspor Cadangan Skema Saja (Plain SQL untuk audit struktur DDL)
pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE \
  --schema-only -f "$BACKUP_DIR/damez_schema_$TIMESTAMP.sql"

# 3. Ekspor Cadangan Data Tabel Transaksional Saja (.dump)
pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE \
  --data-only -F c -f "$BACKUP_DIR/damez_data_$TIMESTAMP.dump"
```

#### Enkripsi Berkas Cadangan (Kepatuhan UU PDP No. 27/2022)
Sesuai mandat UU PDP, data pelanggan (nama dan nomor telepon) yang dicadangkan wajib dienkripsi saat transit dan diam (*at-rest*):
```bash
# Enkripsi berkas cadangan menggunakan GPG (AES-256)
gpg --symmetric --cipher-algo AES256 "$BACKUP_DIR/damez_full_$TIMESTAMP.dump"

# Hapus berkas dump mentah tak terenkripsi
rm -f "$BACKUP_DIR/damez_full_$TIMESTAMP.dump"
```

### 7.4 Skrip Otomasi Cron Backup Harian (Disaster Recovery Script)
Simpan skrip bash berikut pada server pemeliharaan (`scripts/daily-db-backup.sh`):

```bash
#!/usr/bin/env bash
# ==============================================================================
# DAMEZ BARBERSHOP - AUTOMATED DAILY DATABASE BACKUP TO CLOUD STORAGE
# ==============================================================================
set -euo pipefail

BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
LOCAL_BACKUP_PATH="/tmp/damez_backup_${BACKUP_DATE}.dump"
GPG_PASSPHRASE="${DB_BACKUP_ENCRYPTION_KEY}"
S3_BUCKET="s3://damez-barber-offsite-backups/database"

echo "[INFO] Memulai proses pencadangan basis data Supabase..."

# Ekspor database menggunakan pg_dump
PGPASSWORD="${SUPABASE_DB_PASSWORD}" pg_dump \
  -h "${SUPABASE_DB_HOST}" \
  -p 5432 \
  -U postgres \
  -d postgres \
  -F c -b -v \
  -f "${LOCAL_BACKUP_PATH}"

echo "[INFO] Dump database berhasil. Mengenkripsi berkas dengan AES-256..."
gpg --batch --yes --passphrase "${GPG_PASSPHRASE}" \
  --symmetric --cipher-algo AES256 "${LOCAL_BACKUP_PATH}"

ENCRYPTED_FILE="${LOCAL_BACKUP_PATH}.gpg"

echo "[INFO] Mengunggah cadangan terenkripsi ke penyimpanan off-site cloud..."
# Menggunakan AWS CLI atau Rclone ke S3 / Cloudflare R2
aws s3 cp "${ENCRYPTED_FILE}" "${S3_BUCKET}/damez_backup_${BACKUP_DATE}.dump.gpg"

echo "[INFO] Membersihkan berkas sementara di server lokal..."
rm -f "${LOCAL_BACKUP_PATH}" "${ENCRYPTED_FILE}"

echo "[SUCCESS] Pencadangan basis data Damez Barbershop selesai dengan aman!"
```

### 7.5 Prosedur Pemulihan Bencana (Database Restoration SOP)
Jika terjadi kerusakan basis data atau migrasi ke server baru:

1. **Dekripsi Berkas Cadangan**:
   ```bash
   gpg --decrypt --batch --passphrase "<your-passphrase>" \
     -o "/tmp/damez_restore.dump" "damez_backup_<timestamp>.dump.gpg"
   ```

2. **Inisialisasi Database Target**:
   Pastikan ekstensi `uuid-ossp`, `pgcrypto`, dan `btree_gist` telah terpasang di database tujuan.

3. **Jalankan Utilitas `pg_restore`**:
   ```bash
   pg_restore -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE \
     --clean --if-exists --no-owner --no-privileges -v "/tmp/damez_restore.dump"
   ```

4. **Verifikasi Integritas Data Pasca-Restore**:
   Jalankan kueri validasi di psql / Supabase SQL Editor:
   ```sql
   -- 1. Cek jumlah data master barber (wajib 3 orang)
   SELECT count(*) FROM public.barbers;

   -- 2. Cek integritas constraint GiST exclusion
   SELECT conname, contype FROM pg_constraint WHERE conname = 'exclude_barber_slot_overlap';

   -- 3. Cek status reservasi terkini
   SELECT status, count(*) FROM public.bookings GROUP BY status;
   ```

5. Hapus berkas dump sementara dari disk lokal (`rm -f /tmp/damez_restore.dump`).

---

## 8. Konfigurasi Background Workers & Scheduled Jobs (Cron)

Sistem reservasi membutuhkan dua jenis background scheduler untuk menjaga akurasi antrean dan pengiriman pengingat jadwal.

### 8.1 Worker 1: Auto-Expire Slot Engine
- **Fungsi**: Memeriksa slot reservasi berstatus `pending_payment` yang telah melampaui batas waktu 15 menit, mengubah statusnya menjadi `expired`, dan melepaskan kursi agar dapat dipesan kembali oleh pelanggan lain.
- **Opsi Eksekusi A (Proses Daemon Mandiri)**:
  ```bash
  # Menjalankan worker berkesinambungan (polling tiap 15 detik)
  npm run worker:expire

  # Menjalankan satu kali putaran (one-shot sweep)
  npm run worker:expire -- --once
  ```
- **Opsi Eksekusi B (Endpoint Cron HTTP)**:
  Route handler `/api/cron/expire-slots` siap dipanggil oleh penyedia cron eksternal (Vercel Cron, GitHub Actions, atau crontab server) dengan proteksi Bearer Secret:
  ```http
  GET /api/cron/expire-slots
  Authorization: Bearer <CRON_SECRET>
  ```

### 8.2 Worker 2: Scheduled Reminders Sweeper
- **Fungsi**: Memindai jadwal booking terkonfirmasi pada hari H yang memasuki jendela waktu H-2 Jam dan H-30 Menit, lalu mengirimkan pengingat WhatsApp secara otomatis.
- **Endpoint**: `/api/cron/reminders`
- **Jadwal Eksekusi Disarankan**: Setiap 5 menit atau 10 menit.
- **Contoh Permintaan HTTP**:
  ```http
  POST /api/cron/reminders
  Authorization: Bearer <CRON_SECRET>
  Content-Type: application/json
  ```

### 8.3 Contoh Konfigurasi `vercel.json` untuk Cron Otomatis
Jika aplikasi di-deploy di Vercel:
```json
{
  "crons": [
    {
      "path": "/api/cron/expire-slots",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/cron/reminders",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 9. Prosedur Rilis Produksi (Production Launch Checklist)

Sebelum merilis sistem ke domain publik `https://damezbarber.com`, tim teknis wajib menandatangani lembar ceklis verifikasi akhir berikut:

### 9.1 Pre-Flight Deployment Checklist
- [ ] Seluruh variabel rahasia di `.env` telah disetujui dan tidak ada nilai mock di server produksi (`MOCK_MIDTRANS=false`, `MOCK_WHATSAPP=false`).
- [ ] Mode Midtrans telah diubah ke Production (`MIDTRANS_IS_PRODUCTION=true`) dan Server Key menggunakan awalan `Mid-server-`.
- [ ] Webhook URL di portal Midtrans terdaftar dengan protokol `https://damezbarber.com/api/webhooks/midtrans`.
- [ ] Akun Fonnte / Wablas terhubung dengan nomor seluler resmi gerai dan kuota pesan aktif mencukupi.
- [ ] Database Supabase telah mengeksekusi migrasi `001`, `002`, dan `003` secara utuh.
- [ ] Seluruh unit test lokal lolos 100% (`npm test`).
- [ ] Build produksi Next.js sukses tanpa peringatan error fatal (`npm run build`).

### 9.2 Post-Deployment Health Check (Smoke Test)
1. **Pemeriksaan Halaman Publik**: Buka `https://damezbarber.com` dan pastikan asset visual (gambar, ikon, font) termuat cepat (LCP < 2.5s).
2. **Pemeriksaan Alur Pemesanan**: Lakukan pemesanan riil dengan nominal DP Rp 20.000 menggunakan scan QRIS di ponsel.
3. **Pemeriksaan Webhook & Dispatcher**: Pastikan dalam waktu < 5 detik setelah pembayaran berhasil:
   - Status booking di portal admin berubah menjadi `confirmed`.
   - Ponsel pemesan menerima pesan WhatsApp konfirmasi dari nomor gerai.
   - Ponsel master barber menerima alert jadwal baru.
4. **Pemeriksaan Portal Admin**: Masuk ke `/login` dan akses dashboard kasir untuk memastikan kalender matriks 3 kursi berfungsi lancar.

---
*Dokumen ini merupakan standar operasional teknologi resmi Damez Barbershop. Seluruh perubahan konfigurasi infrastruktur wajib melalui peninjauan Lead Tech dan terdokumentasi dalam Architecture Decision Record (ADR).*
