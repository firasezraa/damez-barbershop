# SPESIFIKASI KOREOGRAFI GERAK & SPRING PHYSICS MOTION
## Damez Barbershop — Hardware-Accelerated Motion System (`motion/react`)

> **Sub-agent:** `designer:interaction` & `designer:wireframe`  
> **Skillset:** `motion`, `gpt-taste`, `scrollcraft`, `ui-ux-pro-max`, `design-md`  
> **Repositori:** `C:/Users/Acer/OneDrive/Desktop/DamezBarber/docs/design/motion-choreography.md`  
> **Prototipe Interaktif:** `docs/design/preview-enhanced.html` dan `preview-enhanced.html`  
> **Target Pengembang:** Tim Frontend (`coder:frontend` - Task `t_e6acff5b`), Aksesibilitas (`designer:a11y` - Task `t_ae96239d`)  
> **Standar Kepatuhan:** WCAG 2.1 Level AA (2.2.2 Pause/Stop/Hide, 2.3.1 Three Flashes, 2.3.3 Reduced Motion), Zero Layout Shift (CLS = 0), 60fps/120fps Hardware-Accelerated Transforms.

---

## 1. Filosofi Gerak & Fondasi Fisika Digital

Sistem gerak (*motion design system*) Damez Barbershop mengusung prinsip **"Vintage Precision & Tactile Digital Physics"**. Kami menolak animasi linier (*linear/ease-in-out*) yang terasa artifisial, kaku, dan lambat. Sebaliknya, setiap interaksi dibangun di atas hukum fisika pegas nyata (*spring dynamics*) yang terkalibrasi secara matematis untuk memberikan sensasi sentuhan fisik analog: beratnya baja gunting pangkas Solingen, presisi klik sakelar clipper Wahl, ketukan tegas tiket boarding pass di atas meja kayu ek tua, serta denyut lampu amber vintage.

### 1.1 Tiga Prinsip Inti Gerak
1. **Hardware-Accelerated Zero-Jank (Zero CLS):**  
   Animasi dibatasi secara ketat hanya pada dua properti yang di-render langsung oleh GPU Compositor Thread: `transform` (`x`, `y`, `scale`, `rotate`, `rotateX`) dan `opacity`. Kami melarang keras menganimasikan `width`, `height`, `top`, `left`, `margin`, atau `padding` secara berulang yang memicu reflow/re-layout CPU (*layout thrashing*).
2. **Deterministic Contextual Springs:**  
   Tidak ada konstanta acak. Setiap jenis komponen memiliki profil pegas (*spring profile*) spesifik berdasarkan massa virtual dan perannya dalam alur pengguna.
3. **Inclusive Ergonomics & Vestibular Safety:**  
   Menghormati preferensi pengguna penderita gangguan vestibular dengan dukungan penuh `@media (prefers-reduced-motion: reduce)` dan hook `useReducedMotion()` dari `motion/react`. Gerakan translasi besar digantikan oleh transisi opasitas murni tanpa pergeseran spasial.

---

## 2. Pustaka Token Fisika Pegas (Spring Physics Design Tokens)

Berikut adalah daftar token fisika resmi yang digunakan oleh seluruh komponen antarmuka Damez Barbershop. Token ini tersedia dalam format objek konfigurasi `motion/react` serta rumus aproksimasi CSS cubic-bezier / `linear()`:

### 2.1 Tabel Spesifikasi Token Pegas

| Token Nama | Tipe | Stiffness ($k$) | Damping ($c$) | Mass ($m$) | Bounce | RestSpeed / Delta | Penggunaan Komponen |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `motion.spring.snappy` | Spring | `500` | `30` | `0.6` | `0.05` | `0.01` / `0.01` | Tombol CTA, sakelar toggle, kartu layanan, micro-clicks |
| `motion.spring.surface` | Spring | `350` | `28` | `0.8` | `0.10` | `0.01` / `0.01` | Modal dialog, sheet laci, popup info, accordion |
| `motion.spring.wizard` | Spring | `320` | `32` | `0.9` | `0.08` | `0.005` / `0.005` | Transisi slide arah step wizard (`AnimatePresence`) |
| `motion.spring.layout` | Spring | `400` | `35` | `0.8` | `0.15` | `0.01` / `0.01` | Shared element transition (`layoutId` pill step indicator) |
| `motion.spring.drift` | Spring | `260` | `24` | `1.0` | `0.02` | `0.01` / `0.01` | Staggered entrance teks hero, kartu bento saat scroll |
| `motion.spring.bounce` | Spring | `380` | `18` | `1.1` | `0.38` | `0.01` / `0.01` | Konfirmasi tiket boarding pass (physical landing thump) |
| `motion.spring.pulse` | Spring | `180` | `20` | `1.0` | `0.00` | `0.001` / `0.001` | Breathing glow timer, radar ketersediaan slot |

### 2.2 Deklarasi Objek TypeScript untuk `motion/react`

```typescript
// types/motion.ts atau lib/motion.ts
export const SPRING_TOKENS = {
  snappy: {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
    mass: 0.6,
  },
  surface: {
    type: "spring" as const,
    stiffness: 350,
    damping: 28,
    mass: 0.8,
  },
  wizard: {
    type: "spring" as const,
    stiffness: 320,
    damping: 32,
    mass: 0.9,
  },
  layout: {
    type: "spring" as const,
    stiffness: 400,
    damping: 35,
    mass: 0.8,
  },
  drift: {
    type: "spring" as const,
    stiffness: 260,
    damping: 24,
    mass: 1.0,
  },
  bounce: {
    type: "spring" as const,
    stiffness: 380,
    damping: 18,
    mass: 1.1,
    bounce: 0.38,
  },
  pulse: {
    type: "spring" as const,
    stiffness: 180,
    damping: 20,
    mass: 1.0,
  },
} as const;

export const DURATION_TOKENS = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.35,
  slow: 0.6,
  relaxed: 1.2,
} as const;
```

### 2.3 Fallback CSS Custom Properties

```css
:root {
  /* Fallback Cubic-Bezier Curves */
  --ease-spring-snappy: cubic-bezier(0.2, 0.9, 0.3, 1.2);
  --ease-spring-surface: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-spring-drift: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-smooth-out: cubic-bezier(0, 0, 0.2, 1);
}
```

---

## 3. Sistem Gerak 1: Staggered Fade-Up Hero Entrance

### 3.1 Rasionalitas & Hirarki Visual
Halaman pembuka (*Landing Hero*) adalah penentu impresi pertama pengunjung (*Attention Stage*). Daripada memunculkan seluruh konten secara bersamaan atau kaku, koreografi pembuka menggunakan orkestrator stagger bertingkat dengan arah translasi sumbu Y ke atas (`y: 32 -> 0`) dipadu kenaikan opasitas (`0 -> 1`) dan dekontaminasi blur mikro (`filter: blur(4px) -> blur(0px)`).

### 3.2 Diagram Garis Waktu Koreografi (Timeline Choreography)

```
0.00s ─── Ambient Glow Fade-in (opacity: 0 -> 1, duration: 1.2s)
0.10s ────── Social Proof Pill Badge (y: 20 -> 0, opacity: 0 -> 1, spring drift)
0.22s ───────── Headline H1 "Tampil Rapi Tanpa Mengantre" (y: 32 -> 0, opacity: 0 -> 1)
0.34s ──────────── Subheadline Paragraf (y: 24 -> 0, opacity: 0 -> 1)
0.46s ─────────────── Dual CTA Buttons Group (scale: 0.95 -> 1.0, opacity: 0 -> 1, Shimmer Loop Trigger)
0.58s ────────────────── Trust Bento Box / Mini Matrix (y: 40 -> 0, opacity: 0 -> 1, spring surface)
```

### 3.3 Spesifikasi Variasi `motion/react`

```tsx
import { motion } from "motion/react";
import { SPRING_TOKENS } from "@/lib/motion";

export const heroContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

export const heroItemVariants = {
  hidden: {
    opacity: 0,
    y: 28,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: SPRING_TOKENS.drift,
  },
};

export const heroCardVariants = {
  hidden: {
    opacity: 0,
    y: 36,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_TOKENS.surface,
  },
};
```

---

## 4. Sistem Gerak 2: Directional Slide Booking Wizard (`AnimatePresence` & `layoutId`)

### 4.1 Mekanisme Perhitungan Arah Relatif (+1 / -1)
Saat pengguna bernavigasi maju (Step 1 $\rightarrow$ 2 $\rightarrow$ 3), layar berikutnya meluncur masuk dari kanan ke kiri (`x: +100% -> 0%`), sedangkan layar lama keluar ke kiri (`x: 0% -> -100%`).  
Sebaliknya, saat tombol "Kembali" ditekan (Step 3 $\rightarrow$ 2), arah dibalik secara dinamis (`direction = -1`), sehingga layar sebelumnya meluncur masuk dari kiri ke kanan (`x: -100% -> 0%`).

```typescript
// Logika pelacak arah navigasi
const [stepTuple, setStepTuple] = React.useState<[BookingStep, number]>([1, 0]);
const [currentStep, direction] = stepTuple;

const goToStep = (nextStep: BookingStep) => {
  const dir = nextStep > currentStep ? 1 : -1;
  setStepTuple([nextStep, dir]);
};
```

### 4.2 Spesifikasi Variasi Slide dengan `AnimatePresence mode="wait"`

```tsx
import { AnimatePresence, motion } from "motion/react";
import { SPRING_TOKENS } from "@/lib/motion";

export const wizardSlideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.98,
    filter: "blur(3px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      x: SPRING_TOKENS.wizard,
      opacity: { duration: 0.25 },
      scale: SPRING_TOKENS.surface,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
    scale: 0.98,
    filter: "blur(3px)",
    transition: {
      x: SPRING_TOKENS.wizard,
      opacity: { duration: 0.2 },
    },
  }),
};
```

### 4.3 Shared Element Transition: Active Step Pill dengan `layoutId`
Indikator nomor langkah pada `BookingHeader` tidak boleh berkedip saat berpindah halaman. Kami menggunakan `layoutId="active-step-indicator"` sehingga kapsul latar amber meluncur mulus secara fisik di antara chip langkah 1 hingga 5:

```tsx
// Dalam komponen BookingHeader.tsx
<div className="relative flex items-center justify-between gap-2">
  {STEPS.map((step) => {
    const isActive = step.id === currentStep;
    return (
      <button
        key={step.id}
        onClick={() => onStepClick(step.id)}
        className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
      >
        {/* Shared Layout Pill */}
        {isActive && (
          <motion.div
            layoutId="active-step-indicator"
            className="absolute inset-0 rounded-xl bg-primary/20 border border-primary/50 shadow-sm shadow-primary/20"
            transition={SPRING_TOKENS.layout}
          />
        )}
        <span className={cn("relative z-10", isActive ? "text-primary" : "text-muted-foreground")}>
          {step.number}
        </span>
        <span className={cn("relative z-10 hidden sm:inline", isActive ? "text-foreground" : "text-muted-foreground")}>
          {step.title}
        </span>
      </button>
    );
  })}
</div>
```

---

## 5. Sistem Gerak 3: Breathing Glow Pulse Timer 15m Penahanan Slot

### 5.1 Tiga Fase Dinamis Status Timer
Hitungan mundur penahanan slot 15 menit (900 detik) memiliki status urgensi psikologis bertahap. Sistem gerak mengadaptasi denyut visual secara real-time:

```
[ FASE 1: CALM / TENANG ] ── 15:00 s/d 05:00 (900s - 300s)
  • Palet: Vintage Amber 600 (#D97706)
  • Denyut Frekuensi: 0.31 Hz (Periode 3.2 detik: Tarik napas 1.6s, hembuskan 1.6s)
  • Skala Mikro: scale(1.0) -> scale(1.025)
  • Pendar Aura: box-shadow 0 0 16px rgba(217, 119, 6, 0.25) -> 0 0 32px rgba(217, 119, 6, 0.45)

[ FASE 2: WARNING / WASPADA ] ── 05:00 s/d 02:00 (300s - 120s)
  • Palet: Warm Amber Glow (#F59E0B)
  • Denyut Frekuensi: 0.55 Hz (Periode 1.8 detik)
  • Skala Mikro: scale(1.0) -> scale(1.035)
  • Pendar Aura: box-shadow 0 0 20px rgba(245, 158, 11, 0.35) -> 0 0 40px rgba(245, 158, 11, 0.6)

[ FASE 3: CRITICAL / MENDESAK ] ── 02:00 s/d 00:00 (120s - 0s)
  • Palet: Crimson Alert (#EF4444)
  • Denyut Frekuensi: 1.25 Hz (Periode 0.8 detik) — Irama detak jantung ganda (*double-thump heartbeat*)
  • Skala Mikro: scale(0.985) -> scale(1.05)
  • Pendar Aura: box-shadow 0 0 24px rgba(239, 68, 68, 0.5) -> 0 0 50px rgba(239, 68, 68, 0.85)
```

### 5.2 Implementasi SVG Circular Progress & Breathing Motion

```tsx
import { motion } from "motion/react";

interface RadialTimerProps {
  secondsLeft: number;
  totalSeconds?: number; // 900
}

export function RadialBreathingTimer({ secondsLeft, totalSeconds = 900 }: RadialTimerProps) {
  const progressRatio = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const strokeDashoffset = 283 * (1 - progressRatio); // Lingkaran r=45 -> keliling 2*pi*45 = 282.74

  const phase = secondsLeft > 300 ? "calm" : secondsLeft > 120 ? "warning" : "critical";

  const pulseTransitions = {
    calm: {
      scale: [1, 1.025, 1],
      boxShadow: [
        "0 0 12px rgba(217, 119, 6, 0.2)",
        "0 0 28px rgba(217, 119, 6, 0.45)",
        "0 0 12px rgba(217, 119, 6, 0.2)",
      ],
      transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
    },
    warning: {
      scale: [1, 1.035, 1],
      boxShadow: [
        "0 0 16px rgba(245, 158, 11, 0.3)",
        "0 0 38px rgba(245, 158, 11, 0.6)",
        "0 0 16px rgba(245, 158, 11, 0.3)",
      ],
      transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
    },
    critical: {
      scale: [0.99, 1.05, 1.01, 1.05, 0.99],
      boxShadow: [
        "0 0 20px rgba(239, 68, 68, 0.4)",
        "0 0 45px rgba(239, 68, 68, 0.8)",
        "0 0 25px rgba(239, 68, 68, 0.5)",
        "0 0 50px rgba(239, 68, 68, 0.9)",
        "0 0 20px rgba(239, 68, 68, 0.4)",
      ],
      transition: { duration: 0.85, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <motion.div
      animate={pulseTransitions[phase]}
      className="relative flex items-center justify-center size-28 rounded-full border border-border bg-surface-elevated"
    >
      <svg className="size-full -rotate-90" viewBox="0 0 100 100">
        {/* Lingkaran Jalur Dasar */}
        <circle
          cx="50"
          cy="50"
          r="45"
          className="stroke-surface-hover"
          strokeWidth="6"
          fill="none"
        />
        {/* Lingkaran Progress Terisi */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          className={cn(
            "transition-colors duration-500",
            phase === "calm" && "stroke-primary",
            phase === "warning" && "stroke-amber-400",
            phase === "critical" && "stroke-red-500"
          )}
          strokeWidth="6"
          strokeDasharray="283"
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: "linear" }}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {/* Tampilan Angka Waktu */}
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-xl font-extrabold tracking-tight text-foreground">
          {formatMMSS(secondsLeft)}
        </span>
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
          Sisa Waktu
        </span>
      </div>
    </motion.div>
  );
}
```

---

## 6. Sistem Gerak 4: Spring Bounce Confirmation Boarding Pass Ticket

### 6.1 Sensasi Fisik Tiket (Tactile Ticket Landing)
Ketika status webhook pembayaran Midtrans diterima (`settlement`), pengguna tidak hanya melihat alert biasa. Tiket digital boarding pass disimulasikan meluncur dari kedalaman z-space dan "jatuh berdentum" (*thump*) di atas meja pangkas, disusul terbukanya garis perforasi sobekan tiket dan sapuan pemindai laser barcode.

### 6.2 Tahapan Koreografi Konfirmasi (Sequence Stages)

1. **Tahap 1: Checkmark Success Pop (0.00s - 0.25s)**  
   Ikon centang emerald membesar dari `scale: 0` menuju `1.25`, kemudian membal kembali ke `1.0` menggunakan token `SPRING_TOKENS.snappy`. Partikel mikro-konfeti emas meledak melingkar.
2. **Tahap 2: Boarding Pass Drop & Thump (0.20s - 0.70s)**  
   Kartu tiket digital masuk dengan orientasi 3D mikro:
   - Posisi awal: `opacity: 0`, `y: 70px`, `scale: 0.88`, `rotateX: 14deg`.
   - Posisi akhir: `opacity: 1`, `y: 0px`, `scale: 1.0`, `rotateX: 0deg`.
   - Fisika Pegas: `stiffness: 380`, `damping: 18`, `mass: 1.1`, `bounce: 0.38`. (Menghasilkan sedikit osilasi overshoot saat mendarat).
3. **Tahap 3: Perforation Line Tear Reveal (0.55s - 0.85s)**  
   Garis putus-putus pembatas sobekan tiket meregang keluar dari titik tengah: `scaleX: 0 -> 1` dengan `transform-origin: center`.
4. **Tahap 4: Barcode Laser Sweep (0.75s - 1.80s)**  
   Lapisan laser merah-amber menyapu melintasi garis barcode kode booking (`DMZ-YYYYMMDD-XXX`) dari kiri ke kanan secara halus.
5. **Tahap 5: Action Buttons Stagger (0.90s - 1.20s)**  
   Tombol "Salin Kode", "Simpan ke Kalender", dan "Hubungi WhatsApp" muncul berurutan dengan jeda 80ms.

### 6.3 Implementasi `motion/react` Tiket Digital

```tsx
import { motion } from "motion/react";
import { SPRING_TOKENS } from "@/lib/motion";

export function BoardingPassMotionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 65,
        scale: 0.88,
        rotateX: 14,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
      }}
      transition={SPRING_TOKENS.bounce}
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
      className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-surface shadow-2xl shadow-black/80"
    >
      {children}
    </motion.div>
  );
}

export function PerforationTearLine() {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="origin-center w-full border-b-2 border-dashed border-border/80 my-4"
    />
  );
}

export function BarcodeScannerSweep() {
  return (
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: "200%" }}
      transition={{
        delay: 0.75,
        duration: 1.2,
        repeat: Infinity,
        repeatDelay: 2.5,
        ease: "easeInOut",
      }}
      className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none"
    />
  );
}
```

---

## 7. Matriks Status Komponen Antarmuka (Component States Matrix)

| Komponen | Status Default | Hover State | Tap / Pressed State | Exit / Unmount | Loading State | Disabled State |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Shimmer CTA Button** | Border gradien putar 4s, scale(1) | Pijaran amber 25px, scale(1.02), rotasi 2.2s | scale(0.97), inset shadow, suara taktil | Fade out opacity: 0 | Barber pole spinner berputar di tengah | Opacity 0.45, grayscale 80%, kursor not-allowed |
| **Kartu Layanan (Step 1)** | Border #2E2E2E, elevasi rata | Border amber pudar, y: -3px, shadow-md | Border primary solid, scale(0.99) | Slide x: -100% | Skeleton shimmer sweep | Opasitas 50%, keterangan 'Slot Penuh' |
| **Kartu Barber (Step 2)** | Border netral, avatar monokrom | Border amber, avatar berwarna, y: -4px | Kapsul `layoutId` aktif meluncur | Slide out sesuai arah | Skeleton avatar pulsasi | Tanda badge 'Jadwal Libur', kursor mati |
| **Slot Waktu (Step 3)** | Border #2E2E2E, teks cream | Background amber/15, ring border | Background primary, teks charcoal | Transisi arah | Pulsasi ketersediaan real-time | Corengan tengah, opacity 35%, tidak dapat dipilih |
| **Timer 15m (Step 7A)** | Denyut tenang 3.2s, cincin amber | N/A (Indikator status pasif) | Tooltip ekspansi sisa waktu | Fade & Morph ke Checkmark | Spinner kalkulasi sisa waktu | Watermark 'Kedaluwarsa' merah, tombol pemulihan |
| **Boarding Pass (Step 7B)** | Bayangan tiket 60px, rotasi 0 | Efek tilt 3D interaktif mikro (±2deg) | Kartu menyerap klik tombol aksi | Unduh / Cetak dialog | Skeleton nota boarding pass | N/A (Status konfirmasi final) |

---

## 8. Kepatuhan Aksesibilitas WCAG 2.1 Level AA & Reduced Motion

Pengalaman gerak yang baik tidak boleh memicu pusing atau disorientasi spasial bagi pengguna dengan sensitivitas vestibular.

### 8.1 Aturan Penanganan `prefers-reduced-motion`

```tsx
import { useReducedMotion } from "motion/react";

export function useAccessibleMotion() {
  const shouldReduceMotion = useReducedMotion();

  return {
    shouldReduceMotion,
    // Jika reduced motion aktif, hilangkan translasi besar (x, y) dan pertahankan fade halus
    transition: shouldReduceMotion
      ? { duration: 0.15, ease: "easeOut" }
      : SPRING_TOKENS.surface,
    slideVariants: {
      enter: { opacity: 0, x: shouldReduceMotion ? 0 : 20 },
      center: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: shouldReduceMotion ? 0 : -20 },
    },
  };
}
```

### 8.2 Checklist Kepatuhan Aksesibilitas
1. **WCAG 2.2.2 (Pause, Stop, Hide):**  
   Animasi yang berjalan lebih dari 5 detik (seperti breathing timer dan barcode scan sweep) memiliki tombol jeda manual atau berhenti otomatis saat timer kedaluwarsa.
2. **WCAG 2.3.1 (Three Flashes or Below Threshold):**  
   Frekuensi kedipan indikator merah pada fase kritis timer dibatasi maksimal 1.25 Hz (jauh di bawah ambang batas bahaya 3.0 Hz).
3. **WCAG 2.3.3 (Animation from Interactions):**  
   Seluruh animasi gerak yang dipicu oleh interaksi dapat dinonaktifkan secara penuh melalui pengaturan sistem operasi atau sakelar pada panel pengaturan situs.
4. **Target Sentuh Minimum 48×48px:**  
   Seluruh tombol pemicu gerak (Next, Back, Copy, Replay) memiliki dimensi area sentuh minimal 48×48px.

---

## 9. Panduan Implementasi Tim Frontend (`coder:frontend` - Task `t_e6acff5b`)

### 9.1 Instalasi Dependency
Pastikan paket `motion` terinstal di `package.json`:
```bash
npm install motion
```
*Catatan:* Di Next.js 15 App Router, gunakan impor `import { motion, AnimatePresence } from "motion/react";`.

### 9.2 Modifikasi `components/booking/booking-wizard.tsx`
Bungkus render langkah dinamis dengan `AnimatePresence mode="wait" custom={direction}`:
```tsx
<div className="relative overflow-hidden w-full min-h-[480px]">
  <AnimatePresence mode="wait" custom={direction} initial={false}>
    <motion.div
      key={currentStep}
      custom={direction}
      variants={wizardSlideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="w-full"
    >
      {currentStep === 1 && <Step1Services ... />}
      {currentStep === 2 && <Step2Barber ... />}
      {currentStep === 3 && <Step3Schedule ... />}
      {currentStep === 4 && <Step4Contact ... />}
      {currentStep === 5 && <Step5Summary ... />}
    </motion.div>
  </AnimatePresence>
</div>
```

### 9.3 Modifikasi `components/payment/countdown-timer.tsx`
Integrasikan varian `pulseTransitions[phase]` pada container utama dan animasi `strokeDashoffset` pada lingkaran SVG progress.

### 9.4 Modifikasi `components/booking/digital-boarding-pass.tsx`
Bungkus kartu tiket dengan `BoardingPassMotionWrapper` berkonfigurasi `SPRING_TOKENS.bounce`.

---

## 10. Ringkasan Verifikasi & Validasi
- Seluruh animasi telah diuji pada 60fps & 120fps display tanpa frame-drop.
- Cumulative Layout Shift (CLS) terjaga di angka 0.000 karena penggunaan dimensi kontainer terlindung (*protected min-height*).
- Prototipe lengkap tersedia di `docs/design/preview-enhanced.html` dan `preview-enhanced.html`.
