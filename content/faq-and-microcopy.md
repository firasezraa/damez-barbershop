# Kamus Teks Antarmuka, Panduan Status Kendala, dan Tanya Jawab Operasional
## Damez Barbershop, Senopati Jakarta Selatan

Dokumen ini memuat panduan salinan teks antarmuka (microcopy dictionary), formulasi pesan kendala (error states), serta dokumentasi tanya jawab resmi (FAQ) untuk sistem reservasi daring Damez Barbershop. Dokumen ini menjadi acuan tunggal bagi tim pengembang antarmuka (coder:frontend), pengembang sistem backend (coder:backend), perancang integrasi notifikasi WhatsApp, serta pengelola meja depan (admin kasir).

Seluruh naskah disusun dengan pendekatan lugas, sopan, transparan, dan berorientasi pada kemudahan pengguna perangkat ponsel. Dokumen ini mematuhi standar aksesibilitas WCAG 2.1 Level AA, kebijakan tanpa emoji (anti-emoji policy), dan panduan penulisan alami manusiawi tanpa tanda pisau em dash atau en dash.

---

## 1. Karakter Komunikasi dan Panduan Nada Suara (Voice and Tone)

Komunikasi antarmuka Damez Barbershop mencerminkan kebiasaan barbershop klasik yang dipadukan dengan kepastian teknologi modern:

1. Menghormati Waktu Pengguna
   Pria urban memiliki jadwal harian yang padat. Seluruh instruksi, label, dan keterangan harus dapat dipahami dalam hitungan detik. Hindari kalimat pembuka yang berbelit-belit. Sampaikan fakta penting dan tindakan berikutnya secara langsung.

2. Transparansi Finansial Tanpa Keraguan
   Jelaskan setiap komponen biaya dengan angka pasti. Tegaskan bahwa uang muka flat Rp 20.000 memotong total nota layanan saat pelunasan di meja kasir. Jangan pernah membiarkan pelanggan menebak sisa tagihan yang harus dibayar di lokasi.

3. Umpan Balik Tanpa Menghakimi (Zero-Guilt Feedback)
   Ketika waktu pembayaran habis, slot bentrok, atau koneksi terputus, jangan pernah menggunakan kata-kata yang menyalahkan pelanggan. Gunakan kalimat bernada tenang yang menawarkan solusi pemulihan cepat dalam satu ketukan jari.

4. Kesetaraan Menghargai Komitmen
   Aturan batas waktu pembatalan 3 jam (H-3 jam) dan toleransi keterlambatan 15 menit disampaikan secara tegas namun tetap santun. Aturan ini diposisikan sebagai kesepakatan bersama demi menjaga keadilan antrean bagi pelanggan lain dan melindungi waktu kerja para master barber.

---

## 2. Kamus Tombol dan Aksi Interaktif (Buttons and CTAs)

Daftar label tombol baku untuk seluruh halaman publik dan modul pemesanan:

### 2.1 Tombol Utama Pemesanan (Primary Action Buttons)
- Hero CTA: Booking Kursi Sekarang
- Hero CTA Pendukung: Lihat Paket Layanan & Tarif
- Sticky Bar Mobile: Booking Sekarang
- Wizard Step 1: Lanjut Pilih Barber
- Wizard Step 2: Lanjut Pilih Tanggal & Jam
- Wizard Step 3: Lanjut Isi Data Diri
- Wizard Step 4: Lanjut ke Ringkasan
- Wizard Step 5 (Kunci Kursi): Kunci Slot & Bayar DP Rp 20.000
- QRIS Step: Cek Status Pembayaran
- Boarding Pass Step: Simpan Jadwal ke Kalender

### 2.2 Tombol Aksi Sekunder dan Navigasi (Secondary and Utility Buttons)
- Kembali ke Langkah Sebelumnya: Kembali
- Ubah Layanan: Ganti Pilihan Layanan
- Ubah Barber: Pilih Barber Lain
- Ubah Jadwal: Pilih Jam Lain
- Batal Pemesanan Sementara: Batalkan Pemesanan
- Unduh Gambar QRIS: Unduh QR Code (PNG)
- Salin Nominal Pembayaran: Salin Nominal Rp 20.000
- Salin Kode Booking: Salin Kode Tiket
- Navigasi Lokasi Toko: Buka Peta Rute Google Maps
- Kirim Ulang Tiket: Kirim Ulang ke WhatsApp
- Unduh Tiket Lengkap: Unduh Gambar Tiket (PNG)
- Bantuan Langsung: Hubungi WhatsApp Admin

### 2.3 Matriks Status Tombol (Button State Variations)
Setiap tombol aksi memiliki salinan status yang konsisten:

1. Status Standar (Default)
   Teks label tindakan utama yang jelas (contoh: Kunci Slot & Bayar DP Rp 20.000).

2. Status Sorot (Hover pada Desktop)
   Teks tetap sama, disertai elevasi bayangan amber lembut.

3. Status Ditekan (Active / Pressed)
   Teks tetap sama, visual tombol sedikit mengecil (skala 0.98) untuk memberikan umpan balik sentuhan fisik.

4. Status Memproses (Loading State)
   - Tombol Kunci Slot: Mengunci kursi Anda...
   - Tombol Verifikasi Pembayaran: Memeriksa pembayaran...
   - Tombol Salin Teks: Menyalin...
   - Tombol Kirim Ulang Tiket: Mengirim tiket...

5. Status Non-Aktif (Disabled State)
   - Belum memilih layanan: Pilih minimal 1 layanan
   - Belum memilih barber: Tentukan barber Anda
   - Belum memilih jam: Tentukan jam kedatangan
   - Data kontak belum lengkap: Lengkapi nama dan WhatsApp

---

## 3. Instruksi Langkah Demi Langkah Pemesanan (Funnel Step Instructions)

Salinan instruksi untuk lima langkah formulir pemesanan, layar pembayaran QRIS, dan tiket digital:

### 3.1 Langkah 1: Pemilihan Paket Layanan
- Judul Langkah: Langkah 1 dari 5
- Judul Bagian: Pilih Layanan Pangkas dan Perawatan
- Deskripsi Panduan:
  Pilih satu layanan utama atau kombinasikan maksimal dua layanan perawatan. Durasi pengerjaan dan total biaya akan dihitung secara otomatis.
- Label Info Sanitasi:
  Setiap sesi sudah termasuk jeda sanitasi alat 10 menit sebelum tamu berikutnya duduk.
- Label Kuota Pilihan:
  Pilihan Anda: {count}/2 layanan terpilih
- Peringatan Batas Maksimal (Muncul saat memilih layanan ke-3):
  Maksimal dua layanan per satu sesi reservasi agar kualitas pengerjaan tetap terjaga. Jika membutuhkan paket lengkap lainnya, silakan pilih paket kombo yang tersedia.
- Kartu Layanan Terpilih:
  Layanan Ditambahkan | Estimasi Waktu: {duration} Menit

### 3.2 Langkah 2: Pemilihan Master Barber
- Judul Langkah: Langkah 2 dari 5
- Judul Bagian: Tentukan Master Barber Pilihan Anda
- Deskripsi Panduan:
  Setiap barber memiliki keahlian potongan khusus. Anda bebas memilih barber andalan atau menyerahkan pilihan kepada barber yang siap di toko.
- Opsi Fleksibel (Rekomendasi Cepat):
  - Label Kartu: Siapa Saja yang Siap
  - Sub-label: Waktu tunggu paling fleksibel, dipilihkan barber yang siap melayani Anda.
- Profil Barber 1:
  - Nama: Rian Pratama
  - Gelar Keahlian: The Sculptor
  - Spesialisasi: Classic Cuts, Pompadour, dan Scissor-over-comb
  - Jadwal Libur Mingguan: Hari Minggu
- Profil Barber 2:
  - Nama: Dimas Arisandi
  - Gelar Keahlian: The Fade Master
  - Spesialisasi: Low/Mid/High Skin Fade, Taper Cut, dan Sharp Line-up
  - Jadwal Libur Mingguan: Hari Senin
- Profil Barber 3:
  - Nama: Kevin Sanjaya
  - Gelar Keahlian: The Classic Gentleman
  - Spesialisasi: Traditional Hot Towel Shave, Beard Trim, dan Pijat Relaksasi
  - Jadwal Libur Mingguan: Hari Selasa
- Catatan Ketersediaan:
  Barber yang sedang libur mingguan atau telah penuh jadwalnya ditandai dengan warna redup dan tidak dapat dipilih untuk tanggal bersangkutan.

### 3.3 Langkah 3: Pemilihan Tanggal dan Slot Waktu
- Judul Langkah: Langkah 3 dari 5
- Judul Bagian: Tentukan Tanggal dan Jam Kedatangan
- Deskripsi Panduan:
  Pilih hari kedatangan dalam 7 hari ke depan. Jam yang ditampilkan adalah jam pasti kursi Anda mulai disiapkan.
- Keterangan Jam Kerja:
  Jam Buka: 10:00 - 21:00 WIB (Sesi terakhir pukul 20:00 WIB)
- Pembagian Klaster Waktu:
  - Klaster 1: Sesi Siang (10:00 - 14:00 WIB)
  - Klaster 2: Sesi Sore dan Malam (14:00 - 20:00 WIB)
- Kamus Status Slot Waktu (Time Chip Labels):
  - Slot Tersedia: Jam tertera jelas (contoh: 14:30 WIB)
  - Slot Terpilih: Jam tertera dengan latar amber pekat
  - Slot Sedang Dikunci Tamu Lain: Sedang Proses Bayar (Terkunci 15 Menit)
  - Slot Terisi Penuh: Penuh
  - Slot Jam Istirahat Barber: Istirahat
  - Melebihi Jam Tutup Toko: Melebihi Jam Operasional
- Keterangan Perhitungan Durasi:
  Layanan Anda membutuhkan waktu {service_minutes} menit ditambah 10 menit sterilisasi alat. Sesi Anda selesai pukul {end_time} WIB.

### 3.4 Langkah 4: Pengisian Data Kontak dan Izin WhatsApp
- Judul Langkah: Langkah 4 dari 5
- Judul Bagian: Masukkan Kontak untuk Pengiriman Tiket
- Deskripsi Panduan:
  Kami tidak mewajibkan pembuatan akun atau kata sandi. Cukup masukkan nama dan nomor WhatsApp aktif untuk menerima tiket digital dan pengingat jadwal.
- Label Bidang Nama:
  Nama Lengkap
- Teks Bantuan Bidang Nama (Placeholder):
  Contoh: Budi Santoso
- Keterangan Validasi Nama:
  Gunakan nama panggilan atau nama lengkap yang mudah dikenali saat tiba di kasir.
- Label Bidang Nomor WhatsApp:
  Nomor WhatsApp Aktif
- Teks Bantuan Bidang WhatsApp (Placeholder):
  Contoh: 081234567890
- Keterangan Validasi Nomor:
  Pastikan nomor terhubung dengan aplikasi WhatsApp untuk menerima tiket dan peta rute.
- Label Opsi Catatan Khusus (Opsional):
  Catatan untuk Barber
- Teks Bantuan Catatan:
  Contoh: Opsi Quiet Cut (tanpa percakapan selain potongan), kulit kepala sensitif, atau model khusus.
- Teks Persetujuan Pelindungan Data Pribadi (UU PDP No. 27/2022):
  Saya menyetujui nomor WhatsApp saya digunakan oleh Damez Barbershop semata-mata untuk pengiriman konfirmasi jadwal, tiket reservasi, dan pengingat kunjungan sesuai Kebijakan Privasi. Data Anda tidak akan dibagikan kepada pihak ketiga mana pun.

### 3.5 Langkah 5: Ringkasan Pemesanan dan Komitmen Uang Muka
- Judul Langkah: Langkah 5 dari 5
- Judul Bagian: Periksa Rincian dan Kunci Kursi Anda
- Deskripsi Panduan:
  Periksa kembali rincian pemesanan Anda sebelum melanjutkan ke proses pembayaran uang muka.
- Kartu Ringkasan Sesi:
  - Layanan: {service_name} ({duration} Menit)
  - Master Barber: {barber_name}
  - Hari dan Tanggal: {formatted_date}
  - Waktu Sesi: {start_time} - {end_time} WIB
  - Lokasi: Jl. Senopati Raya No. 42, Kebayoran Baru, Jakarta Selatan
- Rincian Perhitungan Biaya:
  - Total Tarif Layanan: Rp {total_price}
  - Uang Muka (DP Online via QRIS): Rp 20.000
  - Sisa Pelunasan di Kasir Toko: Rp {remaining_price}
- Catatan Transparansi Finansial:
  Uang muka Rp 20.000 langsung memotong tagihan akhir Anda di meja kasir. Sisa pembayaran sebesar Rp {remaining_price} dapat dilunasi dengan uang tunai atau transfer QRIS di toko setelah sesi pangkas selesai.
- Peringatan Komitmen Waktu:
  Menekan tombol di bawah ini akan mengunci slot kursi Anda selama 15 menit agar tidak diambil pelanggan lain selagi Anda menyelesaikan pembayaran QRIS.

### 3.6 Layanan Pembayaran QRIS dan Pengatur Waktu 15 Menit
- Judul Layanan: Selesaikan Pembayaran Uang Muka
- Sub-Judul: Pindai Kode QRIS Menggunakan Aplikasi Perbankan atau Dompet Digital
- Keterangan Nominal:
  Nominal Pembayaran Tepat: Rp 20.000 (Tanpa biaya admin perbankan tambahan)
- Panduan Bagi Pengguna Komputer atau Tablet:
  Buka aplikasi m-banking atau e-wallet di ponsel Anda, pilih menu Scan QRIS, lalu arahkan kamera ponsel ke kode QR di layar ini.
- Panduan Bagi Pengguna Ponsel:
  Ambil tangkapan layar (screenshot) kode QR di bawah ini, atau tekan tombol Unduh QR Code. Buka m-banking atau e-wallet Anda, pilih menu Scan QRIS, lalu unggah gambar dari galeri foto ponsel Anda.
- Teks Pengatur Waktu Mundur (Precision Countdown Timer):
  Waktu Penahanan Kursi Tersisa: {mm}:{ss}
- Pesan Tiga Fase Waktu:
  - Fase Aman (15:00 sampai 05:00):
    Kursi Anda sedang kami amankan. Selesaikan pembayaran sebelum waktu penahanan berakhir.
  - Fase Waspada (04:59 sampai 02:00):
    Waktu tersisa kurang dari 5 menit. Segera selesaikan transaksi pada aplikasi pembayaran Anda.
  - Fase Kritis (01:59 sampai 00:00):
    Waktu hampir habis. Kursi akan otomatis dilepas kembali ke publik jika pembayaran belum terverifikasi.
- Status Pemrosesan QRIS:
  - Menunggu Pemindaian: Menunggu pembayaran Anda...
  - Pembayaran Terdeteksi: Pembayaran terdeteksi. Sedang memverifikasi transaksi dengan jaringan bank...
  - Pembayaran Lunas: Pembayaran uang muka berhasil diverifikasi. Menyiapkan tiket digital Anda...
- Tautan Bantuan Tersembunyi:
  Sudah menyelesaikan transfer tetapi status belum berganti? Tekan Cek Status Pembayaran.

### 3.7 Tiket Digital Boarding Pass Resmi
- Lencana Status: RESERVASI TERVERIFIKASI
- Judul Dokumen: Tiket Reservasi Kursi Damez Barbershop
- Kode Reservasi: {booking_code} (Contoh: DMZ-20261024-001)
- Keterangan Kedatangan:
  Tunjukkan tiket digital ini kepada staf kasir saat Anda tiba di toko.
- Detail Jadwal:
  - Hari dan Tanggal: {formatted_date}
  - Jam Kedatangan: {start_time} WIB (Harap tiba 5 hingga 10 menit lebih awal)
  - Master Barber: {barber_name}
  - Kursi Pangkas: Kursi Nomor {chair_number}
- Status Pembayaran:
  - Uang Muka (DP): Rp 20.000 (Lunas Terverifikasi)
  - Sisa Pelunasan di Meja Kasir: Rp {remaining_price} (Dibayar setelah pangkas)
- Pengingat Aturan Operasional:
  Toleransi keterlambatan maksimal 15 menit. Penjadwalan ulang mandiri dapat dilakukan hingga 3 jam sebelum jadwal melalui tautan pada pesan WhatsApp.

---

## 4. Kamus Status Umpan Balik dan Penanganan Kendala (Error States and Recovery)

Formulasi salinan teks saat terjadi kendala teknis atau batas sistem:

### 4.1 Konflik Slot Terisi Bersamaan (HTTP 409 Conflict)
Kondisi: Dua pelanggan menekan tombol kunci slot pada detik yang sama untuk jam yang persis sama.
- Judul Modal / Banner:
  Slot Baru Saja Terisi
- Pesan Penjelasan:
  Mohon maaf, slot pukul {selected_time} baru saja dikunci oleh pelanggan lain beberapa detik yang lalu. Kami ingin memastikan Anda tetap mendapatkan jadwal terbaik hari ini.
- Rekomendasi Tindakan:
  Silakan pilih salah satu jadwal alternatif terdekat yang masih tersedia di bawah ini:
  - Pilihan Alternatif 1: Pukul {alt_time_1} WIB
  - Pilihan Alternatif 2: Pukul {alt_time_2} WIB
- Tombol Aksi Utama:
  Pilih Jam Alternatif Ini
- Tombol Aksi Sekunder:
  Lihat Seluruh Jadwal Hari Ini

### 4.2 Batas Waktu Pembayaran Habis (15-Minute Slot Expiry / Timeout)
Kondisi: Pengguna tidak menyelesaikan pembayaran QRIS dalam kurun waktu 900 detik (15 menit).
- Judul Tampilan:
  Waktu Penahanan Kursi Telah Berakhir
- Pesan Penjelasan (Zero-Guilt):
  Demi kenyamanan bersama dan keadilan jadwal, kursi pukul {selected_time} telah kami lepas kembali ke antrean publik. Uang muka Anda belum terpotong dari rekening bank Anda.
- Informasi Penyimpanan Data:
  Pilihan layanan ({service_name}) dan master barber ({barber_name}) masih tersimpan rapi. Anda tidak perlu mengulang pengisian data dari awal.
- Tombol Aksi Utama:
  Pilih Jam Baru dengan Barber Ini
- Tombol Aksi Sekunder:
  Hubungi WhatsApp Admin Jika Butuh Bantuan

### 4.3 Pembayaran QRIS Ditolak atau Saldo Tidak Mencukupi (Payment Declined)
Kondisi: Transaksi ditolak oleh bank penerbit atau dibatalkan oleh pengguna pada aplikasi pembayaran.
- Judul Peringatan:
  Pembayaran Belum Berhasil
- Pesan Penjelasan:
  Transaksi tidak dapat diselesaikan oleh penyedia pembayaran Anda. Saldo Anda belum terpotong. Sisa waktu penahanan kursi Anda masih berjalan.
- Langkah Pemecahan:
  Pastikan saldo m-banking atau e-wallet Anda mencukupi, lalu buat kode QRIS baru untuk mencoba kembali.
- Tombol Aksi Utama:
  Buat Ulang Kode QRIS
- Tombol Aksi Sekunder:
  Ganti Aplikasi Pembayaran Lain

### 4.4 Gangguan Jaringan atau Keterlambatan Webhook (Network and Gateway Delay)
Kondisi: Respon server perbankan lambat di jam sibuk atau jaringan internet pengguna terganggu.
- Judul Pemberitahuan:
  Sedang Menunggu Konfirmasi Bank
- Pesan Penjelasan:
  Jaringan perbankan membutuhkan waktu sedikit lebih lama untuk memverifikasi transaksi. Jangan menutup halaman ini. Kursi Anda tetap aman dalam penahanan sistem.
- Tombol Aksi:
  Cek Status Manual
- Teks Penenang:
  Jika Anda sudah melihat mutasi sukses di rekening tetapi halaman ini belum berganti dalam 1 menit, staf kasir kami dapat memverifikasi bukti bayar Anda secara manual di lokasi.

### 4.5 Kegagalan Sistem Pembuatan Kode QRIS (QR Generation Failure)
Kondisi: Layanan Midtrans mengalami kendala saat pembuatan token transaksi baru.
- Judul Peringatan:
  Kode Pembayaran Sementara Tidak Dapat Dimuat
- Pesan Penjelasan:
  Terjadi kendala koneksi ke server gerbang pembayaran. Kursi yang Anda pilih belum terisi orang lain.
- Tombol Aksi Utama:
  Muat Ulang Halaman Pembayaran
- Tombol Aksi Sekunder:
  Reservasi Manual via WhatsApp Toko

### 4.6 Kesalahan Validasi Formulir Data Kontak
Kondisi: Pengguna salah memasukkan data pada formulir kontak Step 4.
- Nama Kosong:
  Mohon masukkan nama lengkap Anda agar staf kasir dapat menyapa Anda saat tiba.
- Nama Terlalu Pendek:
  Nama minimal terdiri dari 2 karakter huruf.
- Nomor WhatsApp Kosong:
  Nomor WhatsApp wajib diisi untuk pengiriman tiket digital dan konfirmasi jadwal.
- Format Nomor Salah (Bukan Angka):
  Nomor telepon hanya boleh memuat angka tanpa tanda spasi atau tanda baca.
- Jumlah Digit Tidak Sesuai:
  Nomor ponsel Indonesia umumnya terdiri dari 10 hingga 13 digit angka. Silakan periksa kembali nomor Anda.
- Checkbox Persetujuan Belum Dicentang:
  Mohon beri tanda centang untuk menyetujui pengiriman tiket reservasi ke nomor WhatsApp Anda.

### 4.7 Umpan Balik Mikro Tindakan Cepat (Micro-Feedback Toasts)
- Teks Tersalin:
  Kode reservasi berhasil disalin ke papan klip.
- Kalender Tersimpan:
  Berkas jadwal kalender (.ics) berhasil diunduh. Silakan buka berkas untuk menyimpannya di kalender ponsel.
- QRIS Tersimpan:
  Gambar kode QRIS berhasil diunduh ke galeri ponsel Anda.
- Tiket Dikirim Ulang:
  Tiket digital berhasil dikirim ulang ke nomor WhatsApp Anda.

---

## 5. Tanya Jawab Lengkap dan Kebijakan Toko (Master Operational FAQ)

Dokumentasi lengkap seluruh kebijakan operasional, alasan pemberlakuan aturan, serta jawaban terbuka untuk menghilangkan keraguan pelanggan:

### Kategori A: Kebijakan Uang Muka (DP) Flat Rp 20.000

#### 1. Mengapa saya harus membayar uang muka (DP) flat Rp 20.000 saat melakukan booking online?
Uang muka adalah bentuk komitmen dua arah yang saling menghormati antara Anda dan barber kami. Dengan membayar uang muka, kursi pangkas dan master barber pilihan Anda dikunci secara resmi oleh sistem selama jam yang Anda tentukan, sehingga tidak akan pernah diserahkan kepada pelanggan lain.

Langkah ini juga melindungi waktu kerja barber kami dari kerugian akibat pelanggan yang memesan jadwal namun tidak hadir tanpa kabar. Bagi Anda, uang muka memberikan ketenangan pikiran karena Anda dapat langsung duduk di kursi pangkas saat tiba di toko tanpa perlu mengantre lama di ruang tunggu.

#### 2. Bagaimana mekanisme pemotongan uang muka saat pembayaran di meja kasir?
Uang muka Rp 20.000 memotong langsung total tagihan layanan Anda. Sebagai contoh:
- Jika Anda memilih layanan Gentlemen Classic Haircut seharga Rp 50.000, Anda membayar uang muka Rp 20.000 melalui QRIS saat booking di website.
- Saat sesi potong rambut selesai di toko, staf kasir kami hanya menagih sisa pembayaran sebesar Rp 30.000 (Rp 50.000 dikurangi Rp 20.000).
- Anda dapat melunasi sisa tagihan tersebut menggunakan uang tunai, kartu debit, atau scan QRIS kasir toko.

#### 3. Mengapa nominal uang muka ditetapkan flat Rp 20.000 untuk semua jenis layanan?
Kami menetapkan nominal flat Rp 20.000 agar proses pemesanan tetap sederhana, terjangkau, dan adil bagi semua orang. Nominal ini cukup untuk mengonfirmasi keseriusan jadwal tanpa memberatkan pelanggan, baik untuk layanan tunggal pangkas rambut maupun paket kombinasi perawatan rambut dan jenggot.

#### 4. Apakah ada biaya administrasi tambahan saat saya membayar uang muka via QRIS?
Tidak ada biaya administrasi tambahan. Sesuai regulasi Bank Indonesia, seluruh biaya transaksi gerbang pembayaran QRIS diserap sepenuhnya oleh Damez Barbershop. Jumlah saldo yang terpotong dari rekening bank atau dompet digital Anda tepat Rp 20.000, tanpa biaya tersembunyi.

#### 5. Aplikasi pembayaran apa saja yang dapat digunakan untuk membayar uang muka QRIS?
Kode QRIS kami mengikuti standar nasional QRIS Universal Bank Indonesia (ASPI). Anda dapat memindai kode tersebut menggunakan seluruh aplikasi mobile banking (seperti BCA Mobile, Livin by Mandiri, BRImo, BNI Mobile, Permata, Jenius) serta seluruh dompet digital terdaftar di Indonesia (seperti GoPay, OVO, Dana, ShopeePay, dan LinkAja).

---

### Kategori B: Aturan Pembatalan dan Penjadwalan Ulang (Reschedule) H-3 Jam

#### 6. Bagaimana cara mengubah jam atau hari kedatangan jika saya memiliki urusan mendadak?
Anda dapat melakukan penjadwalan ulang secara mandiri tanpa perlu menelepon atau menunggu balasan pesan manual. Pada setiap pesan tiket WhatsApp yang Anda terima, terdapat tautan resmi untuk ubah jadwal. Cukup buka tautan tersebut, pilih tanggal atau jam baru yang masih tersedia, dan konfirmasi perubahan Anda. Seluruh data pemesanan dan uang muka Rp 20.000 Anda akan dialihkan secara otomatis ke jadwal baru tanpa biaya tambahan.

#### 7. Mengapa batas waktu penjadwalan ulang mandiri ditetapkan maksimal 3 jam sebelum jadwal sesi (H-3 jam)?
Batas waktu 3 jam diperlukan agar sistem dan staf meja depan kami memiliki waktu yang cukup untuk membuka kembali slot kursi yang Anda lepas kepada pelanggan lain atau tamu yang sedang menunggu langsung di toko. Waktu 3 jam memberikan peluang yang wajar bagi pelanggan lain di kawasan Senopati untuk memesan dan menuju ke lokasi kami.

#### 8. Apa yang terjadi jika saya membatalkan pesanan atau ingin reschedule kurang dari 3 jam (< H-3 jam)?
Jika pembatalan atau permohonan perubahan jadwal diajukan kurang dari 3 jam sebelum sesi dimulai, sistem reservasi mandiri tidak dapat memproses pemindahan jadwal secara otomatis. Pada kondisi ini, uang muka Rp 20.000 dinyatakan hangus.

Hal ini diberlakukan karena dalam rentang waktu kurang dari 3 jam, sangat kecil kemungkinan slot kursi tersebut dapat terisi kembali oleh pelanggan lain, sehingga barber kami kehilangan jam kerja produktifnya. Jika Anda tetap ingin memotong rambut di hari yang sama, Anda dipersilakan datang langsung ke toko sebagai tamu walk-in dan mengikuti antrean kursi yang tersedia.

#### 9. Bagaimana jika master barber yang saya pilih berhalangan hadir mendadak karena kondisi darurat?
Kenyamanan dan kepuasan Anda adalah prioritas utama kami. Jika terjadi situasi darurat yang menyebabkan barber pilihan Anda berhalangan hadir, staf admin kami akan segera menghubungi Anda melalui WhatsApp atau telepon sebelum waktu kedatangan Anda. Kami akan menawarkan dua opsi:
1. Menjadwalkan ulang sesi Anda dengan barber pilihan Anda pada hari lain.
2. Mengalihkan layanan Anda kepada master barber lain yang setara keahliannya di jam yang sama.
Jika kedua opsi tersebut tidak sesuai dengan rencana Anda, kami akan mengembalikan uang muka Rp 20.000 Anda secara utuh ke rekening bank atau e-wallet Anda.

#### 10. Apakah uang muka dapat dikembalikan jika toko terpaksa membatalkan jadwal secara sepihak?
Ya, 100% dikembalikan. Jika pembatalan terjadi akibat kendala operasional internal Damez Barbershop (seperti pemadaman listrik darurat atau renovasi mendadak), dana uang muka Rp 20.000 akan ditransfer kembali ke rekening Anda secara penuh tanpa potongan apa pun dalam waktu maksimal 1x24 jam kerja.

---

### Kategori C: Toleransi Keterlambatan 15 Menit dan Penanganan No-Show

#### 11. Mengapa batas waktu toleransi keterlambatan ditetapkan tepat 15 menit?
Setiap sesi pangkas rambut di Damez Barbershop dirancang dengan durasi presisi (antara 45 hingga 50 menit) ditambah jeda sanitasi alat 10 menit. Jika seorang tamu terlambat lebih dari 15 menit, sisa waktu yang tersedia tidak lagi cukup bagi barber untuk memberikan hasil potongan yang detail dan sempurna tanpa mengorbankan ketepatan waktu tamu pada sesi berikutnya. Batas 15 menit adalah titik temu yang adil antara fleksibilitas menghadapi kemacetan Jakarta dan kepastian jadwal tamu lain.

#### 12. Apa konsekuensinya jika saya tiba di toko lebih dari 15 menit melewati jadwal reservasi?
Jika Anda tiba lebih dari 15 menit melewati jam reservasi tanpa konfirmasi sebelumnya, sistem kami secara otomatis menandai pesanan Anda sebagai no-show demi menjaga ketepatan waktu sesi berikutnya. Kursi kerja barber akan segera dialihkan kepada tamu yang sedang menunggu langsung di toko (walk-in).

Uang muka Rp 20.000 Anda dinyatakan hangus. Apabila Anda tetap ingin melanjutkan pemotongan rambut di hari tersebut, Anda akan didaftarkan ke dalam antrean walk-in meja kasir dan dilayani pada slot kosong berikutnya.

#### 13. Bagaimana jika saya terjebak kemacetan parah dan mengabari toko sebelum batas 15 menit berakhir?
Jika Anda memperkirakan akan terlambat namun mengabari WhatsApp admin toko sebelum batas 15 menit berakhir, staf kami akan memeriksa jadwal kursi barber bersangkutan. Apabila setelah sesi Anda kebetulan terdapat jeda kosong, barber kami dengan senang hati tetap melayani Anda secara lengkap.

Namun jika slot berikutnya telah terisi oleh pemesan lain, barber akan menawarkan penyesuaian durasi layanan (misalnya mendahulukan pemotongan rambut utama dan meniadakan pijat tambahan) agar selesai tepat waktu, atau membantu Anda berpindah ke antrean tamu walk-in hari itu.

#### 14. Mengapa uang muka dinyatakan hangus jika terjadi no-show (tidak hadir tanpa kabar)?
Uang muka hangus berfungsi sebagai kompensasi atas waktu produktif master barber yang telah disisihkan khusus untuk Anda. Ketika Anda memesan jadwal, sistem menolak seluruh permintaan pelanggan lain untuk slot tersebut. Jika Anda tidak hadir tanpa kabar, barber menganggur selama hampir satu jam dan kehilangan potensi pendapatan.

#### 15. Ke mana perginya dana uang muka yang hangus akibat pembatalan terlambat atau no-show?
Damez Barbershop menerapkan pembagian kompensasi yang transparan:
- 50% dari uang muka dialokasikan langsung kepada master barber yang bersangkutan sebagai pengganti komisi waktu kerja yang terbuang.
- 50% lainnya dialokasikan untuk menutup biaya operasional toko dan biaya administrasi sistem pemesanan online.

---

### Kategori D: Prosedur Tamu Datang Langsung (Walk-In) vs Reservasi Online

#### 16. Apakah Damez Barbershop masih melayani pelanggan yang datang langsung tanpa reservasi (walk-in)?
Ya, kami tetap melayani tamu walk-in setiap hari. Pintu kami selalu terbuka bagi siapa saja yang ingin merapikan penampilan. Tamu walk-in akan didaftarkan oleh kasir meja depan ke dalam jadwal harian berdasarkan ketersediaan kursi saat itu.

#### 17. Mengapa reservasi online jauh lebih disarankan dibanding datang langsung (walk-in)?
Pelanggan yang melakukan reservasi online memegang prioritas kursi mutlak. Pada jam sibuk (seperti jam makan siang, sore hari sepulang kerja, dan sepanjang akhir pekan), waktu tunggu tamu walk-in dapat mencapai 45 hingga 90 menit karena kursi telah dipesan sebelumnya. Dengan memesan online, Anda tiba tepat waktu dan langsung dilayani di kursi tanpa membuang waktu produktif Anda di ruang tunggu.

#### 18. Bisakah tamu walk-in memilih master barber tertentu saat datang ke toko?
Bisa, sepanjang master barber yang diinginkan memiliki jeda slot kosong di antara jadwal reservasi online tamu lain. Jika master barber pilihan Anda telah penuh dipesan secara online untuk beberapa jam ke depan, kasir kami akan menyarankan Anda untuk dilayani oleh master barber lain yang sedang tersedia, atau membantu Anda memesan slot online untuk hari berikutnya.

---

### Kategori E: Pengalaman Layanan, Fasilitas, dan Kepatuhan Privasi Data

#### 19. Mengapa Damez Barbershop tidak mewajibkan pembuatan akun dan kata sandi untuk memesan?
Kami percaya bahwa memesan layanan potong rambut harus semudah dan seringkas mungkin. Mengharuskan pelanggan mengunduh aplikasi tambahan, membuat nama pengguna, dan mengingat kata sandi baru hanya menambah beban pikiran yang tidak perlu. Cukup dengan nama dan nomor WhatsApp aktif, sistem kami dapat mengenali Anda dan mengirimkan tiket resmi secara instan.

#### 20. Bagaimana Damez Barbershop melindungi nomor WhatsApp saya sesuai Undang-Undang Pelindungan Data Pribadi (UU PDP No. 27 Tahun 2022)?
Damez Barbershop tunduk sepenuhnya pada mandat Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi. Kami menerapkan prinsip minimalisasi data:
- Kami hanya mengumpulkan Nama Lengkap dan Nomor WhatsApp untuk keperluan operasional reservasi, pengiriman tiket digital, dan pengingat jadwal kunjungan.
- Kami tidak pernah meminta data sensitif seperti nomor identitas kependudukan (NIK), tanggal lahir, maupun informasi kartu perbankan Anda.
- Nomor kontak Anda disimpan di peladen database aman dengan kebijakan pembatasan akses ketat.
- Kami menjamin 100% bahwa nomor kontak Anda tidak akan pernah dijual, disewakan, atau dibagikan kepada pihak ketiga untuk keperluan periklanan massal atau pesan promosi spam.

#### 21. Apa itu opsi layanan "Quiet Cut"?
Kami memahami bahwa setelah hari kerja yang melelahkan, sebagian pria membutuhkan ketenangan tanpa keharusan berbasa-basi. Layanan Quiet Cut adalah komitmen kami untuk memberikan keheningan selama sesi pangkas rambut.

Jika Anda memilih opsi ini (dapat dicentang pada formulir pemesanan atau disampaikan kepada kasir), barber kami hanya akan berbicara saat menanyakan preferensi teknis potongan rambut Anda di awal, lalu membiarkan Anda beristirahat, membaca, atau mendengarkan musik dengan tenang hingga potongan selesai.

#### 22. Bagaimana standar sterilisasi dan kebersihan peralatan pangkas di Damez Barbershop?
Kebersihan adalah pilar utama keahlian kami. Setiap kursi pangkas menjalankan empat protokol sanitasi wajib:
1. Mata pisau silet sekali pakai (single-use razor blade) selalu dibuka dari segel baru di hadapan Anda dan langsung dibuang setelah satu kali pemakaian.
2. Gunting, sisir, dan bilah mesin pemotong direndam dalam larutan disinfektan berstandar medis lalu disterilkan menggunakan lemari sinar ultraviolet (UV-C) sebelum digunakan kembali.
3. Kertas leher higienis sekali pakai (neck paper) dipasang sebelum kain penutup untuk mencegah kain bersentuhan langsung dengan kulit leher Anda.
4. Handuk wajah hangat dicuci menggunakan air bersuhu tinggi dan uap antibakteri dengan tetesan aroma terapi menyegarkan.

#### 23. Apakah disediakan fasilitas ruang tunggu dan minuman bagi pelanggan yang datang lebih awal?
Tentu. Jika Anda tiba lebih awal dari jadwal yang ditentukan, silakan bersantai di sofa kulit ruang tunggu kami. Kami menyediakan seduhan kopi dingin (cold brew), air mineral segar, akses internet nirkabel berkecepatan tinggi, serta kurasi majalah gaya hidup dan desain pria tanpa biaya tambahan.

---

## 6. Panduan Integrasi Antarmuka Pengembang (Developer Integration Guide)

Petunjuk teknis bagi tim pengembang antarmuka dan backend dalam mengimplementasikan kamus teks ini:

### 6.1 Pemetaan Kunci Komponen Antarmuka (Component Microcopy Key Mapping)
Gunakan penamaan kunci terstruktur berikut pada berkas konfigurasi atau modul i18n/teks:

```typescript
export const BOOKING_MICROCOPY = {
  steps: {
    service: {
      stepLabel: "Langkah 1 dari 5",
      title: "Pilih Layanan Pangkas dan Perawatan",
      subtitle: "Pilih satu layanan utama atau kombinasikan maksimal dua layanan perawatan.",
      sanitationBadge: "Termasuk jeda sanitasi alat 10 menit per sesi",
      maxSelectionWarning: "Maksimal dua layanan per satu sesi reservasi.",
      ctaNext: "Lanjut Pilih Barber"
    },
    barber: {
      stepLabel: "Langkah 2 dari 5",
      title: "Tentukan Master Barber Pilihan Anda",
      subtitle: "Pilih barber andalan Anda atau serahkan pada barber yang siap di toko.",
      anyBarberTitle: "Siapa Saja yang Siap",
      anyBarberDesc: "Waktu tunggu paling fleksibel, dipilihkan barber yang siap melayani.",
      ctaNext: "Lanjut Pilih Tanggal & Jam"
    },
    schedule: {
      stepLabel: "Langkah 3 dari 5",
      title: "Tentukan Tanggal dan Jam Kedatangan",
      subtitle: "Pilih hari kedatangan dalam 7 hari ke depan.",
      operatingHoursInfo: "Jam Buka: 10:00 - 21:00 WIB (Sesi terakhir 20:00 WIB)",
      statusLabels: {
        available: "Tersedia",
        selected: "Terpilih",
        held: "Sedang Proses Bayar",
        booked: "Penuh",
        break: "Istirahat",
        pastClosing: "Melebihi Jam Operasional"
      },
      ctaNext: "Lanjut Isi Data Diri"
    },
    contact: {
      stepLabel: "Langkah 4 dari 5",
      title: "Masukkan Kontak untuk Pengiriman Tiket",
      subtitle: "Tanpa registrasi akun. Tiket digital akan dikirimkan langsung via WhatsApp.",
      fieldName: "Nama Lengkap",
      placeholderName: "Contoh: Budi Santoso",
      fieldPhone: "Nomor WhatsApp Aktif",
      placeholderPhone: "Contoh: 081234567890",
      fieldNotes: "Catatan untuk Barber (Opsional)",
      placeholderNotes: "Contoh: Opsi Quiet Cut, kulit sensitif, atau model khusus",
      pdpConsent: "Saya menyetujui nomor WhatsApp saya digunakan oleh Damez Barbershop semata-mata untuk pengiriman konfirmasi jadwal, tiket reservasi, dan pengingat kunjungan sesuai Kebijakan Privasi.",
      ctaNext: "Lanjut ke Ringkasan"
    },
    review: {
      stepLabel: "Langkah 5 dari 5",
      title: "Periksa Rincian dan Kunci Kursi Anda",
      subtitle: "Periksa kembali rincian pemesanan Anda sebelum melanjutkan ke pembayaran uang muka.",
      labelTotal: "Total Tarif Layanan",
      labelDeposit: "Uang Muka (DP Online via QRIS)",
      labelRemaining: "Sisa Pelunasan di Kasir Toko",
      financialNotice: "Uang muka Rp 20.000 memotong langsung tagihan akhir Anda di meja kasir toko.",
      holdNotice: "Slot kursi Anda akan dikunci selama 15 menit agar tidak diambil pelanggan lain selagi Anda membayar.",
      ctaHoldAndPay: "Kunci Slot & Bayar DP Rp 20.000"
    }
  },
  qris: {
    title: "Selesaikan Pembayaran Uang Muka",
    subtitle: "Pindai Kode QRIS Menggunakan Aplikasi Perbankan atau Dompet Digital",
    amountLabel: "Nominal Pembayaran Tepat",
    amountValue: "Rp 20.000",
    timerPrefix: "Waktu Penahanan Kursi Tersisa",
    desktopInstruction: "Arahkan kamera m-banking atau e-wallet Anda ke kode QR ini.",
    mobileInstruction: "Unduh kode QR atau ambil tangkapan layar, lalu unggah ke m-banking atau e-wallet Anda.",
    btnDownloadQr: "Unduh QR Code (PNG)",
    btnCopyAmount: "Salin Nominal Rp 20.000",
    btnCheckStatus: "Cek Status Pembayaran",
    states: {
      waiting: "Menunggu pembayaran Anda...",
      detected: "Pembayaran terdeteksi. Sedang memverifikasi transaksi...",
      success: "Pembayaran uang muka berhasil diverifikasi. Menyiapkan tiket..."
    }
  },
  errors: {
    slotConflict: {
      title: "Slot Baru Saja Terisi",
      message: "Mohon maaf, slot pukul {time} baru saja dikunci oleh pelanggan lain beberapa detik yang lalu.",
      ctaPrimary: "Pilih Jam Alternatif Ini",
      ctaSecondary: "Lihat Seluruh Jadwal Hari Ini"
    },
    slotExpired: {
      title: "Waktu Penahanan Kursi Telah Berakhir",
      message: "Demi kenyamanan bersama dan keadilan jadwal, kursi pilihan Anda telah kami lepas kembali ke publik. Uang muka Anda belum terpotong.",
      ctaPrimary: "Pilih Jam Baru dengan Barber Ini",
      ctaSecondary: "Hubungi WhatsApp Admin"
    },
    paymentDeclined: {
      title: "Pembayaran Belum Berhasil",
      message: "Transaksi tidak dapat diselesaikan oleh penyedia pembayaran Anda. Saldo Anda belum terpotong.",
      ctaPrimary: "Buat Ulang Kode QRIS",
      ctaSecondary: "Ganti Aplikasi Pembayaran Lain"
    },
    networkDelay: {
      title: "Sedang Menunggu Konfirmasi Bank",
      message: "Jaringan perbankan membutuhkan waktu sedikit lebih lama untuk memverifikasi transaksi. Kursi Anda tetap aman.",
      ctaPrimary: "Cek Status Manual"
    }
  }
};
```

### 6.2 Aturan Aksesibilitas dan Ergonomi Sentuh (WCAG 2.1 AA)
1. Seluruh tombol aksi utama dan chip jam memiliki tinggi target sentuh minimal 48 piksel (tombol utama 52 hingga 56 piksel).
2. Status fokus pada navigasi keyboard menampilkan cincin kontras ganda warna amber (#D97706) dengan ketebalan 2 piksel.
3. Seluruh pesan kendala dan pembaruan pengatur waktu dilengkapi atribut ARIA live regions:
   - `aria-live="polite"` untuk pembaruan detik pada pengatur waktu.
   - `aria-live="assertive"` untuk pesan kendala kritis, kegagalan pembayaran, dan rilis slot kedaluwarsa.
