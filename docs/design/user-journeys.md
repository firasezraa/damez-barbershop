# User Journey Mapping — Customer Mobile & Admin Operations
## Damez Barbershop Web Platform (MVP Baseline)

> **Dokumen**: User Journey Mapping Specification (Customer Mobile & Admin Operations)  
> **Status**: APPROVED & LOCKED (Spesifikasi Handoff Milestone 1 & Milestone 2)  
> **Penulis**: Chief Product Officer & Lead Product Strategist (`product:persona-story`)  
> **Target Pengguna**: Tim UI/UX (`designer:wireframe`, `designer:interaction`), Content/Copywriting (`writer`), dan Fullstack Engineering (`coder`)  
> **Klasifikasi**: Standard Operating Product Requirement (SOPR)  
> **Repositori**: `C:/Users/Acer/OneDrive/Desktop/DamezBarber/docs/design/user-journeys.md`  
> **Referensi Hulu**: `docs/PRD.md`, `docs/research/market-services-benchmark.md`, `docs/research/slot-capacity-and-noshow-model.md`, `docs/reports/M0-quality-gate-report.md`

---

## 1. Executive Summary & Arsitektur Perjalanan Pengguna

Dokumen ini mendefinisikan pemetaan terperinci mengenai interaksi manusia dan sistem pada **Damez Barbershop Web Platform**. Berakar pada temuan empiris *The Barbershop Trilemma* (ketidakpastian antrean fisik, angka *no-show* 25%, dan friksi reservasi manual via chat), sistem ini membagi pengalaman pengguna ke dalam dua pilar arsitektur utama:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           DAMEZ BARBERSHOP USER JOURNEY ARCHITECTURE                            │
├────────────────────────────────────────────────┬────────────────────────────────────────────────┤
│       PILAR 1: CUSTOMER MOBILE WEB (< 120s)     │      PILAR 2: ADMIN TABLET / DESK OPERATIONS   │
├────────────────────────────────────────────────┼────────────────────────────────────────────────┤
│ • Zero-Account / Zero-Download                 │ • Single-Screen Timeline Calendar Grid         │
│ • Thumb-Friendly Mobile Viewport (360px–430px) │ • Quick Triage & 1-Klik Mutasi Status          │
│ • 7-Step High-Velocity Booking Funnel          │ • Input Walk-In Instan (< 15 detik)            │
│ • Penguncian Slot Atomik & DP Flat Rp 20.000  │ • Penegakan Otomatis Toleransi 15 Mnt & H-3 Jam│
│ • Auto-Confirm Tiket & Dispatch WhatsApp SLA<5s│ • Kasir Fisik & Rekap Kas Otomatis (.CSV)      │
└────────────────────────────────────────────────┴────────────────────────────────────────────────┘
```

### 1.1 Metrik Sasaran Pengalaman Pengguna (UX Target Metrics)
1. **Customer Booking Velocity**: Total durasi dari landing page hingga terbit kode tiket **< 120 detik** pada koneksi 4G mobile standar.
2. **Booking Completion Rate**: >= 18% pengunjung unik yang mengklik CTA berhasil menuntaskan pembayaran DP Rp 20.000.
3. **Admin Operation Speed**: Penginputan tamu *walk-in* selesai dalam **< 15 detik**; perubahan status janji temu selesai dalam **1 klik (< 2 detik)**.
4. **Zero Double-Booking Guarantee**: Insiden bentrok jadwal **0 Kasus (0.00%)** melalui penguncian sementara (*temporary hold* 15 menit) dan database constraint PostgreSQL `tsrange`.

---

## 2. Profil Persona, Model Mental & Konteks Empati

Pemetaan perjalanan dibangun di atas 3 persona representatif yang berinteraksi dalam ekosistem Damez Barbershop:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       TRI-PERSONA MATRIX                                        │
├──────────────────────────┬───────────────────────────────┬──────────────────────────────────────┤
│ Budi Santoso (28 Thn)    │ Rian Pratama (25 Thn)         │ Damez (35 Thn)                       │
│ Pelanggan (Urban Pro)    │ Senior Master Barber          │ Owner & Head Admin                   │
├──────────────────────────┼───────────────────────────────┼──────────────────────────────────────┤
│ Perangkat: Smartphone 4G │ Perangkat: Mobile Phone / Bar │ Perangkat: iPad 10.2" & Desktop PC   │
│ Mindset: Butuh kepastian │ Mindset: Fokus pada gunting,  │ Mindset: Mengamankan omzet, kendali  │
│ waktu, anti antre & akun │ benci jadwal bentrok/no-show  │ kasir, operasional rapi tanpa drama  │
└──────────────────────────┴───────────────────────────────┴──────────────────────────────────────┘
```

### 2.1 Persona 1: Budi Santoso — The Busy Urban Professional (Pelanggan)
- **Latar Belakang**: Profesional muda, bekerja 45–50 jam/minggu di area perkotaan. Mengakses web saat jam makan siang atau dalam perjalanan pulang komuter.
- **Tujuan Utama**: Memotong rambut akhir pekan dengan jam pasti, tanpa menunggu giliran 1 jam di sofa, dan tanpa diwajibkan registrasi akun atau mengunduh aplikasi native.
- **Karakteristik Interaksi**: Membuka tautan dari Google Maps atau Instagram, menggunakan satu tangan (*thumb-driven navigation*), membayar langsung via QRIS e-wallet (GoPay/OVO/BCA).
- **Empathy Map**:
  - *Says*: "Saya cuma punya waktu 1 jam sebelum meeting atau acara keluarga, tolong jangan buat saya menunggu."
  - *Thinks*: "Apakah slot ini benar-benar dikunci untuk saya setelah saya bayar DP?"
  - *Feels*: Cemas terhadap antrean fisik tak menentu; lega dan percaya diri saat menerima voucher resmi via WhatsApp.
  - *Pain Points*: Form pengisian yang panjang, keharusan mengingat password baru, dan proses pembayaran yang lambat.

### 2.2 Persona 2: Rian Pratama ("The Sculptor") — Senior Master Barber (Penyedia Layanan)
- **Latar Belakang**: Barber senior dengan pengalaman 6 tahun, spesialis *classic cuts* dan *pompadour*. Mengelola kursi 1 di Damez Barbershop bersama Dimas Arisandi (Kursi 2) dan Kevin Sanjaya (Kursi 3).
- **Tujuan Utama**: Bekerja sesuai ritme terencana, memiliki waktu istirahat yang teratur (*staggered breaks*), dan mendapatkan kompensasi penuh jika pelanggan membatalkan sepihak.
- **Karakteristik Interaksi**: Mengecek jadwal harian di sela-sela pembersihan alat cukur melalui layar tablet toko atau ponselnya.
- **Empathy Map**:
  - *Says*: "Tolong hargai waktu persiapan dan alat-alat cukur kami."
  - *Thinks*: "Semoga pelanggan jam 14:00 datang tepat waktu agar ritme kerja hari ini tidak berantakan."
  - *Feels*: Kecewa jika slot kosong karena pelanggan *ghosting*; termotivasi jika kursi terisi stabil.

### 2.3 Persona 3: Damez — Owner & Head Admin (Operator Bisnis)
- **Latar Belakang**: Pendiri sekaligus pengelola operasional harian Damez Barbershop. Bertanggung jawab atas meja depan (*front desk*), penerimaan kasir, dan pengawasan 3 barber.
- **Tujuan Utama**: Menjaga tingkat utilisasi kursi >= 80% (minimal 22 slot terisi dari kapasitas 27 slot harian), mengeliminasi kerugian *no-show*, dan menutup buku kas harian tanpa selisih hitung.
- **Karakteristik Interaksi**: Mengoperasikan tablet yang terpasang di meja kasir dengan dudukan (*stand*), multitasking antara menyambut pelanggan fisik (*walk-in*) dan memantau slot masuk.
- **Empathy Map**:
  - *Says*: "Sistem harus memberi tahu saya dengan jelas siapa yang sudah datang, siapa yang telat, dan sisa uang kas yang harus ditagih."
  - *Thinks*: "Apakah hari ini ada kursi menganggur yang bisa saya tawarkan ke pelanggan walk-in?"
  - *Feels*: Kewalahan jika harus membuka banyak chat WhatsApp; puas saat melihat matriks kalender tersinkronisasi otomatis.

---

## 3. Journey 1: Customer Mobile Booking & Payment (< 120 Detik)

Alur pemesanan pelanggan dirancang tanpa hambatan pendaftaran akun (*Zero-Account Friction*), memandu pengguna melalui **7 langkah linier modular**. Setiap langkah didesain ramah jempol (*thumb-friendly zone*) dengan batas interaksi minimal.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                       CUSTOMER MOBILE BOOKING FUNNEL (7 MODULAR STEPS)                          │
├─────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬────────────┤
│ Step 1  │ Step 2       │ Step 3       │ Step 4       │ Step 5       │ Step 6       │ Step 7     │
├─────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼────────────┤
│ Landing │ Multi-Select │ Pilih Barber │ Pilih Tgl &  │ Data Kontak  │ Review DP &  │ Bayar QRIS │
│ Profile │ Layanan (1-2)│ Favorit / Any│ Slot Jam     │ & Consent PDP│ Hold 15 Mnt  │ & Tiket WA │
└─────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴────────────┘
```

---

### Step 1: Landing Page Discovery & Call-to-Action (CTA)

#### 1.1 User Mindset & Emotional State
Pengguna tiba di situs web Damez Barbershop (melalui tautan Google Maps, Instagram Bio, atau pencarian lokal). Pengguna mencari bukti kredibilitas: melihat lokasi, suasana toko, rentang harga, dan menginginkan akses pemesanan instan tanpa navigasi rumit.

#### 1.2 Komponen UI & Layout Mobile (Breakpoint 360px–430px)
- **Top Navigation**: Logo Damez Barbershop (kiri), Status Toko Real-Time Badge `"Buka Sekarang (10:00 - 21:00 WIB)"` (kanan).
- **Hero Section**: Tagline maskulin klasik *"Crafted Grooming for Gentlemen"*, foto atmosfer barbershop beresolusi teroptimasi WebP, dan rating Google Review *"4.9 ★ (320+ Ulasan)"*.
- **Primary Sticky Floating CTA**: Tombol kontras tinggi di bagian bawah viewport mobile (tinggi 52px, z-index 50): `"Booking Jadwal Sekarang — Mulai DP Rp 20rb"`.
- **Informasi Cepat**: 3 pilar penenang rasa cemas: *"Tanpa Perlu Akun"*, *"Jaminan Kursi Pasti"*, *"QRIS Instan"*.

#### 1.3 Alur Happy Path
1. Pengguna membuka URL website di browser mobile (Safari/Chrome). Halaman memuat dalam < 1.5 detik (LCP target).
2. Pengguna melakukan *scroll* cepat selama 5–10 detik melihat preview interior, lokasi peta, dan 3 profil master barber.
3. Pengguna menekan tombol primer `"Booking Jadwal Sekarang"`.
4. Halaman bertransisi secara mulus (*smooth transition*) membuka modal/wizard Step 2 tanpa *full-page reload*.

#### 1.4 Alur Alternatif (Alternative Paths)
- **Alt-1A (Scroll ke Daftar Layanan Dahulu)**: Pengguna melakukan scroll ke bagian katalog layanan di landing page, melihat kartu layanan `"Gentlemen Classic Haircut"`, dan mengklik tombol `"Pilih Layanan Ini"` pada kartu tersebut. Sistem langsung membuka wizard Step 2 dengan paket tersebut sudah dalam kondisi tercentang (*pre-selected*).
- **Alt-1B (Cek Lokasi Google Maps)**: Pengguna mengklik ikon peta atau alamat di footer untuk membuka aplikasi Google Maps navigasi arah, lalu kembali ke browser untuk memulai booking.

#### 1.5 Edge Cases & Error States
- **Edge-1.1 (Toko Sedang Libur / Luar Jam Operasional)**: Jika pengguna mengakses web pada pukul 23:00 WIB, badge status menampilkan `"Toko Tutup — Reservasi Dibuka untuk Besok"`. Tombol booking tetap aktif dan mengarahkan kalender default ke hari berikutnya.
- **Edge-1.2 (Koneksi Internet Lambat / Mode Hemat Data)**: Aset gambar hero digantikan oleh background placeholder warna solid (Tailwind `bg-zinc-900`) dengan tipografi tajam, sehingga CTA interaktif tetap dapat diklik dalam < 1.0 detik tanpa terhalang unduhan aset berat.

#### 1.6 Data Exchange & State Transition
- **Client State**: Inisialisasi store booking (`bookingStore.currentStep = 1`).
- **Network / API**: Static site fetch (`/`) via Edge CDN Vercel.

#### 1.7 Acceptance Criteria (Given-When-Then)
```gherkin
Given pengguna membuka halaman utama website Damez Barbershop melalui browser smartphone,
When pengguna menekan tombol floating CTA "Booking Jadwal Sekarang",
Then sistem membuka layar pemilihan layanan (Step 2) dalam waktu < 200 milidetik tanpa memuat ulang browser.
```

---

### Step 2: Pemilihan Layanan & Multi-Selection (1–2 Layanan)

#### 2.1 User Mindset & Emotional State
Pengguna ingin melihat daftar paket secara transparan, memahami apa saja yang didapat, berapa durasi pengerjaannya, dan berapa biaya totalnya tanpa biaya tersembunyi.

#### 2.2 Komponen UI & Layout Mobile
- **Step Indicator Header**: Bar progres visual `"Langkah 1 dari 5: Pilih Layanan"`.
- **Katalog Layanan Bertingkat (Card List)**: Menampilkan 8 paket layanan terverifikasi (dari `docs/research/market-services-benchmark.md`), antara lain:
  - `SRV-01`: Gentlemen Classic Haircut (Rp 50.000, 45 mnt) — *Badge "Paling Populer"*.
  - `SRV-02`: Kids Gentle Cut (Rp 40.000, 35 mnt).
  - `SRV-03`: Express Clean Cut & Wash (Rp 40.000, 30 mnt).
  - `SRV-04`: Beard Trim & Hot Towel Shave (Rp 35.000, 30 mnt).
  - `SRV-05`: Scalp Treatment & Anti-Dandruff (Rp 45.000, 35 mnt).
  - `SRV-06`: Hair Color Camo / Grey Blending (Rp 75.000, 50 mnt).
  - `SRV-07`: Royal Shave & Facial Massage (Rp 50.000, 40 mnt).
  - `SRV-08`: Signature Executive Combo (Rp 95.000, 60 mnt) — *Badge "Nilai Terbaik"*.
- **Floating Cart Summary Bar**: Bar ringkasan mengambang di bawah yang reaktif memperbarui: `[N] Layanan Dipilih | Estimasi Durasi: [X] Menit | Total: Rp [Y]`.
- **Tombol Lanjut**: `"Lanjut Pilih Barber (1/5)"` (Disabled jika 0 layanan dipilih; Enabled jika >= 1 layanan dipilih).

#### 2.3 Alur Happy Path
1. Pengguna memilih kartu layanan utama `SRV-01: Gentlemen Classic Haircut` (Rp 50.000, 45 mnt) dengan mengetuk kartu.
2. Kartu berubah status menjadi aktif (border warna tembaga/emas, ikon centang aktif).
3. Pengguna ingin menambah perawatan jenggot, lalu mengetuk `SRV-04: Beard Trim & Hot Towel Shave` (Rp 35.000, 30 mnt).
4. Floating bar secara instan mengalkulasi: **2 Layanan | Durasi: 75 Menit | Estimasi: Rp 85.000**.
5. Pengguna menekan tombol `"Lanjut Pilih Barber"`.

#### 2.4 Alur Alternatif (Alternative Paths)
- **Alt-2A (Pemilihan Tunggal Cepat)**: Pengguna hanya memilih satu paket kombo lengkap `SRV-08: Signature Executive Combo` (Rp 95.000, 60 mnt) dan langsung menekan tombol lanjut tanpa menambah layanan lain.
- **Alt-2B (Membatalkan Salah Satu Pilihan)**: Pengguna mengetuk kembali kartu yang telah terpilih untuk mendeselesi. Kalkulator durasi dan harga berkurang seketika.

#### 2.5 Edge Cases & Error States
- **Edge-2.1 (Batas Maksimal Multi-Selection)**: Untuk mencegah durasi layanan melebihi batas operasional slot tunggal (maksimal 90 menit), sistem membatasi pemilihan maksimal **2 layanan komplementer** atau **1 layanan signature combo**. Jika pengguna mencoba memilih layanan ketiga, sistem menampilkan toast info halus: *"Maksimal 2 layanan per sesi reservasi untuk menjaga ketepatan waktu antrean."*
- **Edge-2.2 (Pengguna Belum Memilih Layanan)**: Tombol lanjut tetap berstatus disabled dengan opacity 50%. Jika pengguna mengetuk tombol disabled, muncul getaran visual halus (*shake animation*) pada kartu layanan teratas dengan teks: *"Silakan pilih minimal 1 layanan."*

#### 2.6 Data Exchange & State Transition
- **Client State**:
  ```json
  {
    "selectedServices": [
      {"id": "SRV-01", "name": "Gentlemen Classic Haircut", "price": 50000, "duration": 45},
      {"id": "SRV-04", "name": "Beard Trim & Hot Towel Shave", "price": 35000, "duration": 30}
    ],
    "totalDuration": 75,
    "totalEstimatedPrice": 85000
  }
  ```

#### 2.7 Acceptance Criteria (Given-When-Then)
```gherkin
Given pengguna berada di langkah pemilihan layanan (Step 2),
When pengguna memilih "Gentlemen Classic Haircut" (Rp 50.000, 45 mnt) dan "Beard Trim" (Rp 35.000, 30 mnt),
Then kalkulator ringkasan menampilkan total 2 layanan, estimasi durasi 75 menit, total harga Rp 85.000, dan tombol lanjut menjadi aktif.
```

---

### Step 3: Pemilihan Barber (Barber Spesifik vs "Siapa Saja")

#### 3.1 User Mindset & Emotional State
Pengguna mungkin sudah memiliki barber langganan yang cocok dengan potongan rambutnya, atau pengguna hanya mementingkan kecepatan dan fleksibilitas jadwal sehingga tidak masalah ditangani oleh siapa saja.

#### 3.2 Komponen UI & Layout Mobile
- **Step Indicator Header**: Bar progres `"Langkah 2 dari 5: Pilih Barber"`.
- **Kartu Opsi Default "Siapa Saja yang Tersedia" (Recommended)**:
  - Ikon avatar gabungan, label *"Siapa Saja yang Tersedia (Jadwal Tercepat)"*, sub-label *"Kami pilihkan barber terbaik dengan slot terluang"*.
- **Daftar Kartu Barber Individu (3 Master Barber)**:
  - `BBR-01`: Rian Pratama ("The Sculptor") — *Senior Master Barber, Spesialis Classic Cuts & Scissor Work*.
  - `BBR-02`: Dimas Arisandi ("Fade Master") — *Clipper Specialist, Spesialis Skin Fade & Tren Viral*.
  - `BBR-03`: Kevin Sanjaya ("Grooming Specialist") — *Shave Master, Spesialis Hot Towel & Beard Sculpting*.
  Setiap kartu menampilkan foto avatar profesional, julukan keahlian, dan tombol radio seleksi.

#### 3.3 Alur Happy Path
1. Pengguna melihat daftar barber. Karena pengguna menyukai model rambut belah samping rapi, pengguna memilih `Rian Pratama ("The Sculptor")`.
2. Kartu Rian Pratama terlingkari warna aksen aktif.
3. Sistem menyimpan `barber_id = "BBR-01"` ke dalam session draft.
4. Sistem mengaktifkan tombol `"Lanjut Pilih Waktu"`.

#### 3.4 Alur Alternatif (Alternative Paths)
- **Alt-3A (Memilih Opsi "Siapa Saja")**: Pengguna memilih kartu paling atas `"Siapa Saja yang Tersedia"`. Sistem menyimpan `barber_id = "ANY"` yang nantinya akan dialokasikan oleh backend secara dinamis berdasarkan rotasi beban kerja terendah (*round-robin capacity balancing*).

#### 3.5 Edge Cases & Error States
- **Edge-3.1 (Barber Terjadwal Libur / Cuti)**: Sesuai rotasi kerja harian (Rian libur Minggu, Dimas libur Senin, Kevin libur Selasa), jika pengguna memilih barber yang pada tanggal terkait sedang off, kartu barber tersebut tetap dapat dilihat namun memiliki keterangan: *"Jadwal libur hari [Senin] — pilih tanggal lain di langkah berikutnya atau pilih Siapa Saja."*
- **Edge-3.2 (Barber Sakit / Izin Darurat Hari Ini)**: Jika admin telah menonaktifkan status aktif barber di dashboard, kartu barber terkait ditandai badge abu-abu `"Tidak Bertugas Hari Ini"` dan tidak dapat diklik.

#### 3.6 Data Exchange & State Transition
- **Client State**:
  ```json
  {
    "selectedBarber": {
      "id": "BBR-01",
      "name": "Rian Pratama",
      "isAny": false
    }
  }
  ```

#### 3.7 Acceptance Criteria (Given-When-Then)
```gherkin
Given pengguna berada di langkah pemilihan barber (Step 3),
When pengguna memilih opsi "Siapa Saja yang Tersedia",
Then sistem menandai parameter barber sebagai fleksibel (ANY), mengizinkan agregasi seluruh slot kursi kosong di langkah kalender, dan mengaktifkan tombol lanjut.
```

---

### Step 4: Pemilihan Tanggal & Slot Jam Dinamis

#### 3.1 User Mindset & Emotional State
Pengguna mencari kepastian slot waktu yang cocok dengan agendanya. Pengguna membutuhkan kejelasan: slot mana yang masih kosong, slot mana yang sudah terisi orang lain, dan tidak ingin menemui kegagalan saat memilih jam.

#### 4.2 Komponen UI & Layout Mobile
- **Step Indicator Header**: Bar progres `"Langkah 3 dari 5: Pilih Waktu"`.
- **Horizontal Date Scroller (7 Hari ke Depan)**: Pita tanggal geser horizontal menampilkan hari dan tanggal (contoh: `Sabtu, 24 Okt | Minggu, 25 Okt | Senin, 26 Okt`). Tanggal terpilih ditandai dengan warna kontras.
- **Pengelompokan Sesi Waktu (Time Chips Grid)**:
  - Sesi Pagi & Siang: `10:00`, `11:00`, `12:00`, `13:00`, `14:00`.
  - Sesi Sore & Malam: `15:00`, `16:00`, `17:00`, `18:00`, `19:00`, `20:00`.
- **Status Chip Interaktif**:
  - *Tersedia (Available)*: Warna latar gelap netral dengan border terang, dapat diklik.
  - *Terisi (Booked / In-Progress)*: Warna abu-abu redup (*disabled*), teks coret halus, tidak dapat diklik.
  - *Istirahat Barber (Break)*: Ditandai keterangan `"Istirahat Bergantian"`.
  - *Terpilih (Selected)*: Background emas/tembaga dengan teks kontras.
- **Keterangan Buffer Sanitasi**: Catatan halus di bawah grid: *"Setiap slot mencakup 10 menit sterilisasi alat sebelum Anda tiba."*

#### 4.3 Alur Happy Path
1. Pengguna memilih tanggal besok (`Sabtu, 24 Oktober 2026`).
2. Antarmuka memanggil endpoint ketersediaan slot `/api/slots/available?date=2026-10-24&barber_id=BBR-01&duration=75`.
3. Grid menampilkan slot yang valid dengan memperhitungkan durasi layanan (75 mnt) + buffer sanitasi (10 mnt) = blok 85 menit.
4. Pengguna memilih chip jam `14:00 WIB`.
5. Chip `14:00` berubah warna menjadi aktif, sistem menampilkan ringkasan: *"Waktu Layanan: 14:00 – 15:15 WIB (Termasuk Sanitasi)"*.
6. Tombol `"Lanjut Isi Data Diri"` menjadi aktif.

#### 4.4 Alur Alternatif (Alternative Paths)
- **Alt-4A (Pilihan "Siapa Saja")**: Jika di Step 3 pengguna memilih "Siapa Saja", grid waktu menampilkan slot jam yang masih memiliki **minimal 1 barber yang kosong**. Begitu pengguna memilih jam 14:00, sistem secara transparan mengalokasikan slot tersebut ke barber dengan antrean terendah (misal: Dimas Arisandi) dan menginformasikannya pada kartu ringkasan.
- **Alt-4B (Semua Slot Penuh di Hari Tersebut)**: Jika seluruh slot pada tanggal yang dipilih telah terisi (27 slot penuh), kalender menampilkan ilustrasi informatif: *"Slot penuh untuk hari ini. Silakan pilih tanggal berikutnya."* dengan tombol cepat loncat ke hari esok.

#### 4.5 Edge Cases & Error States
- **Edge-4.1 (Slot Baru Saja Diambil Orang Lain Saat Sedang Membuka Halaman)**: Saat pengguna menatap layar selama 2 menit, orang lain telah mengunci slot 14:00. Begitu pengguna mengetuk chip 14:00, query real-time memeriksa ulang dan chip berubah menjadi abu-abu disertai pesan banner: *"Slot 14:00 baru saja diambil pelanggan lain. Silakan pilih slot terdekat pukul 15:00 atau 16:00."*
- **Edge-4.2 (Bentrok Jam Istirahat Barber)**: Jika barber yang dipilih memiliki jadwal istirahat tetap (misal Rian istirahat pukul 12:00–13:00 WIB dan 18:00–19:00 WIB sesuai model kapasitas `docs/research/slot-capacity-and-noshow-model.md`), slot jam tersebut otomatis disembunyikan/dinonaktifkan untuk barber terkait.

#### 4.6 Data Exchange & State Transition
- **API Request**: `GET /api/slots/available?date=2026-10-24&barber_id=BBR-01&duration=75`
- **API Response**:
  ```json
  {
    "date": "2026-10-24",
    "barberId": "BBR-01",
    "availableSlots": ["10:00", "11:00", "14:00", "15:30", "19:00", "20:00"],
    "bookedSlots": ["13:00", "17:00"],
    "breakSlots": ["12:00", "18:00"]
  }
  ```
- **Client State**:
  ```json
  {
    "bookingDate": "2026-10-24",
    "bookingTime": "14:00",
    "serviceEndTime": "15:15"
  }
  ```

#### 4.7 Acceptance Criteria (Given-When-Then)
```gherkin
Given pengguna telah memilih layanan berdurasi total 75 menit dan memilih barber Rian Pratama,
When pengguna memilih tanggal 24 Oktober 2026 pukul 14:00 WIB yang berstatus kosong,
Then sistem menandai slot 14:00 sebagai terpilih, menghitung estimasi selesai pukul 15:15 WIB, dan mengizinkan navigasi ke pengisian data kontak.
```

---

### Step 5: Input Kontak Minimalis & Consent UU PDP No. 27/2022

#### 5.1 User Mindset & Emotional State
Pengguna tidak ingin dipersulit dengan pengisian formulir registrasi yang menanyakan alamat rumah, tanggal lahir, atau pembuatan password rumit. Pengguna bersedia memberikan nomor WhatsApp karena tahu bahwa tiket dan pengingat akan dikirimkan ke nomor tersebut.

#### 5.2 Komponen UI & Layout Mobile
- **Step Indicator Header**: Bar progres `"Langkah 4 dari 5: Data Pemesan"`.
- **Formulir Super-Ringkas (2 Kolom Wajib Saja)**:
  1. *Nama Lengkap / Panggilan*: Input text dengan autofill name (`autocomplete="name"`).
  2. *Nomor WhatsApp*: Input tel dengan prefix otomatis `+62` (`autocomplete="tel"`), disertai ikon validasi hijau saat format nomor Indonesia sah (10–13 digit).
- **Klausul Persetujuan Privasi (Consent Checkbox UU PDP No. 27/2022)**:
  - Checkbox bawaan tercentang / wajib dicentang dengan teks eksplisit:
    > *"Saya menyetujui nomor WhatsApp saya digunakan oleh Damez Barbershop untuk pengiriman bukti tiket reservasi dan pengingat jadwal sesuai regulasi privasi data."*
- **Penjelasan Keamanan Data**: Ikon gembok dengan teks: *"Data Anda dilindungi dan tidak akan pernah dibagikan kepada pihak ketiga atau spam promosi."*

#### 5.3 Alur Happy Path
1. Pengguna mengetik nama `"Budi Santoso"`.
2. Pengguna memasukkan nomor WhatsApp `"081234567890"`. Sistem secara otomatis memformatnya menjadi format standar internasional `+6281234567890`.
3. Checkbox persetujuan privasi dalam status tercentang.
4. Tombol `"Lanjut ke Review Pembayaran DP"` menyala aktif.

#### 5.4 Alur Alternatif (Alternative Paths)
- **Alt-5A (Penyimpanan Sesi Browser Lokal / LocalStorage)**: Jika pengguna pernah melakukan booking sebelumnya di perangkat yang sama, sistem secara otomatis mengisi nama dan nomor WhatsApp dari `localStorage` browser (*Smart Autofill*), sehingga pengguna hanya perlu melakukan konfirmasi 1 ketukan.

#### 5.5 Edge Cases & Error States
- **Edge-5.1 (Nomor WhatsApp Tidak Valid / Kurang Digit)**: Pengguna mengetik nomor kurang dari 9 digit (misal: `081234`). Saat input kehilangan fokus (*onBlur*), muncul pesan error inline merah: *"Nomor WhatsApp harus valid (antara 10 hingga 13 digit angka)."* Tombol submit tetap disabled.
- **Edge-5.2 (Unchecked PDP Consent Checkbox)**: Jika pengguna sengaja menghilangkan centang persetujuan privasi, tombol submit menjadi disabled disertai tooltip panduan: *"Persetujuan pengiriman tiket via WhatsApp wajib disetujui untuk menerima kode reservasi Anda."*

#### 5.6 Data Exchange & State Transition
- **Client State**:
  ```json
  {
    "customer": {
      "fullName": "Budi Santoso",
      "phone": "+6281234567890",
      "pdpConsent": true,
      "consentTimestamp": "2026-10-23T14:05:00+07:00"
    }
  }
  ```

#### 5.7 Acceptance Criteria (Given-When-Then)
```gherkin
Given pengguna berada pada formulir pengisian data kontak (Step 5),
When pengguna memasukkan nama "Budi Santoso", nomor WhatsApp "081234567890", dan mencentang persetujuan privasi,
Then sistem memvalidasi format nomor ke standar E.164 (+6281234567890) dan mengaktifkan tombol review pembayaran.
```

---

### Step 6: Review Booking, Rincian DP Flat Rp 20.000 & Penguncian Slot Sementara (Hold 15 Menit)

#### 6.1 User Mindset & Emotional State
Pengguna memeriksa kembali seluruh rincian pesanannya (jadwal, barber, layanan, total tagihan). Pengguna perlu memahami dengan sangat jelas bahwa ia **hanya membayar Down Payment sebesar Flat Rp 20.000 sekarang**, sedangkan sisa tagihan dibayarkan di kasir setelah pangkas rambut selesai.

#### 6.2 Komponen UI & Layout Mobile
- **Step Indicator Header**: Bar progres `"Langkah 5 dari 5: Konfirmasi & Bayar DP"`.
- **Kartu Ringkasan Reservasi (Booking Voucher Preview)**:
  - Layanan: Gentlemen Classic Haircut + Beard Trim (75 Menit).
  - Barber: Rian Pratama ("The Sculptor").
  - Waktu: Sabtu, 24 Oktober 2026, pukul 14:00 – 15:15 WIB.
  - Nama Pemesan: Budi Santoso (+6281234567890).
- **Struktur Transparan Finansial**:
  - Total Harga Layanan: `Rp 85.000`
  - **Down Payment (DP) Dibayar Sekarang**: `Rp 20.000` *(Highlight Emas)*
  - **Sisa Pembayaran di Kasir Toko**: `Rp 65.000` *(Dapat dibayar tunai / QRIS kasir)*
- **Ketentuan Pembatalan & No-Show (Highlight Kotak Peringatan)**:
  - *"Bebas ubah jadwal (reschedule) maksimal H-3 jam sebelum jam layanan."*
  - *"Keterlambatan hadir maksimal 15 menit. Keterlambatan lebih dari 15 menit menyebabkan booking batal dan DP Rp 20.000 hangus sebagai kompensasi operasional."*
- **Tombol Utama Eksekusi**:
  - Tombol Lebar 56px: `"Kunci Slot & Bayar DP Rp 20.000 via QRIS"`

#### 6.3 Alur Happy Path
1. Pengguna meninjau rincian biaya dan menyetujui rincian DP Rp 20.000.
2. Pengguna menekan tombol `"Kunci Slot & Bayar DP Rp 20.000 via QRIS"`.
3. Tombol menampilkan status loading interaktif (*spinner*: `"Mengunci slot dan membuat QRIS..."*).
4. Backend mengeksekusi transaksi atomik database (`SELECT ... FOR UPDATE` dan constraint `tsrange`), membuat record booking berstatus `pending_payment`, menyalakan timer kedaluwarsa 15 menit (900 detik), dan memanggil API Midtrans Snap untuk membuat transaksi.
5. Pop-up Snap / QRIS interface terbuka di layar ponsel pengguna.

#### 6.4 Alur Alternatif (Alternative Paths)
- **Alt-6A (Kembali Mengubah Rincian / Edit Step)**: Pengguna melihat kesalahan pemilihan jam dan mengetuk tombol tautan `"Ubah Jadwal"` pada kartu ringkasan. Sistem mengembalikan pengguna ke Step 4 dengan data layanan dan kontak tetap tersimpan utuh di memori tanpa mereset form.

#### 6.5 Edge Cases & Error States
- **Edge-6.1 (Race Condition — Slot Direbut Pelanggan Lain di Milidetik Sama)**: Dua pengguna menekan tombol pembayaran pada jam yang sama persis. Database menangkap bentrok melalui Exclusion Constraint `gist` pada Supabase PostgreSQL. Pengguna kedua menerima modal dialog empati:
  > *"Maaf, slot pukul 14:00 baru saja diambil pelanggan lain beberapa detik yang lalu. Jangan khawatir, data diri Anda telah tersimpan! Silakan pilih slot terdekat pukul 15:30 atau 16:30."*  
  Sistem langsung mengarahkan pengguna kembali ke kalender Step 4 dengan status slot yang sudah terbarui secara real-time.
- **Edge-6.2 (Gagal Terhubung ke Midtrans API)**: Jika gateway pembayaran mengalami downtime jaringan sementara, sistem menangani error dengan elegan, melepaskan kuncian slot sementara, dan menampilkan tombol: `"Coba Lagi Pembayaran"` tanpa menghilangkan data pemesanan.

#### 6.6 Data Exchange & State Transition
- **API Request**: `POST /api/booking/checkout`
  ```json
  {
    "barberId": "BBR-01",
    "serviceIds": ["SRV-01", "SRV-04"],
    "bookingDate": "2026-10-24",
    "startTime": "14:00",
    "customerName": "Budi Santoso",
    "customerPhone": "+6281234567890",
    "dpAmount": 20000
  }
  ```
- **Database Mutation**:
  - Insert row ke `bookings` dengan `status = 'pending_payment'`, `locked_until = NOW() + INTERVAL '15 minutes'`.
- **API Response**:
  ```json
  {
    "bookingId": "dmz_bk_9872134",
    "orderId": "DMZ-20261024-001",
    "snapToken": "snap_tok_abc123xyz",
    "redirectUrl": "https://app.midtrans.com/snap/v2/vtweb/...",
    "expiresAt": "2026-10-23T14:20:00+07:00"
  }
  ```

#### 6.7 Acceptance Criteria (Given-When-Then)
```gherkin
Given pengguna berada di langkah review pesanan (Step 6),
When pengguna menekan tombol "Kunci Slot & Bayar DP Rp 20.000",
Then backend mengunci slot di database dengan status pending_payment selama 15 menit, mengembalikan token Snap Midtrans, dan memunculkan jendela pembayaran QRIS.
```

---

### Step 7: Pembayaran QRIS Midtrans Snap, Webhook Settlement & Konfirmasi Kode Tiket

#### 7.1 User Mindset & Emotional State
Pengguna melihat kode QRIS di layar smartphone, melakukan *screenshot* atau memilih pembayaran langsung via deep-link aplikasi e-wallet / m-banking, menyelesaikan otorisasi PIN di aplikasi bank, dan kembali ke browser untuk mendapatkan bukti kode tiket resmi.

#### 7.2 Komponen UI & Layout Mobile
- **Layar Pembayaran QRIS (Snap Modal / Embedded)**:
  - Banner Countdown Waktu Kedaluwarsa: `"Selesaikan pembayaran dalam [14:59] menit"`.
  - Kode QR QRIS Universal (Standar ASPI/Bank Indonesia) dengan logo GPN, BCA, Mandiri, GoPay, OVO, ShopeePay, Dana.
  - Tombol Salin Nominal / Unduh QR Code untuk pemindaian via galeri.
  - Nominal Tepat: `Rp 20.000` (Bebas biaya admin transfer).
- **Layar Sukses Konfirmasi Tiket (Success Confirmation Screen)**:
  - Ilustrasi Animasi Sukses (Checkmark Emas).
  - Teks Utama: *"Pembayaran DP Terverifikasi! Kursi Anda Telah Terkunci."*
  - **Badge Kode Tiket Booking Unik**: `DMZ-20261024-042` (Font tebal berukuran 28px, dilengkapi tombol *"Salin Kode"*).
  - Ringkasan Tiket: Jadwal, Barber Rian Pratama, Sisa Pelunasan di Kasir (Rp 65.000).
  - Keterangan WhatsApp: *"Bukti tiket resmi dan petunjuk arah Google Maps telah dikirim ke nomor WhatsApp Anda (+6281234567890)."*
  - Tombol Navigasi: Tombol `"Buka Lokasi di Google Maps"` dan `"Simpan ke Kalender HP (Add to Calendar)"`.

#### 7.3 Alur Happy Path
1. Pengguna memindai kode QRIS atau menekan tombol integrasi e-wallet di smartphone-nya.
2. Pengguna memasukkan PIN di aplikasi perbankannya dan mentransfer Rp 20.000.
3. Midtrans memproses transaksi dan mengirimkan HTTP POST Webhook ke `/api/webhooks/midtrans` dengan status `settlement` dan validasi signature SHA-512.
4. Backend Damez mengubah status booking menjadi `confirmed`, mencatat waktu lunas, dan secara asinkron memicu dispatcher WhatsApp REST API (Fonnte/Wablas).
5. Layar browser pelanggan yang sedang membuka halaman pembayaran menerima sinyal WebSocket/Polling dan secara instan bertransisi ke **Layar Sukses Konfirmasi Tiket** (< 2 detik paska bayar).
6. Dalam waktu < 5 detik, notifikasi WhatsApp masuk ke ponsel Budi Santoso berisi ringkasan tiket dan link navigasi.
7. Total durasi pengerjaan dari Step 1 hingga tiket terbit: **85 detik (Memenuhi target SLA < 120 detik)**.

#### 7.4 Alur Alternatif (Alternative Paths)
- **Alt-7A (Pembayaran via Virtual Account BCA/Mandiri/BRI)**: Pengguna memilih opsi Virtual Account pada Snap Midtrans, menyalin nomor VA, membuka mobile banking, mentransfer DP Rp 20.000, lalu kembali ke halaman web yang otomatis menampilkan status berhasil.
- **Alt-7B (Pengguna Menutup Browser Sebelum Layar Sukses Muncul)**: Pengguna telah berhasil transfer di mobile banking, namun koneksi browser tertutup. Pengguna tidak perlu panik karena backend tetap memproses webhook secara andal dan tiket otomatis terkirim via pesan WhatsApp resmi toko.

#### 7.5 Edge Cases & Error States
- **Edge-7.1 (Kedaluwarsa Pembayaran > 15 Menit / Timeout)**: Pengguna mengabaikan pembayaran hingga hitungan mundur 15:00 habis. Sistem secara otomatis membatalkan token pembayaran, mengubah status booking menjadi `expired`, dan melepaskan slot kembali ke publik. Jika pengguna baru membuka kembali browser setelah lewat 15 menit, layar menampilkan status:
  > *"Batas waktu pembayaran 15 menit telah berakhir. Slot ini telah dibuka kembali ke publik demi keadilan antrean. Silakan pilih slot baru."*
- **Edge-7.2 (Keterlambatan Pengiriman WhatsApp Gateway)**: Jika gateway pihak ketiga (Fonnte/Wablas) mengalami antrean jaringan, status booking di sistem tetap **sah dan confirmed**. Layar sukses tetap menampilkan kode tiket lengkap, dan tombol *"Kirim Ulang Tiket via WA"* tersedia jika pesan belum diterima setelah 3 menit.
- **Edge-7.3 (Pembayaran Ganda / Duplicate Webhook Notification)**: Midtrans mengirimkan retry notifikasi webhook ganda. Handler backend mengecek status idempotensi: jika `status == 'confirmed'`, handler langsung merespons `HTTP 200 OK` tanpa memicu pembaruan berulang atau spam notifikasi WA.

#### 7.6 Data Exchange & State Transition
- **Webhook Payload Inbound (`POST /api/webhooks/midtrans`)**:
  ```json
  {
    "order_id": "DMZ-20261024-001",
    "status_code": "200",
    "gross_amount": "20000.00",
    "signature_key": "a8fbc749e...",
    "transaction_status": "settlement",
    "payment_type": "qris"
  }
  ```
- **Database Status Transition**: `pending_payment` ➔ `confirmed`.
- **WhatsApp Dispatcher Payload (`POST https://api.fonnte.com/send`)**:
  ```json
  {
    "target": "6281234567890",
    "message": "*KONFIRMASI RESERVASI DAMEZ BARBERSHOP*\n\nHalo Kak Budi Santoso,\nPembayaran DP Rp 20.000 telah kami terima. Kursi Anda telah terkunci!\n\nKode Tiket: *DMZ-20261024-001*\nBarber: Rian Pratama\nJadwal: Sabtu, 24 Okt 2026 | 14:00 WIB\nSisa Pelunasan Kasir: Rp 65.000\n\nPetunjuk Arah Google Maps: https://maps.google.com/?q=DamezBarbershop\n\n*Catatan Penting*: Toleransi keterlambatan maksimal 15 menit. Mohon hadir 5 menit sebelum jadwal. Sampai jumpa di kursi pangkas!"
  }
  ```

#### 7.7 Acceptance Criteria (Given-When-Then)
```gherkin
Given booking berada dalam status pending_payment dengan token Snap aktif,
When Midtrans mengirimkan webhook bertipe settlement dengan verifikasi signature SHA-512 yang sah,
Then sistem mengupdate status menjadi confirmed, mengarahkan UI ke layar sukses tiket DMZ-20261024-001, dan mengirim pesan WhatsApp konfirmasi dalam waktu < 5 detik.
```

---

## 4. Journey 2: Admin Tablet/Desktop Operations Journey

Alur kerja admin difokuskan pada meja operasional kasir (*front desk*) menggunakan perangkat tablet layar sentuh (10–11 inci) atau monitor desktop. Dirancang untuk kecepatan tinggi (*High-Velocity Triage*), memungkinkan kasir mengelola antrean tanpa melepaskan pandangan dari pelanggan fisik.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           ADMIN TABLET / DESKTOP CORE WORKFLOWS                                 │
├───────────────┬────────────────┬────────────────┬────────────────┬───────────────┬──────────────┤
│ Workflow 1    │ Workflow 2     │ Workflow 3     │ Workflow 4     │ Workflow 5    │ Workflow 6   │
├───────────────┼────────────────┼────────────────┼────────────────┼───────────────┼──────────────┤
│ Daily Timeline│ 1-Klik Mutasi  │ Input Walk-In  │ Reschedule     │ Auto No-Show  │ Pelunasan    │
│ Calendar View │ Status Booking │ Cepat (< 15s)  │ Gating H-3 Jam │ & Toleransi   │ Kasir & CSV  │
└───────────────┴────────────────┴────────────────┴────────────────┴───────────────┴──────────────┘
```

---

### Step 1: Login & Daily Calendar Timeline View (10:00 – 21:00 WIB)

#### 1.1 Operator Mindset & Context
Admin/Owner (Damez) membuka tablet di meja kasir pada pukul 09:45 WIB sebelum toko buka. Admin ingin melihat lanskap keseluruhan hari ini: berapa banyak booking online yang sudah terkonfirmasi, kursi mana yang sedang kosong untuk ditawarkan kepada pelanggan *walk-in*, dan jadwal istirahat barber.

#### 1.2 Komponen UI & Layout Tablet/Desk (1024px–1440px)
- **Top Header Bar**:
  - Tanggal aktif dengan pemilih tanggal cepat (`< Hari Ini: Sabtu, 24 Okt >`).
  - Ringkasan KPI Harian Real-Time: `Okupansi: 18/27 Slot (66.7%) | DP Masuk: Rp 360.000 | Tamu Selesai: 4 | Sisa Kasir: Rp 220.000`.
  - Tombol Aksi Cepat: `[ + Input Tamu Walk-In ]` (Aksen hijau mencolok) dan `[ Ekspor Rekap CSV ]`.
- **Daily Multi-Column Timeline Grid (Matriks 3 Kursi)**:
  - Sumbu Vertikal (Y): Jam operasional dibagi per slot 55–60 menit (10:00 s/d 21:00 WIB).
  - Sumbu Horizontal (X): 3 Kolom Barber aktif:
    - Kolom 1: Kursi 1 — Rian Pratama ("The Sculptor")
    - Kolom 2: Kursi 2 — Dimas Arisandi ("Fade Master")
    - Kolom 3: Kursi 3 — Kevin Sanjaya ("Grooming Specialist")
  - Blok Kartu Reservasi dengan Kode Warna:
    - *Hijau Muda*: Terkonfirmasi (`confirmed`) — Menunggu kedatangan.
    - *Biru / Berkedip Halus*: Sedang di Kursi (`in_progress`) — Pelayanan berlangsung.
    - *Abu-abu Lembut*: Selesai (`completed`).
    - *Kuning / Oranye*: Tamu Walk-In (`walk_in`).
    - *Merah Muda*: Peringatan Terlambat / No-Show (`no_show`).
    - *Garis Arsip Abu-abu*: Jam Istirahat Barber (`staggered break`).

#### 1.3 Alur Happy Path
1. Admin membuka URL admin di browser Safari/Chrome tablet (`/admin/dashboard`).
2. Sesi login tervalidasi via Supabase Auth (JWT). Kalender memuat dalam < 500 ms.
3. Admin melihat jadwal 3 barber secara serentak. Slot jam 10:00 terisi penuh di ketiga kursi.
4. Admin mematut persiapan handuk hangat dan peralatan cukur bersama para barber.

#### 1.4 Alur Alternatif (Alternative Paths)
- **Alt-1A (Navigasi ke Tanggal Mendatang)**: Admin mengetuk panah kanan pada date picker untuk meninjau proyeksi booking hari Minggu atau Senin guna mengatur ketersediaan stok produk pomade dan handuk bersih.

#### 1.5 Edge Cases & Error States
- **Edge-1.1 (Sesi Token Admin Kedaluwarsa)**: Jika tablet ditinggalkan semalaman dan token habis masa berlaku, sistem menampilkan form login overlay minimalis tanpa membuang URL state kalender saat ini.
- **Edge-1.2 (Sinkronisasi Offline / Gangguan WiFi Toko)**: Jika koneksi internet toko terputus sesaat, muncul banner oranye kecil di pojok kanan atas: *"Koneksi terputus — Menampilkan data offline lokal. Mencoba rekoneksi otomatis..."*. Saat WiFi tersambung kembali, Supabase Realtime langsung merefresh status tanpa reload layar.

#### 1.6 Data Exchange & State Transition
- **API Request**: `GET /api/admin/schedule?date=2026-10-24`
- **Response**: Array objek booking harian yang dipetakan ke 3 kolom barber.

#### 1.7 Acceptance Criteria (Given-When-Then)
```gherkin
Given admin telah login ke dashboard tablet,
When halaman kalender operasional harian terbuka,
Then sistem menampilkan timeline 3 kolom master barber dari jam 10:00 hingga 21:00 WIB lengkap dengan status slot real-time.
```

---

### Step 2: 1-Klik Perubahan Status Janji Temu (Quick-Status Transitions)

#### 2.1 Operator Mindset & Context
Ketika pelanggan tiba di toko, admin tidak ingin mengetik form panjang atau mencari menu tersembunyi. Admin membutuhkan aksi instan 1-sentuhan untuk memperbarui status agar barber di kursi tahu bahwa pelanggan telah siap.

#### 2.2 Komponen UI & Layout Tablet/Desk
- **Kartu Slot Janji Temu Interaktif (Touch Target >= 44x44px)**:
  - Informasi pada kartu: `14:00 | Budi Santoso | Classic Cut + Beard | DP Rp 20k Lunas | Sisa Rp 65k`.
- **Aksi Cepat Dropdown / Popover 1-Klik**:
  - Tombol Cepat 1: `[ Mulai Cukur ]` ➔ Mengubah ke `in_progress`.
  - Tombol Cepat 2: `[ Tandai Selesai ]` ➔ Membuka modal pelunasan kasir.
  - Tombol Cepat 3: `[ Tandai No-Show ]` ➔ Membatalkan slot karena lewat 15 menit.

#### 2.3 Alur Happy Path
1. Pelanggan Budi Santoso tiba di toko pukul 13:55 WIB dan menyebutkan namanya.
2. Admin mengetuk kartu slot Budi Santoso pada kolom Rian Pratama.
3. Admin menekan tombol hijau `"Mulai Pelayanan (Seated)"`.
4. Status slot seketika berubah menjadi `in_progress` dengan highlight biru.
5. Indikator lampu status di meja Rian/tablet barber menyala aktif menunjukkan pelanggan sudah duduk di kursi.

#### 2.4 Alur Alternatif (Alternative Paths)
- **Alt-2A (Pelanggan Meminta Tambahan Layanan di Kursi)**: Saat sedang dicukur, Budi meminta tambahan layanan cuci rambut ekstra. Admin mengetuk kartu slot, memilih opsi `[ Tambah Layanan ]`, memilih item tambahan, dan sistem otomatis mengupdate total sisa tagihan kasir tanpa mengubah waktu slot.

#### 2.5 Edge Cases & Error States
- **Edge-2.1 (Aksi Tak Sengaja Tertekan / Mis-Click)**: Jika admin tidak sengaja menekan tombol *"Tandai Selesai"*, sistem menyediakan tombol *"Undo (Batalkan Aksi)"* berupa toast notification selama 6 detik di sudut layar sebelum transaksi difinalisasi di database.

#### 2.6 Data Exchange & State Transition
- **API Request**: `PATCH /api/admin/bookings/dmz_bk_9872134/status`
  ```json
  {"status": "in_progress", "seatedAt": "2026-10-24T13:58:00+07:00"}
  ```
- **Database Status**: `confirmed` ➔ `in_progress`.

#### 2.7 Acceptance Criteria (Given-When-Then)
```gherkin
Given pelanggan dengan booking terkonfirmasi telah tiba di toko,
When admin menekan tombol "Mulai Pelayanan" pada kartu slot pelanggan,
Then sistem mengupdate status booking menjadi in_progress dalam waktu < 500 ms dan mengubah visual kartu menjadi aktif.
```

---

### Step 3: Input Pelanggan Walk-In Cepat (< 15 Detik)

#### 3.1 Operator Mindset & Context
Seorang pelanggan datang langsung ke toko tanpa reservasi (*walk-in*). Pelanggan berdiri di depan meja kasir dan bertanya: *"Bisa potong sekarang mas?"*. Admin harus dapat mengecek slot terdekat yang kosong dan menginput data dalam hitungan 15 detik agar kursi tidak kosong dan kalender online otomatis terkunci.

#### 3.2 Komponen UI & Layout Tablet/Desk
- **Modal Input Walk-In Super Cepat**:
  - Tombol pemicu: `[ + Input Walk-In ]` (Dapat diakses via shortcut keyboard `Alt + W` di desktop atau tombol besar di tablet).
  - Field 1: *Nama Pelanggan* (Opsional / Default: `"Tamu Walk-In"` jika buru-buru).
  - Field 2: *Pilih Barber*: Menampilkan hanya barber yang saat ini kursinya sedang berstatus kosong.
  - Field 3: *Pilih Layanan*: Dropdown ringkas (Default: `"Gentlemen Classic Haircut - Rp 50.000"`).
  - Tombol Eksekusi Instan: `[ Langsung Masuk Kursi (Start Now) ]`.
- **Tanpa Beban DP Online**: Karena pelanggan sudah berada secara fisik di toko, transaksi *walk-in* **tidak memerlukan pembayaran DP Midtrans**; tagihan dibayarkan 100% penuh di kasir setelah pangkas rambut selesai.

#### 3.3 Alur Happy Path
1. Tamu walk-in datang pukul 15:30 WIB. Admin melirik kalender: Kursi 2 (Dimas Arisandi) sedang kosong hingga pukul 16:30 WIB.
2. Admin menekan tombol `[ + Input Walk-In ]`.
3. Modal terbuka dalam < 100 ms.
4. Admin mengetik nama `"Andi"`, memilih barber `"Dimas"`, dan layanan `"Gentlemen Classic Haircut"`.
5. Admin menekan tombol `[ Langsung Masuk Kursi ]`.
6. Total durasi penginputan: **9 detik (Memenuhi target SLA < 15 detik)**.
7. Sistem langsung membuat record dengan status `in_progress`, tipe `walk_in`, dan mengunci slot 15:30–16:15 WIB pada kalender web publik sehingga tidak dapat diambil orang lain secara online.

#### 3.4 Alur Alternatif (Alternative Paths)
- **Alt-3A (Walk-In Menunggu Giliran / Antrean Fisik)**: Tamu walk-in datang saat ketiga kursi penuh, namun ingin menunggu 20 menit untuk slot jam 16:00. Admin memilih jam mulai 16:00 dengan status `confirmed_walkin`. Tamu dipersilakan duduk di sofa ruang tunggu.

#### 3.5 Edge Cases & Error States
- **Edge-3.1 (Tabrakan dengan Online Booking yang Baru Masuk Bersamaan)**: Saat admin membuka modal walk-in untuk slot 15:30, seorang pelanggan online baru saja menyelesaikan pembayaran QRIS untuk slot yang sama 2 detik sebelumnya. Sistem Supabase Realtime secara instan memperingatkan admin: *"Slot 15:30 baru saja terisi oleh booking online Budi Santoso. Alihkan tamu walk-in ke barber Kevin di slot 16:00."*

#### 3.6 Data Exchange & State Transition
- **API Request**: `POST /api/admin/bookings/walk-in`
  ```json
  {
    "customerName": "Andi (Walk-in)",
    "barberId": "BBR-02",
    "serviceId": "SRV-01",
    "startTime": "15:30",
    "status": "in_progress",
    "bookingType": "walk_in",
    "dpAmount": 0,
    "totalPrice": 50000
  }
  ```

#### 3.7 Acceptance Criteria (Given-When-Then)
```gherkin
Given admin membuka modal input walk-in pada jam kerja aktif,
When admin memilih barber yang tersedia dan menekan "Langsung Masuk Kursi",
Then sistem membuat tiket walk-in berstatus in_progress dalam < 1 detik dan mengunci slot waktu tersebut dari pemesanan web publik.
```

---

### Step 4: Penanganan Reschedule & Penegakan Batas H-3 Jam

#### 4.1 Operator Mindset & Context
Pelanggan menghubungi WhatsApp admin toko atau datang meminta perubahan jadwal. Admin harus menegakkan kebijakan bisnis yang telah terkunci secara objektif: **Reschedule hanya diizinkan maksimal 3 jam sebelum jadwal mulai (H-3 jam)** demi melindungi pendapatan toko dari slot kosong mendadak.

#### 4.2 Komponen UI & Layout Tablet/Desk
- **Modal Manajemen Jadwal (Reschedule Action Modal)**:
  - Ringkasan booking asli: Kode Booking, Waktu Jadwal, Waktu Pengajuan Saat Ini.
  - Indikator Gating Waktu Otomatis:
    - *Kasus Valid (>= 3 Jam)*: Badge hijau `"Pengajuan Sah (Selisih: 4 Jam 15 Menit)"`.
    - *Kasus Ditolak (< 3 Jam)*: Badge merah `"Pengajuan Terlambat (Selisih: 1 Jam 30 Menit)"`.
  - Date & Time Picker untuk memilih slot baru yang masih kosong.
  - Tombol Eksekusi: `[ Pindahkan Jadwal Tanpa Denda ]` atau `[ Batalkan dengan DP Hangus ]`.

#### 4.3 Alur Happy Path (Reschedule Valid >= H-3 Jam)
1. Pelanggan Budi Santoso (jadwal pukul 16:00 WIB) menelepon admin pada pukul 11:30 WIB (selisih 4,5 jam sebelum layanan).
2. Admin mencari kode booking `DMZ-20261024-001` di pencarian dashboard.
3. Admin mengklik tombol `[ Reschedule ]`. Sistem menampilkan badge hijau: *"Memenuhi Syarat Bebas Reschedule (H-4.5 Jam)"*.
4. Budi meminta dipindahkan ke hari Minggu pukul 11:00 WIB pada barber Rian.
5. Admin memilih slot baru yang berstatus kosong, lalu menekan `[ Pindahkan Jadwal ]`.
6. Database memindahkan jadwal lama ke slot baru, status tetap `confirmed`, uang DP Rp 20.000 dialihkan secara utuh, dan sistem otomatis mengirimkan pesan konfirmasi jadwal baru via WhatsApp.

#### 4.4 Alur Alternatif (Alternative Paths — Pengajuan < H-3 Jam)
- **Alt-4A (Pelanggan Membatalkan Kurang dari 3 Jam)**: Pelanggan jadwal jam 16:00 baru menghubungi admin pada pukul 14:15 WIB (1 jam 45 menit sebelum mulai). Sistem menampilkan peringatan merah:
  > *"Perubahan jadwal di bawah batas H-3 jam tidak dapat diproses secara gratis. Pembatalan pada tahap ini mengakibatkan DP Rp 20.000 hangus."*
  Admin membacakan SOP kepada pelanggan. Jika pelanggan tetap membatalkan, admin menekan tombol `[ Eksekusi Pembatalan — DP Hangus ]`. Slot jam 16:00 langsung terbuka kembali untuk tamu walk-in di toko.

#### 4.5 Edge Cases & Error States
- **Edge-4.1 (Tidak Ada Slot Kosong di Hari yang Diminta)**: Saat pelanggan ingin reschedule, slot barber favoritnya di hari tersebut telah penuh. Sistem menawarkan opsi: *"Pindah ke barber lain yang kosong"* atau *"Pilih hari berikutnya"*.

#### 4.6 Data Exchange & State Transition
- **API Request (Reschedule Valid)**: `POST /api/admin/bookings/reschedule`
  ```json
  {
    "bookingId": "dmz_bk_9872134",
    "newDate": "2026-10-25",
    "newStartTime": "11:00",
    "rescheduleReason": "Permintaan Pelanggan via WA"
  }
  ```
- **Database Status**: Record lama diperbarui rentang waktunya, log riwayat reschedule tercatat di tabel audit.

#### 4.7 Acceptance Criteria (Given-When-Then)
```gherkin
Given booking berstatus confirmed untuk pukul 16:00 WIB,
When permintaan perubahan jadwal diproses pada pukul 11:30 WIB (lebih dari 3 jam sebelum jadwal),
Then sistem mengizinkan pemindahan ke slot lain yang kosong tanpa mengenakan denda, dan mengalihkan DP Rp 20.000 ke jadwal baru.
```

---

### Step 5: Penegakan Toleransi Keterlambatan 15 Menit & Eksekusi No-Show

#### 5.1 Operator Mindset & Context
Pelanggan yang memesan slot jam 10:00 belum hadir. Barber sedang menunggu di kursi dan pelanggan *walk-in* sedang mengantre di sofa. Admin membutuhkan aturan tegas dan otomatis: jika lewat 15 menit tanpa kabar, slot wajib dilepaskan untuk tamu lain agar toko tidak rugi.

#### 5.2 Komponen UI & Layout Tablet/Desk
- **Visual Alert Keterlambatan (Lateness Tracker)**:
  - Pada pukul 10:01 WIB, kartu booking memunculkan indikator waktu: `Terlambat: 1 Menit`.
  - Pada pukul 10:10 WIB (10 menit terlambat), kartu berubah warna menjadi kuning berkedip (*Peringatan Siaga*).
  - Pada pukul 10:15 WIB (Batas Toleransi Habis), kartu berubah menjadi merah terang dengan tombol aksi darurat: `[ Lepas Kursi & Tandai No-Show ]`.

#### 5.3 Alur Happy Path (Pelanggan Hadir Dalam Toleransi)
1. Pelanggan jadwal jam 10:00 tiba di toko pada pukul 10:11 WIB (terlambat 11 menit).
2. Karena masih berada dalam batas toleransi (< 15 menit), admin menyambut pelanggan dan menekan tombol `[ Mulai Cukur ]`.
3. Barber menyesuaikan ritme potongan agar selesai mendekati waktu awal yang dijadwalkan, dibantu oleh buffer sanitasi 10 menit.

#### 5.4 Alur Alternatif (Alternative Paths — Eksekusi No-Show > 15 Menit)
- **Alt-5A (Pelanggan Ghosting / Melewati 15 Menit)**:
  1. Jam menunjukkan pukul 10:16 WIB (16 menit berlalu) dan pelanggan tidak hadir serta tidak dapat dihubungi.
  2. Admin menekan tombol merah `[ Lepas Kursi & Tandai No-Show ]`.
  3. Muncul konfirmasi modal: *"Toleransi 15 menit telah terlampaui. Uang DP Rp 20.000 akan hangus menjadi pendapatan kompensasi operasional toko. Lanjutkan?"*.
  4. Admin mengonfirmasi. Status berubah menjadi `no_show`.
  5. Kursi barber seketika kosong, dan admin langsung memanggil tamu walk-in yang menunggu di sofa untuk masuk ke kursi.
  6. Sistem mengirimkan pesan WhatsApp pemberitahuan pembatalan sopan kepada pelanggan terkait pembatalan otomatis.

#### 5.5 Edge Cases & Error States
- **Edge-5.1 (Pelanggan Datang di Menit ke-16 Tepat Saat Slot Diberikan ke Walk-In)**: Pelanggan tiba pada pukul 10:17 WIB saat kursi baru saja diduduki oleh tamu walk-in. Sesuai SOP sistem yang tercantum di tiket WA, admin menjelaskan secara profesional bahwa toleransi 15 menit telah habis dan sistem otomatis mengalihkan kursi. Admin menawarkan solusi: menunggu slot berikutnya yang kosong atau membuat reservasi baru.

#### 5.6 Data Exchange & State Transition
- **API Request**: `POST /api/admin/bookings/dmz_bk_9872134/no-show`
  ```json
  {
    "noShowDeclaredAt": "2026-10-24T10:16:00+07:00",
    "forfeitAmount": 20000,
    "reason": "Melebihi toleransi keterlambatan 15 menit"
  }
  ```
- **Database Status**: `confirmed` ➔ `no_show`.
- **Financial Allocation**: DP Rp 20.000 dicatat sebagai pendapatan toko (`forfeited_dp_revenue`).

#### 5.7 Acceptance Criteria (Given-When-Then)
```gherkin
Given pelanggan memiliki jadwal pukul 10:00 WIB dan belum hadir hingga pukul 10:16 WIB,
When admin menekan tombol "Tandai No-Show",
Then sistem mengubah status booking menjadi no_show, mencatat DP Rp 20.000 hangus, dan membuka slot kursi untuk pelanggan walk-in.
```

---

### Step 6: Penyelesaian Layanan Kasir & Rekonsiliasi Kas Harian

#### 6.1 Operator Mindset & Context
Pangkas rambut telah selesai. Pelanggan berdiri di depan kasir untuk melakukan pembayaran akhir. Admin harus menagih nominal yang tepat (Total Harga dikurangi DP Rp 20.000 yang sudah dibayar online), mencatat metode pelunasan sisa, dan di akhir hari mampu mengunduh laporan rekapitulasi tanpa selisih hitung uang fisik.

#### 6.2 Komponen UI & Layout Tablet/Desk
- **Modal Checkout Kasir Fisik (Settlement Drawer)**:
  - Total Harga Layanan: `Rp 85.000`
  - Potongan DP Online (Telah Lunas): `- Rp 20.000` *(Label Hijau)*
  - **Sisa Wajib Tagih**: `Rp 65.000` *(Font Tebal 32px)*
  - Pilihan Metode Pembayaran Sisa:
    - `[ Tunai / Cash ]` ➔ Memunculkan input nominal uang diterima & kalkulator kembalian otomatis.
    - `[ QRIS Kasir Toko ]` ➔ Menampilkan QR statis kasir toko fisik.
  - Tombol Eksekusi: `[ Selesaikan Transaksi & Tutup Tiket ]`.
- **Panel Rekapitulasi Kas Harian & Ekspor CSV**:
  - Tombol di pojok dashboard: `[ Unduh Laporan Harian (.CSV) ]`.

#### 6.3 Alur Happy Path
1. Barber menyelesaikan pangkas rambut Budi Santoso pukul 15:10 WIB.
2. Budi menuju meja kasir. Admin mengklik tombol `[ Selesaikan Layanan ]` pada kartu Budi.
3. Modal kasir menampilkan rincian: Total Rp 85.000 – DP Rp 20.000 = **Sisa Tagihan Rp 65.000**.
4. Budi membayar tunai Rp 100.000. Admin mengetik 100000 pada kalkulator kembalian; sistem menampilkan: `"Kembalian: Rp 35.000"`.
5. Admin memberikan kembalian uang fisik, lalu menekan `[ Selesaikan Transaksi ]`.
6. Status booking berubah menjadi `completed`, kursi siap disterilisasi oleh barber selama buffer 10 menit.
7. Di akhir jam operasional (pukul 21:00 WIB), Owner menekan tombol `[ Unduh Laporan Harian (.CSV) ]` untuk mencocokkan total uang tunai di laci kasir dengan mutasi bank Midtrans.

#### 6.4 Alur Alternatif (Alternative Paths)
- **Alt-6A (Pelunasan Tamu Walk-In Penuh)**: Untuk tamu walk-in tanpa DP, modal kasir menampilkan potongan DP = Rp 0 dan menagih 100% nominal layanan (misal Rp 50.000).
- **Alt-6B (Pelanggan Membeli Tip Sukarela untuk Barber)**: Jika pelanggan ingin memberikan tip tunai langsung kepada barber, transaksi tip tidak dicatat ke dalam omzet sistem dan diserahkan 100% langsung kepada barber di kursi.

#### 6.5 Edge Cases & Error States
- **Edge-6.1 (Perbedaan Selisih Kas di Akhir Hari)**: Laporan CSV memisahkan secara jelas kolom `nominal_dp_online` (yang masuk ke rekening bank Midtrans) dengan kolom `pelunasan_kasir_fisik` (tunai di laci toko) sehingga pemilik usaha dapat melakukan rekonsiliasi kas dalam < 3 menit tanpa selisih.

#### 6.6 Data Exchange & State Transition
- **API Request**: `POST /api/admin/bookings/dmz_bk_9872134/complete`
  ```json
  {
    "finalPaymentMethod": "cash",
    "finalPaymentAmount": 65000,
    "completedAt": "2026-10-24T15:12:00+07:00"
  }
  ```
- **Database Status**: `in_progress` ➔ `completed`.

#### 6.7 Acceptance Criteria (Given-When-Then)
```gherkin
Given pelanggan memiliki total layanan Rp 85.000 dengan DP terbayar Rp 20.000,
When layanan selesai dan pelanggan melunasi sisa Rp 65.000 di kasir,
Then sistem mengupdate status menjadi completed, mencatat pelunasan tunai Rp 65.000, dan memasukkan data transaksi ke rekap laporan harian.
```

---

## 5. Matriks Mutasi State & Resolusi Tabrakan Konkurensi

Sistem menjamin integritas data 100% bebas dari kasus *double booking* melalui aturan mutasi status (*state machine*) dan tabel resolusi konflik (*collision resolution*).

### 5.1 Diagram Transisi State Janji Temu (State Machine Matrix)

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 LIFECYCLE STATE MACHINE MATRIX                                    │
├───────────────────┬───────────────────┬───────────────────────────────┬───────────────────────────┤
│ State Asal        │ State Tujuan      │ Pemicu / Aksi (Trigger)       │ Pihak yang Mengeksekusi   │
├───────────────────┼───────────────────┼───────────────────────────────┼───────────────────────────┤
│ [Draft]           │ pending_payment   │ Submit checkout form Step 6   │ Pelanggan (Customer Web)  │
│ pending_payment   │ confirmed         │ Webhook Settlement Midtrans   │ Payment Gateway API       │
│ pending_payment   │ expired           │ Timeout > 15 Menit (Cron/TTL) │ Background Scheduler      │
│ confirmed         │ in_progress       │ Pelanggan tiba di kursi       │ Admin / Kasir (1-Klik)    │
│ confirmed         │ no_show           │ Lewat batas toleransi 15 mnt  │ Admin / Kasir (1-Klik)    │
│ confirmed         │ cancelled         │ Batal sebelum batas H-3 jam   │ Admin / Customer Service  │
│ in_progress       │ completed         │ Layanan & Pelunasan Kasir OK  │ Admin / Kasir (Checkout)  │
│ [Initial Walk-In] │ in_progress       │ Input walk-in langsung kursi  │ Admin / Kasir (Modal POS) │
└───────────────────┴───────────────────┴───────────────────────────────┴───────────────────────────┘
```

### 5.2 Matriks Resolusi Tabrakan Konkurensi (Cross-Journey Collision Matrix)

Berikut skenario konflik yang mungkin terjadi antara perjalanan Customer Mobile dengan Admin Tablet beserta resolusi sistematisnya:

| Skenario Konflik | Pihak Terlibat | Kondisi Real-Time | Mekanisme Resolusi & Hasil Akhir Sistem |
|---|---|---|---|
| **Konflik 1: Customer vs Customer (Milidetik Sama)** | Pelanggan A & Pelanggan B | Keduanya memilih slot jam 14:00 pada Barber Rian secara bersamaan. | Transaksi PostgreSQL mengeksekusi `SELECT ... FOR UPDATE` dengan Exclusion Constraint `gist`. Transaksi pertama mendapat slot dan status `pending_payment`. Transaksi kedua ditolak dengan pesan: *"Slot baru saja diambil orang lain, silakan pilih slot terdekat."* |
| **Konflik 2: Admin Walk-In vs Customer Checkout** | Admin di Meja Depan & Pelanggan Online | Admin sedang menginput tamu walk-in di tablet untuk slot jam 15:00 tepat saat pelanggan online menekan checkout. | Jika Admin menekan "Mulai Sekarang" lebih dulu, slot terkunci ke `in_progress`. Customer online yang mencoba checkout gagal membuat token Snap dan diarahkan memilih jam lain. Jika Customer online bayar DP duluan, tablet Admin otomatis memunculkan kartu slot terisi via Supabase Realtime. |
| **Konflik 3: Pembayaran Telat vs Auto-Expire** | Pelanggan Online & Background Scheduler | Pelanggan membayar QRIS tepat di detik ke-901 (setelah masa hold 15 menit habis dan slot dilepas ke publik). | Webhook Midtrans memeriksa waktu: jika slot belum diambil orang lain, status otomatis dipulihkan ke `confirmed`. Jika slot telah diambil orang lain, sistem menandai flag `overdue_payment_manual_refund` dan mengirim alert ke admin untuk menawarkan opsi jadwal baru atau refund manual. |
| **Konflik 4: Reschedule vs Slot Baru Terisi** | Pelanggan Minta Pindah & Pengunjung Web | Pelanggan lama minta reschedule ke jam 17:00, namun slot 17:00 baru saja dikunci oleh orang lain. | Sistem kalender admin menampilkan ketersediaan slot atomik. Admin tidak dapat memindahkan booking ke slot yang sedang berstatus `pending_payment` atau `confirmed`. |

---

## 6. Arahan Desain Handoff untuk Tim Hilir

Dokumen user journey ini menjadi acuan spesifik untuk deliverable tim spesialis hilir pada Milestone 1 dan Milestone 2:

### 6.1 Arahan untuk UI/UX Designer (`designer:wireframe` — M1-03 & `designer:interaction` — M1-04)
1. **Prioritas Zona Jempol (Thumb-Zone Optimization)**: Seluruh tombol primer (Lanjut, Bayar DP, Input Walk-In) wajib berada pada area jangkauan jempol bawah layar (*bottom 30% viewport*) dengan tinggi touch target minimal **48px–56px**.
2. **Visual Countdown Timer 15 Menit**: Buat komponen timer yang elegan di langkah pembayaran QRIS dengan perubahan warna dinamis:
   - Menit 15:00 – 05:00: Warna netral / emas.
   - Menit 04:59 – 01:00: Warna oranye peringatan.
   - Menit 00:59 – 00:00: Warna merah berkedip halus.
3. **Admin Daily Calendar Grid**:
   - Tampilan tablet wajib mendukung orientasi landscape (1024x768 atau 1280x800).
   - Terapkan pembedaan kontras warna yang tegas pada kartu janji temu agar admin dapat mengenali status dalam jarak pandang 50 cm.

### 6.2 Arahan untuk Content Writer (`writer:copywriter` — M2-01 & `writer:editor` — M2-03)
1. **Mikro-Copy Transparansi DP**:
   - Jangan gunakan istilah yang terkesan menyembunyikan biaya. Gunakan frasa lugas: *"Komitmen DP Flat Rp 20.000 — Memastikan Kursi Anda Siap Tanpa Antre. Sisa tagihan dibayarkan di kasir."*
2. **Copywriting Edukasi No-Show**:
   - Jelaskan alasan di balik aturan toleransi keterlambatan 15 menit dan H-3 jam dengan nada sopan, profesional, dan menghargai waktu sesama pelanggan: *"Kami menyediakan jeda waktu dan sterilisasi alat terbaik demi kenyamanan Anda."*

### 6.3 Arahan untuk SOP & Dokumentasi Operasional (`writer:techdocs` — M2-04)
1. **SOP Kasir Meja Depan**: Tulis panduan langkah demi langkah bagi kasir toko dalam menangani tamu walk-in saat antrean padat, cara menyikapi pelanggan yang terlambat 16 menit dengan empati, dan langkah rekonsiliasi kas harian via file `.csv`.

### 6.4 Arahan untuk Database & Backend Engineering (`coder` — M3-01 & M4-01)
1. **Constraint Rentang Waktu**: Skema database wajib mengimplementasikan ekstensi `btree_gist` dan constraint rentang waktu:
   ```sql
   EXCLUDE USING gist (
     barber_id WITH =,
     tstzrange(waktu_mulai, waktu_selesai) WITH &&
   ) WHERE (status IN ('confirmed', 'pending_payment', 'in_progress'));
   ```
2. **Zona Waktu Terkunci**: Seluruh kalkulasi waktu dan penegakan timer dikunci pada **`Asia/Jakarta` (WIB / UTC+07:00)**.

---

## 7. Definition of Done (DoD) & Verifikasi Kelayakan

Dokumen User Journey Mapping ini dinyatakan memenuhi kriteria Definition of Done (DoD) berdasarkan kriteria berikut:

- [x] **Kelengkapan Pilar**: Memetakan secara mendalam Customer Mobile Journey (< 120 detik) dan Admin Tablet/Desk Operations Journey.
- [x] **Rincian Alur Customer**: Mencakup 7 langkah modular (Landing ➔ Pilih Layanan ➔ Pilih Barber ➔ Pilih Tanggal/Jam ➔ Data Kontak & PDP ➔ Review DP Rp 20.000 ➔ Bayar QRIS & Konfirmasi Tiket WA).
- [x] **Rincian Alur Admin**: Mencakup 6 alur operasional meja kasir (Kalender Timeline 3 Barber ➔ 1-Klik Mutasi Status ➔ Input Walk-In < 15s ➔ Gating Reschedule H-3 Jam ➔ Auto No-Show Toleransi 15 Mnt ➔ Kasir & Ekspor CSV).
- [x] **Tri-State Coverage**: Setiap langkah dilengkapi dengan status **Happy Path**, **Alternative Paths**, dan **Edge Cases / Error Handling**.
- [x] **INVEST & BDD Compliance**: Setiap langkah dilengkapi dengan Acceptance Criteria berbasis skenario **Given-When-Then** yang dapat diuji oleh tim QA.
- [x] **Konsistensi Invarian M0**: Selaras 100% dengan keputusan terkunci (DP Flat Rp 20.000, jam operasional 10:00–21:00 WIB, 3 master barber, buffer sanitasi 10 menit, batas H-3 jam, toleransi keterlambatan 15 menit, Midtrans QRIS MDR 0.7%, Supabase tsrange).

---
*Disahkan oleh:*  
**Chief Product Officer & Lead Product Strategist** (`product:persona-story`)  
Damez Barbershop High-Velocity MVP Project — 23 Oktober 2026
