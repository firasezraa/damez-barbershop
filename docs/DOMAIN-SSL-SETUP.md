# Panduan Konfigurasi Custom Domain, Sertifikat SSL & Deployment Produksi
## Damez Barbershop — Production Deployment, Domain & Security Runbook

> **Dokumen**: Custom Domain, SSL HTTPS & CI/CD Deployment Architecture  
> **Klasifikasi**: Infrastructure & Security Specification  
> **Status**: APPROVED FOR PRODUCTION DEPLOYMENT  
> **Target URL Produksi**: `https://damezbarber.com`  
> **Target URL Alternatif**: `https://www.damezbarber.com` / `https://damez-barbershop.vercel.app`  
> **Kepatuhan Regulasi**: UU No. 27/2022 (UU PDP), Standar Bank Indonesia QRIS MDR, PCI-DSS Level 1 (Midtrans)

---

## 1. Topologi Domain & Pemetaan DNS (DNS Record Matrix)

Damez Barbershop menggunakan arsitektur Anycast Edge Network Vercel yang dipadukan dengan SSL/TLS otomatis dari Let's Encrypt dan DigiCert.

### 1.1 Matriks DNS Records Resmi

| Tipe Record | Host / Nama | Nilai Target (Value / Points to) | TTL | Fungsi / Keterangan |
|---|---|---|---|---|
| **A** | `@` (Apex / damezbarber.com) | `76.76.21.21` | 3600 (1 Jam) | Mengarahkan domain utama ke Anycast IP Vercel Edge Server global |
| **CNAME** | `www` | `cname.vercel-dns.com.` | 3600 (1 Jam) | Subdomain kanonikal www dengan auto-redirect ke domain apex |
| **CNAME** | `staging` | `cname.vercel-dns.com.` | 3600 (1 Jam) | Lingkungan staging untuk validasi fitur sebelum rilis produksi |
| **CAA** | `@` | `0 issue "letsencrypt.org"` | 86400 (24 Jam) | Otorisasi penerbitan sertifikat SSL oleh Let's Encrypt |
| **CAA** | `@` | `0 issue "digicert.com"` | 86400 (24 Jam) | Otorisasi sekunder penerbitan sertifikat SSL oleh DigiCert |
| **TXT** | `_vercel` | `vc-domain-verify=damezbarber.com,...` | 3600 (1 Jam) | Token verifikasi kepemilikan domain Vercel |

### 1.2 Prosedur Delegasi Name Server (Opsi Cloudflare Proxy)
Jika menggunakan Cloudflare sebagai DNS & DDoS Protection layer:
1. Atur record `A` `@` ke `76.76.21.21` dengan status Proxy (Orange Cloud).
2. Atur record `CNAME` `www` ke `cname.vercel-dns.com` dengan status Proxy.
3. Di tab **SSL/TLS** Cloudflare, pilih mode **Full (Strict)** untuk menjamin enkripsi end-to-end antara Cloudflare Edge dan origin Vercel.
4. Aktifkan fitur **Always Use HTTPS** dan **Automatic HTTPS Rewrites**.

---

## 2. Arsitektur Sertifikat SSL / TLS & Hardening Keamanan

### 2.1 Spesifikasi SSL / TLS
- **Protokol**: TLS 1.3 (wajib) dengan backward compatibility ke TLS 1.2. Protokol usang (SSL v3, TLS 1.0, TLS 1.1) dinonaktifkan secara permanen.
- **Cipher Suite**: ECDHE-ECDSA-AES128-GCM-SHA256, ECDHE-RSA-AES128-GCM-SHA256, ECDHE-ECDSA-AES256-GCM-SHA384, ECDHE-RSA-AES256-GCM-SHA384.
- **Siklus Pembaruan Otomatis**: Sertifikat diterbitkan dengan masa berlaku 90 hari dan diperbarui otomatis pada hari ke-60 melalui protokol ACME HTTP-01 / DNS-01 tanpa down-time.

### 2.2 HTTP Security Headers
Diterapkan secara ketat pada level aplikasi (`next.config.mjs`) dan level edge router (`vercel.json`):

1. **Strict-Transport-Security (HSTS)**:
   ```http
   Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
   ```
   *Memaksa seluruh peramban untuk hanya berkomunikasi via HTTPS selama 2 tahun dan memenuhi syarat HSTS Preload list browser global.*

2. **Content-Security-Policy (CSP)**:
   ```http
   Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://app.midtrans.com https://app.sandbox.midtrans.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://app.midtrans.com https://app.sandbox.midtrans.com https://api.midtrans.com https://api.sandbox.midtrans.com https://api.fonnte.com https://wablas.com; frame-src 'self' https://app.midtrans.com https://app.sandbox.midtrans.com https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self'
   ```
   *Mengunci sumber skrip dan iframe hanya ke domain resmi Damez Barbershop, Midtrans Snap QRIS, Supabase Cloud, dan Google Maps.*

3. **X-Content-Type-Options**: `nosniff` (mencegah MIME-sniffing exploit).
4. **X-Frame-Options**: `SAMEORIGIN` (mencegah serangan clickjacking).
5. **Referrer-Policy**: `strict-origin-when-cross-origin` (melindungi privasi URL transaksi pelanggan).
6. **Permissions-Policy**: `camera=(), microphone=(), geolocation=()` (membatasi akses hardware peramban).

---

## 3. Otomasi Pipeline CI/CD (GitHub Actions)

Proyek dilengkapi 3 workflow GitHub Actions yang terisolasi dan modular:

```
                  ┌───────────────────────────────┐
                  │    Git Push / Pull Request    │
                  └──────────────┬────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       ┌────────────────────┐          ┌────────────────────┐
       │   PR Opened/Push   │          │  Scheduled Cron    │
       │    (.github/ci)    │          │ (.github/db-backup)│
       └─────────┬──────────┘          └─────────┬──────────┘
                 │                               │
       ┌─────────▼──────────┐          ┌─────────▼──────────┐
       │ Quality Gate 1:    │          │ Supabase pg_dump   │
       │ Static Typecheck   │          │ Snapshot           │
       │ (npx tsc --noEmit) │          └─────────┬──────────┘
       └─────────┬──────────┘                    │
       ┌─────────▼──────────┐          ┌─────────▼──────────┐
       │ Quality Gate 2:    │          │ AES-256 Encryption │
       │ 18 Test Suites     │          │ (UU PDP No.27/2022)│
       │ (npm test)         │          └─────────┬──────────┘
       └─────────┬──────────┘                    │
       ┌─────────▼──────────┐          ┌─────────▼──────────┐
       │ Quality Gate 3:    │          │ 30-Day Retention   │
       │ Next 15 Build      │          │ Secure Artifact    │
       │ (npm run build)    │          └────────────────────┘
       └─────────┬──────────┘
       ┌─────────▼──────────┐
       │ Quality Gate 4:    │
       │ Security Audit     │
       └─────────┬──────────┘
                 │
                 ▼
       ┌────────────────────┐
       │  Merge to 'main'   │
       │    (.github/cd)    │
       └─────────┬──────────┘
                 │
                 ▼
       ┌────────────────────┐
       │ Vercel Production  │
       │ Deploy & Smoke Test│
       │ https://damez...   │
       └────────────────────┘
```

### 3.1 Berkas Workflow CI/CD
- `.github/workflows/ci.yml`: Menjalankan typecheck TypeScript, 18 automated test suites (concurrency, idempotensi webhook Midtrans, 15m TTL hold, dan E2E booking spec), serta kompilasi produksi Next.js 15.
- `.github/workflows/cd.yml`: Mengorkestrasikan deployment otomatis ke Vercel production saat merge ke branch `main`, disertai smoke test dan probe sertifikat SSL.
- `.github/workflows/db-backup.yml`: Menjadwalkan pencadangan harian basis data Supabase setiap pukul 00:00 WIB (17:00 UTC) dengan enkripsi AES-256 dan masa simpan 30 hari.

---

## 4. Konfigurasi Scheduled Background Jobs (Vercel Cron)

Sesuai `vercel.json`, sistem menjalankan dua background scheduler otomatis:
1. **`/api/cron/expire-slots`** (Frekuensi: Setiap 1 Menit `* * * * *`):
   - Memeriksa booking dengan status `pending_payment` yang berumur > 15 menit.
   - Mengubah status ke `expired` secara atomik dan membebaskan kursi barber.
2. **`/api/cron/reminders`** (Frekuensi: Setiap 5 Menit `*/5 * * * *`):
   - Memindai reservasi terkonfirmasi untuk hari H.
   - Menembakkan pesan pengingat WhatsApp H-2 jam dan H-30 menit tanpa emoji.

---

## 5. Prosedur Verifikasi Mandiri Pasca Rilis (Post-Deployment Verification)

Eksekusi probe pengujian berikut pada terminal:

```bash
# 1. Jalankan audit DNS dan evaluasi security headers lokal
node --experimental-strip-types scripts/verify-ssl-domain.ts

# 2. Jalankan simulasi pencadangan database dan verifikasi dekripsi
node --experimental-strip-types scripts/backup-db.ts

# 3. Jalankan seluruh test suite otomatis (18 suites)
npm test

# 4. Verifikasi kompilasi build produksi Next.js 15
npm run build
```

---
*Damez Barbershop — Automated Infrastructure & DevOps Standard 2026.*
