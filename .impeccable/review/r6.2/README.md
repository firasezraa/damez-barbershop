# Bukti R6.2 — beranda grid berlubang

Tangkapan layar dari build produksi (`npm run start`) terhadap `damez_dev` yang sudah di-seed,
dengan tiga booking hari ini dibuat lewat fungsi database asli
`public.fn_admin_schedule_walk_in` (14:00 kursi 1, 16:00 kursi 2, 19:00 kursi 3) supaya sel
terjadwal, bebas, dan istirahat semuanya terlihat.

| Berkas | Viewport |
|---|---|
| `beranda-1440.png` | 1440×900, halaman penuh |
| `beranda-390.png` | 390×844, halaman penuh |

Hasil pemeriksaan mata: papan hari terbaca dengan tiga plat barber, sel terjadwal satu baris tanpa
meluber, tepi kiri daftar layanan sejajar kolom kursi pertama, tidak ada seksi kosong, dan tidak
ada elemen meluber di 390 px. Detektor desain atas berkas yang berubah: 0 temuan.

Catatan: nama layanan di sel memakai label pendek pada layar lebar (dipotong di batas kata atau
memakai kategori katalog), dan dibiarkan membungkus sampai tiga baris di ponsel.
