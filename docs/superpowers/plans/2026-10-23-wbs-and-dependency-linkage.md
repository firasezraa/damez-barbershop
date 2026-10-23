# WBS & Dependency Linkage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memecah kebutuhan sistem Damez Barbershop menjadi Work Breakdown Structure (WBS) 31 task granular lintas 7 milestone (M0-M6), menghubungkan dependensi Directed Acyclic Graph (DAG) bebas circular wait pada sistem Hermes Kanban, serta mengunci kontrak serah-terima artefak (handoff contract) antar spesialis agen.

**Architecture:** AI Company Multi-Agent Operating System mengkoordinasikan 6 profil agen otonom (`orchestrator`, `product`, `researcher`, `designer`, `writer`, `coder`) yang dieksekusi dalam 7 gelombang terurut (Execution Waves 0 s/d 6) dengan gerbang kendali mutu (quality gate) berbasis kontrak data eksplisit.

**Tech Stack:** Hermes Agent (Kanban Board, Multi-Profile CLI, Subagents), Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL RLS & Auth), Midtrans Payment Gateway (QRIS/VA), Fonnte/Wablas WhatsApp Gateway API.

**Spec:** `IDEA.md`, `docs/PRD.md`, `docs/reports/M0-quality-gate-report.md`, `docs/research/market-services-benchmark.md`, `docs/research/gateway-and-wa-feasibility.md`, `docs/research/slot-capacity-and-noshow-model.md`.

## Global Constraints

- Besaran Down Payment (DP): Nominal tetap Flat Rp 20.000 per booking (mengunci slot, dipotong saat pelunasan di kasir).
- Kebijakan Pembatalan / Reschedule: Maksimal H-3 jam sebelum jadwal slot; No-show = DP hangus.
- Toleransi Keterlambatan: Maksimal 15 menit. Jika lewat 15 menit tanpa konfirmasi, slot dilepas.
- Timezone Engine: Strict `Asia/Jakarta` (WIB) pada server, database, dan format tampilan.
- Payment Gateway & Fee: Midtrans Snap & Core API (QRIS fee 0.7% = Rp 140/tx; VA fee Rp 2.000-4.000).
- Notifikasi Pelanggan & Barber: WhatsApp Gateway API otomatis (< 5 detik setelah webhook settlement).
- Workspace Permanen: Seluruh task kanban wajib dijalankan pada permanent workspace `dir:C:/Users/Acer/OneDrive/Desktop/DamezBarber` guna mencegah kehilangan artefak.
- Zero Circular Wait: Hubungan parent-child pada DAG kanban wajib strictly acyclic (hanya merujuk ke task hulu yang sudah tuntas).

## Review Focus

1. **Circular Dependency Deadlock:** Tidak boleh ada relasi siklik antar-task yang menyebabkan dua worker saling menunggu (diuji dengan depth-first cycle check).
2. **Ephemeral Workspace Artifact Loss:** Task tidak boleh dijalankan di folder scratch temporer yang dihapus saat task selesai; wajib dipin ke direktori proyek lokal.
3. **Heartbeat Loop pada Model Tidak Aktif:** Profile worker tidak boleh digantung dengan model yang tidak tersedia; orchestrator wajib mereclaim dan memin ke model aktif.
4. **Data Race / Double Booking Concurrency:** Pengerjaan Coder wajib menerapkan row-level lock `SELECT FOR UPDATE` dan constraint waktu untuk mencegah dua customer mengunci satu kursi di menit yang sama.
5. **Idempotensi Webhook Pembayaran:** Webhook handler Midtrans wajib memvalidasi signature SHA-512 dan mengabaikan event duplikat tanpa menduplikasi data booking.

---

### Task 1: Verifikasi Validitas Struktur Relasi DAG & Bebas Siklus di Hermes Kanban

**Files:**
- Create: `docs/superpowers/plans/2026-10-23-wbs-and-dependency-linkage.md`
- Inspect: SQLite DB `C:/Users/Acer/AppData/Local/hermes/kanban/boards/damez-barbershop/kanban.db`
- Modify: `KANBAN.md`

**Interfaces:**
- Consumes: Skema tabel `tasks` dan `task_links` pada SQLite database `damez-barbershop`.
- Produces: Pemetaan 31 task aktif, 55 link relasi dependensi teruji acyclic, dan jalur kritis (critical path) terdefinisi.

- [x] **Step 1: Audit seluruh 31 task terdaftar dan 55 dependency link**
Query tabel `tasks` dan `task_links` pada kanban board untuk memastikan semua task terdaftar dengan assignee profile valid (`orchestrator`, `product`, `researcher`, `designer`, `writer`, `coder`).

- [x] **Step 2: Jalankan deteksi circular wait (Cycle Detection)**
Verifikasi algoritma graf terarah (DFS cycle check). Hasil: 0 cycle, seluruh 55 edge bergerak searah dari M0 menuju M6.

- [x] **Step 3: Identifikasi Jalur Kritis (Critical Path)**
Petakan rantai dependensi terpanjang yang menentukan batas minimum waktu peluncuran:
`TSK-M0-01` -> `TSK-M0-02` -> `TSK-M0-04` -> `TSK-M0-06` -> `TSK-M3-01` -> `TSK-M4-01` -> `TSK-M4-03` -> `TSK-M4-05` -> `TSK-M5-03` -> `TSK-M6-01` -> `TSK-M6-03`.

---

### Task 2: Penyusunan Dokumen Master KANBAN.md

**Files:**
- Modify: `KANBAN.md` (root directory)

**Interfaces:**
- Consumes: Deliverables M0 (`docs/PRD.md`, `docs/research/`, `docs/reports/M0-quality-gate-report.md`) dan ketetapan bisnis owner di `IDEA.md`.
- Produces: Dokumen kanban komprehensif mencakup tabel WBS 31 task, visualisasi gelombang eksekusi (Waves), diagram Mermaid DAG, kontrak serah-terima (I/O contracts), dan matriks risiko.

- [x] **Step 1: Tuliskan WBS Table Lengkap 31 Task**
Sertakan kolom WBS ID, Kanban ID, Title, Assignee Profile, Sub-agent Persona, Assigned Skills, Category, Priority, Dependencies, Deliverable, dan Definition of Done.

- [x] **Step 2: Petakan Gelombang Pengerjaan (Execution Waves 0-6)**
Uraikan pembagian fase paralel vs sekuensial agar tim Product, Designer, Writer, dan Coder mengetahui kapan gilirannya dapat dimulai tanpa blocking.

- [x] **Step 3: Rumuskan Kontrak Serah-Terima (Handoff Quality Gates)**
Tentukan artefak input spesifik yang harus ada dan tervalidasi sebelum agen hilir memulai pekerjaannya.

- [x] **Step 4: Susun Matriks Risiko & Kontingensi Kebuntuan (Risk & Deadlock Contingency)**
Dokumentasikan penanganan kegagalan agen, model timeout/backoff, penanganan race condition, dan mitigasi webhook ganda.

---

### Task 3: Finalisasi Status Task M0-01 dan Handoff Milestone 1

**Files:**
- Modify: State internal task `t_2f541ed2` via `kanban_complete`.

**Interfaces:**
- Consumes: `KANBAN.md` terverifikasi dan `docs/superpowers/plans/2026-10-23-wbs-and-dependency-linkage.md`.
- Produces: State `completed` pada task `t_2f541ed2`, meng-unblock task hilir di sistem Hermes Kanban.

- [x] **Step 1: Validasi keberadaan file artefak di disk lokal**
Pastikan `KANBAN.md` dan dokumen rencana telah tersimpan permanen di direktori proyek.

- [ ] **Step 2: Eksekusi penyelesaian task melalui tool kanban_complete**
Panggil `kanban_complete(summary=..., metadata=...)` dengan catatan handoff yang jelas.
