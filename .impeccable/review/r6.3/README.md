# Bukti R6.3 — wizard booking & halaman tiket

Tangkapan dari build produksi (`npm run start`) terhadap `damez_dev`, dijalankan lewat
Playwright yang benar-benar mengklik alur booking sampai tiket terbit (bukan mock).

| Berkas | Apa yang ditunjukkan |
|---|---|
| `r63c-step3.png` | langkah 3, grid jam setelah slab abu diperbaiki, keterangan WIB |
| `r63d-step3.png` | langkah 3, putaran akhir (grid + catatan istirahat) |
| `r63d-step5.png` | langkah tiket: banner `Slot terkunci`, struk dengan baris jadwal & barber, batas hol bertanggal |
| `r63-tiket-1440.png` | halaman tiket (kartu kertas) |
| `r63-booking-1440.png`, `r63-booking-390.png`, `r63c-booking-390.png` | wizard di 1440 px dan 390 px |
| `r63-sel-terpilih.png`, `r63-sel-bebas.png` | potongan 1:1 sel jam terpilih vs bebas |

Bukti objektif sel terpilih (piksel, bukan tafsir): bingkai `(200,162,74)`, latar `(39,33,21)`;
sel bebas `(20,20,23)`. `getComputedStyle` di Chromium ini melaporkan nilai basi untuk elemen
yang baru berubah kelas — dua putaran pemeriksaan sempat salah menyimpulkan "tidak ada penanda
terpilih" karena itu. Pemotongan piksel yang menjawab.

Catatan: `DMZ-20261031-0005/0006/0007` adalah booking uji yang dibuat skrip verifikasi di
`damez_dev` (tanggal 31 Oktober), bukan data produksi.
