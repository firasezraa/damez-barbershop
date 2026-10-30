# ADR-001: Arsitektur Pembayaran Down Payment (DP) Flat Rp 20.000 via Midtrans Snap QRIS

## Status
Accepted

## Tanggal
2026-10-23

## Konteks
Damez Barbershop adalah gerai pangkas rambut pria premium dengan 3 kursi master barber. Masalah utama operasional barbershop tradisional di kawasan urban adalah tingginya angka ketidakhadiran (*no-show*) dan pembatalan sepihak tanpa kabar (mencapai 15%–25% di industri jasa perawatan pria), yang menyebabkan waktu produktif kapster terbuang sia-sia dan mengganggu alur antrean tamu walk-in.

Kami membutuhkan arsitektur pembayaran reservasi online yang memenuhi kriteria:
1. Memberikan komitmen psikologis kepada pelanggan untuk hadir tepat waktu.
2. Meminimalkan friksi pembayaran di smartphone (checkout < 60 detik tanpa input manual berulang).
3. Efisiensi biaya transaksi gerai (MDR fee tidak menggerus margin laba layanan dasar Rp 50.000).
4. Menjamin keamanan webhook dari manipulasi data (tampering) dan idempotensi pemrosesan data ganda.

## Keputusan
Menerapkan skema **Down Payment (DP) flat sebesar Rp 20.000** untuk seluruh paket layanan dengan integrasi **Midtrans Snap API** dan fokus utama pada kanal pembayaran **QRIS (Quick Response Code Indonesian Standard)**.

Kebijakan arsitektur kunci:
- **Nominal DP Terkunci di Server**: Nilai DP Rp 20.000 dihitung dan dikunci secara ketat di backend server (`lib/payment/midtrans.ts`), mencegah modifikasi nominal oleh manipulasi request client.
- **Kanal Utama QRIS**: Diaktifkan secara default karena seluruh aplikasi mobile banking (BCA, Mandiri, BRI, BNI) dan dompet digital (GoPay, OVO, Dana, ShopeePay) di Indonesia mendukung pemindaian QRIS secara instan tanpa biaya transfer antarbank bagi konsumen.
- **Non-aktifkan Virtual Account Beban Merchant**: Kanal Virtual Account dengan biaya flat Rp 4.000 per transaksi dinonaktifkan pada Snap preferences untuk mencegah erosi margin DP hingga 20,00%–22,20%.
- **Validasi Kriptografi SHA-512**: Seluruh notifikasi webhook dari Midtrans diverifikasi menggunakan signature key SHA-512 berformula:
  $$\text{SHA512}(\text{order\_id} + \text{status\_code} + \text{gross\_amount} + \text{server\_key})$$
- **Idempotensi Webhook**: Pemrosesan notifikasi berulang dijamin aman (DoD: Zero Data Duplication) dengan mengecek status transaksi di basis data sebelum melakukan mutasi.

## Alternatif yang Dipertimbangkan

### 1. Pembayaran Penuh di Awal (100% Prepayment Online)
- *Kelebihan*: Pendapatan gerai terjamin 100% sebelum layanan dimulai.
- *Kekurangan*: Friksi konversi sangat tinggi. Banyak pelanggan enggan membayar lunas di depan karena sering kali ingin menambah layanan tambahan (*upselling*) seperti pewarnaan rambut, creambath, atau pomade saat di kursi barber.
- *Alasan Ditolak*: Menurunkan tingkat konversi pemesanan online hingga 40%.

### 2. Reservasi Gratis Tanpa DP (Zero Deposit Booking)
- *Kelebihan*: Friksi booking nol, registrasi sangat cepat.
- *Kekurangan*: Angka *no-show* tetap tinggi karena pelanggan tidak memiliki risiko finansial jika mangkir. Kapster kehilangan pendapatan produktif.
- *Alasan Ditolak*: Tidak menyelesaikan akar masalah bisnis gerai.

### 3. Integrasi Direct API Perbankan / Transfer Manual
- *Kelebihan*: Tanpa potongan MDR aggregator pihak ketiga.
- *Kekurangan*: Memerlukan staf kasir untuk mengecek mutasi rekening secara manual (lambat, rawan fraud bukti transfer palsu), atau biaya setup host-to-host bank yang sangat mahal untuk skala UMKM.
- *Alasan Ditolak*: Beban operasional manual tinggi dan verifikasi tidak instan (< 5 detik).

## Konsekuensi & Dampak
- Margin DP terlindungi optimal: Pada transaksi QRIS dengan MDR 0,7%, potongan gateway hanya Rp 140. Damez Barbershop menerima bersih Rp 19.860 (efisiensi 99,30%).
- Pelunasan sisa tagihan (Total Layanan - Rp 20.000) dilakukan secara cepat di kasir fisik gerai setelah pangkas rambut selesai via tunai atau QRIS statis kasir.
- Proteksi kerugian no-show: Jika pelanggan mangkir setelah batas toleransi 15 menit, dana DP Rp 20.000 hangus dan menutup biaya kursi kapster yang terbuang.
- Ketergantungan pada stabilitas gateway Midtrans: Dimigigasi dengan unit testing komprehensif, retry webhook otomatis, dan mode mock untuk CI/CD.
