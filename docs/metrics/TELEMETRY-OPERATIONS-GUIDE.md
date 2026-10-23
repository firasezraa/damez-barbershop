# PANDUAN OPERASIONAL & AUDIT TELEMETRI METRIK
## Conversion Funnel & No-Show Monitoring Manual
**Damez Barbershop — Panduan Pemilik & Kasir Operasional**

---

## 1. Pendahuluan

Dokumen ini adalah panduan resmi bagi Owner dan Petugas Kasir Damez Barbershop untuk membaca, memantau, dan menindaklanjuti data telemetri bisnis pada **Admin Dashboard (Tab: Telemetri & Konversi)**.

Sistem telemetri ini dirancang khusus untuk memastikan dua tujuan strategis tercapai secara transparan:
1. **Memantau Alur Konversi Pengunjung:** Mengetahui efektivitas situs web dari pengunjung pertama hingga selesai cukur.
2. **Menjaga Rasio No-Show di Bawah 10%:** Membuktikan bahwa kebijakan pembayaran Down Payment (DP) Flat Rp 20.000 dan pengingat WhatsApp berhasil menekan ketidakhadiran pelanggan.

---

## 2. Cara Mengakses Dashboard Telemetri

1. Buka Admin Portal pada browser: `https://damezbarber.com/dashboard` (atau `/admin`).
2. Masuk menggunakan akun PIN/Password kasir atau owner.
3. Pada bilah navigasi tab di atas kalender antrean, klik tombol berikon grafik batang:
   **[Telemetri & Konversi]**.
4. Data akan dimuat secara instan dan disinkronkan secara real-time dengan basis data gerai.

---

## 3. Struktur & Interpretasi Metrik

### 3.1 Headline KPI Cards (4 Kartu Utama)

1. **Rasio No-Show (%)**
   - **Formula:** `(Total Booking No-Show / Total Booking Terjadwal) x 100%`
   - **Target Standar:** Wajib di bawah **10.0%**.
   - **Indikator Status:**
     - **Hijau (`TARGET TERCAPAI`):** Rasio &le; 10.0%. Operasional berjalan sangat sehat.
     - **Kuning (`PERINGATAN`):** Rasio antara 10.1% hingga 15.0%. Diperlukan pengecekan log pengiriman WhatsApp.
     - **Merah (`KRITIS`):** Rasio &gt; 15.0%. Owner wajib melakukan audit langsung.

2. **Penurunan No-Show vs Industri (%)**
   - **Tolak Ukur:** Benchmark rata-rata barbershop konvensional tanpa sistem DP di Indonesia adalah **28.5%**.
   - **Arti Angka:** Jika dashboard menunjukkan `-76.1%`, artinya sistem DP Damez berhasil memangkas lebih dari 3/4 kasus ketidakhadiran dibandingkan barbershop konvensional.

3. **Konversi End-to-End (%)**
   - **Formula:** `(Jumlah Pelanggan Selesai Cukur / Jumlah Pengunjung Web) x 100%`
   - **Standar Sehat:** Industri layanan fisik umumnya berkisar antara 4% – 8%. Angka di atas 6.5% menandakan copy penawaran dan alur booking berjalan sangat efektif.

4. **Dana DP Hangus Terlindungi (Rp)**
   - **Arti Angka:** Akumulasi nominal DP Rp 20.000 dari tamu yang terbukti tidak hadir melewati batas toleransi 15 menit.
   - **Alokasi:** Dana ini dialokasikan 100% sebagai kompensasi biaya sewa kursi barber yang menganggur selama slot tersebut.

---

### 3.2 Visualisasi 4-Stage Conversion Funnel

Dashboard memetakan perjalanan pelanggan ke dalam 4 kotak tahapan:

| Tahap | Nama Tahapan | Keterangan & Definisi |
|---|---|---|
| **Tahap 1** | **Pengunjung Web** | Sesi pengguna unik yang membuka halaman beranda/profile Damez Barbershop. |
| **Tahap 2** | **Klik Booking** | Pengguna yang mengklik tombol CTA "Booking Sekarang" dan masuk ke form pemilihan layanan. |
| **Tahap 3** | **Bayar DP Flat Rp 20.000** | Pelanggan yang berhasil membayar DP melalui QRIS/VA Midtrans dan reservasi terkonfirmasi. |
| **Tahap 4** | **Hadir di Gerai & Selesai** | Pelanggan yang hadir di gerai, duduk di kursi barber, dan melunasi sisa tagihan di kasir. |

**Cara Menganalisis Drop-off:**
- Jika drop-off tinggi pada **Tahap 1 &rarr; 2**: Perbaiki judul promosi hero dan visibilitas tombol booking mobile.
- Jika drop-off tinggi pada **Tahap 2 &rarr; 3**: Periksa variasi metode bayar QRIS atau kejelasan informasi jam operasional.
- Jika drop-off terjadi pada **Tahap 3 &rarr; 4**: Ini adalah representasi langsung dari pelanggan **No-Show**.

---

### 3.3 Matriks Performa Barber (3 Kursi)

Tabel ini memperlihatkan kontribusi masing-masing Master Barber:
- **Rian Pratama (Kursi 1)**
- **Dimas Anggara (Kursi 2)**
- **Kevin Sanjaya (Kursi 3)**

Owner dapat memantau apakah ada barber yang memiliki tingkat no-show lebih tinggi dari rekannya. Jika salah satu kursi memiliki badge `Perhatian`, tanyakan apakah ada kendala komunikasi atau keterlambatan antrean sebelumnya.

---

### 3.4 Analisis Kanal Trafik Akuisisi

Menampilkan asal kedatangan calon pelanggan:
1. **Google Search & Maps (SEO Lokal):** Tamu yang mencari kata kunci "barbershop terdekat" atau nama Damez di Google.
2. **Direct / QR Code Fisik Toko:** Tamu yang memindai QR code di meja kasir, banner luar gerai, atau kartu nama.
3. **Instagram Profile Link:** Calon pelanggan dari link bio Instagram resmi.
4. **WhatsApp Referral & Chat Link:** Tamu yang menerima tautan reservasi via chat customer service.

---

## 4. Standar Operasional Prosedur (SOP) Eskalasi No-Show

### Kapan Kasir Boleh Menandai Tamu sebagai No-Show?
1. Jadwal kedatangan tamu telah tiba (contoh: 14:00 WIB).
2. Kasir menunggu masa toleransi **tepat 15 menit** (hingga 14:15 WIB).
3. Kasir menghubungi nomor WhatsApp pelanggan sebanyak 1 kali.
4. Jika hingga menit ke-15 tamu belum tiba dan tidak ada konfirmasi keterlambatan:
   - Kasir membuka kartu reservasi pada Kalender Matriks.
   - Klik tombol **[Tandai No-Show]**.
   - Masukkan alasan: *"Toleransi 15 menit habis. Tamu tidak hadir."*
   - Konfirmasi tindakan.
5. **Dampak Otomatis Sistem:**
   - Kursi barber langsung dibebaskan kembali menjadi hijau (tersedia untuk tamu walk-in).
   - DP Rp 20.000 dinyatakan hangus dan masuk ke pos pendapatan kompensasi no-show.
   - Event telemetri `booking_no_show` otomatis tercatat pada dashboard metrik.

### Prosedur Jika Rasio No-Show Melebihi 10% (Status Warning/Critical)
1. Periksa log gateway WhatsApp di menu notifikasi untuk memastikan pesan pengingat H-2 jam dan H-30 menit terkirim sukses tanpa hambatan kuota API.
2. Evaluasi apakah terdapat kondisi eksternal (hujan lebat, kemacetan ekstrem di sekitar ruko, atau hari libur nasional).
3. Jika no-show terkonsentrasi pada jam malam (19:00 - 20:00), pertimbangkan untuk membatasi kuota booking online pada jam tersebut dan mengalihkannya ke antrean walk-in langsung.

---

## 5. Kepatuhan Privasi Data (UU PDP No. 27/2022)

Dalam menampilkan metrik dan tabel log aktivitas terkini:
- Seluruh nomor telepon pengguna **wajib disamarkan (masked)** dan tidak disimpan dalam data telemetri publik.
- Nama lengkap pelanggan tidak ditampilkan pada audit trail telemetri, melainkan hanya diwakili oleh ID sesi dan kode reservasi acak (contoh: `DMZ-20261024-001`).
- Hak privasi pelanggan terjamin sepenuhnya sesuai regulasi perlindungan data pribadi di Republik Indonesia.

---

## 6. Prosedur Ekspor Data untuk Laporan Bulanan

1. Buka tab **[Telemetri & Konversi]**.
2. Pilih filter rentang waktu: **[30 Hari]** atau **[Semua]**.
3. Klik tombol ikon unduh **[Export JSON]** di pojok kanan atas.
4. File laporan dengan format nama `damez-telemetry-30d-YYYY-MM-DD.json` akan otomatis terunduh ke perangkat.
5. Simpan file tersebut ke folder arsip keuangan bulanan sebagai bukti audit efektivitas operasional.

---

*Disusun dan disahkan oleh Tim Product & Operasional Damez Barbershop — 2026.*
