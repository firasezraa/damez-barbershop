# Bukti R6.4 — masuk admin & dasbor kasir

Tangkapan dari build produksi dengan sesi **nyata**: skrip masuk lewat formulir
sungguhan memakai akun kasir dan owner (Supabase hosted), membuat satu tamu walk-in
lewat API kasir, lalu memotret papan.

| Berkas | Isi |
|---|---|
| `r64-dasbor-kasir-1440.png`, `r64b-dasbor-kasir-1440.png` | papan kursi setelah walk-in, versi pertama dan setelah perbaikan |
| `r64-dasbor-kasir-390.png` | papan kursi di 390 px |
| `r64-dasbor-owner-1440.png` | sudut pandang owner (tautan unduh rekap tampil) |
| `r64-masuk-1440.png`, `r64c-masuk-1440.png`, `r64-masuk-390.png` | layar masuk dengan galat |

Angka yang diukur, bukan dikira:

| Ukuran | Hasil |
|---|---|
| Tombol aksi terpendek di papan (target §17.9 ≥ 48 px) | **48 px** |
| Tinggi tombol Masuk | **58 px**, `justify-content: center`, teks 135 px dari kiri dan 135 px dari kanan |
| Kode booking `DMZ-…` pada empat kartu | `getClientRects().length` = **1** (tidak pecah baris) |
| Tombol pada kartu walk-in | `Mulai layani`, `Lunas tunai`, `Lunas QRIS` |
| Tautan unduh rekap untuk kasir / owner | **0** / **1** |

Catatan jujur: dua hal belum diubah. Kolom jam memakai kontrol waktu bawaan peramban
(tampil 12 jam di lingkungan uji) sementara kartu memakai format 24 jam `14.00`; dan formulir
walk-in tidak memperingatkan bentrok jam di klien — server yang menolak lewat batasan
anti-bentrok, jadi tidak ada bentrok tersimpan, tetapi peringatannya baru muncul setelah simpan.
