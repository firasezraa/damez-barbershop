---
version: 1
slug: "src-app-public-page-tsx"
primary_target: "src/app/(public)/page.tsx"
related_targets: ["src/app/(public)/booking/page.tsx","src/app/(public)/booking/success/[code]/page.tsx","src/app/admin/login/page.tsx","src/app/(admin)/admin/dashboard/page.tsx"]
---

# Surface brief — beranda publik Damez (dan sistem yang diturunkan darinya)

Mode: **Persuade** (beranda), turunannya Operate (dasbor kasir, login) dan Read-free (tiket).
Target: `src/app/(public)/page.tsx`. Permukaan turunan: wizard booking, halaman tiket,
`/admin/login`, `/admin/dashboard`.

## Audiens, pekerjaan, aksi

Pelanggan Jakarta Selatan dari HP, tanpa akun, ingin memastikan dapat kursi pada jam yang
cocok. Aksi yang harus diambil di viewport pertama: memilih jam dan mengunci kursi
(DP Rp 20.000, hold 15 menit). Bukti yang boleh dipakai: 3 kursi, 8 layanan dengan durasi dan
harga nyata, jam buka 10:00–21:00 WIB, istirahat bergilir, dan keadaan kursi hari ini.

## Batasan

Dunia visual dipatok pemilik: gelap + brass, tanpa emoji, bahasa Indonesia. Tidak ada aset
foto/logo; materi visual dibuat sendiri dari tipografi, warna, dan komposisi. Satu set ikon
(`lucide-react`), Tailwind v4 dengan satu sumber token, tanpa library UI baru.

## Arah terpilih

Grid berlubang: baris = jam, kolom = kursi. Slot terjadwal dicetak arsir brass, kursi bebas
digaris putus-putus, pilihan pengunjung berbingkai brass. Kepala kolom adalah plat nama barber
(kursi, nama, gelar). Delapan layanan turun sebagai "alat di slotnya" di bawah grid. Momen yang
diingat: satu layar yang menunjukkan seluruh hari gerai apa adanya, bukan ilustrasi.

## Keputusan yang belum tertutup

- Foto barber/gerai: belum ada. Materi sintetis harus diberi tanda sampai foto asli tersedia.
- Nama layanan tetap Inggris (dari katalog v1), label antarmuka Indonesia.
- Rekap kas & CSV tetap permukaan Operate yang tenang; bukan tempat ekspresi.

## Direction contract

THESIS: satu layar menampilkan seluruh hari gerai seperti apa adanya — jam × kursi × layanan —
dan susunannya menolak hero headline-plus-tombol dengan kartu-kartu seragam di bawahnya.

OWN-WORLD: gelap hampir hitam `#0b0b0c` sebagai dinding, dua tingkat permukaan `#141417` dan
`#1d1d21`, brass `#c8a24a` sebagai bahan (bidang arsir, garis putus, bingkai, plat nama), teks
`#f5f1e8`, muted `#9a958c`, bahaya `#d9534f`, ok `#4e9f6a`. Huruf: Archivo (sumbu lebar untuk
papan dan plat), Spline Sans Mono untuk jam, kode, harga, dan keadaan. Tanpa glow, tanpa gradien
dekoratif; kedalaman datang dari bidang dan garis, bukan bayangan.

STORY: pengunjung tahu jam berapa kursi kosong, berapa lama layanannya, berapa harganya, dan
sistem menahan kursinya 15 menit setelah DP; ia mengunci satu slot sebelum menggulir dua layar.

FIRST VIEWPORT: kolom kiri 392 px — plat gerai, aturan (DP, toleransi, batal H-3), aksi utama
"Kunci kursi saya"; kolom kanan — papan hari: kepala papan dengan jam sekarang dan jumlah slot,
tiga plat nama barber, grid jam × kursi dengan sel terjadwal arsir, sel bebas garis putus, sel
pilihan berbingkai brass, lalu gulungan delapan layanan di bagian bawah. Aksi utama duduk di
bawah kolom kiri, satu tombol, brass penuh.

FORM: gulungan alat dan meja kerja, peringkat 6 dari 7 struktur yang saya susun; ia menang karena
menempatkan jadwal nyata sebagai citra pembuka, bukan foto.
seed: c8462c0e1d575567

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the
verdict, DESIGN.md, and every shipping raster carrying its provenance.
