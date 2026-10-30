# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Pelanggan gerai (utama).** Laki-laki 18–45 di Jakarta Selatan dan sekitarnya, membuka dari HP
sambil berdiri atau di perjalanan. Mereka ingin memastikan dapat kursi pada jam yang cocok tanpa
menelepon, dan mereka tidak mau membuat akun untuk itu. Kebutuhan mereka: tahu harga dan lama
layanan sebelum datang, tahu kursi siapa yang mereka dapat, dan yakin kursinya benar-benar
terkunci setelah membayar DP.

**Kasir (pengguna harian kedua).** Satu orang di meja, tablet atau laptop, sambil melayani tamu
yang berdiri di depannya. Kebutuhannya: melihat tiga kursi hari ini dalam sekali lihat, mencatat
tamu walk-in dalam hitungan detik, menandai layanan mulai/selesai, menutup pembayaran, dan
menutup kas di akhir hari. Tangan dan matanya sibuk; layar harus tahan dibaca sambil berdiri.

**Owner.** Datang untuk tiga hal: rekap kas hari ini, tingkat no-show, dan melihat jejak siapa
mengubah apa. Tidak memakai layar ini sepanjang hari.

**Barber.** Hanya melihat jadwalnya sendiri. Bukan pengguna layar intensif.

## Product Purpose

Menggantikan telepon dan chat manual sebagai cara memesan kursi. Pelanggan memesan sendiri,
membayar DP Rp 20.000 untuk mengunci kursi 15 menit, dan datang pada waktunya; gerai mendapat
jadwal yang tidak bentrok tanpa perlu satu orang memegang buku jadwal. Sukses berarti: booking
selesai dari HP dalam waktu kurang dari dua menit, tidak ada dua pelanggan yang mendapat kursi
yang sama, dan kasir bisa menjalankan satu hari penuh tanpa pendampingan.

## Positioning

Kursi dikunci di tingkat database (`EXCLUDE USING gist` pada rentang waktu), bukan di lapisan
aplikasi, jadi double booking tidak bisa terjadi meski dua permintaan datang bersamaan. DP kecil
yang hangus saat tidak hadir membuat reservasi kosong punya biaya nyata, dan notifikasi WhatsApp
datang tanpa diminta. Ini produk satu gerai dengan tiga kursi — dibuat pas untuk skala itu, bukan
platform multi-cabang.

## Operating Context

- Tiga kursi, tiga master barber, jam buka 10:00–21:00 WIB. Tutup pada hari tertentu per barber,
  dengan istirahat yang sengaja berselang (jam 12/13/14 dan 18/19/20) supaya kursi tidak kosong
  bersamaan.
- DP flat Rp 20.000 dipotong dari total saat pelunasan di kasir. Batas batal/reschedule H-3 jam.
  Toleransi keterlambatan 15 menit; lewat itu tamu dihitung tidak hadir dan DP hangus.
- Pembayaran lewat Midtrans Snap, QRIS diprioritaskan (MDR 0,7%).
- Notifikasi lewat gateway WhatsApp (Fonnte/Wablas), tanpa emoji, memuat aturan 15 menit dan 3 jam.
- Bahasa antarmuka: Indonesia saja. Zona waktu `Asia/Jakarta` di database, server, dan tampilan.
- Alur pelanggan: layanan → barber → tanggal & jam → data diri → DP → tiket. Tanpa akun, tanpa
  riwayat, tanpa poin.
- Dashboard kasir dipakai di tablet di meja kasir.

## Capabilities and Constraints

Sudah berjalan dan teruji: skema database + constraint anti-bentrok, hold 15 menit dengan
kedaluwarsa otomatis, API ketersediaan/hold/checkout, webhook Midtrans bertanda tangan yang
idempoten, antrean notifikasi WhatsApp, login admin server-side lewat Supabase + RLS, aksi kasir
(ubah status, pelunasan, walk-in), rekap kas harian + ekspor CSV, dan CI enam tahap.

Batasan yang mengikat desain: tidak ada aset brand (belum ada logo, belum ada foto barber atau
gerai — rancang tanpa foto), tidak ada hosting publik (proyek hidup di repo), satu set ikon
(`lucide-react`), Tailwind v4 dengan satu sumber token di `src/app/globals.css`, tanpa PWA
(ditunda), dan tanpa library UI tambahan di luar yang sudah ada.

## Brand Commitments

- **Warna gelap + aksen brass dipertahankan.** Ini keputusan pemilik dan tidak boleh diganti.
  Nilai token yang berlaku: `--color-ink #0B0B0C`, `--color-surface #141417`,
  `--color-surface-2 #1D1D21`, `--color-brass #C8A24A`, `--color-text #F5F1E8`,
  `--color-muted #9A958C`, `--color-danger #D9534F`, `--color-ok #4E9F6A`.
- **Tanpa emoji**, di antarmuka maupun template pesan WhatsApp.
- Nama gerai ditulis **Damez**, tanpa diubah, tanpa tagline baru yang mengarang klaim.
- Nada bicara: tenang, langsung, tanpa hiperbola pemasaran.

## Evidence on Hand

- `content/landing-copy.md`, `content/faq-and-microcopy.md`, `content/about-us.md`, dan 8 template
  WhatsApp: copy nyata yang boleh dipakai apa adanya.
- `docs/reference/v1/market-services-benchmark.md`: benchmark harga dan layanan pasar sebagai acuan.
- Data katalog nyata di seed: 8 layanan dengan durasi dan harga, 3 barber bernama, jam kerja, dan
  istirahat berselang. Angka dan nama itu boleh dipakai di desain.
- **Tidak ada**: logo, foto gerai, foto barber, testimoni pelanggan, angka penjualan. Keempatnya
  tidak boleh dikarang. Materi visual apa pun harus dibuat sendiri (tipografi, warna, bentuk) dan
  diberi tanda sintetis bila bisa disalahartikan sebagai dokumentasi nyata.

## Product Principles

1. **Kursi nyata lebih penting daripada janji.** Setiap layar menunjukkan keadaan sebenarnya
   (kursi terisi atau kosong, hold berjalan atau kedaluwarsa), bukan ilustrasi keadaan ideal.
2. **Satu tangan, dua menit.** Alur pelanggan dirancang untuk ibu jari di HP; tidak ada langkah
   yang bisa dihapus tanpa kehilangan kejelasan.
3. **Kasir melihat dulu, mengetik kemudian.** Informasi yang dibutuhkan saat tamu berdiri di depan
   meja harus terbaca sebelum ada interaksi apa pun.
4. **Uang harus bisa ditelusuri.** Angka yang tampil di layar, di tiket, dan di CSV berasal dari
   sumber yang sama; tidak ada pembulatan yang menyembunyikan selisih.
5. **Waktu Jakarta adalah waktu semua orang.** Tidak ada tanggal atau jam yang ditampilkan dalam
   zona lain.

## Accessibility & Inclusion

Target WCAG 2.2 AA: kontras teks ≥ 4,5:1 (≥ 3:1 untuk teks besar), target sentuh ≥ 44×44 px,
fokus terlihat di semua kontrol, navigasi keyboard penuh di dasbor kasir, `prefers-reduced-motion`
dihormati, dan tidak ada informasi yang hanya disampaikan lewat warna. Dasbor kasir dipakai sambil
berdiri di bawah lampu gerai, jadi ukuran teks dan kontrasnya lebih ketat daripada halaman publik.
