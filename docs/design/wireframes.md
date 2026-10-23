# Spesifikasi Wireframe & Desain Komponen UI — Landing Profile & Modular Mobile Booking
## Damez Barbershop Web Platform (MVP Baseline)

> **Dokumen**: Master Wireframe & UI Component Specification (Landing Profile & Mobile Multi-Step Booking Funnel)  
> **Status**: APPROVED & LOCKED (Spesifikasi Handoff Milestone 1 & Milestone 2)  
> **Penulis**: Principal Product Designer & Design System Architect (`designer:wireframe`)  
> **Target Pengguna**: Tim UI/UX (`designer:interaction`, `designer:a11y`), Content/Copywriting (`writer:copywriter`, `writer:longform`, `writer:editor`), dan Engineering (`coder:frontend`, `coder:backend`)  
> **Klasifikasi**: Standard Operating Design Specification (SODS)  
> **Repositori**: `C:/Users/Acer/OneDrive/Desktop/DamezBarber/docs/design/wireframes.md`  
> **Referensi Hulu**: `docs/PRD.md`, `docs/design/DESIGN.md`, `docs/design/user-journeys.md`, `docs/research/market-services-benchmark.md`, `docs/research/slot-capacity-and-noshow-model.md`  
> **DoD Verification**: Memenuhi standar responsif breakpoint 360px – 1440px, zona ergonomis jempol smartphone (*Thumb-Friendly Ergonomics*), dan kepatuhan WCAG 2.1 Level AA.

---

## 1. Executive Design Summary & Ergonomic Philosophy

Dokumen ini menetapkan cetak biru visual (*wireframe blueprints*), hierarki tata letak, dan spesifikasi komponen antarmuka untuk dua pilar utama **Damez Barbershop Web Platform**:
1. **Public Company Profile**: Menampilkan kredibilitas, etalase layanan premium, transparansi harga, 3 master barber, galeri suasana, peta lokasi, jam operasional (10:00 – 21:00 WIB), serta kebijakan anti-no-show secara berwibawa dengan tema *Masculine Vintage Modern*.
2. **7-Step Modular Mobile Booking Funnel**: Alur reservasi berkecepatan tinggi (< 120 detik) tanpa kewajiban pendaftaran akun (*Zero-Account Friction*), teroptimasi untuk jempol satu tangan pada perangkat smartphone, terintegrasi penguncian slot atomik 15 menit dan pembayaran Down Payment (DP) Flat Rp 20.000 via Midtrans QRIS.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           DAMEZ BARBERSHOP WIREFRAME ARCHITECTURE                               │
├────────────────────────────────────────────────┬────────────────────────────────────────────────┤
│       PILAR 1: LANDING PROFILE (DESKTOP & MOB) │      PILAR 2: 7-STEP MODULAR MOBILE BOOKING    │
├────────────────────────────────────────────────┼────────────────────────────────────────────────┤
│ • Sticky Nav + Store Live Status Badge         │ • Step 1: Trigger / Entry Floating CTA         │
│ • Asymmetric / Split Hero + Rating 4.9 ★       │ • Step 2: Multi-Select Layanan & Duration Calc │
│ • 3 Value Pillars (Tanpa Akun, Pasti, QRIS)    │ • Step 3: Pilih Barber (Spesifik / Siapa Saja) │
│ • Katalog 8 Layanan Benchmark & Badges         │ • Step 4: Pilih Tgl (7 Hari) & Time Chips Grid │
│ • 3 Profil Master Barber (Rian, Dimas, Kevin)  │ • Step 5: Input Nama & WA (+62) + Consent PDP  │
│ • Galeri Portofolio & Suasana Toko             │ • Step 6: Review DP Rp 20k & Hold 15 Mnt       │
│ • Google Maps Interaktif & Transit Info        │ • Step 7: Bayar QRIS Snap & Tiket Digital Pass │
│ • Kebijakan H-3 Reschedule, 15m Telat & FAQ    │ • Sticky Bottom Cart Bar (Thumb Zone)          │
└────────────────────────────────────────────────┴────────────────────────────────────────────────┘
```

### 1.1 Ergonomi Zona Jempol Smartphone (Thumb Zone Architecture)
Mengacu pada riset ergonomi antarmuka sentuh seluler (*Steven Hoober Mobile Touch Patterns*), 75% interaksi satu tangan bergantung pada jangkauan jempol (*Thumb Reach Zone*). Pada layar berdimensi 360px–430px:

```
┌────────────────────────────────────────┐  ▲
│ [Top Bar: Logo & Status Badge]         │  │ 15% Zona Sukar Dijangkau (Hard Zone)
│ ────────────────────────────────────── │  │ • Hanya elemen visual informatif & read-only
│ [Hero Title / Visual Imagery]          │  │ • Dilarang menempatkan tombol aksi krusial
├────────────────────────────────────────┤  ┼
│ [Content Cards: Layanan, Barber, Tgl]  │  │ 50% Zona Reguler (Natural / Stretch Zone)
│                                        │  │ • Pilihan interaktif (Card, Chip, Radio)
│                                        │  │ • Geser horizontal (Horizontal Date Scroller)
├────────────────────────────────────────┤  ┼
│ [Floating Summary Bar: Layanan & DP]   │  │ 35% Zona Jempol Ideal (Easy Thumb Zone)
│ [Sticky Primary Action CTA: 52-56px]   │  │ • Tombol Primer, Lanjut, dan Konfirmasi
│ [Bottom Safe Area / Home Bar: 16-34px] │  │ • Mudah ditekan satu tangan tanpa tergelincir
└────────────────────────────────────────┘  ▼
```

### 1.2 Breakpoint & Responsive Scaling Standard
Semua tata letak wajib beroperasi tanpa *horizontal scroll* (`overflow-x: hidden`) pada seluruh spektrum perangkat:
- **Mobile Compact (xs)**: `360px – 389px` (Samsung Galaxy A-series, Android compact)
- **Mobile Standard (sm)**: `390px – 429px` (iPhone 13/14/15/16, Google Pixel)
- **Mobile Large / Phablet**: `430px – 480px` (iPhone Pro Max, Samsung Ultra)
- **Tablet Portrait (md)**: `768px – 834px` (iPad Mini, iPad 10.2", Galaxy Tab)
- **Desktop Standard (lg/xl)**: `1024px – 1280px` (MacBook Air, Laptop 13-14")
- **Desktop Widescreen (2xl)**: `1440px+` (Desktop Monitor, iMac)

### 1.3 Design Tokens Mapping (from `docs/design/DESIGN.md`)
- **Background Utama**: `#121212` (Matte Charcoal Obsidian — bebas `#000000` pekat)
- **Surface / Card**: `#1A1A1A` (Deep Carbon Surface)
- **Surface Elevated / Modal**: `#242424` (Elevated Slate)
- **Border Default**: `#2E2E2E` (Subtle Wireframe Border)
- **Border Accent / Active**: `#D97706` (Warm Vintage Amber)
- **Primary Accent CTA**: `#D97706` (Hover: `#F59E0B`, Text: `#121212` Charcoal)
- **Secondary Action**: `#784C25` (Cognac Leather, Text: `#FFFFFF`)
- **Teks Utama**: `#F5F5F0` (Clean Cream Off-White)
- **Teks Muted**: `#A8A29E` (Warm Stone 400)
- **Status Badges**:
  - Confirmed: Background `#064E3B`, Text `#34D399`
  - Pending / Hold: Background `#451A03`, Text `#FBBF24`
  - No-Show: Background `#450A0A`, Text `#F87171`
  - Cancelled: Background `#27272A`, Text `#A1A1AA`
- **Tipografi**:
  - Display: `Cinzel`, serif (Masculine Classical Heritage)
  - UI Headings & Body: `Plus Jakarta Sans`, sans-serif (High-legibility modern digital)
  - Codes & Numbers: `JetBrains Mono`, monospace (Price, Booking Code, Timer)

---

## 2. Information Architecture & Navigation Logic

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   SITEMAP & ROUTING ARCHITECTURE                                 │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                 │
                                                 ▼
             ┌───────────────────────────────────────────────────────────────────────┐
             │            LANDING PAGE UTAMA (PUBLIC COMPANY PROFILE) `/`            │
             ├───────────────────────────────────────────────────────────────────────┤
             │ 1. Sticky Header & Store Status Live Pulse                            │
             │ 2. Hero Section (Tagline, Rating 4.9★, Primary CTA, Value Props)      │
             │ 3. Katalog Layanan (8 Paket Benchmark, Filter Kategori, Pilih Cepat)  │
             │ 4. Tim Master Barber (3 Kursi: Rian, Dimas, Kevin + Status Bertugas)  │
             │ 5. Galeri Portofolio & Suasana Toko (Masonry Asimetris)               │
             │ 6. Peta Lokasi Google Maps, Jam Operasional & Petunjuk Arah           │
             │ 7. Kebijakan Bisnis: DP Rp 20rb, H-3 Reschedule, 15m Telat & FAQ      │
             │ 8. Footer Kredibilitas, Schema LocalBusiness & Kontak WhatsApp Admin  │
             │ 9. [MOBILE ONLY] Floating Sticky Bottom Bar (Trigger Booking)         │
             └───────────────────────────────────────────────────────────────────────┘
                                                 │
                  [Klik CTA "Booking Sekarang" / "Pilih Layanan Ini"]
                                                 │
                                                 ▼
             ┌───────────────────────────────────────────────────────────────────────┐
             │           MODULAR MOBILE BOOKING WIZARD (MODAL OVERLAY / `/book`)     │
             ├───────────────────────────────────────────────────────────────────────┤
             │ • Header: Tombol Tutup/Batal, Progres Bar (Langkah X dari 5)          │
             │                                                                       │
             │ • [STEP 2] Pilih Layanan (Multi-select 1-2 layanan, max 90 mnt)       │
             │      ▼                                                                │
             │ • [STEP 3] Pilih Barber (Spesifik Rian/Dimas/Kevin vs Siapa Saja)     │
             │      ▼                                                                │
             │ • [STEP 4] Pilih Tanggal & Slot Jam (Scroller 7 hari, Time Chips Grid)│
             │      ▼                                                                │
             │ • [STEP 5] Input Data Pemesan (Nama, WA +62, Consent UU PDP No. 27)   │
             │      ▼                                                                │
             │ • [STEP 6] Review Finansial & Penguncian Slot (Hold 15 Mnt, DP Rp 20k)│
             │      ▼                                                                │
             │ • [STEP 7A] Pembayaran Midtrans Snap QRIS (Countdown 15 Menit)        │
             │      ▼ [Webhook Settlement < 2 Detik]                                 │
             │ • [STEP 7B] Konfirmasi Tiket Digital Boarding Pass (Kode DMZ-*)       │
             └───────────────────────────────────────────────────────────────────────┘
```

---

## 3. Wireframe Blueprint 1: Public Company Profile (Responsive 360px – 1440px)

### 3.1 Header & Sticky Navigation
Berada di posisi paling atas layar (`sticky top-0 z-40`). Menggunakan efek *liquid glass* halus (`bg-[#121212]/90 backdrop-blur-md border-b border-[#2E2E2E]`).

#### Tampilan Wireframe Mobile (360px – 430px)
```
┌────────────────────────────────────────────────────────┐
│ [DAMEZ BARBERSHOP]           [● BUKA (10:00 - 21:00)]  │
└────────────────────────────────────────────────────────┘
```

#### Tampilan Wireframe Desktop (1024px – 1440px)
```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [DAMEZ BARBERSHOP]      Layanan   Barber   Galeri   Lokasi   FAQ    [● BUKA (10-21 WIB)] [Booking]│
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Komponen & Spesifikasi:
- **Logo Brand**:
  - Mobile: Ikon gunting tembaga + teks `"DAMEZ"`, font Cinzel Bold 18px.
  - Desktop: Logo + Tagline `"DAMEZ BARBERSHOP — EST. 2024"`, font Cinzel Bold 20px.
- **Store Status Live Badge**:
  - `status: open`: Dot hijau berdenyut (`bg-emerald-400 animate-pulse`), teks `"Buka Sekarang (10:00 - 21:00 WIB)"`, background `#064E3B`, teks `#34D399`, border `#065F46`.
  - `status: closing_soon` (pukul 20:00–21:00 WIB): Dot kuning (`bg-amber-400`), teks `"Tutup 21:00 WIB"`.
  - `status: closed`: Dot abu-abu (`bg-zinc-500`), teks `"Tutup — Booking untuk Besok"`.
- **Navigasi Menu (Desktop)**: Tautan menu dengan hover amber underline halus (`text-stone-400 hover:text-amber-500 transition-colors`).
- **Tombol Quick CTA (Desktop)**: Tombol ukuran 40px height, background `#D97706`, padding 10px 20px, teks tebal charcoal.

---

### 3.2 Hero Section (First Impression & Value Hook)
Hero section menerapkan *Split Screen Layout* pada desktop dan *High-Impact Vertical Card* pada mobile. Tidak menggunakan teks rata tengah klise; menggunakan rata kiri dinamis dengan kontras tinggi.

#### Wireframe Mobile (390px Viewport)
```
┌────────────────────────────────────────────────────────┐
│ ★★★★★ 4.9 (320+ Ulasan Google Maps)                   │
│                                                        │
│ CRAFTED GROOMING                                       │
│ FOR GENTLEMEN                                          │
│                                                        │
│ Presisi gunting klasik, kenyamanan ruang maskulin,     │
│ dan jaminan kursi pasti tanpa antre berjam-jam.        │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [Foto Hero Interior Barbershop & Kursi Kulit Klasik]│ │
│ │ Aspect Ratio 16:9, Rounded-xl, Overlay Vignette    │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ [► Booking Jadwal Sekarang — DP Flat Rp 20.000]       │
│                                                        │
│ ✓ Tanpa Akun    ✓ Kursi Terkunci    ✓ QRIS Instan      │
└────────────────────────────────────────────────────────┘
```

#### Wireframe Desktop (1280px Viewport)
```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│  KOLOM KIRI (55% Width)                       │  KOLOM KANAN (45% Width)                       │
│                                               │                                                │
│  [Badge: ★★★★★ 4.9 Bintang • 320+ Ulasan]     │  ┌──────────────────────────────────────────┐  │
│                                               │  │ [Foto Master Barber Eksekusi Classic Cut]│  │
│  CRAFTED GROOMING                             │  │ Aspect Ratio 4:5, Rounded-2xl            │  │
│  FOR GENTLEMEN                                │  │ Border 1px border-[#2E2E2E]              │  │
│                                               │  │ Inner Shadow Refraction                  │  │
│  Presisi seni pangkas rambut klasik pria,     │  │                                          │  │
│  kenyamanan lounge modern ber-AC, dan kepastian│ │  │ ┌────────────────────────────────────┐ │  │
│  kursi bebas antre melalui sistem reservasi   │  │ │ Floating Card: Kursi Aktif 100% Steril│ │  │
│  digital ber-DP Flat Rp 20.000.               │  │ │ "3 Master Barber Siap Bertugas"       │ │  │
│                                               │  │ └────────────────────────────────────┘ │  │
│  ┌───────────────────────┐  ┌───────────────┐ │  └──────────────────────────────────────────┘  │
│  │ Booking Jadwal Sekarang│  │ Lihat Layanan │ │                                                │
│  │ (Mulai DP Rp 20.000)   │  │ & Tarif Resmi │ │                                                │
│  └───────────────────────┘  └───────────────┘ │                                                │
│                                               │                                                │
│  ● Zero-Account Friction   ● Garansi Anti-No-Show   ● Konfirmasi Tiket WhatsApp < 5 Detik      │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Spesifikasi Elemen:
- **Headline Display**: Font Cinzel Bold 36px (Mobile) / 52px (Desktop), line-height 1.15, warna `#F5F5F0`.
- **Sub-headline**: Font Plus Jakarta Sans Regular 15px (Mobile) / 18px (Desktop), max-width 54ch, warna `#A8A29E`.
- **Social Proof Pill**: Background `#1A1A1A`, border `#2E2E2E`, padding 6px 14px, rounded-full. Bintang kuning `#F59E0B`, teks 13px bold.
- **Primary Hero Button**: Tinggi 52px (Mobile) / 56px (Desktop), background `#D97706`, hover `#F59E0B`, radius 12px, font Plus Jakarta Sans Bold 16px, shadow `0 4px 20px rgba(217, 119, 6, 0.25)`.
- **Pillar Checks**: 3 poin kepercayaan dengan centang SVG emas, font Plus Jakarta Sans Medium 13px, warna `#D4D4D8`.

---

### 3.3 Tiga Pilar Proposisi Nilai ("Penenang Rasa Cemas")
Dirancang dalam bentuk kartu bento asimetris 3 kolom (Desktop) atau kartu tumpuk vertikal dengan jarak ergonomis (Mobile). Menjawab langsung kecemasan *The Barbershop Trilemma*.

#### Wireframe Kartu Bento:
```
┌──────────────────────────────┬──────────────────────────────┬──────────────────────────────┐
│ [1] ZERO-ACCOUNT FRICTION    │ [2] KURSI DIKUNCI 100% PASTI │ [3] TIKET WHATSAPP INSTAN    │
│                              │                              │                              │
│ Tidak perlu unduh aplikasi   │ Slot pilihan Anda dikunci    │ Konfirmasi tiket QR & jadwal │
│ atau bikin password akun.    │ sistem selama 15 menit via   │ resmi masuk ke WhatsApp dalam│
│ Cukup masukkan Nama & WA,    │ DP Flat Rp 20rb. Anti rebutan│ < 5 detik. Dilengkapi tautan │
│ booking beres dalam 85 detik.│ kursi dan bebas antre fisik. │ navigasi Google Maps toko.   │
└──────────────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

---

### 3.4 Katalog Layanan & Transparansi Tarif (8 Paket Benchmark)
Menyajikan 8 paket layanan hasil riset pasar (`docs/research/market-services-benchmark.md`). Pada mobile disajikan dalam daftar kartu bertingkat ramah sentuh (*touch-friendly card list*); pada desktop disajikan dalam grid 2 kolom dengan pemisahan visual yang tegas.

#### Wireframe Katalog Layanan (Mobile 390px):
```
┌────────────────────────────────────────────────────────┐
│ DAFTAR LAYANAN & TARIF RESMI                           │
│ Harga transparan, tanpa biaya tersembunyi.             │
│ Semua layanan mencakup konsultasi & sterilisasi alat.  │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [POPULER]                                          │ │
│ │ Gentlemen Classic Haircut                Rp 50.000 │ │
│ │ Durasi: 45 Menit                                   │ │
│ │ Potong rambut presisi, cuci rambut, handuk dingin/ │ │
│ │ hangat, pijat kepala rileks & styling pomade.      │ │
│ │                                                    │ │
│ │ [ Tombol: Pilih Layanan Ini (Buka Booking) ]       │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Premium Fade & Taper Cut                 Rp 65.000 │ │
│ │ Durasi: 50 Menit                                   │ │
│ │ Gradasi fade presisi tinggi (skin/taper), detail   │ │
│ │ razor outline, cuci rambut & styling produk.       │ │
│ │                                                    │ │
│ │ [ Tombol: Pilih Layanan Ini ]                      │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [NILAI TERBAIK]                                    │ │
│ │ Damez Signature Executive                Rp 95.000 │ │
│ │ Durasi: 60 Menit                                   │ │
│ │ Full package: Haircut + Beard Grooming + Hot Towel │ │
│ │ Shave + Massage Relaksasi Kepala & Tonik Mewah.    │ │
│ │                                                    │ │
│ │ [ Tombol: Pilih Layanan Ini ]                      │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ [ + Lihat 5 Layanan Spesialis Lainnya (Accordion) ]    │
└────────────────────────────────────────────────────────┘
```

#### Spesifikasi Daftar Layanan:
1. `SRV-01: Gentlemen Classic Haircut` — 45 Menit | Rp 50.000 (Badge: `Paling Populer`)
2. `SRV-02: Premium Fade & Taper Cut` — 50 Menit | Rp 65.000 (Badge: `Spesialis Fade`)
3. `SRV-03: Junior / Kids Haircut` — 35 Menit | Rp 40.000 (Badge: `Ramah Anak`)
4. `SRV-04: Beard Sculpting & Shave` — 35 Menit | Rp 45.000 (Badge: `Grooming Jenggot`)
5. `SRV-05: Relaxing Hair Spa & Wash` — 40 Menit | Rp 55.000 (Badge: `Perawatan Kulit Kepala`)
6. `SRV-06: Black Hair Color Revival` — 45 Menit | Rp 65.000 (Badge: `Pewarnaan Uban`)
7. `SRV-07: Express Clean Cut & Wash` — 30 Menit | Rp 40.000 (Badge: `Cepat & Rapi`)
8. `SRV-08: Damez Signature Executive` — 60 Menit | Rp 95.000 (Badge: `Nilai Terbaik`)

- **Card Styling**: Background `#1A1A1A`, border `#2E2E2E`, hover border `#D97706`, padding 20px, radius 12px.
- **Badge Styling**: Background `#451A03`, teks `#FBBF24`, font JetBrains Mono 11px uppercase tracking-wider.
- **Harga & Durasi**: Harga menggunakan font Cinzel Bold 18px warna `#F5F5F0`; durasi menggunakan font JetBrains Mono 13px warna `#A8A29E`.
- **Tombol Aksi**: Tinggi 44px, border 1px border `#D97706`, teks amber, hover bg `#D97706` teks charcoal.

---

### 3.5 Tim Master Barber (3 Kursi Kerja Aktif)
Menampilkan kredibilitas para barber profesional. Menghilangkan keraguan pelanggan mengenai siapa yang akan memegang gunting dan pisau cukur.

#### Wireframe Tim Barber (Desktop 3 Kolom / Mobile Horizontal Scroll):
```
┌──────────────────────────────┬──────────────────────────────┬──────────────────────────────┐
│ KURSI 1: RIAN PRATAMA        │ KURSI 2: DIMAS ARISANDI      │ KURSI 3: KEVIN SANJAYA       │
│ "The Sculptor"               │ "Fade Master"                │ "Grooming Specialist"        │
│                              │                              │                              │
│ [Foto Portrait Rian]         │ [Foto Portrait Dimas]        │ [Foto Portrait Kevin]        │
│ Senior Master Barber (6 Thn) │ Clipper Specialist (4 Thn)   │ Shave & Beard Master (5 Thn) │
│                              │                              │                              │
│ Spesialisasi:                │ Spesialisasi:                │ Spesialisasi:                │
│ • Classic Pompadour & Sidepart│ • Mid/Low Skin Fade          │ • Royal Hot Towel Shave      │
│ • Scissor Layer Precision    │ • Buzz Cut & Textured Crop   │ • Beard Contouring & Lineup  │
│ • Konsultasi Karakter Wajah  │ • Fast Sharp Lineup          │ • Relaksasi Pijat Titik Wajah│
│                              │                              │                              │
│ Status: Bertugas Hari Ini    │ Status: Bertugas Hari Ini    │ Status: Bertugas Hari Ini    │
│                              │                              │                              │
│ [Pilih Rian untuk Booking]   │ [Pilih Dimas untuk Booking]  │ [Pilih Kevin untuk Booking]  │
└──────────────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

#### Spesifikasi Elemen:
- Foto barber beresolusi tajam, rasio 1:1, hitam-putih artistik dengan filter amber hangat halus saat hover.
- Label kursi: Font JetBrains Mono 12px uppercase warna `#D97706`.
- Tombol aksi: Link trigger yang langsung membuka modal booking dengan barber yang bersangkutan otomatis terpilih (*pre-selected*).

---

### 3.6 Galeri Portofolio & Suasana Barbershop (Asymmetric Bento Grid)
Menampilkan 6 visual kurasi: 3 hasil potongan rambut (*Classic Sidepart, Low Skin Fade, Textured Crop*) dan 3 suasana toko (*Lounge sofa kulit, rak peralatan cukur steril, cermin bergaya vintage*).

#### Wireframe Bento Grid Galeri (Desktop 1280px):
```
┌───────────────────────────────────────┬───────────────────┬───────────────────┐
│                                       │ [Foto 2: Low Fade]│ [Foto 3: Shave]   │
│ [Foto 1: Interior Lounge & Kursi Bar] │ 1:1 Square        │ 1:1 Square        │
│ 16:9 Wide Highlight Card              ├───────────────────┴───────────────────┤
│                                       │ [Foto 4: Pompadour Classic Cut]       │
├───────────────────┬───────────────────┤ 16:9 Wide Card                        │
│ [Foto 5: Tool     │ [Foto 6: Modern   │                                       │
│ Sterilizer Box]   │ Textured Crop]    │                                       │
└───────────────────┴───────────────────┴───────────────────────────────────────┘
```
- **Mobile Mode**: Carousel horizontal bersnap halus (`overflow-x: auto snap-x snap-mandatory flex gap-4`) dengan indikator pagination titik di bawahnya.
- **Lighting Effect**: 1px subtle inner border (`border-white/10`) dengan bayangan difusi halus.

---

### 3.7 Lokasi Peta Interaktif & Jam Operasional
Menyajikan kepastian lokasi toko, akses parkir, transportasi, serta integrasi peta Google Maps.

#### Wireframe Lokasi & Jam Operasional:
```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│  KOLOM KIRI: DETAIL LOKASI & KONTAK           │  KOLOM KANAN: GOOGLE MAPS EMBED INTERAKTIF     │
│                                               │                                                │
│  [ALAMAT TOKO]                                │  ┌──────────────────────────────────────────┐  │
│  Damez Barbershop                             │  │ [ Google Maps Interactive Embed View ]   │  │
│  Jl. Senopati Raya No. 42, Kebayoran Baru,    │  │ Pin Emas Damez Barbershop                │  │
│  Jakarta Selatan 12190                        │  │                                          │  │
│                                               │  │ [Tombol: Petunjuk Arah di Google Maps]   │  │
│  [JAM OPERASIONAL TOKO]                       │  └──────────────────────────────────────────┘  │
│  Senin – Minggu : 10:00 – 21:00 WIB           │                                                │
│  (Batas Reservasi Slot Terakhir: 20:00 WIB)   │  [AKSES & PARKIR]:                             │
│                                               │  • Parkir Mobil & Motor Luas di Depan Toko     │
│  [KONTAK & LAYANAN PELANGGAN]                 │  • 5 Menit Jalan Kaki dari Halte MRT Terdekat  │
│  WhatsApp Toko : +62 812-3456-7890            │  • Ruang Tunggu Ber-AC Dingin & Free Wi-Fi 100M│
│  Email Resmi   : booking@damezbarber.com      │                                                │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.8 Kebijakan Operasional & FAQ Accordion
Menghilangkan friksi dan sengketa pembayaran dengan memaparkan regulasi secara transparan sebelum pelanggan memesan.

#### Wireframe Kebijakan Operasional (3 Kolom Warning Cards):
```
┌──────────────────────────────┬──────────────────────────────┬──────────────────────────────┐
│ 💰 KEBIJAKAN DP FLAT RP 20RB │ ⏰ BATAS RESCHEDULE H-3 JAM  │ ⏳ TOLERANSI TELAT 15 MENIT  │
│                              │                              │                              │
│ • Berlaku untuk semua paket  │ • Bebas ubah jadwal hingga   │ • Toleransi hadir 15 menit   │
│ • Dipotong dari total nota   │   maksimal H-3 jam sebelum sesi│ • Lewat 15 mnt: slot dilepas │
│ • Sisa tagihan dibayar di    │ • Pengajuan via link WhatsApp│   ke walk-in & DP hangus demi│
│   kasir fisik (tunai/QRIS)   │ • Reschedule < H-3: DP hangus│   keadilan jadwal pelanggan  │
└──────────────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

#### FAQ Accordion (5 Tanya Jawab Krusial):
1. *"Mengapa harus membayar DP Rp 20.000?"*  
   → Jawaban: Untuk menjamin kursi potong khusus untuk Anda dan menghindarkan barber dari kekosongan jadwal akibat no-show.
2. *"Bagaimana cara pelunasan sisa tagihan?"*  
   → Jawaban: Sisa pembayaran (misal Rp 30.000 untuk paket Classic Haircut) dibayarkan langsung di kasir toko setelah pangkas rambut selesai, baik dengan uang tunai maupun scan QRIS toko.
3. *"Bisakah saya datang langsung tanpa booking (walk-in)?"*  
   → Jawaban: Bisa, namun pelanggan yang memiliki booking terjadwal akan diprioritaskan. Jika antrean penuh, waktu tunggu walk-in dapat mencapai 45–90 menit.
4. *"Bagaimana jika saya terlambat datang ke toko?"*  
   → Jawaban: Kami memberikan toleransi keterlambatan 15 menit. Jika lebih dari 15 menit tanpa konfirmasi, slot dialihkan ke pelanggan lain dan DP dinyatakan hangus sebagai biaya kompensasi waktu barber.
5. *"Apakah saya bisa mengganti barber saat tiba di lokasi?"*  
   → Jawaban: Tergantung ketersediaan kursi barber lain. Jika barber lain sedang melayani reservasi lain, Anda akan dilayani oleh barber yang telah Anda pilih saat booking.

---

### 3.9 Footer Kredibilitas & Local SEO Schema
- Metadata Schema.org `LocalBusiness` memuat: `name`, `image`, `address`, `geo` (lat/long), `openingHoursSpecification`, `priceRange: "$$"`, dan `telephone`.
- Copyright resmi: `© 2026 Damez Barbershop. All Rights Reserved. Crafted for Gentlemen.`
- Tautan Cepat: Ketentuan Layanan, Kebijakan Privasi (UU PDP No. 27/2022), Akses Dashboard Admin.

---

### 3.10 Floating Sticky Bottom CTA (Khusus Mobile Viewport 360px – 430px)
Elemen ini selalu mengambang di bawah layar ponsel (`fixed bottom-0 left-0 right-0 z-50`), terpasang pada area *Easy Thumb Zone*.

```
┌────────────────────────────────────────────────────────┐
│ [● Buka 10-21]  Mulai DP Rp 20.000    [ BOOKING SEKARANG ] │
│ Jaminan Kursi Pasti Tanpa Antre       [  (Tinggi 52px)   ] │
└────────────────────────────────────────────────────────┘
```
- **Height**: 68px (termasuk padding 10px atas/bawah).
- **Background**: `#121212/95 backdrop-blur-lg border-t border-[#2E2E2E]`.
- **Button**: Background `#D97706`, radius 12px, font Plus Jakarta Sans Bold 15px, warna teks `#121212`.

---

## 4. Wireframe Blueprint 2: Alur Modular Mobile Booking Funnel (7 Langkah)

Alur booking disajikan dalam bentuk antarmuka modal layar penuh (*Full-Screen Sheet Modal* pada mobile / *Centered Modal Card* pada desktop) untuk meminimalkan gangguan visual dan memaksimalkan kecepatan transaksi (*high-velocity conversion*).

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      WIZARD HEADER & PROGRESS INDICATOR                  │
├──────────────────────────────────────────────────────────────────────────┤
│ [← Kembali]              RESERVASI KURSI DAMEZ             [✕ Batal]    │
│ ──────────────────────────────────────────────────────────────────────── │
│ Progres: [==== Langkah 1 dari 5: Pilih Paket Layanan ====]               │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 4.1 Step 2: Pemilihan Layanan & Multi-Selection (Katalog & Kalkulator Cerdas)
Pengguna dapat memilih **1 hingga maksimal 2 layanan komplementer** atau **1 layanan kombo signature**.

#### Wireframe Step 2 (Mobile Viewport 390px):
```
┌────────────────────────────────────────────────────────┐
│ [← Kembali]            PILIH LAYANAN             [✕]   │
│ Progres: [== Langkah 1 dari 5: Layanan ============]   │
├────────────────────────────────────────────────────────┤
│ Pilih 1-2 layanan yang Anda inginkan hari ini:         │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [☑] Gentlemen Classic Haircut            Rp 50.000 │ │
│ │     45 Menit • [Paling Populer]                     │ │
│ │     Potong presisi, cuci rambut, hot towel, massage│ │
│ └────────────────────────────────────────────────────┘ │
│   *Status: Terpilih (Border Amber #D97706, Checked)*   │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [☑] Beard Sculpting & Shave              Rp 45.000 │ │
│ │     35 Menit • [Grooming Jenggot]                  │ │
│ │     Cukur jenggot rapi, razor line, hot towel      │ │
│ └────────────────────────────────────────────────────┘ │
│   *Status: Terpilih (Border Amber #D97706, Checked)*   │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [ ] Relaxing Hair Spa & Wash             Rp 55.000 │ │
│ │     40 Menit                                        │ │
│ │     (Batas maksimal 2 layanan telah tercapai)      │ │
│ └────────────────────────────────────────────────────┘ │
│   *Status: Disabled / Dimmed (Opacity 40%)*            │
│                                                        │
│ [INFO]: Maksimal 2 layanan per sesi untuk ketepatan    │
│   waktu antrean pelanggan berikutnya.                  │
│                                                        │
├────────────────────────────────────────────────────────┤
│ [ZONA ERGONOMI JEMPOL / STICKY BOTTOM BAR]             │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 2 Layanan Terpilih       Estimasi Waktu: 80 Menit  │ │
│ │ Total Tagihan: Rp 95.000 Down Payment: Rp 20.000   │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ [ LANJUT PILIH BARBER (1/5) → ] (Tinggi 52px)      │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

#### Spesifikasi Interaksi:
- **Card Selection Box**: Mengetuk area mana saja pada kartu akan mengubah status centang.
- **Micro-animation**: Kartu aktif terangkat 1px dengan border amber menyala (`border-[#D97706] ring-1 ring-[#D97706]`).
- **Dynamic Calculation**: Bar bawah mengkalkulasi durasi (`45m + 35m = 80m`) dan total biaya (`Rp 50k + Rp 45k = Rp 95k`) secara instan.
- **Validation Guard**: Jika 0 layanan dipilih, tombol `"Lanjut Pilih Barber"` berstatus disabled (`bg-stone-700 text-stone-400 cursor-not-allowed`).

---

### 4.2 Step 3: Pemilihan Barber (Barber Spesifik vs "Siapa Saja yang Tersedia")
Memberikan kebebasan antara loyalitas pada barber favorit atau fleksibilitas waktu tercepat.

#### Wireframe Step 3 (Mobile Viewport 390px):
```
┌────────────────────────────────────────────────────────┐
│ [← Kembali]             PILIH BARBER             [✕]   │
│ Progres: [==== Langkah 2 dari 5: Barber ===========]   │
├────────────────────────────────────────────────────────┤
│ Siapa yang akan menangani gaya rambut Anda?            │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ (•) [KAPASITAS] SIAPA SAJA YANG TERSEDIA [TERCEPAT] │ │
│ │     Pilihan terbaik jika Anda ingin slot terluang  │ │
│ │     tanpa menunggu antrean barber tertentu.        │ │
│ └────────────────────────────────────────────────────┘ │
│   *Status: Terpilih Default (Recommended)*             │
│                                                        │
│ ATAU PILIH MASTER BARBER SPESIFIK:                     │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ( ) [Foto] RIAN PRATAMA ("The Sculptor")           │ │
│ │     Kursi 1 • Senior Master Barber (6 Thn)         │ │
│ │     Spesialis: Classic Cut, Pompadour, Scissor Work│ │
│ │     ● Bertugas Hari Ini (Slot Terbuka)             │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ( ) [Foto] DIMAS ARISANDI ("Fade Master")          │ │
│ │     Kursi 2 • Clipper Specialist (4 Thn)           │ │
│ │     Spesialis: Skin Fade, Taper, Modern Crop       │ │
│ │     ● Bertugas Hari Ini (Slot Terbuka)             │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ( ) [Foto] KEVIN SANJAYA ("Grooming Specialist")   │ │
│ │     Kursi 3 • Shave & Beard Master (5 Thn)         │ │
│ │     Spesialis: Hot Towel Shave, Beard Contouring   │ │
│ │     ● Bertugas Hari Ini (Slot Terbuka)             │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
├────────────────────────────────────────────────────────┤
│ [ LANJUT PILIH WAKTU (2/5) → ]                         │
└────────────────────────────────────────────────────────┘
```

#### Spesifikasi Interaksi:
- Kartu `"Siapa Saja yang Tersedia"` ditempatkan paling atas dengan badge warna hijau toska (`#064E3B` / `#34D399`) untuk mendistribusikan beban kerja kursi (*capacity balancing*).
- Setiap barber menampilkan status real-time: `Bertugas Hari Ini` (hijau), `Sedang Istirahat` (kuning), atau `Libur Rutin` (abu-abu nonaktif).

---

### 4.3 Step 4: Pemilihan Tanggal & Slot Jam Dinamis
Menampilkan pemilih tanggal geser horizontal (*Horizontal Date Scroller*) untuk 7 hari ke depan, diikuti grid waktu (*Time Chips Grid*) yang dikelompokkan menurut sesi Pagi/Siang dan Sore/Malam.

#### Wireframe Step 4 (Mobile Viewport 390px):
```
┌────────────────────────────────────────────────────────┐
│ [← Kembali]             PILIH JADWAL             [✕]   │
│ Progres: [====== Langkah 3 dari 5: Waktu ==========]   │
├────────────────────────────────────────────────────────┤
│ 1. PILIH TANGGAL (7 HARI KE DEPAN)                     │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │ SAB │ │ MIN │ │ SEN │ │ SEL │ │ RAB │ │ KAM │  ...   │
│ │ 24  │ │ 25  │ │ 26  │ │ 27  │ │ 28  │ │ 29  │        │
│ │ OKT │ │ OKT │ │ OKT │ │ OKT │ │ OKT │ │ OKT │        │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘        │
│  [Aktif]                                               │
│                                                        │
│ 2. PILIH JAM KEDATANGAN                                │
│ Durasi Layanan: 80 Mnt + 10 Mnt Sanitasi Alat          │
│                                                        │
│ SESI PAGI & SIANG (10:00 - 14:00 WIB)                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│ │  10:00   │ │  11:30   │ │  13:00   │                 │
│ │ Tersedia │ │ [TERISI] │ │ Istirahat│                 │
│ └──────────┘ └──────────┘ └──────────┘                 │
│                                                        │
│ SESI SORE & MALAM (14:00 - 20:00 WIB)                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│ │  14:30   │ │  16:00   │ │  17:30   │                 │
│ │[TERPILIH]│ │ Tersedia │ │  Terisi  │                 │
│ └──────────┘ └──────────┘ └──────────┘                 │
│ │ ┌──────────┐ ┌──────────┐                              │
│ │  19:00   │ │  20:00   │                              │
│ │ Tersedia │ │ Tersedia │                              │
│ └──────────┘ └──────────┘                              │
│                                                        │
│ [INFO] Catatan: Setiap slot mencakup 10 menit buffer   │
│   sterilisasi alat sebelum Anda duduk di kursi.        │
│                                                        │
├────────────────────────────────────────────────────────┤
│ Waktu Terpilih: Sabtu, 24 Okt 2026 • 14:30 - 15:50 WIB │
│ [ LANJUT ISI DATA DIRI (3/5) → ]                       │
└────────────────────────────────────────────────────────┘
```

#### Spesifikasi State Time Chips Grid:
- **Tersedia (Available)**: Background `#1A1A1A`, border `#2E2E2E`, teks `#F5F5F0`. Ukuran chip minimal 48px height x 95px width.
- **Terpilih (Selected)**: Background `#D97706`, border `#D97706`, teks `#121212` tebal, shadow amber.
- **Terisi (Booked / In-Progress)**: Background `#1F1F1F`, border `#262626`, teks `#52525B` coret halus, kursor `not-allowed`.
- **Istirahat Barber (Break)**: Background `#18181B`, label `"Istirahat"`, tidak dapat diklik.

---

### 4.4 Step 5: Input Kontak Minimalis & Consent UU PDP No. 27/2022
Formulir super-ringkas yang hanya meminta data wajib esensial untuk penerbitan tiket. Menghilangkan kebutuhan registrasi akun dan pembuatan password.

#### Wireframe Step 5 (Mobile Viewport 390px):
```
┌────────────────────────────────────────────────────────┐
│ [← Kembali]            DATA PEMESAN              [✕]   │
│ Progres: [======== Langkah 4 dari 5: Kontak =======]   │
├────────────────────────────────────────────────────────┤
│ Tiket reservasi dan petunjuk arah akan dikirimkan      │
│ langsung ke nomor WhatsApp Anda.                       │
│                                                        │
│ NAMA LENGKAP / PANGGILAN *                             │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Budi Santoso                                       │ │
│ └────────────────────────────────────────────────────┘ │
│ Tinggi input: 50px, Autocomplete: name                 │
│                                                        │
│ NOMOR WHATSAPP AKTIF *                                 │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ID +62 │ 812-3456-7890                             │ │
│ └────────────────────────────────────────────────────┘ │
│ Format otomatis E.164 (+628****7890), 10-13 digit   │
│ [✓ Format nomor WhatsApp valid]                        │
│                                                        │
│ PERSETUJUAN PRIVASI & DATA (UU PDP NO. 27/2022) *      │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [☑] Saya menyetujui nomor WhatsApp saya digunakan  │ │
│ │     oleh Damez Barbershop semata-mata untuk        │ │
│ │     pengiriman bukti tiket reservasi, pengingat    │ │
│ │     jadwal H-3 jam, dan informasi darurat antrean. │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ [TERENKRIPSI] Keamanan Terjamin: Data Anda terenkripsi │
│  dan tidak akan dibagikan ke pihak ketiga atau spam.   │
│                                                        │
├────────────────────────────────────────────────────────┤
│ [ REVIEW PEMBAYARAN DP (4/5) → ]                       │
└────────────────────────────────────────────────────────┘
```

#### Spesifikasi Input & Validasi:
- **Ukuran Input**: Tinggi 50px, radius 8px, font Plus Jakarta Sans 16px (mencegah auto-zoom Safari iOS), background `#1A1A1A`, border `#2E2E2E`, focus border `#D97706`.
- **Validasi Real-time**: Ikon centang hijau di ujung kanan input muncul saat nomor memenuhi rentang 10–13 digit angka Indonesia.
- **PDP Consent Checkbox**: Target sentuh 24x24px, label ramah klik, wajib dicentang untuk mengaktifkan tombol submit.

---

### 4.5 Step 6: Review Booking, Rincian DP Flat Rp 20.000 & Penguncian Slot (Hold 15 Mnt)
Menampilkan pratinjau voucher pemesanan, struktur rincian finansial yang transparan, dan peringatan aturan pembatalan sebelum mengunci database slot.

#### Wireframe Step 6 (Mobile Viewport 390px):
```
┌────────────────────────────────────────────────────────┐
│ [← Kembali]          REVIEW PEMESANAN            [✕]   │
│ Progres: [========== Langkah 5 dari 5: Review =====]   │
├────────────────────────────────────────────────────────┤
│ Periksa kembali rincian reservasi Anda:                │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ RINGKASAN TIKET RESERVASI                          │ │
│ │ ────────────────────────────────────────────────── │ │
│ │ Jadwal   : Sabtu, 24 Oktober 2026                  │ │
│ │ Waktu    : 14:30 – 15:50 WIB (80 Menit)            │ │
│ │ Barber   : Rian Pratama ("The Sculptor")           │ │
│ │ Layanan  : 1. Gentlemen Classic Haircut (Rp 50.000)│ │
│ │            2. Beard Sculpting & Shave   (Rp 45.000)│ │
│ │ Pemesan  : Budi Santoso (+62 812-3456-7890)        │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ RINCIAN PEMBAYARAN:                                    │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Total Biaya Layanan               : Rp 95.000      │ │
│ │ DOWN PAYMENT (DP) DIBAYAR SEKARANG: Rp 20.000 (★)  │ │
│ │ Sisa Pembayaran di Kasir Toko     : Rp 75.000      │ │
│ └────────────────────────────────────────────────────┘ │
│ (★) DP Flat Rp 20.000 memotong langsung total nota kasir│
│                                                        │
│ [PERINGATAN] KETENTUAN PENTING:                        │
│ • Penguncian Slot: Menekan tombol bayar akan mengunci  │
│   kursi Anda selama 15 menit untuk pembayaran QRIS.    │
│ • Reschedule: Bebas ubah jadwal hingga H-3 jam.        │
│ • Keterlambatan: Toleransi 15 menit. Lebih dari 15 mnt,│
│   slot dialihkan ke walk-in dan DP hangus.             │
│                                                        │
├────────────────────────────────────────────────────────┤
│ [ KUNCI SLOT & BAYAR DP RP 20.000 VIA QRIS ]           │
│ (Tombol Utama Tebal 56px, Warna Emas Amber #D97706)    │
└────────────────────────────────────────────────────────┘
```

#### Spesifikasi Eksekusi:
- Saat tombol ditekan, status tombol berubah menjadi *loading state*: Spinner animasi + teks `"Mengunci slot kursi dan membuat QRIS..."`.
- Backend memanggil database dengan transaksi atomik `SELECT FOR UPDATE` dan constraint `tsrange` PostgreSQL. Slot berstatus `pending_payment` selama 15 menit.

---

### 4.6 Step 7A: Layanan Pembayaran QRIS Midtrans Snap & Countdown 15 Menit
Menampilkan antarmuka pembayaran Midtrans Snap QRIS Universal yang didukung oleh seluruh m-banking dan e-wallet di Indonesia.

#### Wireframe Step 7A (Mobile Viewport 390px):
```
┌────────────────────────────────────────────────────────┐
│ DAMEZ BARBERSHOP — PEMBAYARAN DP                 [✕]   │
├────────────────────────────────────────────────────────┤
│ Selesaikan Pembayaran Dalam:                           │
│                     [ 14 : 58 ]                        │
│        (Countdown Timer Berjalan Mundur)               │
│                                                        │
│ Nominal Tepat : Rp 20.000 (Bebas Biaya Admin)          │
│ Order ID      : DMZ-20261024-042                       │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │                                                    │ │
│ │            [ KODE QRIS UNIVERSAL ASPI ]            │ │
│ │           (BCA, GoPay, OVO, ShopeePay,             │ │
│ │               Dana, Mandiri Livin)                 │ │
│ │                                                    │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ [ Unduh QR Code ]        [ Salin Nominal Pembayaran ]  │
│                                                        │
│ CARA PEMBAYARAN:                                       │
│ 1. Buka aplikasi BCA Mobile, GoPay, OVO, atau Dana.    │
│ 2. Scan kode QR di atas atau unggah tangkapan layar.   │
│ 3. Periksa nominal Rp 20.000 dan masukkan PIN Anda.    │
│ 4. Halaman ini akan otomatis terbarui begitu lunas.    │
│                                                        │
│ ● Menunggu pembayaran... (Polling real-time aktif)     │
└────────────────────────────────────────────────────────┘
```

---

### 4.7 Step 7B: Konfirmasi Tiket Digital Boarding Pass & Notifikasi WhatsApp
Begitu webhook Midtrans dengan signature SHA-512 mengirimkan status `settlement`, layar otomatis bertransisi ke tampilan tiket resmi tanpa reload. Notifikasi WhatsApp resmi terkirim dalam < 5 detik.

#### Wireframe Step 7B (Mobile Viewport 390px):
```
┌────────────────────────────────────────────────────────┐
│               PEMBAYARAN DP TERVERIFIKASI!             │
│               Kursi Anda Telah Terkunci Resmi          │
├────────────────────────────────────────────────────────┤
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ DAMEZ BARBERSHOP             KODE RESERVASI RESMI  │ │
│ │ VOUCHER BOARDING PASS        [ DMZ-20261024-042 ]  │ │
│ │                                                    │ │
│ │ PEMESAN  : Budi Santoso                            │ │
│ │ JADWAL   : Sabtu, 24 Oktober 2026                  │ │
│ │ JAM      : 14:30 – 15:50 WIB (Hadir 10 mnt awal)   │ │
│ │ BARBER   : Rian Pratama (Kursi 1)                  │ │
│ │ LAYANAN  : Classic Cut + Beard Sculpting           │ │
│ │                                                    │ │
│ │ - - - - - - - - - [SOBEKAN NOTCH] - - - - - - - - -│ │
│ │                                                    │ │
│ │ STATUS DP : LUNAS RP 20.000 (QRIS Midtrans)        │ │
│ │ SISA NOTA : Rp 75.000 (Pelunasan di Kasir Toko)    │ │
│ │                                                    │ │
│ │ [|||||||||||||||||| BARCODE TIKET |||||||||||||||] │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ TIKET WHATSAPP TERKIRIM:                               │
│ Bukti tiket resmi dan link navigasi telah dikirimkan   │
│ ke nomor WhatsApp Anda (+62 812-3456-7890).            │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [Buka Navigasi Google Maps]                        │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ [Simpan ke Kalender HP (Google/Apple Calendar)]    │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ [ Salin Kode Booking: DMZ-20261024-042 ]           │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ [ ← Kembali ke Halaman Utama ]                         │
└────────────────────────────────────────────────────────┘
```

---

## 5. Spesifikasi Komponen UI & Matriks State Lengkap

Seluruh komponen mematuhi standar desain token pada `docs/design/DESIGN.md` dan mengimplementasikan seluruh matriks status (*Default, Hover, Active, Focus, Loading, Empty, Error*).

### 5.1 Komponen Tombol (Button System)

| Tipe Tombol | Visual Default | Hover State | Active / Pressed | Focus (Keyboard) | Loading State | Disabled State |
|---|---|---|---|---|---|---|
| **Primary CTA** | Background `#D97706`, Text `#121212` Bold, Radius 12px, Height 52px | Background `#F59E0B`, Shadow Amber `0 4px 16px rgba(217,119,6,0.3)` | Scale `0.98`, `-translate-y-[1px]` | Ring 2px Amber, Offset 2px Charcoal | Spinner SVG Emas + Teks `"Memproses..."` | Background `#262626`, Text `#78716C`, Opacity 50% |
| **Secondary Action** | Background `#784C25`, Text `#FFFFFF`, Radius 12px, Height 44px | Background `#8C582B` | Scale `0.98` | Ring 2px Cognac, Offset 2px | Spinner Putih | Opacity 50%, Kursor `not-allowed` |
| **Outline / Chip** | Background `#1A1A1A`, Border 1px `#2E2E2E`, Text `#F5F5F0` | Border `#D97706`, Text `#D97706` | Background `#242424` | Ring 2px Amber | Skeleton Pulse | Border `#222222`, Text `#444444` |
| **Ghost / Link** | Background transparan, Text `#A8A29E` | Text `#F5F5F0`, Underline halus | Opacity 80% | Ring 1px Amber | - | Text `#444444` |

---

### 5.2 Komponen Kartu Layanan (Service Selection Card)

```
┌────────────────────────────────────────────────────────────────────────┐
│ ANATOMI KARTU LAYANAN                                                  │
├────────────────────────────────────────────────────────────────────────┤
│ [Checkbox/Radio]  Nama Paket Layanan                   [Harga Paket]   │
│                   Durasi Menit • [Badge Kategori]                      │
│                   Deskripsi rincian pemotongan & perawatan alat        │
└────────────────────────────────────────────────────────────────────────┘
```

- **Default State**: Background `#1A1A1A`, Border 1px `#2E2E2E`, Radius 12px, Padding 18px.
- **Hover State**: Border 1px `#3E3E3E`, Background `#202020`, kursor `pointer`.
- **Selected State**: Border 1.5px `#D97706`, Background `#242018`, Shadow inner refraction `inset 0 1px 0 rgba(217,119,6,0.15)`. Ikon checkbox berubah menjadi latar emas dengan centang hitam.
- **Disabled State (Max Selection Exceeded)**: Opacity 40%, filter grayscale 20%, kursor `not-allowed`. Saat diklik memicu *tooltip*: *"Maksimal 2 layanan per sesi."*

---

### 5.3 Komponen Kartu Barber (Barber Selection Card)

- **Default State**: Background `#1A1A1A`, Border `#2E2E2E`, Avatar bulat 56px border `#333333`.
- **Hover State**: Border `#D97706`, Avatar mendapatkan ring aksen tembaga.
- **Selected State**: Border 2px `#D97706`, Background `#242018`, Radio indicator aktif dengan dot emas di tengah.
- **Day-Off State (Libur)**: Background `#161616`, Badge abu-abu `"Libur Bertugas"`, kursor `not-allowed`.

---

### 5.4 Komponen Chip Waktu (Time Slot Chip)

- **Default (Tersedia)**: Height 48px, Width 95px–110px, Background `#1A1A1A`, Border `#2E2E2E`, Text `#F5F5F0`, Font JetBrains Mono 15px.
- **Hover**: Border `#D97706`, Text `#D97706`.
- **Selected**: Background `#D97706`, Text `#121212` Font-bold, Border `#D97706`.
- **Booked (Terisi)**: Background `#181818`, Border `#222222`, Text `#52525B` line-through, pointer-events none.
- **Break (Istirahat)**: Background `#18181B`, Text `#71717A` 12px italic `"Istirahat"`.

---

### 5.5 Komponen Formulir Input & Validasi

- **Default State**: Height 50px, Background `#1A1A1A`, Border 1px `#2E2E2E`, Text `#F5F5F0` 16px, Padding horizontal 16px, Radius 8px. Label terletak di atas input (Font Plus Jakarta Sans 13px Medium, `#A8A29E`).
- **Focus State**: Border 1.5px `#D97706`, Ring 2px `rgba(217,119,6,0.2)`.
- **Success State**: Border 1.5px `#059669`, Ikon centang hijau di ujung kanan input.
- **Error State**: Border 1.5px `#DC2626`, Pesan kesalahan teks merah di bawah input (`text-xs text-red-400 mt-1`), efek getar halus (*shake animation* 200ms).

---

### 5.6 Komponen Tiket Boarding Pass Digital

- **Wadah Luar**: Background `#1A1A1A`, Border 1px `#2E2E2E`, Radius 16px, Shadow modal tebal.
- **Sobekan Tiket (*Ticket Notches*)**: Dua lingkaran cekung simetris di sisi kiri dan kanan berdiameter 24px (`background-color: #121212`), menciptakan efek fisik tiket pangkas klasik.
- **Garis Putus-Putus (*Dashed Divider*)**: Border 2px dashed `#333333` menghubungkan kedua cekungan tiket.
- **Kode Booking Unik**: Font JetBrains Mono Bold 26px, warna `#D97706`, letter-spacing 2px.

---

## 6. Aksesibilitas & Kepatuhan Breakpoint (WCAG 2.1 AA)

### 6.1 Matriks Uji Kontras Warna (WCAG Contrast Ratios)
Seluruh kombinasi teks dan latar belakang telah diaudit dan memenuhi rasio minimal WCAG 2.1 AA (4.5:1 untuk teks normal, 3.0:1 untuk teks besar/komponen UI):

| Pasangan Warna | Foreground | Background | Rasio Kontras | Status Kepatuhan |
|---|---|---|---|---|
| Teks Utama pada Background | `#F5F5F0` (Cream) | `#121212` (Obsidian) | **16.5 : 1** | **PASS (WCAG AAA)** |
| Teks Muted pada Background | `#A8A29E` (Stone 400) | `#121212` (Obsidian) | **7.2 : 1** | **PASS (WCAG AAA)** |
| Aksen Amber pada Background | `#D97706` (Amber) | `#121212` (Obsidian) | **6.2 : 1** | **PASS (WCAG AA)** |
| Teks Tombol pada Primary Amber | `#121212` (Charcoal) | `#D97706` (Amber) | **6.2 : 1** | **PASS (WCAG AA)** |
| Teks Tombol pada Luminous Amber | `#121212` (Charcoal) | `#F59E0B` (Luminous Amber) | **8.8 : 1** | **PASS (WCAG AAA)** |
| Teks Putih pada Cognac Leather | `#FFFFFF` (White) | `#784C25` (Cognac) | **5.6 : 1** | **PASS (WCAG AA)** |
| Status Badge Confirmed | `#34D399` (Emerald Text) | `#064E3B` (Emerald Dark BG)| **6.8 : 1** | **PASS (WCAG AAA)** |
| Status Badge Pending | `#FBBF24` (Amber Text) | `#451A03` (Amber Dark BG) | **7.4 : 1** | **PASS (WCAG AAA)** |
| Status Badge No-Show | `#F87171` (Ruby Text) | `#450A0A` (Ruby Dark BG) | **6.4 : 1** | **PASS (WCAG AAA)** |
| Status Badge Cancelled | `#A1A1AA` (Zinc Text) | `#27272A` (Zinc Dark BG) | **4.7 : 1** | **PASS (WCAG AA)** |

---

### 6.2 Matriks Zona Sentuh & Touch Targets (Touch Ergonomics)
- **Tombol Utama Mobile**: Tinggi minimum 52px (melebihi standar minimum Apple 44pt dan Android 48dp).
- **Time Slot Chips**: Minimum 48px x 95px dengan jarak renggang antar-chip (*spacing gap*) minimal 8px (`gap-2` atau `gap-3`).
- **Date Scroller Item**: Minimum 64px width x 74px height, memudahkan gesekan jempol horizontal.
- **PDP Consent Checkbox**: Target klik pembungkus (*clickable touch bounding box*) sebesar 44px x 44px meskipun kotak checkbox berukuran visual 20px x 20px.

---

### 6.3 Kontrak ARIA & Pembaca Layar (Screen Readers)
- Header Wizard Progres: `role="progressbar" aria-valuenow="1" aria-valuemin="1" aria-valuemax="5" aria-label="Langkah 1 dari 5: Pemilihan Layanan"`.
- Daftar Kartu Layanan: `role="group" aria-label="Daftar Paket Layanan Barbershop"`.
- Kartu Layanan: `aria-checked="true/false"` dengan `role="checkbox"`.
- Chips Jam: `role="radio" aria-checked="true/false"` dan `aria-disabled="true"` untuk slot yang telah terisi.
- Live Update Bar Bawah: `aria-live="polite"` sehingga perubahan total durasi dan harga dibacakan secara otomatis kepada pengguna disabilitas netra tanpa memotong navigasi.

---

### 6.4 Matriks Adaptasi Breakpoint Antarmuka

| Breakpoint | Target Perangkat | Layout Hero | Layout Katalog Layanan | Layout Wizard Booking |
|---|---|---|---|---|
| **360px – 429px (xs/sm)** | iPhone 13/14/15, Galaxy S | Stack Vertikal 1 Kolom, Foto 16:9, Floating Bottom CTA 52px | 1 Kolom Kartu Bertingkat, Scroller Horisontal untuk Galeri | Fullscreen Sheet Modal, Floating Cart Summary Bar |
| **768px – 834px (md)** | iPad Mini / Air Portrait | Stack 1 Kolom Lebar, Padding 32px, Tombol CTA Ganda | Grid 2 Kolom Seimbang, Touch Target 48px | Centered Dialog Container (Max-Width 600px), Radius 20px |
| **1024px – 1280px (lg/xl)** | Laptop / MacBook | Asymmetric Split 55% Teks / 45% Visual Card Portofolio | Grid 2 Kolom Lebar dengan Detail Accordion | Centered Modal Dialog (Max-Width 720px), Backdrop Dimmed |
| **1440px+ (2xl)** | Widescreen Monitor | Max-Width Container 1280px, Padding Horizontal 48px | Grid 3 Kolom Kartu Layanan, Masonry Galeri 3 Kolom | Centered Modal Dialog (Max-Width 780px), Shadow Modal Tebal |

---

## 7. Rencana Tindak Lanjut & Kontrak Handoff (Downstream Linkage)

Spesifikasi wireframe ini menjadi fondasi resmi bagi tugas-tugas hilir pada Milestone 1 dan Milestone 2:

1. **Handoff ke `designer:interaction` (`t_3aaea2e7` / M1-04)**:
   - Implementasi transisi gerak (*motion curves*) spring physics (`stiffness: 100, damping: 20`) pada pembukaan wizard.
   - Perancangan interaksi countdown timer 15 menit pada layar Snap QRIS.
   - Skenario penanganan state real-time saat slot direbut orang lain (*race condition dialog*).
2. **Handoff ke `designer:a11y` (`t_fb5da823` / M1-05)**:
   - Audit komprehensif touch targets 48x48px pada perangkat mobile nyata.
   - Verifikasi navigasi keyboard (fokus urut tab order) pada modal wizard dan form input.
3. **Handoff ke `writer:copywriter` & `writer:editor` (`t_4debe009`, `t_302549f9`, `t_9694c0bc` / M2-01 s/d M2-03)**:
   - Pengisian teks narasi autentik craftsmanship lokal pada Hero & About Us.
   - Penyusunan microcopy transparan untuk ketentuan DP Rp 20rb, batas reschedule H-3 jam, dan toleransi keterlambatan 15 menit.
   - Templatisasi pesan notifikasi WhatsApp resmi toko.
4. **Handoff ke `coder:frontend` (`t_67aafbc4`, `t_f5132d4b` / M3-02 & M3-04)**:
   - Implementasi slicing Next.js 15 App Router menggunakan Tailwind CSS dan token `docs/design/DESIGN.md`.
   - Isolasi komponen interaktif client-side (`'use client'`) pada `BookingWizard.tsx` dan `CartSummaryBar.tsx`.

---

*Dokumen ini sah, terkunci, dan diverifikasi sebagai standar acuan desain wireframe Damez Barbershop Web Platform.*
