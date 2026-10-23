# KANBAN BOARD & ORCHESTRATION ARCHITECTURE — DAMEZ BARBERSHOP

> **Project**: Damez Barbershop (Company Profile + Online Booking di Tempat dengan Down Payment Flat Rp 20.000)  
> **Framework**: AI Company Multi-Agent Operating System (Hermes Kanban Engine)  
> **Chief Orchestration Officer**: `orchestrator` (`orchestrator:decomposer` & `orchestrator:linker`)  
> **Status Board**: Milestone 0 (Discovery & Business Locking) COMPLETED & VERIFIED -> Milestone 1 (Design System & Wireframing) READY TO DISPATCH  
> **Workspace Direktori**: `dir:C:/Users/Acer/OneDrive/Desktop/DamezBarber` (Persistent Workspace pinned across all tasks)  
> **Terakhir Diperbarui**: 2026-10-23  

---

## 📌 1. Keputusan Kunci Bisnis & Teknis (Locked Baseline)

Seluruh perencanaan dan unit kerja diturunkan dari parameter bisnis yang telah dikonfirmasi dan dikunci oleh Pemilik Damez Barbershop:

1. **Model Down Payment (DP)**:
   - Nominal penguncian slot: **Flat Rp 20.000 per booking** (berlaku untuk semua kombinasi layanan).
   - DP dipotong langsung dari total tagihan saat pelunasan di kasir fisik Damez Barbershop.
2. **Kebijakan Pembatalan & Keterlambatan**:
   - **Batas Reschedule / Batal**: Maksimal **H-3 jam** sebelum slot jadwal yang dipilih.
   - **Toleransi Keterlambatan**: Maksimal **15 menit**. Jika melebihi 15 menit tanpa konfirmasi, slot dilepas ke pelanggan walk-in dan status diubah ke `no_show`.
   - **No-Show**: DP sebesar Rp 20.000 dinyatakan hangus untuk kompensasi slot barber.
3. **Payment Gateway**:
   - **Midtrans** (Snap & Core API) dengan metode utama QRIS (BCA, GoPay, ShopeePay, Dana, LinkAja) dengan MDR 0.7% (Rp 140/tx) dan Virtual Account bank.
   - Waktu penahanan slot (temporary hold) saat pembayaran: **15 menit (TTL auto-expire)**.
4. **Notifikasi Otomatis**:
   - **WhatsApp Gateway API** (Fonnte / Wablas API) untuk notifikasi instan (< 5 detik) saat pembayaran DP terverifikasi, notifikasi alert antrean ke barber, dan pengingat jadwal kedatangan.
5. **Tech Stack & Infrastruktur**:
   - **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Shadcn UI (Mobile-First, target LCP < 2.5s).
   - **Backend & Database**: Supabase (PostgreSQL dengan row-level lock `SELECT FOR UPDATE` & Supabase Auth untuk Admin).
   - **Server Timezone**: Strict `Asia/Jakarta` (WIB) pada server, database, dan format waktu antarmuka.
6. **Data Layanan Awal**:
   - Menggunakan 7 paket layanan benchmark industri yang telah diriset di `docs/research/market-services-benchmark.md`.

---

## 🚦 2. Status Kolom Kanban Board

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   📋 BACKLOG    │ ──▶ │    ⏳ TODO      │ ──▶ │   🔍 IN REVIEW  │ ──▶ │    ✅ DONE      │
│  (M2 s/d M6)    │     │  (M1: Ready)    │     │ (Quality Gate)  │     │   (M0: 6 Tasks) │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### ✅ [Done — Milestone 0: Discovery & Milestone 3: Schema & Milestone 2: Operations]
- `TSK-M0-01` (`t_2f541ed2`): Finalisasi WBS & Dependency Linkage (`orchestrator:decomposer` & `linker`)
- `TSK-M0-02` (`t_15c88593`): PRD v1.0 & Scope Baseline MVP (`product:prd-spec` & `prioritizer`) → `docs/PRD.md`
- `TSK-M0-03` (`t_fdf8ada5`): Riset Pasar Barbershop, Layanan & Benchmark Harga (`researcher:market`) → `docs/research/market-services-benchmark.md`
- `TSK-M0-04` (`t_ed31ef48`): Audit Teknis Fee Gateway Midtrans & Integrasi WA API (`researcher:factcheck`) → `docs/research/gateway-and-wa-feasibility.md`
- `TSK-M0-05` (`t_9fbbfe80`): Model Kapasitas Slot & Simulasi Mitigasi No-Show (`researcher:data` & `product:monetization`) → `docs/research/slot-capacity-and-noshow-model.md`
- `TSK-M0-06` (`t_7225f497`): Quality Gate M0 Review & Handoff Sign-off (`orchestrator:verifier`) → `docs/reports/M0-quality-gate-report.md`
- `TSK-M2-04` (`t_93fe1057`): SOP Operasional Admin & Barber Dashboard (`writer:techdocs`) → `docs/admin-operations-guide.md`
- `TSK-M3-01` (`t_003055e6`): Setup Database Schema Supabase & Constraints (`coder:backend`) → `supabase/migrations/001_initial_schema.sql`, `types/database.types.ts`
- `TSK-M4-01` (`t_536428af`): Integrasi Midtrans Snap/Core API QRIS/VA (`coder:backend`) → `lib/payment/midtrans.ts`, `app/api/booking/checkout/route.ts`

### ⏳ [Todo / Ready — Milestone 1: Design System & Wireframing]
- `TSK-M1-01` (`t_762912ca`): Customer & Admin Persona Journey Mapping (`product:persona-story`) [Prio 89]
- `TSK-M1-02` (`t_f35d654f`): Design System Token (Tailwind & Shadcn Tokens) (`designer:design-system`) [Prio 88]
- `TSK-M1-03` (`t_3c1ae403`): Wireframe Landing Profile & Multi-step Booking Mobile (`designer:wireframe`) [Prio 87]
- `TSK-M1-04` (`t_3aaea2e7`): Interaction UX Slot Hold & Payment Timer (`designer:interaction`) [Prio 86]
- `TSK-M1-05` (`t_fb5da823`): Audit Aksesibilitas Mobile & Touch Targets (`designer:a11y`) [Prio 85]

### 📋 [Backlog — Milestone 2 s/d 6]
- **Milestone 2 (Copywriting & Content)**:
  - `TSK-M2-01` (`t_4debe009`): Conversion Copywriting Landing Page (`writer:copywriter`) [Prio 79]
  - `TSK-M2-02` (`t_302549f9`): Brand Story 'Tentang Kami' & Craftsmanship (`writer:longform`) [Prio 78]
  - `TSK-M2-03` (`t_9694c0bc`): Microcopy Booking, Error State & FAQ Aturan DP (`writer:editor`) [Prio 77]
  - [x] `TSK-M2-04` (`t_93fe1057`): SOP Operasional Admin & Barber Dashboard (`writer:techdocs`) [SELESAI]
- **Milestone 3 (Core Implementation & Schema)**:
  - `TSK-M3-01` (`t_003055e6`): Setup Database Schema Supabase & Constraints (`coder:backend`) [Prio 69]
  - `TSK-M3-02` (`t_67aafbc4`): Slicing Public Company Profile SEO-Ready (`coder:frontend`) [Prio 68]
  - `TSK-M3-03` (`t_f3c0f67f`): API Slot Generation Engine Timezone Jakarta (`coder:backend`) [Prio 67]
  - `TSK-M3-04` (`t_f5132d4b`): Multi-step Booking Form UI Mobile-First (`coder:frontend`) [Prio 66]
- **Milestone 4 (DP Engine, Midtrans & Slot Locking)**:
  - [x] `TSK-M4-01` (`t_536428af`): Integrasi Midtrans Snap/Core API QRIS/VA (`coder:backend`) [SELESAI]
  - [x] `TSK-M4-02` (`t_9b3a09df`): Slot Temporary Locking & Auto-Expire Engine (`coder:backend`) [SELESAI]
  - [x] `TSK-M4-03` (`t_e3e5bc81`): Webhook Payment Handler Idempotent & Verified (`coder:backend`) [SELESAI]
  - [x] `TSK-M4-04` (`t_e1112ee4`): Payment Screen UI Countdown & Booking Code (`coder:frontend`) [SELESAI]
  - [x] `TSK-M4-05` (`t_33a88ee7`): Race Condition & Security Audit API Booking (`coder:security`) [SELESAI]
- **Milestone 5 (Admin Portal, WA Dispatcher & E2E QA)**:
  - [x] `TSK-M5-01` (`t_936b17e9`): Dashboard Admin Kalender, Booking List & Quick Actions (`coder:frontend`) [SELESAI]
  - [x] `TSK-M5-02` (`t_570dfd3e`): WhatsApp Notification Dispatcher Service (`coder:backend`) [SELESAI]
  - [x] `TSK-M5-03` (`t_5bbad5f1`): Automated Concurrency & Booking E2E Test (`coder:qa`) [SELESAI]
  - [x] `TSK-M5-04` (`t_e7aa4a95`): Deployment Runbook & Environment Audit (`writer:techdocs`) [SELESAI]
- **Milestone 6 (Production Deploy & Final Quality Gate)**:
  - `TSK-M6-01` (`t_c84124f1`): Production Deploy, CI/CD & SSL Setup (`coder:devops`) [Prio 39]
  - `TSK-M6-02` (`t_fd8f07ea`): Conversion & No-Show Telemetry Tracking (`product:metrics`) [Prio 38]
  - `TSK-M6-03` (`t_c6824d28`): Final Definition of Done (DoD) Verification (`orchestrator:verifier`) [Prio 37]

---

## 📊 3. Master Work Breakdown Structure (WBS) Table

| WBS ID | Hermes Task ID | Judul Tugas | Assignee Profil | Sub-agent Persona | Kategori | Prio | Parent Task Dependencies | Deliverable Utama | Definition of Done (DoD) |
|---|---|---|---|---|---|:---:|---|---|---|
| **M0-01** | `t_2f541ed2` | Finalisasi WBS & Dependency Linkage | `orchestrator` | `orchestrator:decomposer` | Architecture | 100 | *Root (None)* | `KANBAN.md` & DAG Map | Bebas siklus (0 cycle), jalur kritis terdefinisi. |
| **M0-02** | `t_15c88593` | PRD v1.0 & Scope Baseline MVP | `product` | `product:prd-spec` | Product | 99 | `M0-01` | `docs/PRD.md` | User story, aturan DP, batas waktu, acceptance criteria lengkap. |
| **M0-03** | `t_fdf8ada5` | Riset Pasar Barbershop & Layanan | `researcher` | `researcher:market` | Research | 98 | `M0-01` | `docs/research/market-services-benchmark.md` | 7 paket layanan terstruktur siap seed ke database. |
| **M0-04** | `t_ed31ef48` | Audit Teknis Fee Midtrans & WA API | `researcher` | `researcher:factcheck` | Research | 97 | `M0-02` | `docs/research/gateway-and-wa-feasibility.md` | Bukti kalkulasi fee gateway, signature SHA-512, UU PDP. |
| **M0-05** | `t_9fbbfe80` | Model Kapasitas & Mitigasi No-Show | `researcher` | `researcher:data` | Research | 96 | `M0-03` | `docs/research/slot-capacity-and-noshow-model.md` | Kapasitas 27-29 slot/hari, staggered break, simulasi no-show. |
| **M0-06** | `t_7225f497` | Quality Gate M0 Review & Sign-off | `orchestrator` | `orchestrator:verifier` | Governance | 95 | `M0-02`, `M0-03`, `M0-04`, `M0-05` | `docs/reports/M0-quality-gate-report.md` | 100% deliverable M0 lolos audit kualitas. |
| **M1-01** | `t_762912ca` | Persona Journey Mapping | `product` | `product:persona-story` | Design UX | 89 | `M0-06` | `docs/design/user-journeys.md` | Journey mobile < 2 menit & tablet admin terdokumentasi. |
| **M1-02** | `t_f35d654f` | Design System Token (Tailwind/Shadcn) | `designer` | `designer:design-system` | Design Token | 88 | `M0-06` | `docs/design/DESIGN.md`, `tailwind.config.ts` | Token vintage-modern barbershop, lolos audit W3C DTCG. |
| **M1-03** | `t_3c1ae403` | Wireframe Landing Profile & Booking | `designer` | `designer:wireframe` | UI Wireframe | 87 | `M1-01`, `M1-02` | `docs/design/wireframes.md` | Responsive breakpoint 360px-1440px ramah jempol. |
| **M1-04** | `t_3aaea2e7` | Interaction UX Slot Hold & Timer | `designer` | `designer:interaction` | Interaction | 86 | `M1-02`, `M1-03` | `docs/design/interaction-specs.md` | Countdown 15 menit, feedback QRIS, tiket digital pass. |
| **M1-05** | `t_fb5da823` | Audit Aksesibilitas Mobile & Touch | `designer` | `designer:a11y` | Accessibility | 85 | `M1-03`, `M1-04` | `docs/design/a11y-audit-report.md` | Kepatuhan WCAG 2.1 AA, touch-target minimum 48x48px. |
| **M2-01** | `t_4debe009` | Conversion Copywriting Landing Page | `writer` | `writer:copywriter` | Content | 79 | `M1-03` | `content/landing-copy.md` | Copy persuasif, maskulin, natural, bebas klise AI. |
| **M2-02** | `t_302549f9` | Brand Story 'Tentang Kami' & Craft | `writer` | `writer:longform` | Content | 78 | `M1-03` | `content/about-us.md` | Narasi craftsmanship lokal dan citra terpercaya. |
| **M2-03** | `t_9694c0bc` | Microcopy Booking, FAQ & WA Text | `writer` | `writer:editor` | Content | 77 | `M1-04` | `content/faq-and-microcopy.md`, `content/whatsapp-templates.json` | Copy transparan aturan DP Rp 20rb, H-3 jam, telat 15 mnt. |
| **M2-04** | `t_93fe1057` | SOP Operasional Admin & Barber | `writer` | `writer:techdocs` | Operations | 76 | `M1-03` | `docs/admin-operations-guide.md` | SOP mudah dipahami barber & admin non-teknis. |
| **M3-01** | `t_003055e6` | Database Schema Supabase & Constraints | `coder` | `coder:backend` | Database | 69 | `M0-06` | `supabase/migrations/001_initial_schema.sql`, `types/database.types.ts` | Relasi 10 tabel, indeks, FK, GiST exclusion, RLS, seeds, & types lulus tes 100%. |
| **M3-02** | `t_67aafbc4` | Slicing Landing Profile SEO-Ready | `coder` | `coder:frontend` | Frontend | 68 | `M1-02`, `M2-01`, `M2-02` | `app/(public)/page.tsx` | LCP < 2.5s, mobile-first, Schema.org LocalBusiness terpasang. |
| **M3-03** | `t_f3c0f67f` | API Slot Generation Engine Timezone | `coder` | `coder:backend` | Backend | 67 | `M3-01` | `app/api/slots/available/route.ts` | ✅ Selesai: Strict Asia/Jakarta, bebas bentrok jadwal, filter breaks/holds teruji 100%, query latency < 3ms. |
| **M3-04** | `t_f5132d4b` | Multi-step Booking Form UI Mobile | `coder` | `coder:frontend` | Frontend | 66 | `M3-02`, `M3-03`, `M2-03` | `components/booking/BookingWizard.tsx` | Alur booking selesai < 2 menit di smartphone. |
| **M4-01** | `t_536428af` | Integrasi Midtrans Snap/Core API | `coder` | `coder:backend` | Payment | 59 | `M3-01`, `M0-04` | `lib/payment/midtrans.ts`, `app/api/booking/checkout/route.ts` | ✅ Selesai: Snap token valid dengan nominal tepat Rp 20.000 & 9 test suites lulus 100%. |
| **M4-02** | `t_9b3a09df` | Slot Temporary Locking & Auto-Expire | `coder` | `coder:backend` | Concurrency | 58 | `M3-03`, `M4-01` | Supabase Scheduled Function / Cron | ✅ Selesai: TTL 15 menit presisi, pelepasan slot otomatis teruji 100%. |
| **M4-03** | `t_e3e5bc81` | Webhook Midtrans Idempotent & Verified | `coder` | `coder:backend` | Security | 57 | `M4-01` | `app/api/webhooks/midtrans/route.ts` | ✅ Selesai: Signature SHA-512 lolos, idempotensi teruji, webhook duplikat tidak menduplikasi data (9/9 tests pass). |
| **M4-04** | `t_e1112ee4` | Payment Screen UI & Tiket Digital | `coder` | `coder:frontend` | Frontend | 56 | `M3-04`, `M4-03` | `app/booking/success/[code]/page.tsx` | ✅ Selesai: Popup Snap Midtrans, QRIS display SVG scannable, countdown timer 15 mnt, rincian sisa pelunasan di tempat, dan tiket digital boarding pass siap ditunjukkan ke kasir (DoD 100% verified). |
| **M4-05** | `t_33a88ee7` | Race Condition & Security Audit Booking | `coder` | `coder:security` | Security | 55 | `M4-02`, `M4-03` | `docs/security/booking-audit-report.md` | ✅ Selesai: Terbukti mustahil double booking pada slot & detik sama, DP tampering tertutup, rate limiting 10 req/min, honeypot spam bot aktif. |
| **M5-01** | `t_936b17e9` | Dashboard Admin Kalender & Booking List | `coder` | `coder:frontend` | Admin | 49 | `M3-01`, `M4-03` | `app/(admin)/dashboard/page.tsx` | ✅ Selesai: Matriks 3 kursi barber, filter reservasi, 1-klik Quick Actions (Walk-in, Mulai, Kasir Selesai, No-Show), ekspor CSV 3-pos, teruji 10/10 tests pass. |
| **M5-02** | `t_570dfd3e` | WhatsApp Notification Dispatcher | `coder` | `coder:backend` | Integration | 48 | `M4-03`, `M2-03` | `lib/notifications/whatsapp.ts` | ✅ Selesai: Integrasi Fonnte/Wablas, paralel customer & barber alert terkirim dalam < 5 detik (DoD terverifikasi), 12/12 unit tests pass. |
| **M5-03** | `t_5bbad5f1` | Automated Concurrency & Booking E2E Test | `coder` | `coder:qa` | QA | 47 | `M4-04`, `M4-05`, `M5-01`, `M5-02` | `tests/concurrency.test.ts`, `tests/booking.spec.ts` | 100% skenario kritis hijau tanpa kegagalan. |
| **M5-04** | `t_e7aa4a95` | Deployment Runbook & Environment Audit | `writer` | `writer:techdocs` | Operations | 46 | `M5-01`, `M5-02` | `README.md`, `docs/DEPLOYMENT.md` | Teruji dapat dieksekusi dari fresh clone repository. |
| **M6-01** | `t_c84124f1` | Production Deploy, CI/CD & SSL Setup | `coder` | `coder:devops` | DevOps | 39 | `M5-03`, `M5-04` | GitHub Actions CI/CD & Live URL | Web app tayang di internet dengan performa tinggi & SSL aktif. |
| **M6-02** | `t_fd8f07ea` | Telemetri Konversi & No-Show Tracking | `product` | `product:metrics` | Analytics | 38 | `M6-01` | Dashboard Telemetri & Event Tracker | Funnel konversi & rasio no-show terukur transparan. |
| **M6-03** | `t_c6824d28` | Final Definition of Done (DoD) Sign-off | `orchestrator` | `orchestrator:verifier` | Release Gate | 37 | `M6-01`, `M6-02` | `docs/reports/FINAL-MVP-VERIFICATION-REPORT.md` | 8/8 poin DoD MVP IDEA.md terverifikasi 100%. |

---

## ⚡ 4. Dependency Graph & Execution Waves (DAG)

Alur eksekusi diorganisasikan menjadi 7 gelombang kerja (Waves). Setiap wave membedakan mana pekerjaan yang dapat berjalan **paralel** dan mana yang harus menunggu serah-terima sekuensial.

```mermaid
graph TD
    subgraph Wave 0 [Wave 0: Discovery & Business Locking]
        M0_01["[M0-01] WBS & DAG Linkage<br/>@orchestrator"] --> M0_02["[M0-02] PRD v1.0<br/>@product"]
        M0_01 --> M0_03["[M0-03] Market Benchmark<br/>@researcher"]
        M0_02 --> M0_04["[M0-04] Gateway & WA Feasibility<br/>@researcher"]
        M0_03 --> M0_05["[M0-05] Capacity & No-Show Model<br/>@researcher"]
        M0_02 & M0_03 & M0_04 & M0_05 --> M0_06["[M0-06] Quality Gate M0 Review<br/>@orchestrator"]
    end

    subgraph Wave 1 [Wave 1: Design System & UX Wireframing]
        M0_06 --> M1_01["[M1-01] Persona Journey<br/>@product"]
        M0_06 --> M1_02["[M1-02] Design System Token<br/>@designer"]
        M1_01 & M1_02 --> M1_03["[M1-03] Wireframe Landing & Booking<br/>@designer"]
        M1_02 & M1_03 --> M1_04["[M1-04] Interaction UX Slot & Timer<br/>@designer"]
        M1_03 & M1_04 --> M1_05["[M1-05] Audit Aksesibilitas WCAG<br/>@designer"]
    end

    subgraph Wave 2 [Wave 2: Copywriting & Content Operations]
        M1_03 --> M2_01["[M2-01] Copy Landing Hero<br/>@writer"]
        M1_03 --> M2_02["[M2-02] Brand Story Tentang Kami<br/>@writer"]
        M1_04 --> M2_03["[M2-03] Microcopy & WA Templates<br/>@writer"]
        M1_03 --> M2_04["[M2-04] SOP Admin & Barber<br/>@writer"]
    end

    subgraph Wave 3 [Wave 3: Core Implementation & Schema]
        M0_06 --> M3_01["[M3-01] Database Schema Supabase<br/>@coder"]
        M1_02 & M2_01 & M2_02 --> M3_02["[M3-02] Slicing Company Profile<br/>@coder"]
        M3_01 --> M3_03["[M3-03] API Slot Generation WIB<br/>@coder"]
        M3_02 & M3_03 & M2_03 --> M3_04["[M3-04] Multi-step Booking Form<br/>@coder"]
    end

    subgraph Wave 4 [Wave 4: Payment Engine & Concurrency Locking]
        M3_01 & M0_04 --> M4_01["[M4-01] Midtrans Snap Integration<br/>@coder"]
        M3_03 & M4_01 --> M4_02["[M4-02] Slot Lock & 15m Expire<br/>@coder"]
        M4_01 --> M4_03["[M4-03] Webhook Midtrans Verified<br/>@coder"]
        M3_04 & M4_03 --> M4_04["[M4-04] Payment Screen & Ticket<br/>@coder"]
        M4_02 & M4_03 --> M4_05["[M4-05] Concurrency & Security Audit<br/>@coder"]
    end

    subgraph Wave 5 [Wave 5: Admin Dashboard, Notifications & QA]
        M3_01 & M4_03 --> M5_01["[M5-01] Admin Dashboard Matrix<br/>@coder"]
        M4_03 & M2_03 --> M5_02["[M5-02] WhatsApp Notification Service<br/>@coder"]
        M4_04 & M4_05 & M5_01 & M5_02 --> M5_03["[M5-03] Automated Concurrency Test<br/>@coder"]
        M5_01 & M5_02 --> M5_04["[M5-04] Deployment Runbook<br/>@writer"]
    end

    subgraph Wave 6 [Wave 6: Production Launch & Verification]
        M5_03 & M5_04 --> M6_01["[M6-01] Production Deploy & SSL<br/>@coder"]
        M6_01 --> M6_02["[M6-02] Telemetri No-Show Tracking<br/>@product"]
        M6_01 & M6_02 --> M6_03["[M6-03] Final DoD Verification<br/>@orchestrator"]
    end

    classDef doneStyle fill:#1e3a1e,stroke:#4caf50,stroke-width:2px,color:#c8e6c9;
    classDef readyStyle fill:#3a2e1e,stroke:#ff9800,stroke-width:2px,color:#ffe0b2;
    classDef backlogStyle fill:#1e2530,stroke:#64b5f6,stroke-width:1px,color:#e3f2fd;

    class M0_01,M0_02,M0_03,M0_04,M0_05,M0_06 doneStyle;
    class M1_01,M1_02,M1_03,M1_04,M1_05 readyStyle;
    class M2_01,M2_02,M2_03,M2_04,M3_01,M3_02,M3_03,M3_04,M4_01,M4_02,M4_03,M4_04,M4_05,M5_01,M5_02,M5_03,M5_04,M6_01,M6_02,M6_03 backlogStyle;
```

### 🎯 Jalur Kritis (Critical Path Analysis)
Jalur kritis (rantai terpanjang yang membatasi waktu minimum peluncuran MVP) terdiri atas 11 tahapan linier:
$$\text{M0-01} \longrightarrow \text{M0-02} \longrightarrow \text{M0-04} \longrightarrow \text{M0-06} \longrightarrow \text{M3-01} \longrightarrow \text{M4-01} \longrightarrow \text{M4-03} \longrightarrow \text{M4-05} \longrightarrow \text{M5-03} \longrightarrow \text{M6-01} \longrightarrow \text{M6-03}$$
*Catatan Orchestrator*: Penundaan apa pun pada modul skema database Supabase (`M3-01`), integrasi Midtrans (`M4-01`), atau webhook verifikasi (`M4-03`) akan secara langsung menunda rilis produksi. Modul styling landing page (`M3-02`) dan copywriting berjalan di jalur sekunder paralel (buffer float time: ~3 gelombang).

---

## 🤝 5. Kontrak Serah-Terima Antar Agen (Input/Output Handoff Contracts)

Untuk mencegah deadlock atau serah-terima setengah jadi, setiap perpindahan batas divisi dikunci oleh kontrak data berikut:

| Handoff Interface | Produsen (Hulu) | Konsumen (Hilir) | Artefak yang Wajib Diserahkan | Format & Spesifikasi Standar | Kriteria Kelulusan (Gate Criteria) |
|---|---|---|---|---|---|
| **Contract-01: Baseline Bisnis** | `product`, `researcher` | `designer`, `coder` | `docs/PRD.md`, `docs/research/*.md` | Markdown terstruktur, tabel seed data 7 paket layanan. | Angka DP Rp 20rb, batas batal H-3 jam, dan toleransi 15 menit tertera eksplisit. |
| **Contract-02: Design Tokens** | `designer` | `coder:frontend` | `docs/design/DESIGN.md`, `tailwind.config.ts` | Konfigurasi Tailwind theme colors (vintage black, amber, cream), font sans/serif. | Kode warna HEX terdefinisi; lolos validasi kontras WCAG AA (> 4.5:1). |
| **Contract-03: UI Wireframes & Layout** | `designer` | `coder:frontend`, `writer` | `docs/design/wireframes.md`, `docs/design/interaction-specs.md` | Breakpoint mobile (360px) & desktop (1440px), spesifikasi form wizard. | Alur booking mobile maksimal 5 layar tanpa navigasi bertingkat rumit. |
| **Contract-04: Copywriting & Content** | `writer` | `coder:frontend`, `coder:backend` | `content/landing-copy.md`, `content/whatsapp-templates.json` | JSON key-value templates dan Markdown copy per section. | Semua placeholder teks `{{customer_name}}`, `{{booking_code}}`, `{{dp_amount}}` teruji. |
| **Contract-05: Schema & Database Types** | `coder:backend` | `coder:frontend` | `supabase/migrations/001_initial_schema.sql`, `types/database.ts` | SQL migration script + autogenerated TypeScript interfaces. | Migrasi berhasil dijalankan tanpa error di PostgreSQL Supabase. |
| **Contract-06: API Slot Engine** | `coder:backend` | `coder:frontend` | `GET /api/slots/available?date=YYYY-MM-DD&barber_id=UUID` | REST JSON Payload: `slots: [{ time: "10:00", available: true }]`. | Strict timezone Asia/Jakarta (WIB); slot istirahat/terisi otomatis excluded. |
| **Contract-07: Payment Token & Webhook** | `coder:backend` | `coder:frontend`, `coder:security` | `POST /api/booking/checkout`, `POST /api/webhooks/midtrans` | Snap token string, signature SHA-512 verification, status enum. | Terverifikasi idempoten; percobaan pembayaran kedua untuk slot yang sama ditolak. |
| **Contract-08: E2E QA Verification** | `coder:qa` | `coder:devops` | `tests/concurrency.test.ts`, test run report | Automated Playwright / Jest test suite hasil running hijau. | 0 kegagalan pada skenario double booking, timeout 15 menit, dan webhook retry. |
| **Contract-09: Deployment & Operations** | `coder:devops`, `writer` | `orchestrator`, Owner | Live Production URL, `README.md`, `docs/DEPLOYMENT.md` | HTTPS URL aktif, environment variables audit checklist (.env.example). | Website dapat diakses dari browser smartphone publik dengan response time < 1.5s. |

---

## 🛡️ 6. Matriks Risiko & Kontingensi Kebuntuan (Risk & Deadlock Contingency)

| Risiko Operasional | Kemungkinan | Dampak | Indikator Gejala | Protokol Mitigasi & Kontingensi Otomatis |
|---|:---:|:---:|---|---|
| **Circular Wait / Dependency Deadlock** | Rendah | Kritis | Task saling menunggu di status `todo` tanpa satupun yang berstatus `ready`. | **Zero-Cycle Enforcement**: Verifikasi DAG via DFS cycle check di tabel `task_links`. Dependensi hanya diperbolehkan searah dari nomor wave rendah ke wave tinggi. |
| **Worker Heartbeat Loop (Model 404/503)** | Sedang | Tinggi | Task berada di status `running` berjam-jam dengan heartbeat berkala tanpa kemajuan file. | **Reclaim & Model Pin**: Orchestrator mengeksekusi `hermes kanban reclaim <task-id>` lalu memin model fallback yang stabil (`hermes kanban set-model <task-id> ag/gemini-3.8-flash-high`) dan me-retrigger dispatch. |
| **Ephemeral Workspace Data Loss** | Tinggi | Kritis | Kode yang ditulis agen hilang setelah task dinyatakan selesai. | **Permanent Workspace Pinning**: Seluruh task dikunci dengan `--workspace dir:"C:/Users/Acer/OneDrive/Desktop/DamezBarber"`. Dilarang menggunakan scratch workspace temporer untuk task implementasi kode. |
| **Double Booking Race Condition** | Sedang | Kritis | Dua pelanggan membayar DP untuk kursi barber dan jam yang persis sama. | **PostgreSQL Row-Level Lock**: Query alokasi slot backend wajib menggunakan `SELECT FOR UPDATE` dengan exclusion constraint waktu dan status penahanan slot (`pending_payment` dengan TTL 15 menit). |
| **Payment Signature Spoofing** | Rendah | Kritis | Fake status `settlement` ditembakkan bot ke webhook tanpa pembayaran nyata. | **Strict Cryptographic Signature Verification**: Handler wajib menghitung ulang hash SHA-512 `order_id + status_code + gross_amount + ServerKey` sebelum mengubah status booking menjadi `confirmed`. |
| **WhatsApp Gateway Downtime / Banned** | Sedang | Sedang | Pesan konfirmasi gagal terkirim setelah pembayaran sukses. | **Decoupled Notification Queue & Fallback**: Webhook payment tetap menandai booking `confirmed` dan menampilkan kode tiket langsung di layar sukses (`/booking/success/[code]`), sementara notifikasi WA dimasukkan ke antrean retry dengan log kegagalan. |

---

## 🏁 7. Kriteria Gerbang Kelulusan (Quality Gates DoD)

Sesuai standar operasional AI Company Playbook, rilis akhir produk Damez Barbershop wajib memenuhi 8 butir Definition of Done (DoD) pada Milestone 6 (`TSK-M6-03`):

- [x] **Gate M0 (Discovery & Locking)**: PRD formal, benchmark layanan, audit fee gateway, dan model kapasitas tervalidasi 100% (`docs/reports/M0-quality-gate-report.md`).
- [ ] **Gate M1 (Design & Experience)**: Design system token vintage-modern terpasang, wireframe responsif 360px-1440px lengkap, audit kontras WCAG 2.1 AA lulus.
- [ ] **Gate M2 (Copywriting & Operations)**: Copywriting hero conversion siap, brand story terpasang, kamus microcopy & FAQ DP tervalidasi, SOP operasional admin tersedia.
- [ ] **Gate M3 (Core Architecture)**: Database Supabase termigrasi dengan RLS, halaman landing publik tayang, slot generation engine timezone Asia/Jakarta teruji presisi.
- [ ] **Gate M4 (Payment & Locking Engine)**: Integrasi Midtrans Snap QRIS/VA nominal Rp 20.000 aktif, temporary hold 15 menit auto-expire jalan, webhook signature SHA-512 teruji idempoten, audit anti race-condition lulus.
- [ ] **Gate M5 (Admin & E2E Validation)**: Dashboard admin dengan matriks kalender dan 1-klik aksi siap pakai, WhatsApp dispatcher otomatis jalan, 100% suite E2E concurrency test lulus hijau.
- [ ] **Gate M6 (Production Sign-off)**: Aplikasi tayang di custom domain HTTPS production, telemetri no-show aktif, dan seluruh 8 butir DoD MVP diuji langsung di browser smartphone.

