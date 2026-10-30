# Artefak keputusan redesign (2026-10-30)

Tiga kartu komposisi yang disodorkan ke pemilik, direktori ini adalah catatan putarannya.

| Berkas | Isi | Asal |
|---|---|---|
| `kartu-1-gulungan-alat.png` | terpilih: grid berlubang jam × kursi + gulungan layanan | render `file://` dari `.impeccable/mocks/decision/gulungan-alat.html` pada 1440×900 |
| `kartu-2-tiket-antrian.png` | tidak dipilih | render dari `.impeccable/mocks/decision/tiket-antrian.html` |
| `kartu-3-papan-harga.png` | tidak dipilih | render dari `.impeccable/mocks/decision/papan-harga.html` |

Semua PNG adalah render sketsa HTML, bukan comp hasil generator gambar (mesin ini tidak punya
generator gambar). Isinya sintetis: nama pelanggan dan kode booking contoh dibuat untuk
memperlihatkan kepadatan, sedangkan nama barber, layanan, durasi, dan harga berasal dari katalog
nyata di `scripts/seed-data.ts`. Sketsa yang tidak dipilih tidak membawa persetujuan apa pun.

## Hasil pemeriksaan mekanis

`impeccable detect` dijalankan sekali atas tiga sketsa: 33 temuan (kontras di bawah AA, teks
11,5 px, huruf jarang pada kalimat, teks fungsional 10,5 px, sel menempel garis, label di atas
judul). 31 diperbaiki. Dua yang tersisa adalah pola arsir `repeating-linear-gradient` penanda
keadaan "terjadwal" — fungsional, selalu disertai teks, dan dikecualikan dengan alasan tertulis
di `IDEA.md` §17.14.

Semua kartu diverifikasi secara terukur: `document.documentElement.scrollHeight` = 900 dan setiap
blok berada di dalam 900 px pada viewport 1440×900.
