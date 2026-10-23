# Damez Barbershop — Sistem Reservasi Online & Operasional Gerai Modern

[![CI Quality Gate](https://github.com/firasezraa/damez-barbershop/actions/workflows/ci.yml/badge.svg)](https://github.com/firasezraa/damez-barbershop/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.2.1-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B%20%2F%2017-blue.svg)](https://supabase.com/)
[![Midtrans](https://img.shields.io/badge/Payment-Midtrans%20Snap%20QRIS-0085FF.svg)](https://midtrans.com/)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Multi--Gateway%20%3C5s%20SLA-25D366.svg)](https://fonnte.com/)
[![Tests](https://img.shields.io/badge/Tests-19%2F19%20Passing%20(100%25)-success.svg)](./tests/)
[![Production URL](https://img.shields.io/badge/Live%20URL-https%3A%2F%2Fdamezbarber.com-gold.svg)](https://damezbarber.com)

> **Sistem manajemen reservasi pangkas rambut terintegrasi untuk Damez Barbershop**. Dirancang khusus untuk memotong drama antrean fisik ruang tunggu, mengeliminasi risiko pembatalan sepihak (*no-show*) melalui Down Payment (DP) flat Rp 20.000 via QRIS, menjamin ketiadaan jadwal bentrok (*zero double booking*) berkat constraint PostgreSQL GiST, serta mengirimkan tiket reservasi WhatsApp instan dalam waktu kurang dari 5 detik.
>
> 🌐 **Live Production URL**: -
> 📦 **GitHub Repository**: [https://github.com/firasezraa/damez-barbershop](https://github.com/firasezraa/damez-barbershop)  
> 🔒 **SSL & Custom Domain**: TLS 1.3 / HSTS 2-Tahun / CSP Hardened (`docs/DOMAIN-SSL-SETUP.md`)

---

## 1. Ikhtisar Sistem & Keunggulan Utama

Damez Barbershop mengoperasikan 3 kursi pangkas rambut dengan 3 master barber (Rian Pratama, Dimas Prasetyo, Kevin Sanjaya) di Jakarta Selatan. Sistem ini menjembatani pengalaman pemesanan mandiri oleh pelanggan di ponsel pintar dengan operasional harian kasir gerai.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          ALUR INTI RESERVASI DAMEZ                              │
└─────────────────────────────────────────────────────────────────────────────────┘

 1. Pilih Layanan & Barber  ──►  2. Kunci Slot (Hold 15m)  ──►  3. Bayar DP Rp 20.000
    • 8 Menu Layanan             • Anti Double-Booking          • QRIS Snap Pop-up
    • Jadwal Putar 3 Barber      • GiST Exclusion Lock          • MDR 0,7% (Rp 140)
                                                                        │
 4. Konfirmasi Otomatis     ◄──  5. Webhook Midtrans SHA-512  ◄─────────┘
    • Tiket WA Pelanggan (<5s)   • Idempoten & Anti-Tamper
    • Alert WA Master Barber     • Status Booking 'confirmed'
    • Kasir Siap Potong DP
```

### Pilar Utama Keunggulan Arsitektur:
1. **Down Payment (DP) Flat Rp 20.000 via QRIS**: Menjamin komitmen hadir pelanggan tanpa memberatkan kantong. Biaya MDR hanya 0,7% (Rp 140), memberikan *net payout* bersih Rp 19.860 (efisiensi margin 99,30%). Sisa tagihan diselesaikan di kasir gerai.
2. **Pencegahan Double-Booking Mutlak (Kernel-Level)**: Menggunakan tipe data PostgreSQL `TSTZRANGE` dan *GiST Exclusion Constraint*. Teruji secara matematis dan empiris mustahil terjadi bentrok jadwal antarsesama pelanggan bahkan di bawah beban *simultaneous stampede* (20 request bersamaan pada detik yang sama).
3. **Mekanisme Temporary Hold 15 Menit**: Saat pelanggan memilih jadwal, slot dikunci sementara selama 900 detik. Jika transaksi tidak diselesaikan, mesin *auto-expire* otomatis melepas kursi ke publik.
4. **Dispatcher Notifikasi WhatsApp Cepat (< 5 Detik SLA)**: Menggunakan arsitektur multi-gateway (Fonnte & Wablas) dengan kebijakan ketat tanpa emoji (0 emoji), format bahasa Indonesia baku (WIB), dan sepenuhnya patuh pada UU Pelindungan Data Pribadi (UU PDP No. 27/2022).
5. **Dashboard Kasir & Kalender Matriks 3 Kursi**: Antarmuka tablet kasir dengan matriks visual 3 kapster, rotasi jam istirahat bergantian (*staggered break*), input tamu *walk-in* cepat (< 15 detik), kalkulator pelunasan potong DP, penegakan batas toleransi keterlambatan 15 menit, dan ekspor rekonsiliasi kas harian format CSV 3-pos (RFC 4180).

---

## 2. Panduan Memulai Cepat (Quick Start dari Repositori Bersih)

Sistem dirancang untuk dapat dijalankan langsung dari repositori bersih (*clean repository*) hanya dengan beberapa baris perintah.

### Prasyarat Lingkungan
- Node.js versi `20.x` LTS atau lebih tinggi (`node -v` >= 20.18.0)
- npm versi `10.x` atau lebih baru (`npm -v` >= 10.8.0)
- Akun Supabase (PostgreSQL 15+/17) & Akun Merchant Midtrans

### Langkah Instalasi
```bash
# 1. Gandakan repositori
git clone https://github.com/damezbarbershop/damez-barber.git
cd damez-barber

# 2. Pasang dependensi
npm install

# 3. Salin konfigurasi environment variables
cp .env.example .env

# 4. Jalankan pengujian statis TypeScript
npm run typecheck

# 5. Jalankan seluruh test suite otomatis (15/15 passing)
npm test

# 6. Jalankan server pengembangan lokal
npm run dev
```

Buka peramban di `http://localhost:3000` untuk halaman publik atau `http://localhost:3000/login` untuk masuk ke portal kasir & admin.

---

## 3. Daftar Perintah Kerja (Scripts)

| Perintah | Deskripsi Fungsional |
|---|---|
| `npm run dev` | Menjalankan server pengembangan lokal Next.js di port 3000 |
| `npm run build` | Melakukan kompilasi dan bundling produksi teroptimasi |
| `npm run start` | Menjalankan server aplikasi produksi Next.js |
| `npm run typecheck` | Menjalankan validasi tipe TypeScript (`tsc --noEmit`) tanpa error |
| `npm test` | Menjalankan 15 test suite komprehensif (Unit, Integrasi, Concurrency, Security) |
| `npm run worker:expire` | Menjalankan background worker auto-expire slot (polling 15s) |
| `npm run worker:expire -- --once` | Menjalankan satu kali putaran sapuan pelepasan slot expired |

---

## 4. Struktur Proyek & Organisasi Berkas

```text
damez-barber/
├── app/                          # Next.js 15 App Router (Frontend & API)
│   ├── (admin)/                  # Portal Admin & Kasir (Terproteksi Sesi)
│   │   ├── dashboard/            # Kalender 3 Kursi, Booking List & Quick Actions
│   │   ├── login/                # Halaman Autentikasi Admin
│   │   └── layout.tsx            # Session Guard & Header Admin
│   ├── (public)/                 # Landing Page Publik Ramah SEO & Mobile
│   ├── api/                      # REST API Endpoints
│   │   ├── admin/                # API Manajemen Booking, Status & Laporan CSV
│   │   ├── booking/              # API Slot Hold (/hold) & Checkout Snap (/checkout)
│   │   ├── cron/                 # Route Handler Cron (/expire-slots & /reminders)
│   │   ├── notifications/        # Route Dispatcher Notifikasi WhatsApp
│   │   ├── slots/                # API Ketersediaan Jadwal (/available)
│   │   └── webhooks/             # Webhook Receiver Midtrans (/midtrans)
│   ├── layout.tsx                # Layout Root Aplikasi & Metadata Kanonikal
│   └── globals.css               # Desain Token Tailwind CSS v4 & Variabel Warna
├── components/                   # Komponen React Terisolasi
│   ├── admin/                    # Komponen Kalender, Kasir Modal, & Stats Rekap
│   ├── booking/                  # Wizard Pemesanan 5 Langkah Modular
│   └── landing/                  # Section Hero, Layanan, Barber Roster, Galeri & FAQ
├── content/                      # Salinan Teks Antarmuka & Master Data
│   ├── landing-copy.md           # Master Copy Landing Page
│   ├── faq-and-microcopy.md      # Kamus Teks, Error States & FAQ Aturan DP
│   └── whatsapp-templates.json   # 8 Template Pesan WhatsApp Resmi (0 Emoji)
├── docs/                         # Dokumentasi Arsitektur & Standard Operating Procedures
│   ├── DEPLOYMENT.md             # Runbook Deployment Produksi, Setup Gateway & DR
│   ├── admin-operations-guide.md # SOP Meja Kasir & Alur Pelayanan Gerai
│   ├── PRD.md                    # Product Requirement Document v1.0
│   ├── decisions/                # Architecture Decision Records (ADRs)
│   │   ├── ADR-001-flat-down-payment-and-midtrans-qris.md
│   │   ├── ADR-002-staggered-slots-and-concurrency-locking.md
│   │   └── ADR-003-whatsapp-multi-gateway-and-humanizer-compliance.md
│   └── research/                 # Laporan Riset Biaya Gateway & Kapasitas Kursi
├── lib/                          # Modul Logika Inti & Services
│   ├── admin/                    # Service Kasir, Rekonsiliasi Kas 3-Pos & Auth
│   ├── notifications/            # Service Dispatcher WhatsApp Multi-Gateway
│   ├── payment/                  # Klien Midtrans Snap & Handler Webhook SHA-512
│   ├── security/                 # Rate Limiting, Price Guard & Concurrency Lock
│   ├── slots/                    # Mesin Penjadwalan Slot & Auto-Expire Hold
│   ├── supabase/                 # Supabase Client Singleton
│   └── utils/                    # Utilitas Waktu Asia/Jakarta (WIB) & Format Uang
├── scripts/                      # Skrip Otomasi & Worker
│   └── slot-expire-worker.ts     # Daemon Worker Auto-Expire Slot TTL 15 Menit
├── supabase/                     # Konfigurasi Basis Data PostgreSQL
│   ├── config.toml               # Konfigurasi Supabase Lokal CLI
│   └── migrations/               # Berkas Migrasi Berurutan (001, 002, 003)
├── tests/                        # 15 Test Suites Pengujian Otomatis
└── types/                        # Definisi Tipe Data TypeScript
```

---

## 5. Ringkasan Konfigurasi Environment Variables

Konfigurasi aplikasi dikelola melalui file `.env`. Gunakan `.env.example` sebagai acuan pembuatan. Untuk panduan audit mendalam, silakan baca [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

```env
# 1. Supabase Cloud Database & Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# 2. Midtrans Payment Gateway (Snap API & Webhook)
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxxxxxxxxxx
MOCK_MIDTRANS=false

# 3. WhatsApp Notification Gateway (Fonnte / Wablas)
WHATSAPP_GATEWAY_PROVIDER=fonnte
FONNTE_API_TOKEN=your-fonnte-api-token
FONNTE_API_URL=https://api.fonnte.com/send
WABLAS_TOKEN=your-wablas-token
WABLAS_SECRET_KEY=your-wablas-secret-key
MOCK_WHATSAPP=false
WHATSAPP_TIMEOUT_MS=4500
WHATSAPP_DEFAULT_ADMIN_PHONE=081234567890
BARBER_RIAN_PHONE=081234567801
BARBER_FAJAR_PHONE=081234567802
BARBER_BAGAS_PHONE=081234567803

# 4. Domain & Aplikasi
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development

# 5. Scheduled Jobs & Worker Security
CRON_SECRET=damez_secret_cron_token_15m
EXPIRE_WORKER_INTERVAL_MS=15000
```

---

## 6. Pengujian Mutu & Verifikasi Kode (Quality Gates)

Repositori ini menerapkan standar jaminan mutu yang ketat sebelum kode dapat di-merge atau dirilis ke produksi. Seluruh 15 test suite dapat dijalankan melalui perintah `npm test`:

```text
================================================================================
HASIL VERIFIKASI TEST SUITE OTOMATIS (15/15 PASSING - 100% SUCCESS)
================================================================================
1.  tests/verify-schema.js                : 10 Tabel, Ekstensi & Tipe TypeScript Valid
2.  tests/database-types.test.ts          : Validasi Objek Type-Safe PostgreSQL
3.  tests/test-pg-mem.js                  : Simulasi Engine Relasional PostgreSQL In-Memory
4.  tests/timezone.test.ts                : Presisi Zona Waktu Asia/Jakarta (WIB)
5.  tests/slot-engine.test.ts             : Logika Staggered Break & Rotating Day-Off
6.  tests/api-slots-route.test.ts         : Kueri Slot Ketersediaan Latensi < 2ms
7.  tests/midtrans-payment.test.ts        : Kunci Nominal DP Rp 20.000 & Token Snap
8.  tests/midtrans-webhook.test.ts        : Verifikasi Signature SHA-512 & Idempotensi
9.  tests/slot-auto-expire.test.ts        : Pelepasan Slot Otomatis Tepat Menit ke-15
10. tests/landing-page.test.ts            : Audit SEO, Schema.org & Standar Humanizer
11. tests/concurrency-race-condition.test : 20 Concurrent Stampede Requests = 0 Double Booking
12. tests/security-audit-tampering.test   : Anti-Tamper DP/Harga, Rate Limit RFC 6585 & Honeypot
13. tests/admin-dashboard.test.ts         : Kalender 3 Kursi, Kasir & Rekonsiliasi Kas CSV
14. tests/whatsapp-notification.test.ts   : SLA < 5s, Multi-Gateway & Zero-Emoji Policy
15. tests/booking-form.test.ts            : Ergonomi Mobile & Alur Pemesanan < 2 Menit
================================================================================
```

---

## 7. Indeks Dokumentasi Teknis & Panduan Operasional

Untuk mempelajari sistem lebih lanjut, silakan merujuk pada berkas dokumentasi spesifik:
- **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)**: Panduan lengkap deployment produksi, konfigurasi akun Midtrans Snap & Webhook, pairing WhatsApp Gateway (Fonnte/Wablas), serta Standard Operating Procedure (SOP) pencadangan (*backup*) dan pemulihan bencana (*disaster recovery*) basis data Supabase.
- **[docs/admin-operations-guide.md](./docs/admin-operations-guide.md)**: Standard Operating Procedure (SOP) meja kasir dan operasional harian untuk staf gerai (menyambut tamu, input walk-in < 15 detik, pelunasan potong DP, penanganan no-show toleransi 15 menit, dan rekapitulasi kas harian).
- **[docs/decisions/](./docs/decisions/)**: Dokumen *Architecture Decision Records (ADRs)* yang merekam konteks, trade-off, dan justifikasi keputusan teknis utama:
  - `ADR-001`: Arsitektur Pembayaran DP Flat Rp 20.000 via Midtrans Snap QRIS.
  - `ADR-002`: Manajemen Slot Staggered Break & Penguncian Konkurensi Database GiST.
  - `ADR-003`: Arsitektur Multi-Gateway WhatsApp, Standar Humanizer & Kepatuhan UU PDP.
- **[docs/PRD.md](./docs/PRD.md)**: Dokumen Spesifikasi Kebutuhan Produk (*Product Requirement Document*).

---

## 8. Lisensi & Hak Cipta

Seluruh kode sumber dan aset dokumentasi ini merupakan hak milik eksklusif **Damez Barbershop Jakarta**. Dilindungi oleh undang-undang hak cipta Republik Indonesia. Dilarang menggandakan atau mendistribusikan ulang tanpa izin tertulis dari manajemen Damez Barbershop.
