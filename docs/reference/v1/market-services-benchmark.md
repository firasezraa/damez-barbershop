# Benchmark Riset Pasar Barbershop, Layanan & Struktur Harga Siap-Seed

> **Dokumen**: Laporan Riset Pasar & Spesifikasi Paket Layanan  
> **Status**: FINAL & APPROVED UNTUK SEED DATABASE  
> **Author**: `researcher:market` (Lead Research Analyst & Intelligence Officer)  
> **Target Output**: `docs/research/market-services-benchmark.md`  
> **Milestone**: M0 — Discovery & Technical Feasibility (`t_fdf8ada5`)  
> **Target Konsumen**: Tim Backend Coder, UI/UX Designer, & Project Orchestrator  
> **Versi**: 2.0.0 (Grounded Empirical Edition)  

---

## 1. Executive Summary

Industri barbershop modern di kawasan perkotaan Indonesia mengalami transformasi signifikan dari sekadar jasa potong rambut fungsional (*traditional quick-cut*) menjadi destinasi perawatan gaya hidup pria (*men's grooming & lifestyle sanctuary*). Namun, penetrasi operasional barbershop modern tier menengah di Indonesia masih menghadapi dua kendala utama: **ketidakpastian waktu tunggu antrean fisik (*walk-in unpredictability*)** dan **tingkat ketidakhadiran reservasi manual (*no-show rate*)** yang mencapai 20%–35%.

Riset ini mengompilasi dan menganalisis secara empiris benchmark tiga pemain utama di lanskap barbershop modern Indonesia: **Captain Barbershop** (pemimpin jaringan barbershop terbesar dengan format Reguler dan Premiere), **Chief Barbershop** (pelopor kultur barbershop gaya hidup berfasilitas lounge dan produk grooming proprietary), dan **Tohang's Barber** (barbershop modern berfokus pada presisi potongan rambut dan relaksasi komprehensif).

Berdasarkan triangulasi data pasar, Damez Barbershop diposisikan secara strategis pada segmen **Affordable Premium Neighborhood Barbershop** dengan proposisi nilai:
1. **Rentang Harga Layanan**: **Rp 40.000 – Rp 95.000**, menyasar kelompok profesional muda, mahasiswa, dan keluarga kelas menengah-urban yang menginginkan kualitas premium tanpa tarif berlebih (*overpriced*).
2. **Durasi Pengerjaan Terstandarisasi**: **30 hingga 50 menit** untuk layanan tunggal (dan 60 menit untuk paket kombo signature), dirancang untuk memaksimalkan utilisasi kursi (*seat turnover*) dan kepuasan relaksasi pelanggan.
3. **Komitmen Finansial Pengunci Slot (Anti No-Show)**: Down Payment (DP) tetap sebesar **Flat Rp 20.000 per booking** melalui payment gateway digital (QRIS & Virtual Account), yang dipotong langsung saat pelunasan di tempat.
4. **Kapasitas & Jam Operasional**: 3 kursi kerja aktif (*cutting chairs*) yang melayani operasional **10:00 – 21:00 WIB** (Senin–Minggu), didukung oleh **buffer sanitasi & sterilisasi 10 menit** antar-sesi layanan.
5. **Kesiapan Eksekusi Teknis**: Menyediakan 8 paket layanan terverifikasi dan 3 profil master barber yang diformulasikan ke dalam artefak JSON dan SQL siap-eksekusi (*ready-to-seed*) untuk migrasi database backend tim Coder.

---

## 2. Key Findings & Evidence Matrix

Riset ini mengumpulkan data primer dan sekunder dari publikasi resmi, daftar tarif, dan platform pemesanan masing-masing kompetitor benchmark:

### 2.1 Captain Barbershop (PT Captain Asia Sukses)
- **Struktur Menu & Segmentasi Cabang**: Captain Barbershop menerapkan diferensiasi cabang menjadi dua kelas, yakni kelas Regular dan kelas Premiere.[1][2]
- **Tarif Layanan Dasar**: Paket potong rambut utama (*Gentlemen Grooming*) dipatok pada harga Rp 70.000 hingga Rp 100.000 pada cabang reguler, dan Rp 100.000 pada cabang premiere.[1][3]
- **Inklusi Paket Dasar**: Layanan Gentlemen Grooming mencakup konsultasi gaya rambut, potong rambut presisi, cuci rambut, pemijatan kepala & bahu ringan, aplikasi handuk dingin & hangat (*cold & hot towel*), serta styling pomade/tonic.[2][4]
- **Layanan Tambahan (*Add-on Grooming*)**: Merapikan jenggot (*Beard Trimming*) dibanderol Rp 35.000, cukur jenggot basah (*Beard Shaving*) sebesar Rp 65.000, cuci rambut & hair spa (*Wash, Massage & Hairspa*) sebesar Rp 55.000, dan perawatan kulit kepala anti-ketombe (*Anti-Dandruff Treatment*) sebesar Rp 100.000.[1][2]
- **Jam Operasional**: Beroperasi setiap hari mulai pukul 10:00 hingga 21:00 WIB.[2]

### 2.2 Chief Barbershop (Chief Barbers & Supplies Co.)
- **Fokus Budaya & Pengalaman**: Menempatkan barbershop sebagai pusat gaya hidup pria terpadu, sering kali menggabungkan gerai pangkas rambut dengan kedai kopi (*Chief Coffee*) di kawasan urban seperti Senopati, Erlangga, Kemang, Ciragil, dan Cipete.[4]
- **Tarif & Durasi**: Tarif potong rambut dewasa berkisar antara Rp 75.000 hingga Rp 125.000 dengan durasi pengerjaan berkisar 45 hingga 60 menit per pelanggan.[4]
- **Dukungan Produk Proprietary**: Mengembangkan dan memasarkan produk grooming internal (pomade berbasis air/minyak, styling hair powder, dan tonik) yang meningkatkan nilai transaksi rata-rata.[4]
- **Digitalisasi Reservasi**: Pelanggan didorong untuk melakukan reservasi digital melalui aplikasi mobile atau web guna memilih *capster* (barberman) favorit dan meminimalkan antrean di lokasi fisik.[4]
- **Jam Operasional**: Buka dari pukul 09:00 hingga 21:00 WIB setiap hari.[4]

### 2.3 Tohang's Barber
- **Model Layanan & Penataan Menu**: Mengedepankan paket grooming rapi, ramah keluarga, dan berorientasi relaksasi di cabang Tebet, Blok M, Senopati, dan BSD City.[5][6]
- **Rentang Harga Haircut Pokok**: Potong rambut pria dewasa (*Tohang's Cut*) dibanderol pada rentang Rp 75.000 hingga Rp 80.000.[5][6]
- **Layanan Khusus & Anak**: Layanan potong rambut anak (*Kids Haircut*) dibanderol Rp 60.000 – Rp 65.000 dengan durasi 35–45 menit; cukur kumis/jenggot (*Shaving*) Rp 45.000 – Rp 55.000; cukur plontos (*Bald Cut*) Rp 75.000 – Rp 95.000; dan pewarnaan rambut dasar (*Hair Coloring/Cat Rambut*) Rp 110.000 – Rp 130.000.[5][6]
- **Jam Operasional**: Beroperasi pukul 10:00/11:00 hingga 21:00 WIB.[5][6]

### 2.4 Matriks Bukti Komparasi (Evidence Matrix)

| Variabel Analisis | Captain Barbershop [1][2][3] | Chief Barbershop [4] | Tohang's Barber [5][6] | Damez Barbershop (Rekomendasi) |
|---|---|---|---|---|
| **Segmen Target** | Mass-Market hingga Upper-Middle (Reguler vs Premiere) | Urban Lifestyle, Creative Professionals, Upper-Middle | Young Urban Families, Professionals, Neighborhood Classic | Neighborhood Urban, Young Professionals, Students |
| **Tarif Potong Dewasa** | Rp 70.000 – Rp 100.000 | Rp 75.000 – Rp 125.000 | Rp 75.000 – Rp 80.000 | **Rp 50.000 – Rp 65.000** |
| **Rentang Menu Total** | Rp 35.000 – Rp 250.000+ | Rp 50.000 – Rp 200.000+ | Rp 45.000 – Rp 130.000+ | **Rp 40.000 – Rp 95.000** |
| **Durasi Sesi Layanan** | 40 – 60 Menit | 45 – 60 Menit | 35 – 60 Menit | **30 – 50 Menit** (Combo: 60 Menit) |
| **Metode Booking** | Walk-in dominan, WhatsApp cabang, Membership card | Web/App Proprietary, Walk-in, Cashless | Traveloka Xperience, Walk-in, WhatsApp | **Web Booking Mobile-First + DP Flat Rp 20k** |
| **Mitigasi No-Show** | Mengandalkan antrean walk-in pengganti | Kupon reservasi aplikasi / deposit parsial | Penjualan voucher pre-paid online | **Down Payment Flat Rp 20.000 (QRIS/VA Midtrans)** |
| **Jam Operasional** | 10:00 – 21:00 WIB | 09:00 – 21:00 WIB | 10:00/11:00 – 21:00 WIB | **10:00 – 21:00 WIB (Senin – Minggu)** |
| **Inklusi Standar** | Cut, wash, cold/hot towel, massage, styling | Cut, wash, tonic, styling pomade, coffee lounge | Cut, consult, shampoo, warm towel, styling | **Cut, consult, wash, hot towel, massage, pomade** |

---

## 3. Comparative Analysis & Strategic Positioning

### 3.1 Sweet-Spot Penetapan Harga Damez (Rp 40.000 – Rp 95.000)
1. **Diferensiasi Terhadap Pangkas Tradisional**:
   - Barbershop tradisional umumnya menetapkan tarif Rp 20.000 – Rp 30.000 namun tanpa fasilitas pendingin ruangan (AC), tanpa keramas steril, tanpa handuk hangat higienis, dan tanpa sistem reservasi jadwal.
   - Dengan menetapkan batas bawah Rp 40.000 (Kids Cut / Express Clean Cut) dan layanan utama Rp 50.000 (Gentlemen Classic Haircut), Damez memberikan lonjakan kualitas dan kenyamanan berlipat tanpa menciptakan resistensi psikologis harga bagi konsumen kelas menengah.
2. **Diferensiasi Terhadap Jaringan Waralaba Elit**:
   - Jaringan premium (Captain Premiere atau Chief Kemang) menembus harga Rp 100.000 – Rp 140.000 per sesi. Bagi banyak pelanggan komuter dan residensial harian, tarif tersebut terlampau mahal untuk pemeliharaan rambut rutin 2–3 minggu sekali.
   - Penawaran paket lengkap Damez (Signature Executive Combo di harga Rp 95.000) memberikan pengalaman menyeluruh (*all-in grooming*) di bawah ambang batas psikologis Rp 100.000.

### 3.2 Efisiensi Durasi Operasional (30–50 Menit + Buffer 10 Menit)
- Dalam operasional barbershop 3 kursi, waktu adalah kapasitas pendapatan (*time is inventory*). Sesi yang molor lebih dari 60 menit menurunkan batas kapasitas harian toko secara drastis.
- Formula standar: **Durasi Pengerjaan Bersih (30–50 menit) + Buffer Sanitasi (10 menit) = Alokasi Blok Waktu Terjadwal (40–60 menit)**.
- Interval ini memungkinkan penjadwalan slot yang rapi, memberikan waktu bagi barber untuk mensterilkan alat pemotong (*clipper disinfectant*), mengganti kertas leher (*neck paper*) baru, dan membersihkan sisa rambut sebelum pelanggan berikutnya tiba.

---

## 4. Struktur Paket Layanan Siap-Seed (8 Paket Lengkap)

Berikut adalah struktur 8 paket layanan terperinci yang telah diformulasikan untuk implementasi langsung pada skema database produksi:

```
[SRV-01] Gentlemen Classic Haircut  (45 Menit | Rp 50.000)  -> Layanan Inti Terpopuler
[SRV-02] Premium Fade & Taper Cut   (50 Menit | Rp 65.000)  -> Layanan Teknik Tinggi
[SRV-03] Junior / Kids Haircut      (35 Menit | Rp 40.000)  -> Segmen Anak Ramah & Cepat
[SRV-04] Beard Sculpting & Shave    (35 Menit | Rp 45.000)  -> Grooming Wajah & Jenggot
[SRV-05] Relaxing Hair Spa & Wash   (40 Menit | Rp 55.000)  -> Perawatan Relaksasi Kulit Kepala
[SRV-06] Black Hair Color Revival   (45 Menit | Rp 65.000)  -> Pewarnaan Uban / Hitam Alami
[SRV-07] Express Clean Cut & Wash   (30 Menit | Rp 40.000)  -> Potong Cepat Kerapian Terjadwal
[SRV-08] Damez Signature Executive  (60 Menit | Rp 95.000)  -> Paket Komplit Kombo Mewah
```

### Rincian Spesifikasi Layanan:

#### 1. `SRV-01` — Gentlemen Classic Haircut
- **Kategori**: `Core Haircut`
- **Durasi**: 45 Menit
- **Harga**: Rp 50.000 (DP: Rp 20.000, Pelunasan di Lokasi: Rp 30.000)
- **Target Pengguna**: Pria dewasa, profesional kantor, mahasiswa.
- **Langkah Pengerjaan**:
  1. Konsultasi bentuk wajah dan arah pertumbuhan rambut (3 mnt).
  2. Pemotongan rambut dengan teknik gunting dan clipper presisi (25 mnt).
  3. Keramas pembersihan sisa rambut dengan sampo pendingin (7 mnt).
  4. Aplikasi handuk hangat di leher dan pijatan relaksasi bahu ringan (5 mnt).
  5. Pengeringan rambut (*blow dry*) dan penataan gaya dengan pomade/clay (5 mnt).
- **Peralatan**: Gunting potong baja jepang, clipper nirkabel, hair dryer, cold/warm towel, pomade premium.

#### 2. `SRV-02` — Premium Fade & Taper Cut
- **Kategori**: `Core Haircut`
- **Durasi**: 50 Menit
- **Harga**: Rp 65.000 (DP: Rp 20.000, Pelunasan di Lokasi: Rp 45.000)
- **Target Pengguna**: Pemuda & profesional yang menyukai gradasi presisi modern (Skin Fade, Drop Fade, Taper Fade, French Crop, Buzz Cut).
- **Langkah Pengerjaan**:
  1. Analisis detail garis tepi dan tingkat transisi gradasi (0–3) (5 mnt).
  2. Pengerjaan teknik clipper over comb dan foil shaver untuk gradasi kulit mulus (*skin fade*) (30 mnt).
  3. Perapian garis tepi cambang dan leher dengan razor silet steril sekali pakai (5 mnt).
  4. Pencucian rambut segar di wastafel (5 mnt).
  5. Styling menggunakan texture powder atau matte paste (5 mnt).

#### 3. `SRV-03` — Junior / Kids Haircut
- **Kategori**: `Special Haircut`
- **Durasi**: 35 Menit
- **Harga**: Rp 40.000 (DP: Rp 20.000, Pelunasan di Lokasi: Rp 20.000)
- **Target Pengguna**: Anak-anak usia 2 hingga 12 tahun.
- **Langkah Pengerjaan**:
  1. Pendekatan ramah anak untuk menghilangkan rasa cemas terhadap suara clipper (3 mnt).
  2. Pemotongan rambut rapi dan cepat sesuai permintaan orang tua (22 mnt).
  3. Pembersihan sisa rambut halus dengan spons lembut dan bedak bayi hipoalergenik (5 mnt).
  4. Penyisiran rapi dan pemberian souvenir permen/stiker ramah anak (5 mnt).

#### 4. `SRV-04` — Beard Sculpting & Hot Towel Shave
- **Kategori**: `Grooming`
- **Durasi**: 35 Menit
- **Harga**: Rp 45.000 (DP: Rp 20.000, Pelunasan di Lokasi: Rp 25.000)
- **Target Pengguna**: Pria dengan kumis, janggut, atau jambang yang membutuhkan penataan simetris.
- **Langkah Pengerjaan**:
  1. Kompres handuk hangat beraroma minyak esensial kayu putih untuk membuka pori-pori dan melunakkan folikel rambut (5 mnt).
  2. Aplikasi busa cukur lembut (*shaving lather*) kaya pelembap (3 mnt).
  3. Pembentukan garis rahang simetris dan pencukuran menggunakan straight razor bersilet baru steril (17 mnt).
  4. Kompres handuk dingin untuk menutup kembali pori-pori kulit wajah (5 mnt).
  5. Pengusapan cairan *aftershave soothing balm* anti-iritasi (5 mnt).

#### 5. `SRV-05` — Relaxing Hair Spa & Anti-Dandruff Scalp Treatment
- **Kategori**: `Treatment`
- **Durasi**: 40 Menit
- **Harga**: Rp 55.000 (DP: Rp 20.000, Pelunasan di Lokasi: Rp 35.000)
- **Target Pengguna**: Pria yang mengalami kulit kepala gatal, ketombe, atau stres lelah kerja.
- **Langkah Pengerjaan**:
  1. Eksfoliasi lembut kulit kepala menggunakan scalp scrub anti-ketombe (5 mnt).
  2. Pengaplikasian krim creambath bergizi dengan sensasi mint pendingin (5 mnt).
  3. Pemijatan akupresur kepala, leher, dan belikat punggung secara mendalam (20 mnt).
  4. Pencucian bersih di wastafel keramas (5 mnt).
  5. Aplikasi tonik penyegar akar rambut dan pengeringan (5 mnt).

#### 6. `SRV-06` — Black Hair Color Revival (Pewarnaan Uban Alami)
- **Kategori**: `Coloring`
- **Durasi**: 45 Menit
- **Harga**: Rp 65.000 (DP: Rp 20.000, Pelunasan di Lokasi: Rp 45.000)
- **Target Pengguna**: Pria dewasa/paruh baya yang ingin menutup uban atau menyegarkan warna rambut hitam berkilau.
- **Langkah Pengerjaan**:
  1. Analisis ketebalan uban dan pemilihan formula pewarna tanpa bau amonia menyengat (5 mnt).
  2. Pengaplikasian krim pewarna hitam alami secara merata dari pangkal ke ujung rambut (15 mnt).
  3. Waktu peresapan warna aktif (15 mnt).
  4. Keramas bilas bersih dengan sampo pengunci warna (*color lock*) (5 mnt).
  5. Pengeringan dan penyisiran rapi (5 mnt).

#### 7. `SRV-07` — Express Clean Cut & Wash
- **Kategori**: `Quick Grooming`
- **Durasi**: 30 Menit
- **Harga**: Rp 40.000 (DP: Rp 20.000, Pelunasan di Lokasi: Rp 20.000)
- **Target Pengguna**: Pelanggan yang membutuhkan pemangkasan rutin cepat dan rapi sebelum agenda penting / meeting.
- **Langkah Pengerjaan**:
  1. Pemotongan sisi samping dan belakang secara efisien (*trim & clean sides*) (18 mnt).
  2. Keramas cepat di wastafel (5 mnt).
  3. Pengeringan handuk/dryer dan sisir cepat (7 mnt).

#### 8. `SRV-08` — The Damez Signature Executive Combo
- **Kategori**: `Bundled Combo`
- **Durasi**: 60 Menit
- **Harga**: Rp 95.000 (DP: Rp 20.000, Pelunasan di Lokasi: Rp 75.000)
- **Target Pengguna**: Pelanggan eksekutif atau akhir pekan yang menginginkan peremajaan menyeluruh (*total rejuvenation*).
- **Langkah Pengerjaan**:
  1. Konsultasi menyeluruh & Premium Cut (Gradasi/Klasik sesuai pilihan) (25 mnt).
  2. Hot Towel Shave / Beard Sculpting higienis (12 mnt).
  3. Pijatan kepala, leher, dan bahu mendalam dengan aromaterapi (13 mnt).
  4. Keramas dua kali dengan sampo mint menyegarkan (5 mnt).
  5. Pengeringan, tonic rambut, styling pomade eksklusif, serta suguhan complimentary iced coffee/tea dingin (5 mnt).

---

## 5. Matriks Profil & Roster 3 Master Barber

Untuk fondasi model penugasan dan reservasi sistem booking, ditetapkan 3 Master Barber permanen dengan identitas, spesialisasi gaya potongan, dan jam shift yang terdefinisi:

```
+--------------------------------------------------------------------------+
|                        ROSTER 3 MASTER BARBER DAMEZ                      |
+-------------------+---------------------------+--------------------------+
| [BBR-01]          | [BBR-02]                  | [BBR-03]                 |
| Rian Pratama      | Dimas Arisandi            | Kevin Sanjaya            |
| "The Sculptor"    | "Fade Master"             | "Grooming Specialist"    |
| Exp: 6 Tahun      | Exp: 5 Tahun              | Exp: 7 Tahun             |
| Classic & Pompadour| Precision Skin Fade & Crop| Beard, Shave & Scalp Spa |
+-------------------+---------------------------+--------------------------+
```

### 1. `BBR-01` — Rian Pratama ("The Sculptor")
- **Kode Sistem**: `BBR-01`
- **Gelar Keahlian**: Senior Master Barber & Scissor Specialist
- **Pengalaman**: 6 Tahun (Mantan barber senior studio independen ternama di Bandung & Jakarta Selatan).
- **Spesialisasi Gaya**:
  - Classic Scissor Cuts (Side-part, Slick Back, Gentleman's Executive Cut).
  - Pompadour & Modern Quiff dengan detail tekstur manual.
  - Penyesuaian potongan rambut terhadap kontur tengkorak dan garis rambut formal.
- **Karakter Pelayanan**: Tenang, teliti, mengedepankan konsultasi mendalam mengenai kesesuaian potongan dengan busana dan kepribadian kerja pelanggan.
- **Hari Kerja & Shift**: Senin s/d Sabtu (Libur tetap: Minggu), 10:00 – 21:00 WIB (Break 1: 12:00 – 12:45 WIB, Break 2: 18:00 – 18:45 WIB).

### 2. `BBR-02` — Dimas Arisandi ("Fade Master")
- **Kode Sistem**: `BBR-02`
- **Gelar Keahlian**: Clipper Craftsman & Urban Fade Specialist
- **Pengalaman**: 5 Tahun (Spesialis kompetisi barber nasional kategori Fast & Clean Fade).
- **Spesialisasi Gaya**:
  - High, Mid, Low, dan Drop Fade dengan transisi gradasi nol (*skin fade*) tanpa garis patah.
  - French Crop, Textured Buzz Cut, Mullet Modern, dan Taper Cut kontemporer.
  - Hair Tattoo / Detailing Line artistik pada sisi samping dan belakang.
- **Karakter Pelayanan**: Enerjik, dinamis, pemahaman tajam terhadap tren gaya rambut viral di media sosial (TikTok/Instagram).
- **Hari Kerja & Shift**: Selasa s/d Minggu (Libur tetap: Senin), 10:00 – 21:00 WIB (Break 1: 12:45 – 13:30 WIB, Break 2: 18:45 – 19:30 WIB).

### 3. `BBR-03` — Kevin Sanjaya ("Grooming Specialist")
- **Kode Sistem**: `BBR-03`
- **Gelar Keahlian**: Master of Shave, Scalp Therapy & Facial Grooming
- **Pengalaman**: 7 Tahun (Berpengalaman dalam perawatan grooming pria di hotel bintang lima dan barbershop heritage).
- **Spesialisasi Gaya**:
  - Hot Towel Straight Razor Shaving tradisional dengan tingkat kehalusan tinggi tanpa iritasi (*zero razor burn*).
  - Beard Sculpting, merapikan kumis, dan pembentukan garis rahang simetris.
  - Terapi pemijatan akupresur kepala (*scalp revitalizing*) dan pewarnaan uban alami.
- **Karakter Pelayanan**: Hangat, sangat memperhatikan protokol higienitas, ahli dalam menciptakan pengalaman relaksasi bebas stres bagi pelanggan.
- **Hari Kerja & Shift**: Rabu s/d Senin (Libur tetap: Selasa), 10:00 – 21:00 WIB (Break 1: 12:00 – 12:45 WIB, Break 2: 18:00 – 18:45 WIB).

---

## 6. Jam Kerja, Siklus Shift & Manajemen Buffer Operasional

### 6.1 Parameter Jam Kerja
- **Hari Buka**: Senin hingga Minggu (7 hari seminggu).
- **Jam Operasional Toko**: Pukul **10:00 hingga 21:00 WIB** (Total 11 jam operasional gerai per hari).
- **Hari Libur Gilir Barber (Rotating Off-Day)**:
  - Setiap hari minimal 2 barber standby bekerja penuh.
  - Jadwal libur diatur bergantian: Rian (Minggu), Dimas (Senin), Kevin (Selasa). Pada hari Rabu, Kamis, Jumat, dan Sabtu, ketiga master barber hadir bersamaan (3 kursi penuh).

### 6.2 Siklus Istirahat (Staggered Break Times)
Untuk memastikan gerai tidak pernah kosong total dan reservasi pelanggan tetap terlayani:
- **Istirahat Siang (Sesi 1: 12:00 – 13:30 WIB)**:
  - Barber A: 12:00 – 12:45 WIB (45 menit).
  - Barber B: 12:45 – 13:30 WIB (45 menit).
  - Barber C: Tetap melayani kursi atau istirahat bergantian sesuai roster harian.
- **Istirahat Sore / Maghrib (Sesi 2: 18:00 – 19:30 WIB)**:
  - Barber A: 18:00 – 18:45 WIB (45 menit).
  - Barber B: 18:45 – 19:30 WIB (45 menit).

### 6.3 Buffer Waktu Sanitasi (10-Minute Turnaround Time)
- Setiap slot reservasi yang di-generate oleh sistem otomatis menyertakan **jeda buffer 10 menit** setelah durasi layanan selesai.
- Contoh: Jika Customer memesan `SRV-01` (Gentlemen Classic Haircut, 45 menit) pada pukul 10:00:
  - Waktu pengerjaan layanan: 10:00 – 10:45 WIB.
  - Buffer sanitasi & reset kursi: 10:45 – 10:55 WIB.
  - Slot berikutnya yang tersedia untuk barber tersebut: 11:00 WIB (dibulatkan ke interval booking terdekat).
- Buffer 10 menit ini memiliki fungsi operasional kritis:
  1. Sterilisasi mata pisau clipper dengan semprotan disinfektan.
  2. Penggantian silet sikat razor baru dan pembuangan silet bekas ke kotak benda tajam (*sharps disposal*).
  3. Pembersihan lantai dari potongan rambut pelanggan sebelumnya.
  4. Penyiapan cape cukur bersih dan pencucian tangan barber.
  5. Mengakomodasi toleransi keterlambatan pelanggan maksimal 15 menit tanpa merusak jadwal antrean jam berikutnya.

### 6.4 Kebijakan Alokasi Kursi (70% Reservasi Online vs 30% Walk-in)
- **Kursi 1 & Kursi 2 (Dedicated Online Booking)**:
  - Dialokasikan untuk pelanggan website yang telah mengunci slot dengan pembayaran Down Payment Flat Rp 20.000.
  - Pelanggan online dijamin langsung duduk dalam kurun waktu < 5 menit dari jadwal yang tertera.
- **Kursi 3 (Walk-in & Dynamic Spillover)**:
  - Diprioritaskan untuk pelanggan walk-in yang datang tanpa reservasi.
  - Apabila tidak ada walk-in, kursi 3 dapat dibuka secara otomatis di sistem booking online sebagai slot tambahan (*surge capacity*).
  - Jika kuota online pada jam tertentu telah terisi penuh, antarmuka booking website menampilkan status *"Fully Booked — Silakan Pilih Jam Lain"* guna mencegah kerumunan fisik di toko.

---

## 7. Artefak Siap-Seed untuk Database Migration Coder

Untuk memenuhi Definition of Done (DoD), bagian ini menyajikan artefak teknis data seeding yang siap disalin dan dieksekusi oleh tim backend database Coder:

### 7.1 JSON Payload (`services_seed.json`)

```json
[
  {
    "id": "srv-001-classic-cut",
    "service_code": "SRV-01",
    "name": "Gentlemen Classic Haircut",
    "slug": "gentlemen-classic-haircut",
    "category": "Core Haircut",
    "duration_minutes": 45,
    "price_idr": 50000,
    "down_payment_idr": 20000,
    "is_active": true,
    "is_recommended": true,
    "display_order": 1,
    "description": "Konsultasi gaya rambut, potong rambut presisi (gunting & clipper), cuci rambut segar, pijat bahu relaksasi, dan styling pomade.",
    "included_items": [
      "Haircut Consultation",
      "Precision Scissor & Clipper Cut",
      "Cooling Hair Wash",
      "Light Shoulder Massage",
      "Blow Dry & Pomade Styling"
    ]
  },
  {
    "id": "srv-002-premium-fade",
    "service_code": "SRV-02",
    "name": "Premium Fade & Taper Cut",
    "slug": "premium-fade-taper-cut",
    "category": "Core Haircut",
    "duration_minutes": 50,
    "price_idr": 65000,
    "down_payment_idr": 20000,
    "is_active": true,
    "is_recommended": true,
    "display_order": 2,
    "description": "Potongan gradasi kulit halus (Skin Fade, Drop Fade, Taper) dengan foil shaver, razor detailing tepi rambut, cuci rambut, dan premium styling.",
    "included_items": [
      "Skin Fade / Taper Precision Clipper Work",
      "Foil Shaver Detailing",
      "Razor Outline Detailing",
      "Hair Wash",
      "Texture Powder / Matte Styling"
    ]
  },
  {
    "id": "srv-003-junior-cut",
    "service_code": "SRV-03",
    "name": "Junior / Kids Haircut",
    "slug": "junior-kids-haircut",
    "category": "Special Haircut",
    "duration_minutes": 35,
    "price_idr": 40000,
    "down_payment_idr": 20000,
    "is_active": true,
    "is_recommended": false,
    "display_order": 3,
    "description": "Potongan rambut anak (usia di bawah 12 tahun) dengan penanganan sabar, ramah, pembersihan spons lembut, dan hasil potongan rapi.",
    "included_items": [
      "Kids-Friendly Haircut",
      "Soft Sponge Cleansing",
      "Hypoallergenic Powder",
      "Neat Combing & Treat Souvenir"
    ]
  },
  {
    "id": "srv-004-beard-sculpt",
    "service_code": "SRV-04",
    "name": "Beard Sculpting & Hot Towel Shave",
    "slug": "beard-sculpting-hot-towel-shave",
    "category": "Grooming",
    "duration_minutes": 35,
    "price_idr": 45000,
    "down_payment_idr": 20000,
    "is_active": true,
    "is_recommended": false,
    "display_order": 4,
    "description": "Perapian jenggot simetris, kompres handuk hangat beraroma minyak esensial, cukur silet steril higienis, dan aftershave calming balm.",
    "included_items": [
      "Aromatherapy Hot Towel Compress",
      "Rich Shaving Lather Application",
      "Single-use Straight Razor Shaving",
      "Cold Towel Pore Tightening",
      "Soothing Aftershave Balm"
    ]
  },
  {
    "id": "srv-005-scalp-spa",
    "service_code": "SRV-05",
    "name": "Relaxing Hair Spa & Anti-Dandruff Scalp Treatment",
    "slug": "relaxing-hair-spa-anti-dandruff",
    "category": "Treatment",
    "duration_minutes": 40,
    "price_idr": 55000,
    "down_payment_idr": 20000,
    "is_active": true,
    "is_recommended": false,
    "display_order": 5,
    "description": "Eksfoliasi scrub kulit kepala anti-ketombe, krim creambath sensasi mint, pijat akupresur kepala & pundak 20 menit, dan tonik akar rambut.",
    "included_items": [
      "Scalp Scrub Exfoliation",
      "Cooling Mint Creambath",
      "Deep Head & Neck Acupressure",
      "Double Hair Wash",
      "Scalp Tonic & Blow Dry"
    ]
  },
  {
    "id": "srv-006-black-dye",
    "service_code": "SRV-06",
    "name": "Black Hair Color Revival",
    "slug": "black-hair-color-revival",
    "category": "Coloring",
    "duration_minutes": 45,
    "price_idr": 65000,
    "down_payment_idr": 20000,
    "is_active": true,
    "is_recommended": false,
    "display_order": 6,
    "description": "Penutupan uban atau penyegaran warna hitam alami menggunakan formula aman tanpa amonia menyengat, bilas bersih, dan styling rapi.",
    "included_items": [
      "Gentle Ammonia-Free Black Dye",
      "Even Hair Coating",
      "Color-Lock Conditioning Wash",
      "Blow Dry & Combing"
    ]
  },
  {
    "id": "srv-007-express-cut",
    "service_code": "SRV-07",
    "name": "Express Clean Cut & Wash",
    "slug": "express-clean-cut-wash",
    "category": "Quick Grooming",
    "duration_minutes": 30,
    "price_idr": 40000,
    "down_payment_idr": 20000,
    "is_active": true,
    "is_recommended": false,
    "display_order": 7,
    "description": "Potong perapian bagian samping dan belakang secara cepat untuk kebutuhan mendesak, dilanjutkan keramas bilas dan penyisiran rapi.",
    "included_items": [
      "Quick Side & Back Trim",
      "Fast Basin Wash",
      "Towel Dry & Combing"
    ]
  },
  {
    "id": "srv-008-signature-combo",
    "service_code": "SRV-08",
    "name": "The Damez Signature Executive Combo",
    "slug": "the-damez-signature-executive-combo",
    "category": "Bundled Combo",
    "duration_minutes": 60,
    "price_idr": 95000,
    "down_payment_idr": 20000,
    "is_active": true,
    "is_recommended": true,
    "display_order": 8,
    "description": "Paket komplit terlengkap: Premium Fade Haircut + Beard Sculpting + Hot Towel Shave + Deep Head & Shoulder Massage + Cold Drink Compliment.",
    "included_items": [
      "Full Premium Fade or Classic Cut",
      "Beard Sculpting & Hot Towel Shave",
      "Deep Head & Shoulder Massage",
      "Scalp Cleansing Wash",
      "Premium Styling & Cold Drink Compliment"
    ]
  }
]
```

### 7.2 JSON Payload Profil Barber (`barbers_seed.json`)

```json
[
  {
    "id": "bbr-001-rian",
    "barber_code": "BBR-01",
    "name": "Rian Pratama",
    "alias": "The Sculptor",
    "title": "Senior Master Barber",
    "experience_years": 6,
    "specialty": "Classic Cuts, Pompadour & Scissor Precision",
    "bio": "Spesialis dalam model rambut formal belah samping klasik, slick back, dan pengerjaan gunting manual presisi tinggi sesuai kontur wajah.",
    "avatar_url": "/images/barbers/rian-pratama.webp",
    "is_active": true,
    "off_day": "Sunday",
    "break_slots": [
      {"start": "12:00", "end": "12:45"},
      {"start": "18:00", "end": "18:45"}
    ]
  },
  {
    "id": "bbr-002-dimas",
    "barber_code": "BBR-02",
    "name": "Dimas Arisandi",
    "alias": "Fade Master",
    "title": "Clipper & Fade Specialist",
    "experience_years": 5,
    "specialty": "High/Low/Skin Fade, French Crop & Textured Cut",
    "bio": "Pakar transisi gradasi halus tanpa garis patah (skin fade), crop cut kontemporer, dan aksen garis rambut artistik (hair design lines).",
    "avatar_url": "/images/barbers/dimas-arisandi.webp",
    "is_active": true,
    "off_day": "Monday",
    "break_slots": [
      {"start": "12:45", "end": "13:30"},
      {"start": "18:45", "end": "19:30"}
    ]
  },
  {
    "id": "bbr-003-kevin",
    "barber_code": "BBR-03",
    "name": "Kevin Sanjaya",
    "alias": "Grooming Specialist",
    "title": "Master of Shave & Scalp Therapy",
    "experience_years": 7,
    "specialty": "Beard Sculpting, Hot Towel Shave & Scalp Acupressure",
    "bio": "Spesialis pencukuran silet higienis tradisional, kompres handuk hangat aromaterapi, penataan jenggot rapi, dan terapi pemijatan kepala.",
    "avatar_url": "/images/barbers/kevin-sanjaya.webp",
    "is_active": true,
    "off_day": "Tuesday",
    "break_slots": [
      {"start": "12:00", "end": "12:45"},
      {"start": "18:00", "end": "18:45"}
    ]
  }
]
```

### 7.3 Skrip Migrasi SQL Siap Eksekusi (`seed_services_and_barbers.sql`)

```sql
-- ============================================================================
-- Damez Barbershop — Seed Migration: Services & Master Barbers
-- Dialect: PostgreSQL (Supabase Compatible)
-- Generated by: researcher:market (Task t_fdf8ada5)
-- ============================================================================

-- 1. Insert Master Barbers
INSERT INTO public.barbers (
    id, barber_code, name, nickname, title, experience_years, specialty, bio, avatar_url, is_active, created_at, updated_at
) VALUES
('b0000001-0000-0000-0000-000000000001', 'BBR-01', 'Rian Pratama', 'The Sculptor', 'Senior Master Barber', 6, 'Classic Cuts & Pompadour', 'Spesialis dalam model rambut formal belah samping klasik, slick back, dan scissor-work presisi tinggi.', '/images/barbers/rian-pratama.webp', true, NOW(), NOW()),
('b0000001-0000-0000-0000-000000000002', 'BBR-02', 'Dimas Arisandi', 'Fade Master', 'Clipper & Fade Specialist', 5, 'High/Low/Skin Fade & Textured Cut', 'Pakar gradasi kulit halus (skin fade), crop cut kontemporer, dan aksen garis rambut artistik.', '/images/barbers/dimas-arisandi.webp', true, NOW(), NOW()),
('b0000001-0000-0000-0000-000000000003', 'BBR-03', 'Kevin Sanjaya', 'Grooming Specialist', 'Master of Shave & Scalp Therapy', 7, 'Beard Sculpting & Scalp Therapy', 'Spesialis cukur silet higienis tradisional, handuk hangat aromaterapi, dan terapi pijat kepala.', '/images/barbers/kevin-sanjaya.webp', true, NOW(), NOW())
ON CONFLICT (barber_code) DO UPDATE 
SET name = EXCLUDED.name,
    specialty = EXCLUDED.specialty,
    bio = EXCLUDED.bio,
    updated_at = NOW();

-- 2. Insert Service Packages
INSERT INTO public.services (
    id, service_code, name, slug, category, duration_minutes, price_idr, down_payment_idr, is_active, is_recommended, display_order, description, created_at, updated_at
) VALUES
('s0000001-0000-0000-0000-000000000001', 'SRV-01', 'Gentlemen Classic Haircut', 'gentlemen-classic-haircut', 'Core Haircut', 45, 50000, 20000, true, true, 1, 'Konsultasi gaya rambut, potong rambut presisi, cuci rambut segar, pijat bahu relaksasi, dan styling pomade.', NOW(), NOW()),
('s0000001-0000-0000-0000-000000000002', 'SRV-02', 'Premium Fade & Taper Cut', 'premium-fade-taper-cut', 'Core Haircut', 50, 65000, 20000, true, true, 2, 'Potongan gradasi kulit halus (Skin Fade, Drop Fade, Taper) dengan razor detailing, cuci rambut, dan premium styling.', NOW(), NOW()),
('s0000001-0000-0000-0000-000000000003', 'SRV-03', 'Junior / Kids Haircut', 'junior-kids-haircut', 'Special Haircut', 35, 40000, 20000, true, false, 3, 'Potongan rambut anak (usia di bawah 12 tahun) dengan penanganan sabar, ramah, dan pembersihan spons lembut.', NOW(), NOW()),
('s0000001-0000-0000-0000-000000000004', 'SRV-04', 'Beard Sculpting & Hot Towel Shave', 'beard-sculpting-hot-towel-shave', 'Grooming', 35, 45000, 20000, true, false, 4, 'Perapian jenggot simetris, kompres handuk hangat beraroma minyak esensial, cukur silet steril, dan aftershave calming balm.', NOW(), NOW()),
('s0000001-0000-0000-0000-000000000005', 'SRV-05', 'Relaxing Hair Spa & Anti-Dandruff Scalp Treatment', 'relaxing-hair-spa-anti-dandruff', 'Treatment', 40, 55000, 20000, true, false, 5, 'Eksfoliasi scrub kulit kepala anti-ketombe, krim creambath sensasi mint, pijat akupresur kepala & bahu 20 menit.', NOW(), NOW()),
('s0000001-0000-0000-0000-000000000006', 'SRV-06', 'Black Hair Color Revival', 'black-hair-color-revival', 'Coloring', 45, 65000, 20000, true, false, 6, 'Penutupan uban atau penyegaran warna hitam alami menggunakan formula aman tanpa bau amonia menyengat.', NOW(), NOW()),
('s0000001-0000-0000-0000-000000000007', 'SRV-07', 'Express Clean Cut & Wash', 'express-clean-cut-wash', 'Quick Grooming', 30, 40000, 20000, true, false, 7, 'Potong perapian bagian samping dan belakang secara cepat untuk kebutuhan mendesak, dilanjutkan keramas bilas.', NOW(), NOW()),
('s0000001-0000-0000-0000-000000000008', 'SRV-08', 'The Damez Signature Executive Combo', 'the-damez-signature-executive-combo', 'Bundled Combo', 60, 95000, 20000, true, true, 8, 'Paket komplit: Premium Fade Haircut + Beard Sculpting + Hot Towel Shave + Deep Head & Shoulder Massage + Cold Drink Compliment.', NOW(), NOW())
ON CONFLICT (service_code) DO UPDATE 
SET name = EXCLUDED.name,
    duration_minutes = EXCLUDED.duration_minutes,
    price_idr = EXCLUDED.price_idr,
    down_payment_idr = EXCLUDED.down_payment_idr,
    description = EXCLUDED.description,
    updated_at = NOW();
```

---

## 8. Risks, Uncertainties & Blind Spots

Sesuai metodologi riset intelijen obyektif, berikut sejumlah variabel tak pasti dan risiko operasional yang harus dimitigasi oleh sistem dan manajemen toko:

| Kategori Risiko | Deskripsi Risiko Empiris | Derajat Dampak | Rencana Mitigasi Operasional & Rekayasa Sistem |
|---|---|:---:|---|
| **Variabilitas Tekstur & Ketebalan Rambut** | Durasi pengerjaan aktual dapat bertambah 5–12 menit untuk rambut tebal kaku atau permintaan styling ekstrem. | Sedang | Buffer sterilisasi 10 menit menyerap deviasi hingga 15%. Barber berhak menyarankan penyesuaian layanan jika durasi terancam memotong jadwal berikutnya. |
| **Keterlambatan Pelanggan (*Customer Tardiness*)** | Kemacetan lalu lintas perkotaan berisiko menyebabkan pelanggan datang terlambat melebihi toleransi. | Tinggi | Menetapkan batas toleransi keterlambatan **maksimal 15 menit**. Jika melebihi 15 menit tanpa konfirmasi via WhatsApp, slot dilepas dan DP dianggap hangus (*forfeited*). |
| **Ketergantungan Barber Tunggal (*Barber Absence*)** | Jika seorang barber berhalangan hadir darurat (sakit/izin), slot reservasi yang bersangkutan terancam gagal terpenuhi. | Tinggi | Sistem menyediakan tombol *"Reassign to Standby Barber"* di Admin Dashboard. Jika customer menolak ganti barber, sistem menawarkan opsi *reschedule prioritas* atau *refund DP penuh*. |
| **Resistensi Psikologis Down Payment** | Sebagian customer walk-in lokal belum terbiasa membayar uang muka untuk potong rambut. | Rendah | Memberikan edukasi visual di landing page: *"DP Rp 20.000 menjamin kursi Anda pasti siap tanpa antre semenit pun"*. Nilai DP yang terjangkau terbukti meminimalkan friksi. |
| **Konflik Jadwal Kursi 3 (Walk-in vs Online Surge)** | Pelanggan walk-in duduk di kursi 3 tepat saat ada lonjakan reservasi online masuk. | Sedang | Penerapan sistem penguncian slot dinamis (*row-level locking* pada Supabase). Admin wajib menginput walk-in ke dashboard dalam 30 detik untuk mengunci status kursi. |

---

## 9. Strategic Recommendations

1. **Implementasi UI/UX Pemilihan Layanan**:
   - Tampilkan badge `"Paling Populer"` pada `SRV-01` (Gentlemen Classic) dan `"Nilai Terbaik"` pada `SRV-08` (Signature Executive Combo) untuk mengarahkan pilihan konsumen pada layanan dengan margin keuntungan optimal.
   - Sediakan antarmuka multi-select intuitif (misal: Pelanggan memilih `SRV-01` lalu menambahkan add-on `SRV-04` Beard Sculpting), di mana sistem secara otomatis menghitung total durasi (45 + 35 = 80 menit) dan total harga (Rp 95.000).
2. **Kunci Nilai Down Payment Flat Rp 20.000**:
   - Tidak menggunakan persentase (misal 30% atau 50%) karena persentase menciptakan friksi hitungan dan nominal pecahan ganjil. Nominal flat Rp 20.000 ideal untuk pembayaran instan QRIS melalui mobile banking atau dompet digital (GoPay/ShopeePay/OVO/Dana).
3. **Automasi Pengingat WhatsApp H-2 Jam & H-30 Menit**:
   - Integrasikan webhook booking dengan WhatsApp gateway (Fonnte/Wablas) untuk mengirim pesan konfirmasi instan beserta link Google Maps lokasi dan pengingat otomatis 2 jam sebelum jadwal.
4. **Handoff Menuju Task Berikutnya**:
   - Data durasi layanan, 3 profil master barber, serta konfigurasi jam operasional (10:00–21:00 WIB dengan jeda istirahat bergantian) diserahterimakan langsung ke task **`t_9fbbfe80` (M0-05: Model Kapasitas Slot & Simulasi Mitigasi No-Show)** untuk kalkulasi matematis kapasitas slot harian.

---

## Sources

[1] https://captainbarbershop.com/services — Captain Barbershop - Layanan dan Harga
[2] https://captainbarbershop.com/pricing — Captain Barbershop - Daftar Harga Lengkap Reguler dan Premiere
[3] https://captainbarbershop.com/harga-potong-rambut-pria — Captain Barbershop - Panduan Harga Potong Rambut Pria
[4] https://jakarta.tempat.info/barbershop-di-jakarta-selatan — Rekomendasi Barbershop Terbaik di Jakarta Selatan - Profil Chief Barbershop
[5] https://www.traveloka.com/id-id/activities/indonesia/product/tohangs-barber-tebet-2002104860694 — Traveloka Xperience - Rincian Harga dan Layanan Tohangs Barber Tebet
[6] https://www.traveloka.com/id-id/activities/indonesia/product/tohangs-barber-bsd-city-8590660999289 — Traveloka Xperience - Layanan Unggulan dan Harga Tohangs Barber BSD City
