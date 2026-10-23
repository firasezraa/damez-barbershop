# ADR-003: Arsitektur Multi-Gateway WhatsApp, Standar Humanizer (Zero-Emoji) & Kepatuhan UU PDP

## Status
Accepted

## Tanggal
2026-10-23

## Konteks
Komunikasi digital Damez Barbershop mengandalkan kanal WhatsApp sebagai media utama interaksi transaksional dengan pelanggan dan koordinasi antar-staf gerai. Kanal ini menangani pengiriman tiket reservasi digital instan, pengingat jadwal kedatangan (H-2 Jam dan H-30 Menit), serta alert waktu nyata ke master barber saat ada pemesanan baru.

Kebutuhan & batasan sistem:
1. **SLA Pengiriman Ketat (< 5 Detik)**: Setelah pembayaran DP dikonfirmasi oleh webhook Midtrans, pelanggan dan master barber harus menerima notifikasi selambat-lambatnya dalam 5 detik.
2. **Kepatuhan Citra Brand (Humanizer Standard)**: Damez Barbershop mengusung positioning *Vintage Modern Masculine* yang elegan, bersahaja, dan profesional. Teks khas AI yang penuh emotikon berlebihan (gunting, api, kilat, bintang) merusak citra eksklusif gerai.
3. **Kepatuhan Privasi Data (UU No. 27 Tahun 2022 / UU PDP)**: Pemrosesan data pelanggan wajib menerapkan prinsip minimalisasi data, memiliki dasar pemrosesan yang sah, dan menjaga kerahasiaan nomor seluler.
4. **Resiliensi Transmisi**: Jika satu provider gateway mengalami gangguan jaringan atau kuota habis, sistem tidak boleh macet atau kehilangan rekam jejak pengiriman pesan.

## Keputusan
Menerapkan arsitektur **Multi-Gateway WhatsApp Service Adapter** di `lib/notifications/whatsapp.ts` dengan dukungan provider **Fonnte** sebagai jalur utama, **Wablas** sebagai failover sekunder, dan **Mock Adapter** untuk pengujian offline/CI.

Aturan arsitektur dan kebijakan pesan:
- **Kebijakan Tegas Tanpa Emoji (Strict Zero-Emoji Policy)**: Seluruh template pesan transaksional (8 template) dan filter teks keluar disanitasi secara otomatis dari seluruh karakter Unicode emoji, em-dash (`—`), dan en-dash (`–`). Pesan menggunakan penataan tipografi profesional (huruf kapital terukur, tanda titik, tanda koma, dan format tebal WhatsApp).
- **Pengiriman Paralel Pasca-Settlement**: Webhook handler Midtrans memicu pengiriman konfirmasi ke pelanggan dan alert ke master barber secara paralel menggunakan `Promise.allSettled`, mencapai latensi rata-rata < 15 ms pada lingkungan benchmark dan < 2.000 ms pada jaringan gateway riil.
- **Failover & Resilient Logging**: Setiap upaya pengiriman dicatat dalam tabel `notification_logs`. Jika pengiriman gagal (status `failed`), pesan tidak dibuang melainkan masuk ke status `pending` untuk diproses ulang oleh *queue sweeper* (`processPendingNotifications()`).
- **Penerapan UU PDP No. 27/2022**:
  - *Data Minimization*: Hanya mengumpulkan Nama Lengkap dan Nomor WhatsApp seluler yang dinormalisasi ke format E.164 Indonesia (`628xxx`).
  - *Purpose Limitation*: Data nomor kontak hanya digunakan untuk notifikasi reservasi terkait, bukan untuk spam broadcast promosi tanpa izin (*unsolicited marketing*).
  - *Audit Trail*: Seluruh riwayat pengiriman dan stempel waktu disimpan untuk keperluan audit.

## Alternatif yang Dipertimbangkan

### 1. Meta WhatsApp Business Cloud API Resmi (Direct BSP)
- *Kelebihan*: Zero ban risk, infrastruktur resmi Meta.
- *Kekurangan*: Memerlukan pendaftaran entitas bisnis Meta Business Manager yang rumit (proses verifikasi berhari-hari hingga berminggu-minggu), biaya percakapan utility per template (~Rp 300 per pesan) yang memerlukan saldo deposit internasional kartu kredit, dan kewajiban mendaftarkan setiap draf template untuk di-review tim Meta sebelum bisa digunakan.
- *Alasan Ditolak*: Kurang fleksibel dan menambah beban administrasi yang tidak proporsional untuk tahap awal gerai mandiri.

### 2. Notifikasi via SMS Gateway Tradisional
- *Kelebihan*: Kompatibel dengan semua ponsel tanpa koneksi data internet.
- *Kekurangan*: Biaya per SMS mahal (Rp 300–Rp 500/SMS), keterbatasan 160 karakter teks plain, tidak mendukung tautan interaktif, dan tingkat pembacaan (open rate) konsumen modern di Indonesia jauh lebih rendah daripada WhatsApp.
- *Alasan Ditolak*: Pengalaman pengguna (UX) tertinggal dan biaya operasional lebih boros.

## Konsekuensi & Dampak
- Pengiriman tiket reservasi instan (< 5s) terbukti meningkatkan kepuasan pelanggan dan memberi kesan sistem gerai yang modern dan profesional.
- Tidak ada distorsi visual dari emoji kartun; pesan dibaca dengan jelas oleh tamu segala usia (eksekutif muda, profesional, hingga lansia).
- Sistem aman dari kegagalan vendor tunggal (*single point of failure*) karena dapat berpindah gateway hanya dengan mengubah nilai variabel `WHATSAPP_GATEWAY_PROVIDER`.
