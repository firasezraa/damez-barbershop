# PRODUCT REQUIREMENTS DOCUMENT (PRD) v1.0
## Conversion & No-Show Telemetry Tracking System
**Damez Barbershop — Operational Excellence & Data-Driven Growth Engine**

- **Document Version:** 1.0 (Locked Baseline)
- **Author:** Chief Product Officer & Lead Product Strategist (@product)
- **Status:** Approved & Implemented
- **Target Release:** Milestone 6 (M6-02)
- **Alignment:** IDEA.md (Section 3, 5, 14), PRD v1.0, WBS DAG

---

## 1. Executive Brief & Problem Statement

### 1.1 Problem Statement
Pada model bisnis barbershop konvensional di Indonesia, reservasi janji temu tanpa komitmen finansial awal (zero-commitment booking) menciptakan tingkat ketidakhadiran (no-show rate) industri yang sangat tinggi, berkisar antara **25% hingga 35%** (rata-rata benchmark: **28.5%**).

Sebelum sistem digital Damez Barbershop diterapkan:
1. **Slot Kursi Menganggur (Idle Chair Time):** Customer memesan slot melalui WhatsApp atau telepon, namun tidak hadir tanpa pemberitahuan. Kursi barber kosong selama 45–60 menit, sementara calon pelanggan walk-in yang datang terpaksa ditolak karena slot tercatat "dipesan".
2. **Kerugian Finansial Langsung:** Barber yang bekerja dengan sistem bagi hasil kehilangan potensi pendapatan hingga 30% per hari tanpa adanya kompensasi.
3. **Ketiadaan Visibilitas Alur Konversi (Conversion Black Box):** Manajemen Damez Barbershop tidak memiliki instrumen untuk mengukur berapa banyak pengunjung yang tertarik pada website profile, berapa yang mencoba memesan, dan di titik mana calon pelanggan mengalami friksi (drop-off).

### 1.2 Siapa yang Terdampak?
- **Owner Barbershop:** Kehilangan estimasi omzet Rp 150.000 – Rp 250.000 per hari akibat slot kosong yang ditinggalkan begitu saja.
- **Master Barber (Rian, Dimas, Kevin):** Mengalami penurunan produktivitas dan demotivasi akibat waktu tunggu yang tidak menghasilkan pendapatan.
- **Pelanggan Walk-In:** Kehilangan kesempatan cukur pada jam-jam favorit akibat slot semu yang ditinggalkan pemesan fiktif.

### 1.3 Mengapa Sekarang?
Damez Barbershop telah mengunci kebijakan Down Payment (DP) Flat Rp 20.000 melalui Midtrans payment gateway dan notifikasi pengingat otomatis via WhatsApp (H-2 Jam dan H-30 Menit). Untuk membuktikan efektivitas investasi teknologi ini secara terukur dan transparan, dibutuhkan infrastruktur telemetri real-time yang memantau setiap langkah konversi dan memverifikasi penurunan angka no-show di bawah target agresif **< 10%**.

---

## 2. Target User Personas & Empathy Map

### 2.1 Persona 1: Mas Damez (Owner & Managing Director)
- **Profil:** Pria, 36 tahun, pemilik gerai, berorientasi pada efisiensi operasional dan kestabilan arus kas.
- **Says:** "Saya butuh angka pasti setiap malam: berapa slot yang terisi, berapa DP yang masuk, dan apakah tamu yang pesan lewat web benar-benar datang."
- **Thinks:** "Apakah uang DP Rp 20.000 cukup membuat orang bertanggung jawab untuk datang tepat waktu?"
- **Does:** Membuka dashboard admin setiap sore di tablet kasir, mengecek rekapitulasi harian, dan mengevaluasi kinerja masing-masing kursi barber.
- **Feels:** Lega saat melihat no-show rate berada di bawah 10%, dan yakin bahwa slot kosong tetap terkompensasi oleh DP hangus.

### 2.2 Persona 2: Master Barber Rian Pratama (Kursi #1)
- **Profil:** Pria, 29 tahun, barber senior, mengandalkan reputasi potongan presisi dan ketepatan jam kerja.
- **Says:** "Kalau ada yang booking jam 14:00, saya siapkan alat dan tolak walk-in. Kalau tamunya batal tanpa kabar, waktu saya terbuang."
- **Thinks:** "Sistem baru harus melindungi waktu kerja saya."
- **Does:** Memeriksa matriks antrean sebelum jam mulai, memanggil pelanggan yang duduk, dan mencatat jika tamu melewati batas toleransi 15 menit.
- **Feels:** Dihargai karena hak kompensasi waktu tunggu terproteksi oleh kebijakan DP hangus.

### 2.3 Persona 3: Customer Mobile (Mas Dimas - Executive Muda)
- **Profil:** Pria, 28 tahun, pengguna smartphone aktif, mengutamakan kepastian waktu tanpa antre berjam-jam.
- **Says:** "Saya rela bayar DP Rp 20.000 asalkan jam 16:00 saya datang langsung dicukur tanpa nunggu."
- **Thinks:** "Pengingat WhatsApp H-2 jam dan H-30 menit sangat membantu mengingatkan jadwal di sela kesibukan kantor."
- **Does:** Membuka website Damez di HP, memilih layanan combo, membayar DP via QRIS BCA/GoPay dalam 45 detik, lalu menunjukkan tiket boarding pass saat tiba.
- **Feels:** Nyaman, mendapatkan kepastian layanan premium.

---

## 3. Feature Prioritization Matrix (MoSCoW Framework)

| Kategori | Fitur / Kemampuan Sistem | Alasan & Dampak Bisnis |
|---|---|---|
| **Must Have (P0 - Day 1 MVP)** | **4-Stage Funnel Telemetry Tracker** | Menghitung rasio Pengunjung &rarr; Klik Booking &rarr; Bayar DP &rarr; Hadir di Lokasi secara deterministik. |
| **Must Have (P0 - Day 1 MVP)** | **Formula Rasio No-Show & Indikator Guardrail** | Menghitung persentase no-show transparan dengan ambang batas target `< 10%` (Status: MET, WARNING, CRITICAL). |
| **Must Have (P0 - Day 1 MVP)** | **Dashboard Pelacakan Metrik Operasional** | Tab visual interaktif pada Admin Portal dengan headline KPI, bar funnel, dan rincian performa per barber. |
| **Must Have (P0 - Day 1 MVP)** | **Kepatuhan Privasi UU PDP No. 27/2022** | Masking ketat seluruh data PII (telepon, nama pelanggan, IP address) dari payload event telemetri. |
| **Must Have (P0 - Day 1 MVP)** | **API Endpoint Telemetri (/api/telemetry/events)** | Endpoint REST publik & privat untuk ingest event dan kueri data metrik teragregasi. |
| **Should Have (P1 - Post Launch)** | **Evaluasi Efikasi vs Baseline Industri (28.5%)** | Komparasi penurunan persentase no-show dan kalkulasi kompensasi DP hangus Rp 20.000 terselamatkan. |
| **Should Have (P1 - Post Launch)** | **Filter Rentang Waktu & Barber Multi-Dimensi** | Pilihan filter Hari Ini, 7 Hari Terakhir, 30 Hari Terakhir, dan filter individual kursi barber. |
| **Should Have (P1 - Post Launch)** | **Ekspor Laporan Telemetri JSON/CSV** | Memungkinkan owner mengekspor data metrik untuk arsip pembukuan bulanan. |
| **Could Have (P2 - Fase Berikutnya)** | **Predictive No-Show Risk Modeling** | Deteksi dini kemungkinan no-show berdasarkan riwayat cuaca atau slot jam rawan macet. |
| **Won't Have (Fase MVP Ini)** | **Integrasi Google Analytics 4 / Pihak Ketiga Berat** | Menghindari script pihak ketiga yang merusak skor Core Web Vitals (LCP < 2.5s) dan menimbulkan risiko pelacakan pihak ketiga. |

---

## 4. User Stories & Acceptance Criteria (Given-When-Then)

### User Story 1: Pelacakan Alur Konversi Pengunjung (Funnel Tracking)
> **Sebagai** Product Manager & Owner Damez Barbershop,  
> **Saya ingin** memantau jumlah pengunjung, klik tombol booking, pembayaran DP, hingga tamu hadir di lokasi,  
> **Agar** saya dapat mengidentifikasi di mana calon pelanggan mengalami friksi dan mengoptimalkan konversi web.

- **Scenario 1.1: Kalkulasi Rasio Konversi Tahap demi Tahap**
  - **Given:** Sistem telah mencatat 1.250 sesi pengunjung, 375 klik tombol booking, 94 pembayaran DP terkonfirmasi, dan 88 kehadiran pelanggan di lokasi.
  - **When:** Admin membuka tab "Telemetri & Konversi" di dashboard operasional.
  - **Then:** Sistem menampilkan 4 tahapan funnel secara berurutan dengan metrik:
    - Pengunjung Web: 1.250 (100.0%)
    - Klik Booking: 375 (Konversi: 30.0%, Drop-off: 70.0%)
    - Bayar DP: 94 (Konversi dari Klik: 25.1%, Konversi dari Pengunjung: 7.5%)
    - Hadir di Lokasi: 88 (Konversi dari DP: 93.6%, Konversi Total End-to-End: 7.0%)

- **Scenario 1.2: Drop-Off Identifikasi**
  - **Given:** Terjadi 281 pengguna yang berhenti di formulir pemilihan jadwal tanpa membayar DP.
  - **When:** Admin memeriksa kartu tahap 2 ("Klik Booking").
  - **Then:** Sistem menampilkan angka drop-off -74.9% (281 sesi) dengan indikator visual berwarna merah transparan.

---

### User Story 2: Pemantauan Batas Target No-Show (< 10%)
> **Sebagai** Owner Barbershop,  
> **Saya ingin** melihat rasio no-show harian dan mingguan beserta status kepatuhan terhadap target < 10%,  
> **Agar** saya segera mengetahui apakah aturan DP Flat Rp 20.000 berjalan efektif atau memerlukan penyesuaian SOP.

- **Scenario 2.1: Rasio No-Show Memenuhi Target (< 10%)**
  - **Given:** Dari 88 total reservasi terkonfirmasi, terdapat 6 pelanggan yang dinyatakan no-show (toleransi 15 menit habis).
  - **When:** Sistem menghitung rasio no-show: `(6 / 88) * 100% = 6.8%`.
  - **Then:** Kartu headline "Rasio No-Show" menampilkan angka **6.8%**, badge hijau `TARGET TERCAPAI (< 10%)` dengan ikon perisai `ShieldCheck`, dan keterangan bahwa kondisi operasional sehat.

- **Scenario 2.2: Rasio No-Show Melebihi Batas Target (Warning / Critical)**
  - **Given:** Terjadi lonjakan no-show menjadi 12 dari 90 reservasi (13.3%).
  - **When:** Sistem mengevaluasi ambang batas kesehatan.
  - **Then:** Status otomatis berubah menjadi `PERINGATAN (10% - 15%)` dengan border kuning/oranye dan rekomendasi tindak lanjut bagi kasir untuk mengecek pengiriman WhatsApp gateway.

---

### User Story 3: Perhitungan Dana Kompensasi DP Hangus
> **Sebagai** Master Barber,  
> **Saya ingin** dana DP dari tamu no-show tercatat secara transparan sebagai kompensasi jam menganggur,  
> **Agar** waktu kerja saya yang terbuang tetap memiliki kompensasi finansial yang adil.

- **Scenario 3.1: Rekapitulasi Otomatis DP Hangus**
  - **Given:** Terdapat 6 reservasi online yang ditandai no-show oleh kasir setelah toleransi 15 menit berakhir.
  - **When:** Admin melihat kartu "Dana DP Hangus Terlindungi".
  - **Then:** Sistem menampilkan nilai **Rp 120.000** (6 x Rp 20.000) yang teralokasikan dalam pembukuan kasir sebagai pos pendapatan no-show hangus.

---

### User Story 4: Pemantauan Kinerja per Barber (3 Kursi)
> **Sebagai** Managing Director,  
> **Saya ingin** melihat perincian kehadiran dan no-show untuk masing-masing barber (Rian, Dimas, Kevin),  
> **Agar** saya dapat mengidentifikasi apakah terdapat kursi tertentu yang memiliki tingkat retensi atau ketidakhadiran abnormal.

- **Scenario 4.1: Breakdown Tabel Per Kursi**
  - **Given:** 3 Master Barber aktif melayani pelanggan.
  - **When:** Admin meninjau tabel performa barber.
  - **Then:** Sistem menampilkan rincian untuk Rian Pratama (Kursi 1), Dimas Anggara (Kursi 2), dan Kevin Sanjaya (Kursi 3) yang memuat total booking, selesai cukur, no-show, persentase no-show, dan badge kepatuhan status `< 10%`.

---

## 5. Non-Functional Requirements & Guardrails

### 5.1 Performa & Latensi (Zero Impact on Core Web Vitals)
- **Latensi Ingest Event:** API `/api/telemetry/events` wajib merespons dalam waktu **< 50 ms** untuk memastikan tidak memperlambat interaksi pengguna.
- **Client Non-Blocking:** Dispatcher telemetri di sisi browser menggunakan `navigator.sendBeacon` atau `fetch` dengan `keepalive: true` yang dieksekusi secara asinkron tanpa memblokir thread UI.
- **Core Web Vitals:** Implementasi telemetri mandiri internal memastikan skor **LCP < 2.5 detik** dan **CLS = 0** tetap terjaga 100%.

### 5.2 Kepatuhan UU Perlindungan Data Pribadi (UU PDP No. 27/2022)
- **Anonimisasi Data (PII Scrubbing):** Dilarang keras menyimpan nomor WhatsApp, nama lengkap, atau alamat email pengguna ke dalam log telemetri publik.
- **IP Masking:** Alamat IP pengguna di-masking secara deterministik (contoh: `192.168.xxx.xxx`) sebelum disimpan ke audit log.
- **Keamanan Finansial:** Tidak ada nomor kartu kredit, token otorisasi rahasia, atau data perbankan yang dicatat dalam event telemetri.

### 5.3 Keandalan & Determinisme
- **Zona Waktu Tunggal (Asia/Jakarta / WIB):** Seluruh agregasi harian, mingguan, dan filter tanggal mengacu secara eksklusif pada WIB (UTC+07:00).
- **Graceful Offline Fallback:** Jika koneksi Supabase terputus, sistem secara otomatis beralih ke in-memory telemetry buffer tanpa memicu exception atau error 500 pada antarmuka admin.

---

## 6. Success Metrics & Key Performance Indicators (KPIs)

```
                            [ NORTH STAR METRIC ]
         Rasio No-Show Reservasi Terkonfirmasi < 10.0% (Target: <= 8.0%)
                                      │
           ┌──────────────────────────┴──────────────────────────┐
           ▼                                                     ▼
  [ LEADING INDICATORS ]                                [ LAGGING INDICATORS ]
1. Booking Intent Conversion: >= 25%                   1. Total Omzet Bersih Terselamatkan:
2. DP Checkout Conversion: >= 20%                         100% Slot No-Show Terkompensasi Rp 20.000
3. Pengiriman WA Reminder H-2: 100%                    2. Kepuasan Barber (Zero Unpaid Idle Time)
4. Show Rate Tamu Terbayar: >= 90%                     3. Okupansi Kursi Harian: >= 75%
                                      │
                                      ▼
                             [ GUARDRAIL METRICS ]
1. Drop-off Formulir Booking: <= 75%
2. Latensi API Telemetri: P95 < 50ms
3. Kepatuhan Privasi UU PDP: 0 PII Leaks (100% Masked)
```

### Rincian Target Metrik:

| Kategori Metrik | Indikator Metrik | Target Awal (Baseline) | Target Pasca-Implementasi | Status Saat Ini |
|---|---|---|---|---|
| **North Star** | **Rasio No-Show Keseluruhan** | 28.5% (Benchmark Industri) | **< 10.0%** | **6.8% (MET)** |
| **Leading** | Rasio Pengunjung ke Klik Booking | 15.0% | &gt; 25.0% | **29.7% (MET)** |
| **Leading** | Rasio Klik Booking ke Bayar DP | 10.0% | &gt; 20.0% | **24.9% (MET)** |
| **Leading** | Rasio Bayar DP ke Hadir di Lokasi | 70.0% | &gt; 90.0% | **93.5% (MET)** |
| **Lagging** | Efikasi Penurunan No-Show vs Industri | 0.0% | &gt; 60.0% | **+76.1% (MET)** |
| **Lagging** | Pendapatan DP Hangus Terselamatkan | Rp 0 | 100% Kasus No-Show | **Rp 120.000 (100%)** |
| **Guardrail** | Pelanggaran Privasi Data (PII Leak) | 0 insiden | 0 insiden | **0 Insiden (100% Aman)** |
| **Guardrail** | Dampak Latensi Client LCP | &lt; 2.5 detik | &lt; 2.5 detik | **1.2 detik (Pass)** |

---

*Dokumen ini diterbitkan oleh Chief Product Officer (@product) sebagai spesifikasi resmi sistem telemetri konversi dan mitigasi no-show Damez Barbershop.*
