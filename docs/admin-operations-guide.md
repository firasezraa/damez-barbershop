# Panduan Operasional & SOP Dashboard Admin & Barber
## Damez Barbershop — Tata Cara Kerja Gerai & Penggunaan Sistem Kasir

> **Dokumen**: Standard Operating Procedure (SOP) & Admin Operations Guide v1.0  
> **Target Pembaca**: Pemilik Usaha (Owner), Master Barber (Rian, Dimas, Kevin), dan Staf Kasir / Front Desk  
> **Status**: APPROVED & OPERATIONAL BASELINE  
> **Klasifikasi**: Panduan Kerja Lapangan (Non-Teknis, Aksi Langsung)  
> **Lokasi File**: `docs/admin-operations-guide.md`  
> **Referensi Teknis**: `docs/PRD.md`, `docs/design/user-journeys.md`, `docs/research/slot-capacity-and-noshow-model.md`

---

## Daftar Isi
1. [Prinsip Dasar & Aturan Emas Gerai](#1-prinsip-dasar--aturan-emas-gerai)
2. [Peran, Tanggung Jawab & Perangkat Operasional](#2-peran-tanggung-jawab--perangkat-operasional)
3. [Panduan Masuk Sistem & Tampilan Kalender Harian](#3-panduan-masuk-sistem--tampilan-kalender-harian)
4. [SOP 1: Menyambut Tamu & Memulai Layanan Kursi](#4-sop-1-menyambut-tamu--memulai-layanan-kursi)
5. [SOP 2: Menandai Selesai & Pelunasan Tagihan Kasir](#5-sop-2-menandai-selesai--pelunasan-tagihan-kasir)
6. [SOP 3: Input Tamu Datang Langsung (Walk-In) Cepat](#6-sop-3-input-tamu-datang-langsung-walk-in-cepat)
7. [SOP 4: Pengaturan Jam Istirahat & Blokir Kursi](#7-sop-4-pengaturan-jam-istirahat--blokir-kursi)
8. [SOP 5: Penanganan Tamu Terlambat, Reschedule & No-Show](#8-sop-5-penanganan-tamu-terlambat-reschedule--no-show)
9. [SOP 6: Rekap Kas Harian & Unduh Laporan Keuangan (.CSV)](#9-sop-6-rekap-kas-harian--unduh-laporan-keuangan-csv)
10. [Panduan Komunikasi & Solusi Situasi Khusus Meja Depan](#10-panduan-komunikasi--solusi-situasi-khusus-meja-depan)
11. [Lembar Ceklis Kerja Harian (Daily Checklist)](#11-lembar-ceklis-kerja-harian-daily-checklist)

---

## 1. Prinsip Dasar & Aturan Emas Gerai

Sistem digital Damez Barbershop dirancang untuk satu tujuan utama: **menghilangkan drama antrean ruang tunggu, menjamin kepastian jam kerja barber, dan melindungi pendapatan gerai dari tamu yang tidak hadir (*no-show*)**.

Sebagai staf operasional di lokasi, seluruh aktivitas harian berpedoman pada **5 Aturan Emas**:

| No | Aturan Emas Gerai | Ketentuan Baku | Alasan Operasional |
|:--:|---|---|---|
| **1** | **Uang Muka (DP) Flat Rp 20.000** | Terbayar lunas otomatis via online saat pemesanan web. | Mengunci slot kursi pelanggan dan memastikan pelanggan memiliki komitmen hadir. |
| **2** | **Potong DP di Kasir** | Sisa tagihan di kasir = **Total Layanan dikurangi Rp 20.000**. | Tamu hanya membayar sisa kekurangan secara tunai atau QRIS toko fisik saat pangkas rambut selesai. |
| **3** | **Batas Toleransi Telat 15 Menit** | Lewat 15 menit tanpa kabar = **Status No-Show & Kursi Dilepas**. | Menghargai waktu barber dan memberikan hak kursi kepada tamu lain yang sedang menunggu. |
| **4** | **Batas Ganti Jadwal (Reschedule) H-3 Jam** | Boleh ganti jadwal jika konfirmasi **minimal 3 jam** sebelum mulai. | Jika kurang dari 3 jam, jadwal tidak bisa diubah gratis dan DP dinyatakan hangus bila tamu batal. |
| **5** | **Jeda Sanitasi 10 Menit Antar-Sesi** | Setiap sesi layanan memiliki alokasi bersih 10 menit setelah pangkas. | Wajib membersihkan gunting/clipper dengan semprotan disinfektan, mengganti *neck paper*, dan menyapu lantai. |

---

## 2. Peran, Tanggung Jawab & Perangkat Operasional

### 2.1 Matriks Peran Kerja Gerai

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          STRUKTUR TIM OPERASIONAL TOKO                          │
├───────────────────────────────┬─────────────────────────────────────────────────┤
│ PERAN                         │ TANGGUNG JAWAB UTAMA                            │
├───────────────────────────────┼─────────────────────────────────────────────────┤
│ 👑 Owner / Head Admin (Damez) │ • Pengawasan arus kas harian dan rekonsiliasi.  │
│                               │ • Persetujuan blokir hari libur toko khusus.    │
│                               │ • Unduh laporan keuangan CSV saat tutup toko.   │
├───────────────────────────────┼─────────────────────────────────────────────────┤
│ 💼 Front Desk / Kasir         │ • Membuka dashboard tablet pukul 09:45 WIB.     │
│                               │ • Menyambut tamu dan verifikasi kode booking.   │
│                               │ • Input walk-in cepat (< 15 detik).             │
│                               │ • Eksekusi pelunasan sisa tagihan di kasir.     │
│                               │ • Menegakkan toleransi keterlambatan 15 menit.  │
├───────────────────────────────┼─────────────────────────────────────────────────┤
│ ✂️ Master Barber (Rian, Dimas,│ • Melirik jadwal giliran kursi di layar gerai.  │
│    Kevin)                     │ • Menjalankan layanan tepat waktu sesuai durasi.│
│                               │ • Menjalankan protokol sanitasi alat 10 menit.  │
│                               │ • Istirahat bergantian sesuai jadwal rotasi.    │
└───────────────────────────────┴─────────────────────────────────────────────────┘
```

### 2.2 Perangkat Kerja yang Digunakan
1. **Tablet Kasir Utama (iPad / Layar Sentuh 10 Inci)**:
   - Terpasang pada dudukan (*stand*) di meja depan kasir.
   - Berfungsi sebagai pusat komando antrean, penerimaan tamu, input walk-in, dan kalkulator kasir.
2. **Ponsel Pintar / Monitor Barber**:
   - Terpasang di area dinding cermin kerja barber atau diakses via HP masing-masing barber.
   - Menampilkan urutan nama tamu berikutnya dan sisa menit pengerjaan saat ini.

---

## 3. Panduan Masuk Sistem & Tampilan Kalender Harian

### 3.1 Cara Masuk ke Sistem (Login)
1. Nyalakan tablet di meja depan kasir.
2. Buka aplikasi peramban (browser Safari atau Google Chrome).
3. Ketuk pintasan (bookmark) **Damez Dashboard** pada layar utama.
4. Masukkan alamat email admin dan kata sandi yang telah ditetapkan.
5. Tekan tombol hijau **[ Masuk Dashboard ]**.
6. Sistem akan langsung menampilkan kalender operasional untuk tanggal hari ini.

> **Tips Keamanan**: Jangan pernah membagikan kata sandi admin kepada pihak luar gerai. Jika tablet ditinggalkan tanpa penjaga meja kasir lebih dari 15 menit, layar akan terkunci secara otomatis.

---

### 3.2 Mengenal Tampilan Kalender 3 Kolom Barber

Tampilan kalender harian dirancang dalam format **3 Kolom Berdampingan** sesuai 3 kursi potong aktif toko:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [DAMEZ BARBERSHOP]  < Hari Ini: Sabtu, 24 Okt 2026 >    [+ Input Walk-In]  [Unduh Laporan CSV]  │
│ Okupansi: 18/27 Slot (67%) | DP Masuk: Rp 360.000 | Selesai: 4 Tamu | Kasir Fisik: Rp 220.000   │
├─────────┬───────────────────────────┬───────────────────────────┬───────────────────────────────┤
│  WAKTU  │ KURSI 1: RIAN THE SCULPTOR│ KURSI 2: DIMAS FADE MASTER│ KURSI 3: KEVIN SANJAYA        │
├─────────┼───────────────────────────┼───────────────────────────┼───────────────────────────────┤
│  10:00  │ [HIJAU] Budi Santoso      │ [HIJAU] Hendra Wijaya     │ [HIJAU] Reza Pahlevi          │
│         │ Classic Cut (DP Lunas)    │ Skin Fade (DP Lunas)      │ Hot Towel Shave (DP Lunas)    │
├─────────┼───────────────────────────┼───────────────────────────┼───────────────────────────────┤
│  11:00  │ [BIRU] Aris Munandar      │ [KOSONG] Siap Isi         │ [ORANYE] Tamu Walk-In (Agus)  │
│         │ Sedang di Kursi (32 mnt)  │ [ + Klik Isi Slot ]       │ Langsung Masuk (Bayar Kasir)  │
├─────────┼───────────────────────────┼───────────────────────────┼───────────────────────────────┤
│  12:00  │ [ARSP] ISTIRAHAT SIANG    │ [HIJAU] Fikri Pratama     │ [HIJAU] Denny Kurnia          │
│         │ (12:00 - 12:55 WIB)       │ Pompadour Cut (DP Lunas)  │ Classic Cut (DP Lunas)        │
├─────────┼───────────────────────────┼───────────────────────────┼───────────────────────────────┤
│  13:00  │ [HIJAU] Eko Prasetyo      │ [ARSP] ISTIRAHAT SIANG    │ [HIJAU] Satria Yudha          │
│         │ Beard Grooming (DP Lunas) │ (13:00 - 13:55 WIB)       │ Signature Combo (DP Lunas)    │
└─────────┴───────────────────────────┴───────────────────────────┴───────────────────────────────┘
```

### 3.3 Kode Warna Kartu Jadwal & Artinya

Setiap kotak pada kalender memiliki warna yang membedakan kondisi tamu:

| Warna Kartu | Nama Status | Arti Operasional & Aksi Staf |
|---|---|---|
| 🟢 **Hijau Muda** | `confirmed` | **Tamu Online Siap Datang**: DP Rp 20.000 sudah lunas lewat web. Menunggu tamu tiba di toko. |
| 🔵 **Biru Terang** | `in_progress` | **Sedang Dilayani di Kursi**: Barber sedang mencukur. Sisa waktu pengerjaan berjalan di layar. |
| ⚪ **Abu-abu Pudar** | `completed` | **Selesai & Lunas**: Layanan telah tuntas, sisa biaya telah dibayar di kasir. |
| 🟠 **Oranye** | `walk_in` | **Tamu Langsung di Lokasi**: Masuk tanpa reservasi online, seluruh biaya dibayar penuh di kasir. |
| 🟡 **Kuning Peringatan**| *Terlambat 10m* | **Siaga Keterlambatan**: Tamu belum datang 10 menit dari jadwal. Hubungi nomor WA tamu. |
| 🔴 **Merah Terang** | `no_show` | **Toleransi Habis (> 15 Menit)**: Kursi dilepas untuk tamu lain. DP Rp 20.000 hangus. |
| 🔘 **Arsir Abu-abu** | `blocked` | **Jadwal Istirahat / Kursi Tutup**: Barber sedang istirahat makan/sholat atau hari libur. |

---

## 4. SOP 1: Menyambut Tamu & Memulai Layanan Kursi

Alur ini digunakan ketika pelanggan yang telah memesan jadwal online tiba di gerai Damez Barbershop.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ALUR MENYAMBUT TAMU ONLINE                                                      │
│                                                                                 │
│ Tamu Datang ──▶ Cek Nama / Kode ──▶ Ketuk Kartu ──▶ Tekan [Mulai Cukur] ──▶ Kursi│
│ di Toko         di Tablet Kasir     di Kalender       Status Jadi BIRU           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Langkah demi Langkah:
1. **Sapa Tamu dengan Ramah & Hangat**:
   - Ucapan standar: *"Selamat datang di Damez Barbershop, Mas. Dengan atas nama siapa atau boleh sebutkan kode booking-nya?"*
2. **Cari Jadwal Tamu pada Tablet**:
   - Lihat kolom barber yang dituju pada jam saat ini, atau ketik nama/kode booking pada kotak pencarian di sudut atas tablet.
   - Contoh: Tamu atas nama **Budi Santoso**, jam 14:00 WIB di Kursi 1 (Rian).
3. **Konfirmasi Paket Layanan**:
   - Periksa rincian pada kartu: *"Paket Gentlemen Classic Haircut dengan Mas Rian, betul ya Mas?"*
4. **Tekan Tombol [ Mulai Cukur ]**:
   - Ketuk kartu nama tamu pada layar tablet.
   - Tekan tombol hijau bertuliskan **[ Mulai Cukur / Seated ]**.
   - Warna kartu seketika berubah dari **HIJAU** menjadi **BIRU** (`in_progress`).
   - Layar barber akan menampilkan tanda aktif bahwa pelanggan sudah siap di kursi.
5. **Persilakan Tamu Menuju Kursi Barber**:
   - Arahkan tamu: *"Silakan menuju Kursi 1 bersama Mas Rian, Mas."*

---

### Bila Tamu Meminta Tambahan Layanan Saat di Kursi (Upselling)
Seringkali tamu yang memesan potong rambut ingin menambah layanan saat sedang dicukur (misalnya: menambah *Beard Trim* atau *Hair Wash Express*):
1. Buka kembali kartu tamu yang sedang berstatus biru di tablet kasir.
2. Tekan menu **[ + Tambah Layanan ]**.
3. Pilih layanan tambahan dari daftar menu.
4. Tekan **[ Simpan Perubahan ]**.
5. Sistem secara otomatis menambahkan biaya layanan baru ke tagihan akhir kasir tanpa mengubah waktu slot jam berikutnya.

---

## 5. SOP 2: Menandai Selesai & Pelunasan Tagihan Kasir

Alur ini dilakukan ketika proses pangkas rambut telah selesai dan pelanggan berdiri di meja kasir untuk membayar sisa tagihan.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ALUR KASIR & PELUNASAN SISA TAGIHAN                                             │
│                                                                                 │
│ Cukur Tuntas ──▶ Ketuk [Selesaikan] ──▶ Cek Sisa Wajib ──▶ Terima Uang ──▶ Tutup│
│ Tamu ke Kasir    di Tablet Kasir        (Potong DP 20k)     (Tunai / QRIS)   Tiket│
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Langkah demi Langkah:
1. **Buka Jendela Kasir Pelunasan**:
   - Ketuk kartu tamu yang sedang aktif (warna biru) pada kalender.
   - Tekan tombol **[ Selesaikan Layanan & Checkout ]**.
2. **Periksa Rincian Perhitungan Otomatis**:
   - Layar kasir akan menampilkan ringkasan perhitungan secara transparan:
     - **Total Harga Layanan**: Misal `Rp 85.000` *(Classic Cut Rp 50rb + Beard Trim Rp 35rb)*
     - **Potongan DP Online (Sudah Lunas)**: `- Rp 20.000` *(Label Hijau)*
     - **SISA TAGIHAN WAJIB BAYAR**: **`Rp 65.000`** *(Tulisan Tebal Ukuran Besar)*
3. **Pilih Metode Pembayaran Sisa**:
   - **Opsi A: Bayar Tunai (Cash)**:
     1. Ketuk tombol **[ Tunai ]**.
     2. Ketik jumlah uang fisik yang diberikan pelanggan pada kotak *"Uang Diterima"*.
     3. Sistem akan menghitung uang kembalian secara otomatis.
        - *Contoh*: Tamu memberi uang Rp 100.000. Layar menampilkan: *"Kembalian: Rp 35.000"*.
     4. Berikan uang kembalian fisik kepada pelanggan dengan kedua tangan.
   - **Opsi B: Bayar Nontunai (QRIS Kasir Toko)**:
     1. Ketuk tombol **[ QRIS Kasir ]**.
     2. Tunjukkan kode QRIS fisik akrilik yang berada di meja kasir kepada pelanggan.
     3. Pelanggan memindai (*scan*) menggunakan aplikasi bank atau e-wallet senilai sisa tagihan (misal: Rp 65.000).
     4. Pastikan notifikasi dana masuk atau bukti transaksi berhasil pada ponsel tamu telah terlihat jelas oleh kasir.
4. **Tekan Tombol [ Finalisasi & Tutup Tiket ]**:
   - Tekan tombol hijau **[ Selesaikan Transaksi ]**.
   - Status kartu di kalender berubah menjadi **ABU-ABU** (`completed`).
   - Kursi barber kini berstatus kosong dan siap untuk sesi berikutnya.

---

### Perlakuan Uang Tip untuk Barber
- Jika pelanggan memberikan uang tip sukarela untuk barber (misal: uang pecahan Rp 10.000 atau Rp 20.000):
- **ATURAN**: Uang tip adalah **100% hak barber bersangkutan**.
- **JANGAN** masukkan uang tip ke dalam mesin kasir toko atau sistem rekap omzet gerai.
- Mintalah tamu menyerahkan langsung kepada barber di kursi, atau masukkan ke kotak tip khusus barber bersangkutan di meja depan.

---

### Protokol 10 Menit Pembersihan & Sanitasi Alat (Wajib bagi Barber)
Setiap kali status berubah menjadi selesai, barber memiliki jeda waktu wajib **10 menit** sebelum memanggil tamu berikutnya:
1. **Disinfeksi Mata Pisau Clipper**: Semprotkan cairan *Clippercide / Barbicide spray* pada mata pisau mesin cukur dan gunting.
2. **Ganti Kertas Leher (*Neck Paper*)**: Buang kertas leher bekas ke tempat sampah tertutup dan pasang kertas pelindung baru pada kerah jubah (*cape*).
3. **Sapu Area Lantai Kursi**: Bersihkan serpihan rambut di sekitar kursi potong menggunakan sapu pendorong karet (*squeegee*).
4. **Cuci Tangan / Sanitizer**: Cuci tangan dengan sabun antiseptik sebelum menyentuh pelanggan berikutnya.

---

## 6. SOP 3: Input Tamu Datang Langsung (Walk-In) Cepat

Tamu *walk-in* adalah pelanggan yang datang langsung ke toko tanpa melakukan pemesanan online di website. Kasir wajib menginput data tamu ke dalam tablet **dalam waktu kurang dari 15 detik** agar kursi terkunci dan tidak diambil oleh pelanggan online lain.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ALUR INPUT WALK-IN CEPAT (< 15 DETIK)                                           │
│                                                                                 │
│ Tamu Datang ──▶ Tekan Tombol ──▶ Isi Nama & Pilih ──▶ Tekan [Mulai] ──▶ Kunci   │
│ Tanya Kursi     [+ Input Walk-in]  Barber & Layanan     Langsung Cukur   di Web │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Langkah demi Langkah:
1. **Cek Ketersediaan Kursi yang Kosong**:
   - Lirik kalender tablet. Perhatikan apakah ada kolom barber yang saat ini kosong (tidak ada kotak hijau atau biru).
   - Misal: Kursi 2 (Dimas) sedang kosong hingga 45 menit ke depan.
2. **Buka Formulir Cepat**:
   - Tekan tombol hijau mencolok di pojok kanan atas tablet: **[ + Input Walk-In ]** (atau tekan tombol kombinasi keyboard `Alt + W`).
   - Jendela formulir mini akan muncul seketika di layar.
3. **Isi 3 Data Sederhana**:
   - **Nama Tamu**: Ketik nama panggilan tamu (contoh: *"Mas Doni"*). Jika sedang sangat terburu-buru, sistem otomatis mengisi *"Tamu Walk-In"*.
   - **Pilih Barber**: Ketuk foto/nama barber yang kursinya sedang kosong (contoh: *"Dimas - Kursi 2"*).
   - **Pilih Layanan**: Pilih layanan yang diminta (Standar bawaan: *"Gentlemen Classic Haircut - Rp 50.000"*).
4. **Tekan Tombol [ Langsung Masuk Kursi ]**:
   - Tekan tombol **[ Mulai Layanan Sekarang ]**.
   - Total durasi pengisian: **hanya 8–12 detik**.
5. **Dampak Otomatis pada Sistem**:
   - Kartu oranye langsung terbit di kolom barber bersangkutan dengan status langsung **BIRU/ORANYE** (`in_progress`).
   - **PENTING**: Sistem di internet secara seketika **mengunci slot jam tersebut**, sehingga tidak akan ada pengunjung web yang bisa memesan jam itu dari rumah.
   - Tamu walk-in **TIDAK PERLU bayar DP online**. Pembayaran dilakukan 100% di kasir saat pangkas selesai.

---

### Bila Tamu Walk-In Ingin Menunggu Kursi (Antrean Fisik)
Jika ketiga kursi sedang penuh saat tamu walk-in tiba, namun ada kursi yang akan kosong dalam 20 menit:
1. Tanyakan kepada tamu: *"Saat ini semua kursi sedang penuh Mas, tapi Mas Rian akan selesai sekitar 20 menit lagi (jam 14:00). Bersedia menunggu di sofa ruang tunggu?"*
2. Jika tamu bersedia: Buka modal **[ + Input Walk-In ]**.
3. Pilih jam mulai slot berikutnya (misal: 14:00 WIB) dan tekan tombol **[ Masukkan Antrean Tunggu ]**.
4. Tamu dipersilakan duduk di ruang tunggu, menikmati air mineral atau majalah gerai.

---

## 7. SOP 4: Pengaturan Jam Istirahat & Blokir Kursi

Untuk menjaga stamina barber dan memastikan hasil pangkas rambut tetap presisi, Damez Barbershop menerapkan **Sistem Istirahat Bergantian (*Staggered Break*)**.

> **ATURAN MUTLAK**: Tidak boleh ada 2 barber yang beristirahat pada jam yang sama! Gerai wajib memastikan minimal **2 kursi selalu beroperasi aktif** di setiap jam buka toko.

### 7.1 Jadwal Istirahat Rutin Harian (Telah Terkunci di Sistem)

Sistem telah mengunci jadwal istirahat rutin secara otomatis sehingga tamu online tidak dapat memesan jam istirahat ini:

| Kursi & Nama Barber | Hari Libur Rutin | Istirahat Siang (55 Menit) | Istirahat Sore/Malam (55 Menit) | Kursi Aktif Saat Itu |
|---|:---:|:---:|:---:|:---:|
| **Kursi 1: Rian The Sculptor** | **Minggu** | **12:00 – 12:55 WIB** | **18:00 – 18:55 WIB** | Kursi 2 & 3 Aktif |
| **Kursi 2: Dimas Fade Master** | **Senin** | **13:00 – 13:55 WIB** | **19:00 – 19:55 WIB** | Kursi 1 & 3 Aktif |
| **Kursi 3: Kevin Sanjaya** | **Selasa** | **14:00 – 14:55 WIB** | **20:00 – 20:55 WIB** | Kursi 1 & 2 Aktif |

---

### 7.2 Cara Blokir Slot Darurat (Izin Sakit / Perawatan Kursi / Alat Rusak)

Jika terjadi kondisi tak terduga (misalnya mesin cukur rusak, kursi hidrolik macet, atau barber tiba-tiba sakit mendadak):

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ CARA BLOKIR SLOT DARURAT DI TABLET KASIR                                        │
│                                                                                 │
│ Ketuk Kotak ──▶ Tekan Opsi ──▶ Pilih Alasan ──▶ Tentukan Jam ──▶ [Konfirmasi    │
│ Slot Kosong     [Blokir Slot]    (Sakit / Alat)   Mulai & Akhir    Blokir Slot] │
└─────────────────────────────────────────────────────────────────────────────────┘
```

1. Cari kotak jam yang ingin ditutup pada kolom barber terkait di kalender.
2. Ketuk pada area kosong slot tersebut, lalu pilih tombol **[ Blokir Slot Kursi ]**.
3. Pilih alasan pemblokiran pada menu:
   - *Izin Sakit Darurat*
   - *Pemeliharaan Alat / Kursi Hidrolik*
   - *Keperluan Mendesak Toko*
4. Tentukan rentang waktu pemblokiran (misalnya dari jam 15:00 hingga 17:00 WIB).
5. Tekan tombol **[ Konfirmasi Blokir ]**.
6. Slot akan langsung berubah warna menjadi **ABU-ABU GELAP BERARSIR** dengan tulisan *"DIBLOKIR"*.
7. Website publik secara otomatis menutup ketersediaan jam tersebut dalam detik yang sama, mencegah tamu memesan.

> **PENTING**: Jika slot yang akan diblokir ternyata sudah terisi oleh pemesanan online tamu yang sudah membayar DP, sistem akan menampilkan peringatan: *"Slot ini sudah dipesan oleh [Nama Tamu]. Hubungi tamu terlebih dahulu untuk pemindahan jadwal sebelum memblokir!"*.

---

## 8. SOP 5: Penanganan Tamu Terlambat, Reschedule & No-Show

Ketidakhadiran tanpa kabar (*no-show*) adalah musuh utama operasional barbershop. Ikuti prosedur berikut secara disiplin dan profesional.

---

### 8.1 Manajemen Tamu Terlambat (Toleransi Maksimal 15 Menit)

Sistem kalender memantau keterlambatan secara otomatis berdasarkan jam server toko (WIB):

```
Menit 00:00 ─────────────▶ Menit 10:00 ─────────────▶ Menit 15:00 ─────────────▶ Menit 16:00
Jadwal Mulai               Peringatan Siaga          Batas Toleransi Habis       Eksekusi No-Show
(Warna Hijau)              (Warna Kuning Berkedip)   (Warna Merah Terang)        (Kursi Dilepas)
```

1. **Menit 01 s/d 09 Keterlambatan (Warna Hijau)**:
   - Tamu belum hadir. Barber tetap menyiapkan alat dan handuk steril di kursi.
2. **Menit 10 Keterlambatan (Warna Kuning Berkedip)**:
   - Kartu booking berubah menjadi warna kuning dengan label: *"Terlambat 10 Menit"*.
   - **Tindakan Kasir**: Buka kartu tamu, ketuk tombol hijau kecil **[ Hubungi Tamu via WA ]**.
   - Kirimkan template sapaan ramah kasir:  
     > *"Halo Mas [Nama], kami dari Damez Barbershop menginfokan jadwal pangkas Mas dengan Mas [Barber] sudah dimulai pukul [Jam]. Apakah posisi Mas sudah dekat lokasi gerai? Toleransi kedatangan gerai adalah maksimal 15 menit. Terima kasih."*
3. **Menit 15:00 Keterlambatan (Warna Merah Terang)**:
   - Batas toleransi resmi telah habis. Kartu berubah menjadi warna merah menyala.
   - Muncul tombol darurat: **[ Lepas Kursi & Tandai No-Show ]**.

---

### 8.2 Eksekusi Pembatalan Sepihak (Tandai No-Show)
Jika jam telah menunjukkan **lewat dari 15 menit** (misalnya menit ke-16) dan tamu tidak ada kabar atau tidak membalas pesan:
1. Kasir menekan tombol merah **[ Lepas Kursi & Tandai No-Show ]**.
2. Kotak konfirmasi muncul:  
   *"Toleransi 15 menit telah habis. Uang muka DP Rp 20.000 akan dinyatakan hangus sebagai kompensasi operasional toko dan barber. Lanjutkan pelepasan kursi?"*
3. Kasir menekan **[ Ya, Lepaskan Kursi ]**.
4. Status berubah menjadi `no_show`. Kursi barber seketika berstatus kosong.
5. **Aksi Lapangan Segera**: Kasir langsung memanggil tamu walk-in yang sedang menunggu di ruang tunggu untuk menduduki kursi tersebut: *"Mas [Tamu Walk-In], kursi Mas [Barber] sudah siap, silakan masuk!"*.
6. Sistem mengirimkan pesan pembatalan resmi secara sopan ke WhatsApp tamu yang terlambat.

---

### 8.3 SOP Perubahan Jadwal (Reschedule)
Aturan baku gerai Damez Barbershop adalah: **Perubahan jadwal mandiri hanya dilayani maksimal 3 jam sebelum jadwal mulai (H-3 Jam)**.

#### Skenario A: Tamu Menghubungi Lebih dari 3 Jam Sebelum Jadwal (Sah / Gratis)
*Contoh: Jadwal jam 16:00 WIB, tamu mengirim WhatsApp pada jam 11:30 WIB (selisih 4,5 jam).*
1. Kasir mencari pemesanan tamu di dashboard berdasarkan nama atau nomor HP.
2. Tekan tombol **[ Ubah Jadwal / Reschedule ]**.
3. Sistem memunculkan tanda hijau: *"Pengajuan Sah (Memenuhi Batas H-3 Jam)"*.
4. Tanyakan jadwal baru yang diinginkan tamu dan periksa slot kosong pada kalender.
5. Pilih tanggal dan jam baru yang disepakati, lalu tekan **[ Simpan Jadwal Baru ]**.
6. Uang DP Flat Rp 20.000 otomatis dipindahkan secara utuh ke jadwal baru tanpa biaya tambahan. Tamu menerima tiket WhatsApp baru dalam 5 detik.

#### Skenario B: Tamu Menghubungi Kurang dari 3 Jam (< H-3 Jam)
*Contoh: Jadwal jam 16:00 WIB, tamu baru menghubungi admin pada jam 14:30 WIB (selisih 1,5 jam).*
1. Buka kartu pemesanan tamu di tablet.
2. Sistem akan menampilkan badge merah: *"Pengajuan Terlambat (< 3 Jam sebelum layanan)"*.
3. **Tindakan Kasir**: Sampaikan kebijakan gerai dengan sopan dan empati (gunakan panduan komunikasi pada Bab 10).
4. Jika tamu tetap membatalkan karena berhalangan hadir, tekan tombol **[ Batalkan Jadwal — DP Hangus ]**. Slot jam 16:00 langsung terbuka kembali untuk tamu walk-in di toko.

---

## 9. SOP 6: Rekap Kas Harian & Unduh Laporan Keuangan (.CSV)

Setiap malam pada pukul **21:00 WIB** saat operasional toko berakhir, kasir bersama Owner (Damez) wajib melakukan tutup kasir (*closing shift*) dan mengunduh laporan rekapitulasi harian.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ALUR REKAPITULASI KAS HARIAN (PUKUL 21:00 WIB)                                  │
│                                                                                 │
│ Jam 21:00 Toko ──▶ Tekan Tombol ──▶ File .CSV ──▶ Cocokkan 3 Pos ──▶ Tutup Laci │
│ Tutup Operasi      [Unduh CSV]       Terunduh     Uang (Kas & DP)    Selesai    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 9.1 Langkah Mengunduh Laporan .CSV
1. Pastikan seluruh pangkas rambut terakhir telah ditandai selesai di dashboard.
2. Pada bagian kanan atas dashboard tablet, tekan tombol **[ Ekspor Laporan CSV ]**.
3. Pilih rentang tanggal: pilih **"Hari Ini"** (atau rentang tanggal yang diinginkan).
4. Tekan tombol hijau **[ Unduh Berkas (.csv) ]**.
5. Berkas file dengan nama `rekap-damez-YYYY-MM-DD.csv` akan otomatis tersimpan di folder *Downloads* tablet kasir dan dikirim salinannya ke email resmi Owner.

---

### 9.2 Panduan Pencocokan 3 Pos Keuangan (Rekonsiliasi Kas)

Untuk mencegah selisih uang kas dan kecurigaan antar-staf, lakukan pencocokan pada **3 Pos Uang Terpisah**:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             TABEL REKONSILIASI 3 POS                            │
├────────────────────┬─────────────────────────────┬──────────────────────────────┤
│ POS KEUANGAN       │ SUMBER DATA DI SISTEM       │ BUKTI FISIK YANG DICOCOKKAN  │
├────────────────────┼─────────────────────────────┼──────────────────────────────┤
│ 1. DP Online       │ Kolom `nominal_dp_online`   │ Saldo mutasi masuk rekening  │
│    (Midtrans QRIS) │ pada file CSV yang terunduh │ bank / dashboard Midtrans.   │
├────────────────────┼─────────────────────────────┼──────────────────────────────┤
│ 2. Kasir Tunai     │ Kolom `pelunasan_kasir_cash`│ Uang kertas dan koin fisik   │
│    (Cash di Toko)  │ pada file CSV yang terunduh │ yang ada di dalam laci kasir.│
├────────────────────┼─────────────────────────────┼──────────────────────────────┤
│ 3. Kasir QRIS Toko │ Kolom `pelunasan_kasir_qris`│ Riwayat transaksi berhasil   │
│    (Statis Kasir)  │ pada file CSV yang terunduh │ pada aplikasi QRIS toko.     │
└────────────────────┴─────────────────────────────┴──────────────────────────────┘
```

#### Rumus Hitung Omzet Harian:
$$\text{Total Omzet Bersih Toko} = \text{Total DP Online} + \text{Total Kas Tunai} + \text{Total QRIS Kasir} + \text{DP No-Show Hangus}$$

- **Kondisi Seimbang (Match)**: Total fisik uang di laci kasir tepat sama dengan angka pada kolom `pelunasan_kasir_cash`.
- **Kondisi Selisih**: Jika terjadi selisih uang tunai (lebih atau kurang), periksa kembali tiket tamu walk-in hari itu apakah ada yang lupa diinput atau salah memasukkan nominal kembalian.

---

## 10. Panduan Komunikasi & Solusi Situasi Khusus Meja Depan

Staf meja depan adalah wajah dari Damez Barbershop. Keramahan, ketegasan yang sopan, dan ketenangan dalam menangani komplain adalah kunci menjaga reputasi bintang 5 gerai.

### Script Percakapan 1: Tamu Datang Telat di Menit ke-16 Saat Kursi Sudah Diisi Walk-In
*Kondisi: Tamu jadwal 14:00 datang pada 14:17. Kursi sudah diberikan ke tamu walk-in pada 14:16.*

> **Staf**: *"Selamat siang Mas [Nama]. Mohon maaf sekali Mas, sesuai ketentuan sistem reservasi kami yang tertera pada pesan tiket WhatsApp, batas toleransi kedatangan adalah 15 menit. Karena waktu sudah menunjukkan pukul 14:17 dan kursi tidak boleh kosong, sistem otomatis melepas slot ke tamu berikutnya.*  
> *Kami sangat menghargai waktu Mas, saat ini Mas Rian sedang melayani tamu tersebut. Kami dapat menawarkan dua opsi terbaik untuk Mas: bersedia menunggu slot Mas Dimas yang akan selesai pada pukul 14:45, atau kami bantu buatkan reservasi baru di jam lain yang Mas inginkan?"*

---

### Script Percakapan 2: Tamu Minta Reschedule Mendadak (< 3 Jam)
*Kondisi: Tamu menghubungi WhatsApp pukul 13:00 meminta pindah jadwal jam 14:00.*

> **Staf**: *"Halo Mas [Nama], terima kasih sudah menghubungi kami. Mohon maaf sebelumnya, sesuai regulasi sistem Damez Barbershop, perubahan jadwal bebas biaya hanya dapat diproses maksimal 3 jam sebelum jadwal pangkas dimulai (H-3 Jam) agar barber kami dapat mempersiapkan waktu.*  
> *Karena jadwal Mas tinggal 1 jam lagi dan kursi Mas telah dipersiapkan khusus oleh Mas [Barber], sistem mengunci slot tersebut. Jika Mas berhalangan hadir sama sekali hari ini, DP Rp 20.000 dinyatakan hangus sesuai ketentuan. Namun jika Mas bisa mengusahakan hadir sebelum toleransi 15 menit (14:15 WIB), Mas [Barber] tetap siap melayani Mas dengan maksimal."*

---

### Script Percakapan 3: Tamu Walk-In Datang Saat Semua Kursi Sedang Penuh
*Kondisi: Jam sibuk akhir pekan, seluruh kursi sedang aktif mencukur.*

> **Staf**: *"Selamat sore Mas, selamat datang di Damez Barbershop. Saat ini ketiga master barber kami sedang aktif melayani tamu reservasi di kursi. Jadwal kursi paling cepat yang akan selesai adalah milik Mas Dimas di jam 16:30 (sekitar 25 menit lagi).*  
> *Apakah Mas bersedia menunggu di sofa santai kami? Kami sediakan air mineral dingin dan WiFi gratis sambil menunggu giliran pangkas Mas."*

---

### Penanganan Gangguan Teknis (Koneksi WiFi Toko Terputus / Mode Offline)
Bila koneksi internet gerai mati mendadak:
1. **Layar Tetap Berfungsi**: Aplikasi kasir dirancang dengan teknologi *Offline Support*. Layar tablet tidak akan hilang atau putih (blank), melainkan menampilkan banner oranye kecil di pojok layar:  
   *"Koneksi Terputus — Berjalan dalam Mode Offline Lokal"*.
2. **Tetap Layani Tamu Seperti Biasa**: Staf tetap dapat mengklik tombol "Mulai Cukur" dan "Selesaikan Transaksi". Data akan tersimpan sementara di memori tablet.
3. **Nyalakan Hotspot Seluler Cadangan**: Hubungkan tablet ke koneksi tethering HP admin. Begitu internet tersambung kembali, sistem akan menyinkronkan seluruh data secara otomatis ke server Supabase Cloud tanpa ada data yang hilang.

---

## 11. Lembar Ceklis Kerja Harian (Daily Checklist)

Gunakan lembar ceklis ini sebagai panduan membuka dan menutup gerai setiap hari.

### A. Ceklis Pagi — Persiapan Buka Toko (Pukul 09:45 – 10:00 WIB)
- [ ] Buka kunci pintu toko, nyalakan lampu utama, AC, dan musik latar gerai.
- [ ] Nyalakan tablet kasir utama dan periksa daya baterai / kabel adaptor pengisi daya.
- [ ] Buka peramban dan login ke **Damez Admin Dashboard**.
- [ ] Cek kalender hari ini: periksa berapa slot online yang sudah terisi dan siapa barber yang libur rutin hari ini.
- [ ] Briefing 3 menit bersama para barber: sampaikan jadwal jam-jam padat hari ini.
- [ ] Pastikan laci kasir memiliki uang kembalian pecahan kecil (Rp 5.000, Rp 10.000, Rp 20.000, Rp 50.000) minimal Rp 200.000.
- [ ] Periksa ketersediaan handuk bersih, kertas leher (*neck paper*), dan cairan semprot disinfektan di setiap kursi.
- [ ] Tepat pukul **10:00 WIB**, ubah plang pintu menjadi **"OPEN / BUKA"**.

---

### B. Ceklis Siang & Sore — Selama Jam Operasional (Pukul 10:00 – 20:55 WIB)
- [ ] Selalu sapa setiap tamu yang masuk dalam 5 detik pertama kedatangan.
- [ ] Pastikan setiap tamu yang datang langsung (*walk-in*) segera diinput ke sistem dalam < 15 detik.
- [ ] Pantau kartu kuning siaga jika ada tamu yang belum tiba pada menit ke-10.
- [ ] Pastikan barber mengambil istirahat bergantian sesuai jam masing-masing dan tidak saling bertabrakan.
- [ ] Pastikan barber melakukan pembersihan lantai dan semprot pisau clipper selama 10 menit jeda antartamu.
- [ ] Catat pelunasan sisa tagihan di kasir secara teliti (Tunai vs QRIS kasir).

---

### C. Ceklis Malam — Tutup Kasir & Gerai (Pukul 21:00 – 21:15 WIB)
- [ ] Ubah plang pintu menjadi **"CLOSED / TUTUP"** tepat pukul 21:00 WIB.
- [ ] Pastikan tamu terakhir telah selesai dilayani dan tiketnya ditandai `completed`.
- [ ] Buka menu laporan di tablet kasir, tekan tombol **[ Unduh Laporan CSV ]**.
- [ ] Hitung total uang tunai fisik di dalam laci kasir.
- [ ] Cocokkan total fisik tunai dengan angka pada berkas CSV (`pelunasan_kasir_cash`).
- [ ] Serahkan setoran uang tunai kasir kepada Owner (Damez) bersama salinan laporan harian.
- [ ] Bersihkan seluruh kursi cukur, matikan sterilizer, bersihkan wastafel keramas.
- [ ] Buang seluruh sampah rambut ke tempat pembuangan luar.
- [ ] Matikan AC, lampu gerai, kunci pintu utama, dan pasang sistem alarm keamanan toko.

---

### Ringkasan Aksi Cepat 1-Sentuhan (Quick Reference Cheat Sheet)

| Bila Terjadi Hal Ini... | Tekan Tombol Ini di Layar Tablet... | Hasil yang Terjadi di Sistem... |
|---|---|---|
| **Tamu Online Tiba di Toko** | Ketuk Kartu ➔ Tekan **[ Mulai Cukur ]** | Status jadi Biru (`in_progress`), timer berjalan di kursi. |
| **Cukur Selesai, Tamu Mau Bayar**| Ketuk Kartu ➔ Tekan **[ Selesai & Kasir ]** | Menampilkan sisa tagihan (sudah potong DP Rp 20.000). |
| **Tamu Datang Langsung (Walk-In)**| Pojok Kanan ➔ Tekan **[ + Input Walk-In ]** | Isi nama & barber (< 15 detik), kursi langsung terkunci di web. |
| **Tamu Telat Lebih 15 Menit** | Kartu Merah ➔ Tekan **[ Lepas No-Show ]** | DP Rp 20k hangus, kursi langsung terbuka untuk tamu walk-in. |
| **Tamu Minta Ganti Jadwal (WA)** | Buka Kartu ➔ Tekan **[ Ubah Jadwal ]** | Gratis jika >= 3 jam; ditolak jika kurang dari 3 jam. |
| **Barber Izin Sakit / Kursi Rusak**| Slot Kosong ➔ Tekan **[ Blokir Kursi ]** | Slot terkunci abu-abu, tamu online tidak bisa memesan. |
| **Tutup Kasir Malam (21:00 WIB)** | Pojok Kanan ➔ Tekan **[ Unduh CSV ]** | Mengunduh file laporan keuangan harian otomatis. |

---

*Disusun oleh*:  
**Chief Content Strategist & Lead Technical Documentarian** (`writer:techdocs`)  
Damez Barbershop — High-Velocity MVP Project Baseline  
Dokumen Operasional Resmi Gerai — Tanggal Rilis: 23 Oktober 2026
