# Product Requirements Document (PRD) — Damez Barbershop

> **Dokumen**: Product Requirements Document (PRD) v1.0 — MVP Baseline  
> **Status**: APPROVED & LOCKED (Baseline Operasional & Teknis)  
> **Author**: Lead Product Strategist & CPO (`product:prd-spec`, `product:prioritizer`)  
> **Target Release**: Q4 2026  
> **Klasifikasi Proyek**: High-Impact Lean MVP (7–14 Hari Siklus Pengembangan)  
> **Domain**: Barber & Male Grooming Appointment Booking Platform  
> **Repository Root**: `C:/Users/Acer/OneDrive/Desktop/DamezBarber`

---

## 1. Executive Brief & Problem Statement

### 1.1 Latar Belakang & Konteks
Damez Barbershop adalah penyedia jasa pangkas rambut pria (barbershop) konvensional dengan 3 kursi potong aktif yang beroperasi di kawasan urban dengan dinamika mobilitas tinggi. Saat ini, Damez beroperasi secara hibrida antara antrean langsung (*walk-in*) dan reservasi manual melalui pesan WhatsApp. Meskipun memiliki basis pelanggan setia yang kuat, model operasional manual ini menimbulkan friksi berat pada jam-jam sibuk (*peak hours*: 12:00–13:30 WIB dan 17:30–20:30 WIB).

### 1.2 Masalah Inti (The Barbershop Trilemma)
Operasional barbershop konvensional menghadapi tiga masalah struktural yang saling terkait:
1. **Ketidakpastian Antrean Fisik**: Pelanggan datang ke lokasi tanpa mengetahui waktu tunggu. Antrean fisik berkisar antara 45 hingga 90 menit menyebabkan pelanggan walk-in membatalkan niat (*walk-out*) dan beralih ke barbershop kompetitor.
2. **Tingginya Angka Ketidakhadiran (No-Show Rate ~25%)**: Pelanggan yang memesan jadwal lewat WhatsApp sering tidak hadir tanpa kabar. Karena tidak ada komitmen finansial, barber menganggur selama 45–60 menit di slot tersebut, menyebabkan potensi kerugian omzet hingga **Rp 10.800.000 per bulan**.
3. **Ketiadaan Etalase Digital & Rekap Manual**: Tidak adanya portal resmi untuk mengecek katalog harga, portofolio hasil potong, dan profil barber menurunkan kredibilitas bagi calon pelanggan baru. Pencatatan jadwal di buku/chat rawan terjadi jadwal ganda (*double booking*) dan selisih pencatatan kas harian.

### 1.3 Mengapa Sekarang? (Market Timing)
- **Adopsi QRIS Universal**: Penetrasi QRIS di Indonesia telah mencapai >90% pengguna smartphone perkotaan. Transaksi mikro (*micro-payments*) kini dapat diselesaikan dalam hitungan detik tanpa biaya admin bagi pembeli.
- **Kesiapan Konsumen untuk Self-Service**: Pelanggan urban menuntut kecepatan dan kepastian waktu. Mengisi form reservasi mandiri di web mobile jauh lebih disukai daripada percakapan bolak-balik dengan admin via chat yang lambat merespons di jam sibuk.

### 1.4 Visi Produk & Proposisi Nilai
Membangun web platform terintegrasi yang menggabungkan **Company Profile modern responsif** dengan **Sistem Online Booking instan berbasis Down Payment (DP) Flat Rp 20.000**. Sistem ini menjamin kepastian kursi bagi pelanggan (< 2 menit proses booking tanpa kewajiban registrasi akun) sekaligus melindungi pendapatan barber dari kerugian *no-show*.

---

## 2. Competitive Audit & Analisis Diferensiasi

Berdasarkan riset pasar pada `docs/research/market-services-benchmark.md`, berikut audit lanskap solusi alternatif saat ini:

| Solusi / Kompetitor | Karakteristik Alur | Fatal Flaw / Friksi Utama | Sudut Diferensiasi Damez Barbershop |
|---|---|---|---|
| **Aplikasi Jaringan Waralaba** (e.g. Captain Barbershop App) | Wajib mengunduh aplikasi native dari App Store/Play Store, wajib registrasi akun & verifikasi SMS. | *High drop-off rate* pada pelanggan kasual yang enggan menghabiskan memori HP untuk sekadar potong rambut bulanan. | **Zero-Account Web Booking**: 100% berbasis web browser mobile, tanpa instalasi aplikasi, selesai dalam 6 langkah cepat. |
| **Pemesanan Manual WhatsApp Chat** (Status Quo Barbershop Lokal) | Pelanggan chat ke nomor admin toko, menunggu balasan manual, konfirmasi jadwal secara verbal tanpa DP. | Tingkat *no-show* mencapai 25%–35%; rawan bentrok jadwal (*human error* admin); admin lambat merespons saat jam sibuk. | **Automated Slot Engine & WhatsApp Gateway**: Ketersediaan slot real-time, penguncian DP Rp 20.000 instan, notifikasi tiket otomatis via API. |
| **SaaS Booking Global** (e.g. Booksy, Fresha) | Platform agregator global berbasis langganan bulanan mahal ($29–$99/bulan) dengan konfigurasi mata uang USD. | Tidak mendukung integrasi native QRIS/E-Wallet lokal Indonesia; skema fee memotong margin tipis barbershop independen. | **Hyper-Localized Solo Stack**: Terintegrasi native Midtrans (QRIS MDR 0.7% = Rp 140/tx) dan WhatsApp Gateway lokal (Fonnte/Wablas). |

---

## 3. Target User Personas & Empathy Maps

### 3.1 Persona 1: Budi Santoso (28 Tahun) — Pelanggan (Busy Urban Professional)
- **Profil**: Karyawan swasta di kawasan perkotaan, terbiasa bertransaksi nontunai (*cashless*), mengakses internet 90% via smartphone saat istirahat kerja atau perjalanan pulang.
- **Tujuan Utama**: Ingin kepastian jadwal potong rambut di akhir pekan tanpa membuang waktu 1 jam duduk di ruang tunggu barbershop.
- **Empathy Map**:
  - **Says**: *"Gue mau potong rambut hari Sabtu jam 14.00, tapi males banget kalau harus nunggu antrean 3 orang di sofa."*
  - **Thinks**: *"Bisa nggak gue booking langsung yang pasti dapet kursi? Tapi jangan paksa gue download aplikasi atau bikin akun password baru yang ribet."*
  - **Does**: Mencari rekomendasi barbershop di Instagram/Google Maps, membuka website lewat HP, membayar via scan QRIS bank/e-wallet.
  - **Feels**: Jengkel saat antrean tidak menentu; tenang ketika menerima tiket konfirmasi WhatsApp resmi berisi jadwal pasti dan tautan lokasi.
- **Pain Points**: Waktu terbuang menunggu antrean fisik, proses registrasi akun yang berbelit-belit, ketidakjelasan harga layanan tambahan.

### 3.2 Persona 2: Rian "The Sculptor" (25 Tahun) — Senior Barber (The Craft Specialist)
- **Profil**: Tenaga ahli pangkas rambut dengan pengalaman 5 tahun, spesialis potongan *classic cuts* dan *pompadour*, fokus penuh pada teknik gunting dan kepuasan pelanggan di kursi.
- **Tujuan Utama**: Memiliki jadwal kerja harian yang teratur tanpa bentrok dan terbebas dari pelanggan yang *ghosting* / tidak hadir.
- **Empathy Map**:
  - **Says**: *"Paling nyesek itu kalau ada slot di jam 13.00 di-booking orang lewat chat, saya tolak pelanggan walk-in lain, eh orangnya malah nggak dateng sama sekali."*
  - **Thinks**: *"Saya cuma mau buka HP di sela potongan, lihat siapa pelanggan berikutnya, dan potong rambut dengan tenang tanpa drama antrean."*
  - **Does**: Melayani pelanggan di kursi, mencuci alat cukur di jeda istirahat, melirik jadwal di layar HP/tablet toko.
  - **Feels**: Dihargai jika waktu kerjanya dilindungi komitmen finansial (DP); stres jika terjadi *double booking* di kursinya.
- **Pain Points**: Kehilangan komisi akibat slot kosong *no-show*, ketidakjelasan jam istirahat akibat lonjakan pelanggan walk-in tak terduga.

### 3.3 Persona 3: Damez (35 Tahun) — Owner & Head Admin (The Business Operator)
- **Profil**: Pemilik usaha Damez Barbershop, mengelola 3 orang barber, bertanggung jawab atas arus kas, operasional toko, dan kepuasan pelanggan.
- **Tujuan Utama**: Memaksimalkan okupansi kursi harian, mengamankan arus kas, dan memantau kinerja toko tanpa pencatatan manual di buku kas.
- **Empathy Map**:
  - **Says**: *"Saya ingin sistem yang bisa jalan sendiri: pelanggan pilih slot, bayar DP, langsung masuk kalender. Kalau mereka batal mendadak, biaya operasional saya tetap terlindungi."*
  - **Thinks**: *"Berapa banyak uang yang hilang bulan lalu gara-gara no-show? Bagaimana caranya rekap keuangan otomatis selesai setiap malam?"*
  - **Does**: Mengatur jadwal libur barber, melayani pelanggan walk-in di meja depan, mengecek mutasi pembayaran DP di dashboard.
  - **Feels**: Kewalahan saat harus merekap chat WhatsApp manual; percaya diri ketika sistem berjalan otomatis dan laporan tersaji rapi.
- **Pain Points**: Selisih perhitungan uang kas, waktu habis membalas chat pertanyaan harga dan jam operasional berulang-ulang.

---

## 4. Feature Prioritization Matrix (MoSCoW Discipline)

Sesuai panduan *Ruthless MVP Scoping*, cakupan MVP dibatasi secara ketat pada **5 Fitur Utama (Must-Have)** untuk menjamin peluncuran cepat dan keandalan tinggi.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MOSCOW PRIORITIZATION                           │
├───────────────────────────────────┬────────────────────────────────────┤
│           MUST HAVE (5 Core)      │            SHOULD HAVE             │
│ 1. Public Profile & Local SEO     │ 1. Self-Service Reschedule Portal  │
│ 2. High-Conversion Booking Wizard │ 2. Multi-Barber Group Booking      │
│ 3. DP Engine & Midtrans QRIS/VA   │ 3. Automated Review Prompt WA      │
│ 4. WhatsApp Gateway Dispatcher    │                                    │
│ 5. Admin & Barber Calendar Portal │                                    │
├───────────────────────────────────┼────────────────────────────────────┤
│              COULD HAVE           │            WON'T HAVE (Scope-Out)  │
│ 1. Loyalty Points / Digital Stamp │ 1. Native Mobile App (iOS/Android) │
│ 2. Retail Merchandise E-commerce  │ 2. Customer Account & Password DB  │
│ 3. Online Full Payment Settlement │ 3. Multi-Branch Franchise System   │
│ 4. Tip Barber via E-Wallet        │ 4. Thermal Printer POS Hardware    │
└───────────────────────────────────┴────────────────────────────────────┘
```

### 4.1 Must Have (5 Fitur Inti — Day 1 Launch Baseline)
1. **F-01: Company Profile Publik & Fondasi SEO Lokal**: Landing page responsif mobile-first memuat katalog 7 layanan benchmark, profil 3 barber, galeri foto, jam operasional, kebijakan DP, dan metadata Schema.org `LocalBusiness`.
2. **F-02: Multi-step Booking Engine (< 120 Detik Tanpa Akun)**: Wizard pemilihan layanan (multi-select), pemilihan barber (spesifik atau "Siapa Saja"), pemilihan tanggal/jam dinamis, dan input data diri ringkas (Nama & WhatsApp).
3. **F-03: Mesin Down Payment (DP) Flat Rp 20.000 & Gateway Midtrans**: Penguncian slot sementara (*temporary hold* 15 menit), integrasi Midtrans Snap (QRIS & Virtual Account), dan penanganan webhook terverifikasi signature SHA-512.
4. **F-04: Dispatcher Notifikasi WhatsApp Transaksional Otomatis**: Integrasi REST API WhatsApp Gateway (Fonnte/Wablas) untuk pengiriman instan voucher booking (berisi Kode Booking unik, jadwal, dan link Google Maps), pengingat H-3 jam, dan alert pembatalan.
5. **F-05: Dashboard Admin & Kalender Operasional Barber**: Tampilan matriks slot per jam per barber, pencatatan transaksi walk-in manual, tombol aksi cepat (*Tandai Selesai*, *Tandai No-Show*), dan ekspor rekap harian format `.csv`.

### 4.2 Explicit Out-of-Scope (Yang Dilarang Dibangun pada MVP Sprint)
Untuk mencegah *scope creep*, item berikut **DILARANG KERAS** dikerjakan oleh tim *developer*:
- **Aplikasi Mobile Native**: Dilarang membangun aplikasi React Native, Flutter, atau Swift. Seluruh fungsionalitas diakses via Mobile Web PWA/Browser.
- **Sistem Akun Customer dengan Password**: Tidak ada registrasi user, login email, atau manajemen *forgot password*. Customer diidentifikasi semata-mata via nomor WhatsApp dan Kode Unik Booking.
- **Pelunasan Online Penuh**: Sisa tagihan di luar DP (misal Rp 30.000 dari total Rp 50.000) diselesaikan secara langsung di kasir toko (tunai atau QRIS toko). Tidak ada integrasi pelunasan online di web pada MVP.
- **E-Commerce Produk Retail**: Tidak melayani penjualan pomade, hair powder, atau merchandise di website.
- **Arsitektur Multi-Cabang**: Sistem dikunci khusus untuk 1 cabang Damez Barbershop dengan 3 kursi aktif.

---

## 5. User Stories & Acceptance Criteria (Format Given-When-Then)

### 5.1 Alur Pelanggan (Customer Booking & Payment Flow)

#### US-01: Eksplorasi Layanan & Multi-Selection
- **Sebagai** calon pelanggan,  
- **Saya ingin** memilih satu atau beberapa kombinasi layanan dari katalog (contoh: Haircut + Beard Grooming),  
- **Agar** saya mendapatkan estimasi total biaya dan estimasi total durasi yang akurat sebelum memesan slot.
- **Kriteria Penerimaan (Acceptance Criteria)**:
  - **Scenario 1.1**: Pemilihan satu layanan utama.
    - **Given** pengguna berada pada langkah pertama formulir pemesanan,
    - **When** pengguna memilih paket *"Gentlemen Classic Haircut"* (Rp 50.000, 45 menit),
    - **Then** ringkasan sistem menampilkan Total Durasi: 45 Menit dan Total Tagihan: Rp 50.000.
  - **Scenario 1.2**: Pemilihan kombinasi multi-layanan.
    - **Given** pengguna telah memilih *"Gentlemen Classic Haircut"*,
    - **When** pengguna mencentang layanan tambahan *"Beard Trim & Hot Towel Shave"* (Rp 35.000, 30 menit),
    - **Then** sistem memperbarui kalkulator secara reaktif menjadi Total Durasi: 75 Menit dan Total Tagihan: Rp 85.000.

#### US-02: Pemilihan Barber & Alokasi Slot Otomatis
- **Sebagai** calon pelanggan,  
- **Saya ingin** memilih barber favorit saya atau memilih opsi *"Siapa Saja yang Tersedia"*,  
- **Agar** saya memiliki fleksibilitas antara memilih kapabilitas barber tertentu atau memilih jadwal paling cepat yang tersedia.
- **Kriteria Penerimaan (Acceptance Criteria)**:
  - **Scenario 2.1**: Memilih barber spesifik.
    - **Given** pengguna memilih barber *"Rian 'The Sculptor'"*,
    - **When** pengguna membuka tab pemilihan tanggal,
    - **Then** sistem hanya menampilkan slot jam yang berstatus kosong pada kalender kerja Rian.
  - **Scenario 2.2**: Memilih opsi "Siapa Saja".
    - **Given** pengguna memilih opsi *"Siapa Saja yang Tersedia"*,
    - **When** pengguna memilih tanggal dan jam tertentu,
    - **Then** sistem secara otomatis mengalokasikan slot tersebut ke salah satu dari barber yang memiliki beban antrean paling rendah pada hari tersebut.

#### US-03: Penguncian Slot Sementara & Anti-Double Booking
- **Sebagai** calon pelanggan,  
- **Saya ingin** slot jam yang saya pilih dikunci sementara saat saya diarahkan ke pembayaran,  
- **Agar** orang lain tidak dapat merebut jadwal tersebut saat saya sedang membuka aplikasi perbankan/e-wallet.
- **Kriteria Penerimaan (Acceptance Criteria)**:
  - **Scenario 3.1**: Slot ditahan selama 15 menit dengan status pending.
    - **Given** pengguna memilih slot jam 14:00 WIB pada barber Dimas dan menekan tombol *"Lanjut ke Pembayaran"*,
    - **When** sistem membuat record booking baru di database,
    - **Then** status booking diset ke `pending_payment`, countdown timer 15 menit dimulai, dan slot jam 14:00 WIB pada barber Dimas langsung hilang dari opsi pengguna publik lainnya.
  - **Scenario 3.2**: Perebutan slot konkuren oleh dua pelanggan di milidetik yang sama.
    - **Given** Pengguna A dan Pengguna B memilih slot jam 15:00 WIB pada barber Kevin secara simultan,
    - **When** kedua transaksi checkout masuk ke server,
    - **Then** database mengunci baris dengan transaksi atomik (`SELECT FOR UPDATE`), memberikan slot kepada transaksi yang pertama kali tereksekusi, dan menolak transaksi kedua dengan pesan: *"Maaf, slot ini baru saja diambil oleh pelanggan lain. Silakan pilih slot terdekat lainnya."*

#### US-04: Penyelesaian Pembayaran DP via Midtrans QRIS/VA
- **Sebagai** calon pelanggan,  
- **Saya ingin** membayar komitmen Down Payment sebesar Flat Rp 20.000 melalui QRIS atau Virtual Account,  
- **Agar** pemesanan saya terkonfirmasi secara sah dan resmi tanpa uang tunai.
- **Kriteria Penerimaan (Acceptance Criteria)**:
  - **Scenario 4.1**: Pembayaran QRIS berhasil sebelum masa kedaluwarsa.
    - **Given** status booking berada pada `pending_payment` dengan kewajiban DP Rp 20.000,
    - **When** pengguna melakukan scan QRIS dan Midtrans mengirimkan webhook bertipe `settlement` dengan signature SHA-512 yang valid,
    - **Then** sistem mengubah status booking menjadi `confirmed`, mencatat `nominal_dp = 20000`, menghitung `sisa_pelunasan = total_harga - 20000`, menghentikan timer kedaluwarsa, dan menampilkan Kode Booking unik di layar.
  - **Scenario 4.2**: Masa tunggu pembayaran habis (Timeout > 15 Menit).
    - **Given** status booking adalah `pending_payment` dan pengguna tidak menyelesaikan pembayaran dalam 15 menit,
    - **When** cron job / background scheduler memeriksa kedaluwarsa waktu,
    - **Then** sistem mengubah status booking menjadi `expired`, membatalkan Snap token Midtrans, dan merilis kembali slot waktu tersebut ke kalender publik.

#### US-05: Penerimaan Tiket Konfirmasi WhatsApp Transaksional
- **Sebagai** pelanggan yang telah membayar DP,  
- **Saya ingin** menerima bukti reservasi instan melalui pesan WhatsApp resmi Damez Barbershop,  
- **Agar** saya memiliki pengingat tertulis yang memuat jadwal, kode booking, sisa pembayaran, dan tautan petunjuk arah Google Maps.
- **Kriteria Penerimaan (Acceptance Criteria)**:
  - **Scenario 5.1**: Dispatch pesan konfirmasi paska pembayaran sukses.
    - **Given** webhook Midtrans berhasil memvalidasi pembayaran DP,
    - **When** database mengupdate record menjadi `confirmed`,
    - **Then** sistem memicu pengiriman pesan WhatsApp via API gateway (Fonnte/Wablas) dalam waktu < 5 detik dengan format pesan terstruktur memuat Nama, Kode Booking, Barber, Waktu Layanan, Alamat, dan tautan Maps.

---

### 5.2 Alur Kebijakan Bisnis (Reschedule, Lateness & No-Show)

#### US-06: Permintaan Reschedule Jadwal (Batas H-3 Jam)
- **Sebagai** pelanggan yang berhalangan hadir pada jam yang telah dipesan,  
- **Saya ingin** mengajukan perubahan jadwal (reschedule) maksimal 3 jam sebelum waktu mulai layanan,  
- **Agar** uang DP Rp 20.000 saya tidak hangus dan dialihkan ke jadwal baru.
- **Kriteria Penerimaan (Acceptance Criteria)**:
  - **Scenario 6.1**: Reschedule diajukan sebelum H-3 jam.
    - **Given** booking berstatus `confirmed` untuk jadwal pukul 16:00 WIB,
    - **When** pelanggan menghubungi admin atau mengakses portal perubahan pada pukul 12:30 WIB (3,5 jam sebelum layanan),
    - **Then** sistem mengizinkan pemindahan slot ke jam/hari lain yang masih tersedia tanpa denda finansial, dan uang DP Rp 20.000 tetap tercatat valid.
  - **Scenario 6.2**: Reschedule diajukan kurang dari 3 jam (< H-3 jam).
    - **Given** booking berstatus `confirmed` untuk jadwal pukul 16:00 WIB,
    - **When** pelanggan meminta perubahan jadwal pada pukul 14:15 WIB (1 jam 45 menit sebelum layanan),
    - **Then** sistem menolak perubahan jadwal otomatis dan menampilkan ketentuan: *"Perubahan jadwal di bawah batas H-3 jam tidak dapat diproses. Pembatalan pada tahap ini mengakibatkan DP Rp 20.000 hangus sesuai regulasi."*

#### US-07: Penegakan Toleransi Keterlambatan (Maksimal 15 Menit) & No-Show
- **Sebagai** barber dan admin,  
- **Saya ingin** melepas slot antrean dan menyatakan status `no_show` jika pelanggan terlambat lebih dari 15 menit tanpa konfirmasi,  
- **Agar** kursi potong dapat segera dialokasikan kepada pelanggan walk-in yang sedang menunggu di toko.
- **Kriteria Penerimaan (Acceptance Criteria)**:
  - **Scenario 7.1**: Pelanggan hadir dalam toleransi 15 menit.
    - **Given** pelanggan memiliki jadwal pukul 10:00 WIB dan tiba di toko pada pukul 10:12 WIB,
    - **When** admin memverifikasi kehadiran di dashboard,
    - **Then** status booking dipertahankan dan barber langsung memulai sesi layanan.
  - **Scenario 7.2**: Pelanggan tidak hadir setelah 15 menit berlalu.
    - **Given** jadwal booking adalah pukul 10:00 WIB dan waktu telah menunjukkan pukul 10:16 WIB tanpa konfirmasi dari pelanggan,
    - **When** admin menekan tombol *"Tandai No-Show"* pada dashboard,
    - **Then** status booking berubah menjadi `no_show`, uang DP Rp 20.000 hangus menjadi pendapatan kompensasi operasional toko, dan kursi barber terbuka untuk pelanggan walk-in.

---

### 5.3 Alur Operasional Admin & Barber (Back-Office Flow)

#### US-08: Pencatatan Pelanggan Walk-in di Meja Kasir
- **Sebagai** admin/kasir Damez Barbershop,  
- **Saya ingin** menginput pemesanan walk-in langsung dari dashboard,  
- **Agar** slot kursi yang sedang dipakai pelanggan walk-in secara otomatis tertutup pada kalender online publik.
- **Kriteria Penerimaan (Acceptance Criteria)**:
  - **Scenario 8.1**: Penguncian slot instan untuk tamu walk-in.
    - **Given** admin membuka modal *"Input Walk-in"*,
    - **When** admin memilih barber yang tersedia dan layanan yang diminta, lalu mengklik *"Mulai Layanan Sekarang"*,
    - **Then** sistem membuat record booking bertipe `walk_in` dengan status langsung `in_progress`, tanpa kewajiban gateway DP, dan slot waktu tersebut langsung terkunci di website publik.

#### US-09: Penyelesaian Layanan & Pelunasan Kasir Fisik
- **Sebagai** admin/barber,  
- **Saya ingin** menandai layanan telah selesai dan mencatat pelunasan sisa tagihan di kasir,  
- **Agar** data keuangan harian terekam akurat antara DP online dan pelunasan fisik.
- **Kriteria Penerimaan (Acceptance Criteria)**:
  - **Scenario 9.1**: Penyelesaian pemesanan online dengan pemotongan DP.
    - **Given** pelanggan memesan layanan total Rp 50.000 dengan DP terbayar Rp 20.000,
    - **When** cukur selesai dan pelanggan membayar sisa Rp 30.000 secara tunai/QRIS toko, lalu admin mengklik *"Tandai Selesai"*,
    - **Then** sistem mengubah status booking menjadi `completed`, mencatat `metode_pelunasan_sisa = 'tunai'`, dan memasukkan nominal Rp 30.000 ke rekap kas harian.

#### US-10: Ekspor Laporan Rekap Keuangan Harian
- **Sebagai** pemilik usaha (Owner),  
- **Saya ingin** mengunduh laporan rekapitulasi harian dan bulanan dalam format `.csv`,  
- **Agar** saya dapat mengevaluasi perolehan omzet total, akumulasi DP online, dan distribusi beban kerja per barber.
- **Kriteria Penerimaan (Acceptance Criteria)**:
  - **Scenario 10.1**: Unduh data laporan periodik.
    - **Given** owner memilih rentang tanggal 1 Oktober s/d 31 Oktober di tab Laporan,
    - **When** owner mengklik tombol *"Ekspor CSV"*,
    - **Then** sistem menghasilkan file CSV berisi rincian: Tanggal, Kode Booking, Nama Pelanggan, Barber, Layanan, Status, Nominal DP, Sisa Pelunasan, dan Total Omzet.

---

## 6. Business Rules & Edge Cases

### 6.1 Regulasi Finansial Down Payment (DP)
1. **Nominal Tetap**: Besaran DP dikunci mutlak pada **Flat Rp 20.000 per booking**, terlepas dari apakah pelanggan memilih 1 layanan atau paket kombo senilai Rp 95.000.
2. **Pemotongan Otomatis**: DP Rp 20.000 dipotong langsung saat perhitungan sisa tagihan pelunasan:
   $$\text{Sisa Pelunasan} = \text{Total Harga Layanan} - \text{Rp } 20.000$$
3. **Klausul No-Show & Pembatalan Terlambat**: Uang DP Rp 20.000 dinyatakan **hangus** sepenuhnya (*non-refundable*) jika:
   - Pelanggan tidak hadir (*no-show*) dan melewati toleransi keterlambatan 15 menit.
   - Pelanggan membatalkan reservasi kurang dari 3 jam sebelum jadwal (< H-3 jam).
4. **Alokasi Dana DP Hangus**: Dana DP yang hangus dialokasikan sebagai kompensasi waktu kerja barber (50%) dan penggantian biaya operasional toko (50%).

### 6.2 Manajemen Konkurensi & Double-Booking
1. **Pencegahan Tingkat Database**: Validasi ketersediaan slot tidak boleh hanya bergantung pada *state* UI frontend. Database Supabase PostgreSQL wajib mengimplementasikan:
   - Penguncian baris eksplisit (`SELECT ... FOR UPDATE`) pada tabel `bookings` saat checkout dimulai.
   - *Exclusion Constraint* berbasis rentang waktu (`tsrange`) per barber:
     ```sql
     -- Konsep constraint: Mencegah overlapping waktu untuk barber yang sama pada status aktif
     EXCLUDE USING gist (
       barber_id WITH =,
       tstzrange(waktu_mulai, waktu_selesai) WITH &&
     ) WHERE (status IN ('confirmed', 'pending_payment'));
     ```
2. **Time-To-Live (TTL) Penguncian Sementara**: Slot berstatus `pending_payment` memiliki batas waktu hidup tepat **15 menit (900 detik)**. Jika dalam 900 detik webhook konfirmasi belum diterima, fungsi *cron/trigger* otomatis mengembalikan slot ke status `expired` dan membebaskannya kembali ke publik.

### 6.3 Penanganan Kegagalan Webhook & Keandalan Jaringan
1. **Verifikasi Tanda Tangan Digital (Signature Check)**: Webhook handler Midtrans wajib memvalidasi hash SHA-512 sebelum memproses *payload*:
   $$\text{Signature} = \text{SHA512}(\text{order\_id} + \text{status\_code} + \text{gross\_amount} + \text{ServerKey})$$
   Jika signature tidak cocok, request ditolak dengan kode `HTTP 401 Unauthorized` untuk mencegah injeksi pembayaran palsu.
2. **Idempotensi Webhook**: Endpoint webhook wajib bersifat idempoten. Jika Midtrans mengirimkan notifikasi retry untuk transaksi yang statusnya sudah `confirmed` atau `settlement`, handler langsung mengembalikan respon `HTTP 200 OK` tanpa memicu pembaruan data atau pengiriman WhatsApp ganda.
3. **Failover WhatsApp Gateway**: Jika API WhatsApp (Fonnte/Wablas) mengalami kendala jaringan atau nomor pelanggan tidak valid:
   - Kegagalan pengiriman WA **tidak boleh** membatalkan status `confirmed` pada transaksi pembayaran yang sah.
   - Catat status pengiriman di tabel `notification_logs` dengan status `failed` beserta pesan error.
   - Tampilkan peringatan (*alert badge*) pada dashboard admin agar admin dapat mengonfirmasi pelanggan via telepon darurat jika diperlukan.

### 6.4 Standar Integritas Zona Waktu
Seluruh komputasi slot waktu, batas waktu kedaluwarsa, filter kalender, dan pencatatan database wajib dikunci secara baku pada zona waktu Indonesia Barat: **`Asia/Jakarta` (WIB / UTC+07:00)**. Tidak diperkenankan melakukan pergeseran zona waktu di sisi client browser pengguna.

---

## 7. Arsitektur Teknis & Stack Trade-off Matrix

### 7.1 Matriks Evaluasi Stack: Serverless Modern vs Monolith Konvensional

| Dimensi Evaluasi | Opsi A: Modern Integrated Serverless (Next.js 15 + Supabase) **[TERPILIH]** | Opsi B: Traditional Monolith (Node.js/Express + VPS PostgreSQL) | Rasional Keputusan Lead Strategist |
|---|---|---|---|
| **Kompleksitas Setup** | **Rendah (Low)**: Satu repositori monolitik frontend + Server Actions backend, skema database terkelola di Supabase Cloud. | **Tinggi (High)**: Pengelolaan server VPS Linux, konfigurasi Nginx reverse proxy, PM2 process manager, sertifikat SSL manual. | Opsi A memangkas beban devops untuk tim pengembang tunggal/kecil (*zero devops overhead*). |
| **Estimasi Biaya Bulanan** | **Rp 0 – Rp 150.000 / bulan** (Free Tier Vercel + Free Tier Supabase PostgreSQL mencakup kapasitas hingga 50.000 MAU). | **Rp 180.000 – Rp 350.000 / bulan** (Biaya sewa VPS DigitalOcean/Linode 2GB RAM + Managed Database). | Opsi A memaksimalkan efisiensi biaya operasional tahap peluncuran MVP. |
| **Keamanan & Autentikasi** | **Native Built-in**: Supabase Auth (JWT) dengan *Row-Level Security* (RLS) bawaan PostgreSQL. | **Manual Custom**: Wajib menulis middleware JWT, session store, dan hashing password secara manual. | Opsi A mengurangi celah kerentanan keamanan pada otentikasi dashboard admin. |
| **Kesesuaian Profil Solo Builder** | **Skor: 9.5 / 10** (Sangat Sesuai untuk kecepatan rilis 7–14 hari). | **Skor: 6.0 / 10** (Terlalu banyak boilerplate dan risiko konfigurasi infrastruktur). | Fokus penuh pada *business logic* dan validasi nilai pengguna. |

### 7.2 Spesifikasi Detail Stack Terpilih (The Zero-Overhead Solo Stack)
- **Framework Frontend**: Next.js 15 (App Router), React 19, TypeScript.
- **Styling & UI Components**: Tailwind CSS v3/v4, Lucide React Icons, Shadcn UI (Radix Primitives).
- **Backend Runtimes**: Next.js Server Actions & API Route Handlers (Edge & Node.js Serverless Functions).
- **Database & Auth**: Supabase PostgreSQL dengan ekstensi `btree_gist` untuk constraint rentang waktu, Supabase Auth untuk proteksi dashboard admin.
- **Payment Gateway**: Midtrans Snap API (Mendukung QRIS universal & Virtual Account perbankan utama).
- **Notifikasi Transaksional**: WhatsApp Gateway REST API (Fonnte / Wablas).
- **Hosting & Deploy**: Vercel Serverless Platform dengan integrasi otomatis GitHub CI/CD.

---

## 8. Persyaratan Non-Fungsional & Guardrails (NFR)

### 8.1 Kinerja Antarmuka & Core Web Vitals (Mobile-First SLA)
- **Largest Contentful Paint (LCP)**: < 2.2 detik pada jaringan 4G mobile standar.
- **First Contentful Paint (FCP)**: < 1.0 detik.
- **Cumulative Layout Shift (CLS)**: < 0.05 (mencegah tombol bergeser saat gambar dimuat).
- **Time to Interactive (TTI)**: < 2.8 detik di perangkat smartphone menengah (*mid-range* Android).
- **Lighthouse Performance Score**: Target nilai >= 90 pada mode Mobile Audit.

### 8.2 Kinerja API & Latensi Sistem
- **Latensi Query Slot Ketersediaan (`/api/slots/available`)**: < 350 ms pada kondisi beban puncak.
- **Latensi Pembuatan Token Pembayaran (`/api/booking/checkout`)**: < 1.200 ms (termasuk round-trip handshake ke server Midtrans).
- **Latensi Eksekusi Webhook Payment**: Respons `HTTP 200` dikembalikan ke Midtrans dalam waktu < 800 ms.

### 8.3 Keamanan Sistem & Pencegahan Fraud
- **Proteksi Brute-Force & Bot**: Pembatasan laju pemanggilan (*rate limiting*) pada endpoint pemesanan maksimal 10 request per menit per alamat IP.
- **Sanitasi Data Masukan**: Sanitasi ketat terhadap input nama dan nomor telepon untuk mencegah serangan Cross-Site Scripting (XSS) dan SQL Injection.
- **Otentikasi Dashboard Admin**: Proteksi multi-faktor atau password kuat via Supabase Auth; seluruh endpoint admin diisolasi melalui middleware verifikasi sesi server-side.

### 8.4 Kepatuhan Regulasi Privasi (UU Perlindungan Data Pribadi No. 27/2022)
- **Prinsip Minimalisasi Data**: Sistem dilarang meminta data yang tidak esensial bagi layanan pemotongan rambut. Hanya mengumpulkan dua atribut data customer: **Nama Panggilan/Lengkap** dan **Nomor WhatsApp**. Tidak ada pengumpulan NIK KTP, tanggal lahir, maupun alamat rumah.
- **Consent Checkbox Wajib**: Menyediakan klausul persetujuan eksplisit pada layar checkout sebelum pembayaran DP:
  > *"Saya menyetujui nomor WhatsApp saya digunakan oleh Damez Barbershop untuk pengiriman konfirmasi jadwal dan pengingat pemesanan sesuai Kebijakan Privasi."*
- **Akses Terisolasi**: Akses terhadap nomor telepon pelanggan dilindungi oleh Row-Level Security (RLS) database dan hanya dapat dilihat oleh akun admin terverifikasi.

---

## 9. Success Metrics & Metrik Evaluasi Produk (KPIs)

Semua evaluasi keberhasilan produk diukur secara kuantitatif melalui telemetri:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        METRICS HIERARCHY TREE                          │
├────────────────────────────────────────────────────────────────────────┤
│                       NORTH STAR METRIC                                │
│       Tingkat Penyelesaian Booking Bebas No-Show (>= 90%)              │
├───────────────────────────────────┬────────────────────────────────────┤
│         LEADING INDICATORS        │         LAGGING INDICATORS         │
│ • Rasio Konversi Booking (>= 18%) │ • No-Show Rate Turun ke < 6%       │
│ • Rata-rata Durasi Booking < 120s │ • Omzet Terselamatkan >= Rp 9.5jt  │
│ • Rasio Pembayaran QRIS >= 95%    │ • Kapasitas Terisi >= 80% / hari   │
├───────────────────────────────────┴────────────────────────────────────┤
│                       GUARDRAIL METRICS (Zero-Tolerance)               │
│ • Insiden Double Booking: 0 Kasus (0.00%)                              │
│ • Error Rate Webhook Idempotency: < 0.1%                               │
│ • Keterlambatan Notifikasi WhatsApp: < 10 Detik Paska Lunas            │
└────────────────────────────────────────────────────────────────────────┘
```

1. **North Star Metric**:  
   **Tingkat Penyelesaian Janji Temu Bebas No-Show (Completed Appointment Rate >= 90%)**  
   Jumlah booking berstatus `completed` dibagi dengan total booking berstatus `confirmed` dalam 1 bulan kalender.
2. **Leading Indicators (Indikator Pendorong Cepat)**:
   - **Booking Flow Conversion Rate**: >= 18% pengunjung landing page yang mengklik CTA berhasil menuntaskan pembayaran DP.
   - **Mobile Booking Velocity**: Rata-rata durasi penyelesaian pemesanan dari langkah 1 hingga tiket terbit < 120 detik.
   - **Payment Drop-off Rate**: < 10% transaksi yang telah masuk status `pending_payment` berakhir kedaluwarsa (`expired`).
3. **Lagging Indicators (Hasil Finansial & Operasional Akhir)**:
   - **Penurunan Kasus No-Show**: Menurunkan angka ketidakhadiran dari baseline 25% industri menjadi **< 6%**.
   - **Nilai Omzet Terselamatkan (Net Recovered Revenue)**: Mengamankan potensi kerugian omzet sebesar **Rp 9.500.000 – Rp 10.200.000 per bulan**.
   - **Tingkat Utilisasi Kursi Harian**: Okupansi slot terisi mencapai minimal 22 dari 27 total slot kapasitas harian toko (>= 80%).
4. **Guardrail Metrics (Metrik Pengaman Tanpa Toleransi)**:
   - **Double-Booking Incident**: Wajib **0 Kasus (0.00%)**. Jika terjadi 1 kasus bentrok jadwal, sistem dinyatakan gagal audit integritas.
   - **Webhook Failure Rate**: < 0.1% dari seluruh notifikasi Midtrans yang masuk.
   - **Ketepatan Waktu Rilis Slot Kedaluwarsa**: 100% slot yang tidak dibayar dalam 15 menit wajib terbuka kembali secara otomatis.

---

## 10. Phased Implementation Roadmap & Governance (M0–M6)

Dokumen PRD ini menjadi acuan mutlak bagi eksekusi tugas-tugas pada Kanban Board sistem Damez Barbershop:

- **Milestone 0: Discovery & Scope Baseline (Status: SELESAI & TERKUNCI)**
  - `M0-01`: Finalisasi WBS & Dependency Linkage (Selesai).
  - `M0-02`: PRD v1.0 & Scope Baseline MVP (Dokumen ini — Disahkan).
  - `M0-03`: Riset Pasar Barbershop & Struktur 7 Layanan Seeding (Selesai).
  - `M0-04`: Audit Teknis Fee Gateway Midtrans & Integrasi WA API (Selesai).
  - `M0-05`: Model Kapasitas Slot (27–29 Slot/Hari) & Simulasi Finansial DP (Selesai).
  - `M0-06`: Quality Gate Review M0 & Handoff Sign-off.
- **Milestone 1: Design System & Wireframing**
  - Pemetaan alur perjalanan pengguna (*User Journey Map*), pembuatan design token Tailwind/Shadcn, wireframe mobile-first, dan interaksi countdown timer 15 menit.
- **Milestone 2: Copywriting & Content Engineering**
  - Teks persuasif landing page, narasi craftsmanship, mikro-copy FAQ kebijakan DP Rp 20.000, serta panduan SOP operasional admin/barber.
- **Milestone 3: Core Implementation & Supabase Schema**
  - Migrasi DDL database PostgreSQL Supabase dengan *range exclusion constraints*, slicing UI company profile, dan logic engine slot waktu `Asia/Jakarta`.
- **Milestone 4: Down Payment Engine, Midtrans & Slot Locking**
  - Integrasi Midtrans Snap QRIS/VA, mesin auto-expire TTL 15 menit, verifikasi webhook SHA-512 idempoten, dan pengujian beban konkurensi anti-double booking.
- **Milestone 5: Admin Portal, WhatsApp Dispatcher & E2E QA**
  - Dashboard kalender interaktif admin/barber, integrasi API WhatsApp Fonnte/Wablas, automated E2E testing, dan runbook deployment.
- **Milestone 6: Production Launch & Telemetry Tracking**
  - Deploy produksi di platform cloud, konfigurasi domain & SSL HTTPS, pemasangan dashboard analitik konversi & no-show, dan audit final Definition of Done (DoD).

---

## 11. Sign-off & Quality Gate Baseline

Dokumen PRD v1.0 ini mengikat seluruh peran agen spesialis (`designer`, `writer`, `coder`, `researcher`, `orchestrator`). Segala bentuk penambahan fitur di luar dokumen ini dikategorikan sebagai *scope creep* dan dilarang diimplementasikan pada siklus MVP.

- **Disahkan Oleh**: Chief Product Officer & Lead Product Strategist  
- **Disetujui Oleh**: Project Owner Damez Barbershop  
- **Tanggal Efektif**: 23 Oktober 2026  
- **Hash Dokumen & Verifikasi**: Baseline Dikunci untuk Handoff Milestone 1
