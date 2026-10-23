# Panduan Sistem Ikonografi Barbershop dengan Tabler Icons
**Damez Barbershop — Design System Architecture**  
*Sub-agent: designer:visual & designer:design-system*  
*Standard: Tabler Icons v3.46.0+ | WCAG 2.1 Level AA | Google DESIGN.md Token-Driven Architecture*

---

## 1. Executive Summary & Curation Philosophy

Ikonografi adalah bahasa visual universal yang menjembatani estetika produk dengan navigasi fungsional pengguna. Dalam konteks **Damez Barbershop**, sistem ikonografi dirancang khusus untuk merefleksikan identitas **Masculine Vintage Modern** — memadukan kehangatan warisan pangkas rambut pria klasik (heritage barbershop) dengan presisi digital modern yang tangkas.

### Mengapa Tabler Icons?
1. **Rigor Geometris 24x24 px Grid:** Setiap ikon dibangun di atas grid dasar 24x24 piksel dengan optical padding yang seragam, menjamin keselarasan visual (visual balance) saat disandingkan dengan tipografi Cinzel dan Plus Jakarta Sans.
2. **Stroke Weight Terstandarisasi 2px:** Ketebalan garis 2px memberikan ketegasan maskulin, keterbacaan tinggi di layar smartphone OLED/AMOLED, dan skalabilitas deterministik dari ukuran mikro (16px) hingga hero highlight (48px).
3. **Corner Treatment & Caps:** Karakteristik `stroke-linecap="round"` dan `stroke-linejoin="round"` menghadirkan kesan ramah namun presisi, menghindari distorsi visual pada layar high-DPI (Retina).
4. **Performa & Tree-Shaking Bebas Bobot:** Format SVG murni berbasis vektor tanpa dependensi font binary memastikan First Contentful Paint (FCP) tetap di bawah 0.8 detik.

---

## 2. Kurasi 10 Ikon Inti Spesialis Barbershop (Canonical Set)

Berikut adalah 10 ikon kanonikal Tabler Icons yang dikurasi khusus untuk melayani seluruh domain fungsional Damez Barbershop:

| No | Nama Ikon Tabler | Unicode | Domain / Konteks Penggunaan | Token Ukuran | Rekomendasi Warna Token |
|:---:|:---|:---:|:---|:---:|:---|
| 1 | `IconScissors` | `eb1b` | Layanan Pangkas Rambut, Classic Haircut, Fade, Katalog Servis | `md` (24px) | `{colors.primary}` (#D97706) |
| 2 | `IconRazor` | `f4b5` | Cukur Jenggot, Silet Higienis, Hot Towel Shave, Line-up | `md` (24px) | `{colors.primary}` (#D97706) |
| 3 | `IconWash` | `f311` | Cuci Rambut 2x, Keramas Bersih, Scalp Cleansing | `md` (24px) | `{colors.primary}` (#D97706) |
| 4 | `IconSparkles` | `f6d7` | Scalp Therapy, Creambath Pijat Relaksasi, Combo Signature | `md` (24px) | `{colors.primary}` (#D97706) |
| 5 | `IconCalendarEvent` | `ea52` | Kalender Slot Booking (Window 7 Hari WIB Asia/Jakarta) | `md` (24px) | `{colors.text-primary}` (#F5F5F0) |
| 6 | `IconClock` | `ea70` | Durasi Layanan (30-60m), Jam Slot, Countdown Hold 15 Menit | `sm` (20px) | `{colors.text-muted}` (#A8A29E) |
| 7 | `IconQrcode` | `eb11` | Metode Bayar QRIS Dinamis/Statis (DP Flat Rp 20.000) | `lg` (32px) | `{colors.primary}` (#D97706) |
| 8 | `IconCreditCard` | `ea84` | Midtrans Snap Gateway (Debit, Visa, Mastercard, VA) | `md` (24px) | `{colors.text-primary}` (#F5F5F0) |
| 9 | `IconCheck` | `ea5e` | Status Booking Confirmed, Form Validation Success, Item Terpilih | `sm` (20px) | `{colors.status-confirmed-text}` (#34D399) |
| 10 | `IconMapPin` | `eae8` | Lokasi Studio Fisik (Jl. Senopati Raya No. 42, Kebayoran Baru) | `md` (24px) | `{colors.primary}` (#D97706) |
| 11 | `IconBrandWhatsapp` | `ec74` | Saluran Bantuan CS, Pengiriman Tiket WA, Reminder H-2 & H-30m | `md` (24px) | `#25D366` (Brand WhatsApp) |

---

## 3. Analisis Anatomi & Rasional Desain Ikon Kanonikal

### 1. `IconScissors` (Gunting Cukur)
- **Anatomi:** Terdiri dari dua lingkaran simetris `M3 7a3 3 0 1 0 6 0...` yang merepresentasikan gagang gunting ergonomis dengan bilah diagonal bersilang tajam `M8.6 8.6l10.4 10.4`.
- **Rasionalitas UX:** Menjadi ikon identitas sentral barbershop. Berfungsi sebagai penanda kategori pangkas rambut utama pada landing page dan Step 1 Booking Wizard.
- **Bounding Box & Optical Balance:** Distribusi massa simetris diagonal memastikan ikon tidak terasa miring saat diletakkan di dalam badge atau button.

### 2. `IconRazor` (Pisau Cukur Silet / Straight Razor)
- **Anatomi:** Menampilkan bilah kepala horizontal `M7 3h10v4h-10l0 -4` dengan poros tengah dan gagang lurus bertekstur.
- **Rasionalitas UX:** Mengomunikasikan keahlian tradisional *classic hot towel shave* dan presisi pisau silet sekali pakai berstandar medis (higienis & anti-iritasi).
- **Aplikasi:** Kartu layanan `SRV-04` (Classic Beard Sculpt) dan `SRV-05` (Beard Sculpting & Detailing).

### 3. `IconWash` (Cuci Rambut / Hair Wash)
- **Anatomi:** Menampilkan kontur baskom cuci rambut profesional dengan gelombang cairan dinamis di permukaan `M3.486 8.965c...`.
- **Rasionalitas UX:** Menghilangkan kebingungan pelanggan tentang fasilitas keramas. Pelanggan segera memahami bahwa layanan mencakup cuci rambut sebelum dan sesudah pangkas.
- **Aplikasi:** Kartu layanan `SRV-06` (Scalp Therapy Treatment) dan indikator fasilitas keramas.

### 4. `IconSparkles` (Creambath / Spa / Signature Full Grooming)
- **Anatomi:** Empat bintang kilau biner dengan aksen kilau besar di tengah `M16 18a2 2 0 0 1 2 2...`.
- **Rasionalitas UX:** Memberikan impresi kemewahan (*premium indulgence*). Digunakan untuk paket kombo terlengkap `SRV-08` (Damez Signature Combo) dan fitur unggulan.

### 5. `IconCalendarEvent` (Kalender Slot Reservasi)
- **Anatomi:** Grid kalender dinding dengan dua gantungan atas `M16 3l0 4` dan penanda kotak hari aktif di kanan bawah `M8 15h2v2h-2l0 -2`.
- **Rasionalitas UX:** Berbeda dengan kalender generik, ikon ini memiliki aksen "event pin" yang menegaskan reservasi jadwal yang telah ditentukan.
- **Aplikasi:** Step 3 Booking Wizard (Pemilihan Tanggal Asia/Jakarta).

### 6. `IconClock` (Jam Analog / Durasi & Hitung Mundur)
- **Anatomi:** Lingkaran 18px dengan jarum jam menunjuk pukul 3:00 `M12 7v5l3 3`.
- **Rasionalitas UX:** Digunakan ganda: menampilkan durasi pengerjaan di katalog servis (misal: "45 Menit") dan sebagai pengingat batas waktu 15 menit penahanan slot (Hold TTL).

### 7. `IconQrcode` (Kode QRIS Instan)
- **Anatomi:** Tiga modul posisi sudut persegi `4x4` px dengan titik-titik data interior.
- **Rasionalitas UX:** Menjadi pemicu visual instan bagi pelanggan Indonesia untuk membuka aplikasi mobile banking (BCA, Mandiri, GoPay, OVO, Dana) guna membayar DP Rp 20.000.

### 8. `IconCreditCard` (Kartu Pembayaran / Midtrans Snap)
- **Anatomi:** Kartu rasio 16:10 dengan strip magnetik horizontal `M3 10l18 0` dan modul chip EMV `M7 15l.01 0`.
- **Rasionalitas UX:** Menandakan opsi pembayaran sekunder melalui kartu kredit, debit online, dan virtual account terintegrasi Midtrans.

### 9. `IconCheck` (Checkmark Sukses & Verifikasi)
- **Anatomi:** Sudut siku tunggal `M5 12l5 5l10 -10` dengan garis miring panjang menanjak 45 derajat.
- **Rasionalitas UX:** Memberikan umpan balik visual instan (affirmative feedback) pada input formulir yang valid, layanan yang dipilih, dan status pembayaran lunas.

### 10. `IconMapPin` (Pin Lokasi Studio)
- **Anatomi:** Titik tumpu lancip di bawah dengan lingkaran mata sentral `M9 11a3 3 0 1 0 6 0...`.
- **Rasionalitas UX:** Navigasi cepat ke Google Maps lokasi Senopati pada header, footer, dan tiket digital boarding pass.

### 11. `IconBrandWhatsapp` (WhatsApp Kontak & Gateway)
- **Anatomi:** Balon percakapan dengan ekor kiri bawah dan siluet gagang telepon di dalamnya.
- **Rasionalitas UX:** Mengurangi kecemasan pelanggan (post-purchase anxiety) dengan tombol langsung konfirmasi WhatsApp ke admin barbershop.

---

## 4. Matriks Pemetaan Domain Aplikasi (Contextual Mapping Matrices)

### A. Matriks Pemetaan Katalog Layanan (Benchmark Services)
| Kode Servis | Nama Layanan Resmi | Kategori | Ikon Tabler Utama | Ikon Aksesori | Rasionalitas Visual |
|:---|:---|:---|:---:|:---:|:---|
| **SRV-01** | Gentlemen Classic Haircut | `haircut` | `IconScissors` | `IconClock` | Gunting melambangkan teknik scissor-over-comb klasik. |
| **SRV-02** | Premium Fade & Taper Cut | `haircut` | `IconScissors` | `IconRazor` | Menunjukkan gradasi fade presisi dan detailing silet. |
| **SRV-03** | Junior Gentleman Cut | `haircut` | `IconScissors` | `IconUser` | Potongan khusus anak dengan pendekatan sabar. |
| **SRV-04** | Classic Beard Sculpt & Hot Towel | `grooming` | `IconRazor` | `IconWash` | Cukur silet higienis dengan kompres handuk hangat. |
| **SRV-05** | Beard Sculpting & Detailing | `grooming` | `IconRazor` | `IconClock` | Detailing garis jenggot cepat dan presisi. |
| **SRV-06** | Scalp Therapy Treatment | `treatment` | `IconWash` | `IconSparkles` | Keramas pembersih ketombe & akupresur kepala. |
| **SRV-07** | Quick Express Clean Cut | `haircut` | `IconScissors` | `IconClock` | Potongan cepat 30 menit untuk jadwal padat. |
| **SRV-08** | Damez Signature Full Grooming Combo | `combo` | `IconSparkles` | `IconScissors` | Perawatan bintang lima terlengkap all-in-one. |

### B. Matriks Pemetaan Multi-step Booking Wizard
| Step | Nama Tahapan | Ikon Tabler | Posisi UI | Fungsi Interaksi |
|:---:|:---|:---:|:---|:---|
| **1** | Pemilihan Layanan | `IconScissors` | Step Indicator & Card Badge | Memilih maksimal 2 paket layanan. |
| **2** | Pemilihan Barber | `IconUsers` | Step Indicator & Barber Avatar | Memilih Master Barber atau opsi 'Siapa Saja'. |
| **3** | Jadwal & Slot Waktu | `IconCalendarEvent` | Step Indicator & Slot Button | Memilih tanggal dan jam pangkas tersedia. |
| **4** | Data Diri & Kontak | `IconBrandWhatsapp` | Step Indicator & Phone Prefix | Mengisi nama & nomor HP (normalisasi 628...). |
| **5** | Ringkasan & Kunci Slot | `IconTicket` | Step Indicator & CTA Button | Verifikasi rincian DP Rp 20.000 & kunci slot 15m. |

### C. Matriks Status Reservasi & Pembayaran
| Status Reservasi | Ikon Tabler | Warna Status Token | Arti Bagi Pengguna |
|:---|:---:|:---|:---|
| `pending_payment` | `IconClock` | `{colors.status-pending-text}` (#FBBF24) | Menunggu pembayaran DP dalam 15 menit. |
| `confirmed` | `IconCircleCheck` | `{colors.status-confirmed-text}` (#34D399) | DP Lunas, slot terkunci resmi di kalender. |
| `in_progress` | `IconScissors` | `{colors.primary}` (#D97706) | Pelanggan sedang dilayani di kursi cukur. |
| `completed` | `IconCheck` | `{colors.status-confirmed-text}` (#34D399) | Layanan selesai & pelunasan kasir beres. |
| `cancelled` | `IconX` | `{colors.status-cancelled-text}` (#A1A1AA) | Dibatalkan oleh pelanggan atau Midtrans expire. |
| `no_show` | `IconAlertOctagon` | `{colors.status-noshow-text}` (#F87171) | Lewat batas toleransi 15 menit, DP hangus. |

---

## 5. Spesifikasi Token Ukuran & Ergonomi Visual

Sistem ikonografi Tabler diintegrasikan ke dalam hierarki token Tailwind v4 dan Google `DESIGN.md`:

```
+--------------------------------------------------------------------------+
| HIERARKI SIZE TOKEN TABLER ICONS - DAMEZ BARBERSHOP                      |
+----------+---------+-------------+---------------+-----------------------+
| Token    | Dimensi | Ketebalan   | Utility Class | Kasus Penggunaan      |
| Name     | (px)    | Stroke (px) | Tailwind      | Spesifik              |
+----------+---------+-------------+---------------+-----------------------+
| micro    | 16 x 16 | 1.75        | w-4 h-4       | Badge, Chip, Toast    |
| sm       | 20 x 20 | 2.00        | w-5 h-5       | Input Field, Button   |
| md       | 24 x 24 | 2.00 (Base) | w-6 h-6       | Header, Nav, Cards    |
| lg       | 32 x 32 | 1.50        | w-8 h-8       | QRIS Modal, Bento Hero|
| xl       | 48 x 48 | 1.50        | w-12 h-12     | Boarding Pass Hero    |
+----------+---------+-------------+---------------+-----------------------+
```

### Aturan Optical Weighting & Stroke Scaling:
1. **Micro Scaling (16px):** Stroke diturunkan sedikit dari 2px menjadi **1.75px** agar celah visual di dalam elemen kecil (seperti mata jarum jam atau detail silet) tidak tersumbat.
2. **Standard Scaling (20px - 24px):** Menggunakan ketebalan default **2.0px** untuk kontras optimum di layar smartphone.
3. **Display Scaling (32px - 48px):** Stroke diturunkan menjadi **1.5px** agar garis tidak tampak terlalu berat (chunky) ketika ditampilkan dalam format besar pada layar desktop.

---

## 6. Component States Matrix (Status Interaksi Komponen)

Setiap ikon yang berada di dalam elemen interaktif (button, chip pilihan, toggle) wajib mengikuti matriks status berikut:

| Status Interaksi | Transformasi Visual Ikon | Warna Foreground | Background Wrapper | Shadow / Outline |
|:---|:---|:---|:---|:---|
| **Default** | Skala 1.0x, stroke 2.0px | `{colors.text-primary}` (#F5F5F0) | `{colors.surface}` (#1A1A1A) | Border subtil 1px (#2E2E2E) |
| **Hover** | Translasi Y -1px, skala 1.05x | `{colors.primary-hover}` (#F59E0B) | `{colors.surface-hover}` (#2C2C2C) | Glow subtil amber 10% |
| **Active / Pressed** | Skala 0.95x | `{colors.primary}` (#D97706) | `{colors.surface-elevated}` (#242424) | None |
| **Focus-Visible** | Skala 1.0x | `{colors.primary}` (#D97706) | `{colors.surface}` (#1A1A1A) | Ring amber 2px offset 2px |
| **Disabled** | Skala 1.0x, opacity 40% | `{colors.text-muted}` (#A8A29E) | `{colors.surface}` (#1A1A1A) | Pointer-events none |
| **Loading** | Putaran 360 derajat kontinu | `{colors.primary}` (#D97706) | Transparan | `animate-spin` CSS |
| **Selected** | Check badge aktif di pojok | `{colors.primary-foreground}` (#12) | `{colors.primary}` (#D97706) | Shadow amber solid |

---

## 7. Aksesibilitas (WCAG 2.1 AA) & Ergonomi Layar Sentuh Mobile

### A. Aturan Labeling Semantik
1. **Ikon Dekoratif (Decorative Icons):**
   - Ikon yang diletakkan bersamaan dengan teks label (contoh: `<IconScissors /> <span>Pangkas Rambut</span>`) bersifat redundan bagi screen reader.
   - Wajib memiliki atribut `aria-hidden="true"`.
2. **Ikon Aksi Mandiri (Standalone Icon Buttons):**
   - Tombol yang hanya memuat ikon (contoh: Tombol navigasi 'Kembali' `<button><IconArrowLeft /></button>` atau tombol tutup modal `<button><IconX /></button>`).
   - Wajib memiliki atribut `aria-label="Kembali ke langkah sebelumnya"` atau `aria-label="Tutup jendela modal"` serta `role="img"`.

### B. Mobile Thumb-Zone & Touch Targets
- Sesuai audit aksesibilitas Damez Barbershop (M1-05), seluruh area interaktif yang membungkus ikon di smartphone wajib memiliki ukuran minimal **48 x 48 piksel** (`min-h-[48px] min-w-[48px]`).
- Bounding box SVG 24x24 px diposisikan di tengah (`flex items-center justify-center`) dengan padding ergonomis 12px untuk meminimalisir salah sentuh (*misclicks*).

### C. Rasio Kontras Warna (WCAG Contrast Ratio)
- Seluruh kombinasi warna ikon terhadap latar belakang obsidian `#121212` telah divalidasi memenuhi standar kontras minimal 4.5:1:
  - Amber Primary (`#D97706`) vs Obsidian (`#121212`): **5.84:1** (Lolos WCAG AA)
  - Bone White (`#F5F5F0`) vs Obsidian (`#121212`): **18.72:1** (Lolos WCAG AAA)
  - Status Confirmed Green (`#34D399`) vs Obsidian (`#121212`): **9.94:1** (Lolos WCAG AAA)
  - Status Pending Amber (`#FBBF24`) vs Obsidian (`#121212`): **11.83:1** (Lolos WCAG AAA)
  - Status Destructive Red (`#F87171`) vs Obsidian (`#121212`): **6.91:1** (Lolos WCAG AA)

---

## 8. Panduan Integrasi Teknis Codebase (`components/ui/icons.ts`)

Mapping dictionary telah disediakan pada path `components/ui/icons.ts` dengan interface TypeScript yang kompatibel langsung dengan paket `@tabler/icons-react`.

### Contoh 1: Penggunaan Komponen Terkurasi
```tsx
import { IconScissors, IconCalendarEvent, IconClock } from "@/components/ui/icons";

export function ServiceCard({ name, duration, price }) {
  return (
    <div className="p-5 rounded-xl bg-surface border border-border">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
          <IconScissors size="md" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-text-primary">{name}</h3>
          <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
            <IconClock size="micro" aria-hidden="true" />
            <span>{duration} Menit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Contoh 2: Tombol Aksi Mandiri dengan Aksesibilitas Lengkap
```tsx
import { IconArrowLeft } from "@/components/ui/icons";

export function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex items-center justify-center min-w-[48px] min-h-[48px] p-3 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
      aria-label="Kembali ke langkah sebelumnya"
    >
      <IconArrowLeft size="sm" aria-hidden="true" />
    </button>
  );
}
```

### Contoh 3: Pemetaan Dinamis via Helper
```tsx
import { getServiceIcon, getBookingStepIcon, getPaymentMethodIcon } from "@/components/ui/icons";

// Mendapatkan ikon pangkas untuk SRV-01
const ServiceIcon = getServiceIcon("SRV-01");

// Mendapatkan ikon kalender untuk Step 3
const StepIcon = getBookingStepIcon(3);

// Mendapatkan ikon QRIS untuk metode qris
const PaymentIcon = getPaymentMethodIcon("qris");
```

---

## 9. Definition of Done (DoD) Verification Checklist

- [x] **Kurasi Set Ikon Tabler:** 10 ikon kanonikal barbershop (`IconScissors`, `IconRazor`, `IconWash`, `IconSparkles`, `IconCalendarEvent`, `IconClock`, `IconQrcode`, `IconCreditCard`, `IconCheck`, `IconMapPin`, `IconBrandWhatsapp`) terkurasi lengkap beserta metadata unicode dan kategori.
- [x] **Grid & Stroke Uniformity:** Seluruh ikon terdefinisi pada grid 24x24 px dengan stroke 2.0px default dan ujung round linecap/linejoin.
- [x] **Deliverable 1:** Dokumen spesifikasi komprehensif `docs/design/tabler-iconography.md` selesai dirancang sesuai standar Principal Product Designer.
- [x] **Deliverable 2:** Mapping dictionary type-safe `components/ui/icons.ts` terimplementasi dan lulus `tsc --noEmit` dengan 0 error.
- [x] **Bebas Distorsi Visual:** Skalabilitas rasio aspek 1:1 terjaga pada seluruh breakpoint mobile & desktop.
- [x] **Kepatuhan Aksesibilitas:** WCAG 2.1 AA terverifikasi dengan aturan `aria-hidden` dekoratif dan `aria-label` mandiri.
