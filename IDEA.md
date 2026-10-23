# IDEA.md — Damez Barbershop

> Company profile + sistem booking cukur di tempat dengan down payment (DP).
> Dokumen ini adalah titik awal project di Hermes. Nilai bertanda **[ASUMSI]** perlu dikonfirmasi pemilik sebelum dikunci.

---

## 1. Ringkasan

Damez Barbershop adalah barbershop konvensional. Project ini membuat satu website dengan dua fungsi:

1. **Company profile**: memperkenalkan Damez Barbershop, layanan, harga, tim barber, galeri hasil cukur, lokasi, dan kontak.
2. **Sistem booking**: customer memilih layanan, jadwal, dan barber, lalu membayar **DP** untuk mengunci slot. Cukur dilakukan **di tempat** (on-site).

## 2. Masalah yang Diselesaikan

| Masalah saat ini | Dampak |
|---|---|
| Antrean tidak terprediksi, customer datang lalu menunggu lama | Customer pergi, kesan buruk |
| Customer booking lewat chat lalu tidak datang (no-show) | Slot kosong, pendapatan hilang |
| Tidak ada tempat resmi untuk melihat harga, hasil kerja, dan jam buka | Sulit dipercaya calon customer baru, tidak ditemukan di Google |
| Pencatatan manual (buku/chat) | Rawan salah jadwal, sulit rekap pendapatan |

## 3. Tujuan dan Indikator Keberhasilan

| Tujuan | Indikator (target awal **[ASUMSI]**) |
|---|---|
| Menurunkan no-show | No-show < 10% dari booking terkonfirmasi |
| Mempermudah booking | Booking selesai < 2 menit di HP |
| Meningkatkan jangkauan | Muncul di pencarian Google Maps / lokal untuk nama barbershop |
| Merapikan operasional | Owner bisa melihat jadwal harian dan rekap pembayaran dalam satu halaman |

## 4. Pengguna

- **Customer**: laki-laki segala usia, mayoritas mengakses lewat HP, belum tentu terbiasa dengan aplikasi. Alur harus sangat sederhana, tanpa wajib membuat akun.
- **Barber**: melihat jadwal pribadi hari ini dan menandai booking selesai.
- **Owner/Admin**: mengelola layanan, harga, jadwal, booking, pembayaran, dan konten profile.

## 5. Ruang Lingkup

**Masuk (MVP)**
- Website company profile (responsif, mobile-first).
- Booking online dengan pilihan layanan, barber, tanggal, dan jam.
- Pembayaran DP online lewat payment gateway.
- Notifikasi konfirmasi dan pengingat (WhatsApp **[ASUMSI]**).
- Dashboard admin: kelola booking, layanan, jadwal, dan konten dasar.

**Belum masuk (fase berikutnya)**
- Akun customer dan riwayat cukur.
- Program loyalitas/poin dan voucher.
- Pembayaran pelunasan online (sisa dibayar di tempat pada MVP).
- Produk/merchandise (pomade, dll.).
- Aplikasi mobile native.
- Multi-cabang.

## 6. Fitur

### 6.1 Company Profile (halaman publik)
- **Beranda**: hero, tombol "Booking Sekarang", ringkasan layanan, testimoni.
- **Layanan & Harga**: daftar layanan, durasi, harga.
- **Galeri**: foto hasil cukur dan suasana tempat.
- **Tim Barber**: foto, nama, spesialisasi.
- **Tentang Kami**: cerita singkat Damez Barbershop.
- **Lokasi & Jam Buka**: alamat, peta (Google Maps), jam operasional, hari libur.
- **FAQ**: kebijakan DP, pembatalan, dan reschedule.
- **Kontak**: tombol WhatsApp, Instagram.
- Dasar SEO lokal: meta tag, schema.org `LocalBusiness`, sitemap.

### 6.2 Booking (sisi customer)
1. Pilih **layanan** (bisa lebih dari satu, misalnya cukur + cuci rambut).
2. Pilih **barber** atau "siapa saja".
3. Pilih **tanggal** lalu **jam** yang tersedia.
4. Isi **nama** dan **nomor WhatsApp** (opsional email).
5. Tinjau ringkasan dan nominal DP, setujui kebijakan pembatalan.
6. **Bayar DP** (QRIS, e-wallet, virtual account).
7. Halaman dan pesan **konfirmasi** berisi kode booking, jadwal, alamat, dan tautan ubah/batal.

### 6.3 Dashboard Admin
- Kalender/jadwal harian dan mingguan per barber.
- Daftar booking dengan filter status.
- Aksi: konfirmasi manual, reschedule, batalkan, tandai selesai, tandai no-show.
- Kelola layanan (nama, durasi, harga), barber, dan jam kerja.
- Blokir slot (libur, istirahat, acara).
- Rekap pembayaran dan pendapatan harian/bulanan (ekspor CSV).
- Kelola konten profile: galeri, testimoni, FAQ.

## 7. Aturan Bisnis dan Alur DP

### 7.1 Aturan DP **[DIKUNCI — Keputusan Owner]**
- Besaran DP: **Nominal tetap Flat Rp 20.000 per booking**.
- DP **dipotong dari total** saat pelunasan di tempat.
- Hadir tepat waktu: sisa tagihan dibayar di tempat (tunai/QRIS).
- **No-show**: DP hangus.
- **Batal/reschedule**: Batas waktu maksimal **H-3 jam** sebelum jadwal (DP dipindahkan ke jadwal baru atau dikembalikan sesuai kebijakan operasional).
- **Keterlambatan**: Toleransi keterlambatan maksimal 15 menit. Jika melebihi 15 menit tanpa konfirmasi, slot dilepas.

### 7.2 Status Booking

```
pending_payment ──bayar sukses──▶ confirmed ──datang──▶ completed
      │                               │
      │ timeout (10–15 menit)         ├──batal sesuai aturan──▶ cancelled
      ▼                               └──tidak datang─────────▶ no_show
   expired
```

- Slot **ditahan sementara** selama pembayaran berlangsung. Jika tidak dibayar dalam batas waktu, status `expired` dan slot dilepas otomatis.
- Konfirmasi hanya terjadi lewat **webhook payment gateway**, bukan dari redirect browser.
- Cegah **double booking**: validasi slot di sisi server dengan transaksi/lock, bukan hanya di UI.

### 7.3 Notifikasi
- Segera setelah DP sukses: konfirmasi booking.
- H-1 dan beberapa jam sebelum jadwal: pengingat.
- Saat dibatalkan/di-reschedule: pemberitahuan ke customer dan barber.

## 8. Model Data Awal

| Entitas | Atribut utama |
|---|---|
| `Service` | id, nama, deskripsi, durasi_menit, harga, aktif |
| `Barber` | id, nama, foto, spesialisasi, aktif |
| `WorkingHours` | barber_id, hari, jam_mulai, jam_selesai, istirahat |
| `BlockedSlot` | barber_id, mulai, selesai, alasan |
| `Customer` | id, nama, no_whatsapp, email (opsional) |
| `Booking` | id, kode, customer_id, barber_id, mulai, selesai, status, total_harga, nominal_dp, dibuat_pada, kedaluwarsa_pada |
| `BookingService` | booking_id, service_id, harga_saat_booking |
| `Payment` | id, booking_id, gateway, ref_gateway, jumlah, status, metode, dibayar_pada |
| `Setting` | kunci, nilai (aturan DP, batas batal, jam buka, dll.) |
| `Testimonial` / `GalleryItem` / `Faq` | konten profile yang dikelola admin |

Catatan: harga disimpan **per booking** (`harga_saat_booking`) supaya perubahan harga di kemudian hari tidak mengubah riwayat.

## 9. Ketetapan Teknis & Arsitektur **[DIKUNCI — Keputusan Owner]**

- **Front-end**: Next.js (App Router) + Tailwind CSS + Shadcn UI (Mobile-First, SSR/SSG untuk SEO).
- **Back-end & Database**: Supabase (PostgreSQL dengan row-level constraints & Supabase Auth untuk Admin).
- **Payment gateway**: Midtrans (Snap & Core API: QRIS, E-Wallet GoPay/ShopeePay, Virtual Account) dengan webhook idempoten.
- **Notifikasi**: WhatsApp Gateway API (Fonnte / Wablas API) untuk konfirmasi booking & pengingat otomatis.
- **Hosting & CI/CD**: Vercel / Cloud PaaS, HTTPS wajib, backup database Supabase terjadwal.
- **Zona waktu**: Strict `Asia/Jakarta` di sisi database dan server-side slot engine.

## 10. Persyaratan Non-Fungsional

- **Mobile-first**: sebagian besar traffic dari HP; target LCP < 2,5 detik.
- **Aksesibilitas**: kontras warna, ukuran sentuh tombol, label form, mengikuti WCAG 2.1 AA.
- **Keamanan**: validasi webhook (signature), rate limit pada endpoint booking, proteksi spam/bot (CAPTCHA ringan), admin dengan autentikasi kuat.
- **Privasi**: simpan data pribadi seminimal mungkin (nama, nomor WhatsApp), patuhi UU Pelindungan Data Pribadi, sediakan kebijakan privasi.
- **Keandalan**: pembayaran idempoten (webhook yang terkirim ulang tidak membuat data ganda), log transaksi dapat diaudit.

## 11. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| Double booking saat banyak orang memilih slot yang sama | Penahanan slot + lock/transaksi di database |
| Customer bayar tetapi booking tidak tercatat | Webhook idempoten + halaman cek status + rekonsiliasi harian |
| Customer menolak DP | Besaran DP kecil, jelaskan manfaatnya (jadwal pasti, tanpa antre) |
| Biaya gateway mengurangi margin | Hitung biaya per transaksi, pertimbangkan nominal DP minimum |
| Owner/barber tidak terbiasa dengan dashboard | Dashboard sederhana, panduan singkat bergambar |
| Foto/konten profile tidak tersedia | Rencanakan sesi foto dan kumpulkan aset sejak awal |

## 12. Pembagian Tugas Agent Hermes

| Fase | Agent | Output |
|---|---|---|
| **Riset** | Market Intel | Analisis barbershop kompetitor di area target, rentang harga, fitur booking yang ada |
| | Data Analyst | Perkiraan kapasitas slot, simulasi dampak DP terhadap no-show dan pendapatan |
| | Fact-Checker | Verifikasi biaya gateway, aturan privasi, dan klaim kompetitor |
| | Synthesizer | Ringkasan riset sebagai dasar keputusan fitur |
| **Desain** | UI/UX Wireframe | Wireframe halaman profile, alur booking, dan dashboard |
| | Design System | Warna, tipografi, komponen (identitas khas barbershop) |
| | Visual & Graphic | Logo/aset visual, gaya foto galeri |
| | Interaction/UX | Pemilih tanggal-jam, status pembayaran, state error |
| | Accessibility | Audit kontras, navigasi keyboard, ukuran sentuh |
| **Konten** | Copywriter | Teks beranda, deskripsi layanan, CTA |
| | Technical Docs | Panduan admin, dokumentasi API dan deploy |
| | Content Editor | Penyuntingan konsistensi nada dan ejaan |
| | Script & Pitch | Caption promosi dan teks pengumuman peluncuran |
| | Long-Form / Case | Cerita "Tentang Kami" |
| **Kode** | Front-end Engineer | Halaman publik, alur booking, dashboard |
| | Back-end Engineer | API booking, slot, pembayaran, webhook, notifikasi |
| | DevOps & SRE | CI/CD, hosting, backup, monitoring |
| | QA & Testing | Tes alur booking, konflik slot, kasus pembayaran gagal/kedaluwarsa |
| | Security & SecOps | Review webhook, autentikasi admin, rate limit, kebijakan data |

Urutan serah-terima yang disarankan: **Riset → Wireframe/Design System → Copy → Front-end & Back-end paralel → QA & Security → DevOps**. Untuk merapikan koordinasi, pertimbangkan menambah agent **Orchestrator** dan **Product/Strategy** (lihat catatan roster).

## 13. Roadmap

| Milestone | Isi | Hasil |
|---|---|---|
| **M0 — Discovery** | Jawab pertanyaan terbuka, riset kompetitor, finalkan aturan DP | Keputusan bisnis terkunci |
| **M1 — Desain** | Wireframe, design system, aset visual, copy | Desain dan konten siap diimplementasikan |
| **M2 — Company Profile** | Halaman publik, SEO lokal, galeri, peta | Website profile tayang |
| **M3 — Booking Core** | Layanan, barber, slot, form booking, admin dasar | Booking jalan tanpa pembayaran (uji internal) |
| **M4 — Pembayaran DP** | Integrasi gateway, webhook, penahanan slot, notifikasi | Alur end-to-end |
| **M5 — QA & Peluncuran** | Pengujian, audit keamanan dan aksesibilitas, pelatihan owner/barber | Soft launch |
| **M6 — Iterasi** | Evaluasi no-show dan konversi, perbaikan | Rencana fase berikutnya |

## 14. Definition of Done (MVP)

- [ ] Customer dapat menyelesaikan booking + DP dari HP tanpa membuat akun.
- [ ] Dua orang tidak bisa memesan slot yang sama pada barber yang sama.
- [ ] Booking yang tidak dibayar kedaluwarsa dan slot kembali tersedia.
- [ ] Webhook pembayaran terverifikasi dan idempoten.
- [ ] Owner bisa melihat jadwal, mengubah status, dan melihat rekap pembayaran.
- [ ] Website lulus audit dasar aksesibilitas dan performa mobile.
- [ ] Kebijakan DP/pembatalan dan kebijakan privasi tampil jelas.
- [ ] Backup database dan monitoring dasar aktif.

## 15. Status Keputusan Bisnis & Pertanyaan Terbuka

### Keputusan Terkunci (Locked by Owner):
- **Besaran DP**: Flat Rp 20.000 per booking (Pertanyaan #3 dijawab).
- **Kebijakan Pembatalan**: Batas waktu H-3 jam, keterlambatan maks 15 menit (Pertanyaan #4 dijawab).
- **Payment Gateway**: Midtrans (QRIS, E-Wallet, VA) (Pertanyaan #8 dijawab).
- **Notifikasi**: WhatsApp Gateway API (Fonnte/Wablas) (Pertanyaan #9 dijawab).
- **Data Awal Layanan**: Menggunakan data benchmark industri dari tim Researcher untuk MVP awal (Pertanyaan #2 dijawab bertahap).

### Dikerjakan dalam Milestone 0 (M0 - Discovery):
- **Jumlah barber & jam operasional**: Baseline standar (2–3 barber aktif, operasional 10:00–21:00 WIB) dimodelkan di `TSK-M0-05`.
- **Riset benchmark layanan & harga**: Dikerjakan di `TSK-M0-03` (`docs/research/market-services-benchmark.md`).
- **Alokasi walk-in vs online booking**: Diformulasikan di `TSK-M0-05` (buffer slot dinamis).
- **Aset visual & domain**: Disiapkan placeholder profesional di M1 (`designer:visual`).

---

*Versi 1.0 — Diperbarui 2026-10-23 setelah konfirmasi baseline owner.*
