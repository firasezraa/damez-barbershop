# Spesifikasi Arsitektur Layout & Interaksi Motion Navbar (Milestone 10)

> **Dokumen**: Spesifikasi Desain Layout 3-Column Split & Motion Drawer Mobile  
> **Divisi**: UI/UX & Interaction Design (`designer:interaction` & `designer:design-system`)  
> **Milestone**: M10 - Navbar Refinement  
> **Status**: **FINAL APPROVED SPECIFICATION**

---

## 1. Latar Belakang & Masalah Desain Sebelumnya

Pada implementasi navbar sebelumnya:
1. **Desktop**: Elemen navigasi terkesan padat dan tidak memiliki pembagian 3 pilar yang simetris, dengan label navigasi majemuk ("Ketentuan & FAQ", "Kisah Kami") yang menyita lebar pandang.
2. **Mobile/Tablet**: Komponen `LiveStatusBadge` diletakkan sejajar di header atas berdampingan dengan tombol hamburger. Pada viewport smartphone sempit (360px - 390px), hal ini menyebabkan judul "DAMEZ BARBERSHOP" terhimpit dan tata letak terkesan sesak.
3. **Drawer Menu**: Menu mobile sebelumnya menggunakan transisi kondisional standar tanpa koreografi motion yang halus.

---

## 2. Arsitektur Layout 3-Column Split (Desktop Viewport >= 1024px)

Navbar desktop diorganisasikan menjadi 3 kolom terisolasi dengan grid/flexbox terstruktur:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [KOLOM 1: BRAND LOGO]     │     [KOLOM 2: NAV PILL ISLAND]     │  [KOLOM 3: ACTIONS]   │
│                                                                                        │
│ ✂️ DAMEZ BARBERSHOP       │  ( Layanan · Barber · Cerita ·     │  🟢 Buka Sekarang     │
│    Senopati, Jaksel       │    Galeri · Lokasi · FAQ )         │  [ Booking Jadwal ]   │
│ (~260px, shrink-0, left)  │  (~440px, centered capsule island) │  (~260px, shrink-0)   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Kolom 1 (Kiri): Brand Identification & Heritage
- **Lebar**: `w-[260px]` / `shrink-0` rata kiri.
- **Icon Mark**: Rounded square `bg-surface/90 border border-primary/30` memuat `IconScissors` miring 45 derajat dengan hover glow amber.
- **Tipografi**:
  - Judul: `font-display tracking-wider text-base sm:text-lg font-bold text-foreground`.
  - Sub-label: `text-[11px] text-muted-foreground` bertuliskan "Senopati, Jakarta Selatan (Est. 2024)".

### 2.2 Kolom 2 (Tengah): Centered Navigation Island Capsule
- **Lebar**: Auto / Centered Capsule `mx-auto`.
- **Styling**: `rounded-full border border-border/60 bg-surface/40 backdrop-blur-md px-2 py-1.5 shadow-xs`.
- **Daftar Menu Ringkas**:
  1. `Layanan` ➔ `#layanan`
  2. `Barber` ➔ `#barber`
  3. `Cerita` ➔ `#kisah-kami` (disederhanakan dari "Kisah Kami")
  4. `Galeri` ➔ `#galeri`
  5. `Lokasi` ➔ `#lokasi`
  6. `FAQ` ➔ `#faq` (disederhanakan dari "Ketentuan & FAQ")
- **Hover Micro-interaction**: `hover:bg-surface-elevated hover:text-foreground hover:shadow-xs` dengan kurva transisi cepat 150ms.

### 2.3 Kolom 3 (Kanan): Action Cluster & Live Status
- **Lebar**: `w-[260px]` / `shrink-0` rata kanan (`justify-end`).
- **Elemen**:
  - `LiveStatusBadge` terpasang rapi dengan dot pulse hijau/merah.
  - Button "Booking Jadwal" beraksen amber glow (`shadow-md shadow-primary/20`).

---

## 3. Arsitektur Header Mobile & Drawer Motion (Viewport < 1024px)

### 3.1 Header Atas Bersih & Lapang (Decluttered Top Bar)
- **Kiri**: Logo DAMEZ BARBERSHOP dan Icon Gunting tanpa desak-desakan.
- **Kanan**: **Hanya Tombol Menu Hamburger / Close** (`size-11 rounded-xl border border-border bg-surface`).
- **LiveStatusBadge**: **Dihilangkan dari bar atas mobile** dan dipindahkan secara eksklusif ke bagian paling atas mobile drawer.

### 3.2 Koreografi Gerak Drawer dengan `motion/react`
- **Komponen Wrapper**: `<AnimatePresence>` dan `<motion.div>`.
- **Transisi Dropdown**:
  ```typescript
  initial={{ opacity: 0, y: -16, scale: 0.98 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: -12, scale: 0.98 }}
  transition={{
    type: "spring",
    stiffness: 320,
    damping: 28,
    mass: 0.8
  }}
  ```
- **Backdrop Blur**: `bg-background/95 backdrop-blur-xl border-b border-border shadow-2xl`.

### 3.3 Struktur Isi Drawer Mobile
1. **Kartu Status Operasional (Header Drawer)**:
   - Box `rounded-xl border border-border/60 bg-surface/60 p-3` memuat `LiveStatusBadge showDescription` lengkap dengan jam buka toko.
2. **List Navigasi Vertikal**:
   - 6 tautan menu dengan tinggi sentuh minimal 48px (`min-h-[48px]`), rounded-xl, dan `IconChevronRight` yang bergeser halus saat ditekan.
3. **CTA Booking & Jam Buka**:
   - Tombol full-width `Booking Jadwal Sekarang` (`size="lg"`).
   - Teks alamat dan jam operasional di bawah tombol.

---

## 4. Aksesibilitas & Keyboard Ergonomics (WCAG 2.1 AA)

- **Escape Key Listener**: Menekan tombol `Escape` seketika menutup drawer.
- **Body Scroll Lock**: Saat drawer mobile terbuka, scroll pada background dinonaktifkan (`overflow: hidden`) untuk mencegah disorientasi visual.
- **Resize Auto-Close**: Jika pengguna melebarkan layar browser hingga `>= 1024px`, drawer mobile otomatis menutup secara elegan.
- **ARIA Compliance**: Atribut `aria-expanded`, `aria-label`, dan `aria-controls` terkonfigurasi dengan benar untuk pembaca layar (screen reader).
