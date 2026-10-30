# Damez Barbershop v2 — R0 Fondasi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun fondasi repo `damez-barbershop-v2` yang bisa diverifikasi: Next.js 16 + TS strict, Tailwind v4 satu sumber token, Vitest + Playwright, Postgres 16 lokal, skema inti dengan constraint GiST, seed data, lint batas modul, dan CI 6 tahap.

**Architecture:** Repo baru, bukan branch dari v1. Skema DB ditulis ulang (SQL migrasi biasa) dengan `EXCLUDE USING gist` dipertahankan apa adanya. Migrasi dijalankan oleh runner sendiri berbasis `pg` (tanpa Docker, tanpa Supabase CLI). Verifikasi dijalankan terhadap Postgres nyata, bukan `pg-mem`. Boundary modul ditegakkan lint rule yang sendirinya diuji.

**Tech Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 5.x strict · Tailwind v4 CSS-first · `pg` 8 · Zod 4 · Vitest 3 (+ cobertura v8) · Playwright 1.5x · ESLint 9 flat config · GitHub Actions · Postgres 16 (apt lokal, `postgres:16` service di CI)

**Spec:** `IDEA.md` (root repo ini) — dokumen desain terkunci. Keputusan tambahan dicatat di §14 dan bagian "Keputusan Dikunci".

**Lokasi repo (keputusan Firas, mengganti §14.1 default):** v2 dikerjakan di repo `firasezraa/damez-barbershop` **branch `dev`**, menggantikan pohon v1 di branch itu dalam satu commit `refactor: replace v1 tree with v2 foundation`. v1 tetap utuh di `main` dan ditandai tag `v1-archive`. Tidak ada `git push --force`.

**Roadmap (plan terpisah per milestone, satu gate per plan):**

| Plan | Isi | Gate |
|---|---|---|
| **R0 (dokumen ini)** | fondasi, skema, seed, CI | `npm run verify` hijau lokal + CI; migrasi naik dari nol di DB kosong |
| R1 | Supabase Auth cookie, `middleware.ts`, `requireAdmin()`, RLS + test negatif | `/api/admin/*` → 401 tanpa sesi, 403 role salah; anon key tidak bisa baca tabel sensitif |
| R2 | Landing + wizard booking, slot engine + staggered break, hold 15 menit, worker expire | booking end-to-end internal; 2 pelanggan tidak bisa ambil slot sama di HTTP level |
| R3 | Midtrans Snap, webhook SHA-512 idempoten, tiket, notifikasi WA + queue retry | alur DP penuh `MOCK_MIDTRANS=true`; replay webhook tidak menduplikasi data |
| R4 | Dashboard kasir: matriks 3 kursi, walk-in, potong DP, no-show, tutup kas, CSV, telemetri | SOP kasir dieksekusi Playwright; CSV cocok dengan total di layar |
| R5 | rate limit persisten, bot protection, a11y audit, uji beban, runbook DR | semua gate §9 hijau, 0 temuan kritis |

## Global Constraints

Nilai-nilai ini berlaku untuk semua task, disalin verbatim dari `IDEA.md` §3, §5, §9, §10:

- DP flat **Rp 20.000** (`20000`) per booking; dipotong dari total saat pelunasan; client tidak pernah mengirim nominal DP.
- Hold slot **15 menit** = `900` detik, auto-expire.
- Batas batal/reschedule **H-3 jam** = `3` jam.
- Toleransi keterlambatan **15 menit**; lewat itu `no_show`, slot dilepas, DP hangus.
- **3 kursi**, 3 barber; jam operasional **10:00–21:00 WIB**.
- Zona waktu **`Asia/Jakarta`** di DB, server, dan tampilan. DB menyimpan `timestamptz` (UTC) — konversi hanya di boundary.
- Grid slot **15 menit**, buffer sterilisasi **10 menit**, minimum lead time **30 menit** sebelum jadwal.
- Constraint anti double-booking wajib ada apa adanya:
  ```sql
  CONSTRAINT no_overlapping_active_bookings EXCLUDE USING gist (
      barber_id WITH =,
      booking_range WITH &&
  ) WHERE (status IN ('pending_payment','confirmed','in_progress'))
  ```
- Test DB = **Postgres 16 nyata** (apt lokal + service container `postgres:16` di CI). Dilarang `pg-mem`.
- Tidak ada test yang lulus tanpa assertion. Tidak ada berkas sumber > 800 baris tanpa alasan tertulis.
- Coverage ≥ 80% baris pada `src/lib/**` dan `src/features/*/queries/**`.
- Bahasa UI: Indonesia. Template WhatsApp: 0 emoji. Nama berkas/identifier/skema: Inggris `snake_case`.
- Node **22.23.4**, npm **12.2.1**.
- Registry npm proyek dikunci lewat `.npmrc` proyek (VPS ini defaultnya `mirrors.tencentyun.com`, yang pernah menggagalkan build Vercel di proyek lain).

**Keputusan agen (bukan dari Firas — bisa dibatalkan):**

1. Nama kolom/tabel Inggris `snake_case` (`full_name`, `phone_e164`, `total_idr`, `dp_idr`, `expires_at`), bukan label Indonesia literal `IDEA.md` §6 (`nama`, `nomor_wa`, `total_harga`, `nominal_dp`, `expired_at`). Alasan: konsisten dengan enum & status yang sudah Inggris, dan cocok dengan tipe hasil generate Supabase. Pemetaan: `nama`→`full_name`, `nomor_wa`→`phone_e164`, `kode`→`booking_code`, `harga`→`price_idr`, `durasi_menit`→`duration_minutes`, `aktif`→`is_active`, `urutan`→`display_order`, `total_harga`→`total_idr`, `nominal_dp`→`dp_idr`, `expired_at`→`hold_expires_at`.
2. Satu set ikon: `lucide-react`. Tabler dibuang.
3. Token warna: tema gelap tunggal — `--color-ink #0B0B0C`, `--color-surface #141417`, `--color-surface-2 #1D1D21`, `--color-brass #C8A24A` (aksen), `--color-text #F5F1E8`, `--color-muted #9A958C`, `--color-danger #D9534F`, `--color-ok #4E9F6A`. Belum ada brand kit dari owner.

## Review Focus

Kelas input/kegagalan yang spec tidak sebut tapi berbahaya kalau salah. Tiap baris punya test di task pemiliknya; task R0 yang bisa menutupinya ditandai.

1. **Waktu melewati tengah malam / batas tutup.** Booking 20:45 dengan durasi 60 menit melewati 21:00 dan tengah malam — sistem harus menolak, bukan membuat `booking_range` yang membentang ke hari berikutnya. (owner: R2 slot engine; R0 menegakkan hanya lewat CHECK `end_time > start_time` + test "slot terakhir 20:45 dengan layanan 60 menit ditolak")
2. **Dua hold paralel pada slot identik.** 20 request bersamaan ke barber sama/jam sama → tepat 1 berhasil. (owner: R0.7, test konkurensi DB nyata)
3. **Booking bersebelahan (end == start) tidak boleh dianggap bentrok** karena buffer 10 menit ada di dalam `end_time`. (owner: R0.6)
4. **Hold kedaluwarsa yang dipakai ulang.** Checkout setelah `hold_expires_at` → transisi status tepat sekali, tidak merilis slot dua kali, tidak menaikkan TTL. (owner: R3; R0 menegakkan `fn_expire_stale_holds` idempoten)
5. **Harga/DP dari client.** Payload berisi total palsu → server hitung ulang dari `services`, simpan nilai otoritatif, catat percobaan tamper. (owner: R0.7, test "total palsu diabaikan")

---

### Task R0.1: Inisialisasi repo & toolchain

**Files:**
- Create: `.gitignore`, `.npmrc`, `package.json`, `tsconfig.json`, `next.config.ts`, `README.md`

**Interfaces:**
- Consumes: —
- Produces: skrip npm yang dipakai semua task berikutnya — `dev`, `build`, `start`, `typecheck`, `lint`, `test:unit`, `test:integration`, `test:e2e`, `migrate`, `seed`, `verify`.

- [ ] **Step 1: Ganti pohon v1 dengan fondasi v2**

Repo sudah diinisialisasi di `/home/ubuntu/project-utama/damez-barbershop-v2` dengan `origin = https://github.com/firasezraa/damez-barbershop.git`, di branch `dev` (mengikuti keputusan Firas: v2 masuk ke repo v1 branch `dev`, bukan repo baru). Commit pertama = hapus pohon v1 + tambah fondasi v2:

```bash
cd /home/ubuntu/project-utama/damez-barbershop-v2
# hapus pohon v1 (v1 utuh di main + tag v1-archive)
rm -rf app components lib tests types scripts supabase .github \
       KANBAN.md preview-enhanced.html next.config.mjs postcss.config.mjs \
       tailwind.config.ts tsconfig.json vercel.json package.json package-lock.json \
       README.md .env.example .gitignore
# docs v1: sisakan yang diambil alih saja (task R0.13)
git rm -r --cached docs >/dev/null 2>&1 || true
```

Catatan: `docs/` v1 dihapus dari branch ini kecuali item di task R0.13. `content/` dipertahankan.

- [ ] **Step 2: Cek rute registry npm**

```bash
curl -s -o /dev/null -w '%{http_code} %{time_total}s\n' https://registry.npmjs.org/next
```

Expected: `200` dan waktu < 10s. Kalau gagal/timeout, pakai `https://mirrors.tencentyun.com/npm` dan catat di README.

- [ ] **Step 2: Tulis `.npmrc` proyek**

```
registry=https://registry.npmjs.org/
audit=false
fund=false
```

- [ ] **Step 3: Tulis `.gitignore`**

```
node_modules/
.next/
out/
build/
coverage/
playwright-report/
test-results/
.env
.env.local
.vercel
*.log
supabase/.temp/
```

- [ ] **Step 4: Tulis `package.json`**

Scripts wajib persis ini (nilai versi pakai rentang aman; commit `package-lock.json`):

```json
{
  "name": "damez-barbershop-v2",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.0.0" },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "coverage": "vitest run --coverage",
    "migrate": "node --experimental-strip-types scripts/migrate.ts",
    "seed": "node --experimental-strip-types scripts/seed.ts",
    "verify": "npm run typecheck && npm run lint && npm run coverage && npm run test:integration && npm run build"
  },
  "dependencies": {
    "next": "16.4.2",
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "@supabase/supabase-js": "^2.49.1",
    "@supabase/ssr": "^0.7.0",
    "pg": "^8.16.0",
    "zod": "^4.1.0",
    "lucide-react": "^1.61.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.7.0",
    "server-only": "^0.0.1",
    "midtrans-client": "^1.4.3"
  },
  "devDependencies": {
    "@playwright/test": "^1.56.0",
    "@tailwindcss/postcss": "^4.3.3",
    "@types/node": "^22.13.9",
    "@types/pg": "^8.15.5",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitest/coverage-v8": "^3.2.0",
    "eslint": "^9.30.0",
    "eslint-config-next": "16.4.2",
    "tailwindcss": "^4.3.3",
    "typescript": "^5.8.2",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 5: Tulis `tsconfig.json` (strict penuh)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 6: Tulis `next.config.ts` minimal** (`const nextConfig = {} satisfies import('next').NextConfig; export default nextConfig;`) — jangan aktifkan tipe ketat Next dulu; itu ditambahkan setelah `next build` pertama hijau.

- [ ] **Step 7: Install & verifikasi typecheck**

```bash
npm install
npm run typecheck
```

Expected: exit 0. `npm install` selesai tanpa error registry.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: bootstrap Next.js 16 + TypeScript strict toolchain"
```

---

### Task R0.2: App shell + Tailwind v4 satu sumber token

**Files:**
- Create: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `postcss.config.mjs`
- Modify: —

**Interfaces:**
- Consumes: toolchain R0.1
- Produces: token CSS yang dipakai seluruh milestone — nama variabel persis: `--color-ink`, `--color-surface`, `--color-surface-2`, `--color-brass`, `--color-text`, `--color-muted`, `--color-danger`, `--color-ok`, `--radius-card`, `--font-display`, `--font-body`. `src/app/layout.tsx` mengekspor default `RootLayout`.

- [ ] **Step 1: Tulis `src/app/globals.css`** dengan `@import "tailwindcss";` dan satu blok `@theme { ... }`. Nilai token persis:

```css
@import "tailwindcss";

@theme {
  --color-ink: #0B0B0C;
  --color-surface: #141417;
  --color-surface-2: #1D1D21;
  --color-brass: #C8A24A;
  --color-text: #F5F1E8;
  --color-muted: #9A958C;
  --color-danger: #D9534F;
  --color-ok: #4E9F6A;
  --radius-card: 0.875rem;
  --font-display: var(--font-plus-jakarta), system-ui, sans-serif;
  --font-body: var(--font-inter), system-ui, sans-serif;
}
```

Font di-load lewat `next/font/google` di layout. Tidak ada `tailwind.config.ts` di repo — kalau ada, hapus.

- [ ] **Step 2: Tulis `src/app/layout.tsx`** — `html lang="id"`, `<body className="bg-ink text-text font-body antialiased">`, font Plus Jakarta Sans (display) + Inter (body) via `next/font/google`, export `metadata` dengan `title: "Damez Barbershop — Senopati, Jakarta Selatan"`.

- [ ] **Step 3: Tulis `src/app/page.tsx`** — placeholder minimal (heading "Damez Barbershop", satu paragraf). Landing sebenarnya milik R2.

- [ ] **Step 4: Tulis `postcss.config.mjs`**

```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

- [ ] **Step 5: Verifikasi build + token tunggal**

```bash
grep -rn "tailwind.config" --include="*.ts" --include="*.mjs" --include="*.json" . --exclude-dir=node_modules | grep -v package-lock
npm run build
```

Expected: grep kosong (0 hasil); `next build` exit 0. Kalau OOM di VPS ini, jalankan `NODE_OPTIONS=--max-old-space-size=1024 npm run build` dan catat di README.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(ui): add app shell with single-source Tailwind v4 theme tokens"
```

---

### Task R0.3: Vitest + coverage gate + konstanta bisnis terkunci

**Files:**
- Create: `vitest.config.ts`, `src/lib/config/constants.ts`, `tests/unit/constants.test.ts`
- Modify: —

**Interfaces:**
- Consumes: toolchain R0.1
- Produces: `src/lib/config/constants.ts` mengekspor (nama persis, semua `as const`):
  `DOWN_PAYMENT_IDR = 20000`, `HOLD_TTL_SECONDS = 900`, `CANCEL_CUTOFF_HOURS = 3`, `LATE_TOLERANCE_MINUTES = 15`, `CHAIR_COUNT = 3`, `OPENING_HOUR = 10`, `CLOSING_HOUR = 21`, `TIMEZONE = "Asia/Jakarta"`, `SLOT_GRID_STEP_MINUTES = 15`, `TURNAROUND_BUFFER_MINUTES = 10`, `MIN_LEAD_TIME_MINUTES = 30`, `MAX_ACTIVE_HOLDS_PER_PHONE = 2`.

- [ ] **Step 1: Tulis test yang gagal** `tests/unit/constants.test.ts`

```ts
import { describe, expect, it } from "vitest";
import * as C from "../../src/lib/config/constants.ts";

describe("business baseline (IDEA.md §3)", () => {
  it("locks the flat down payment at Rp 20.000", () => {
    expect(C.DOWN_PAYMENT_IDR).toBe(20000);
  });
  it("locks the hold TTL at 15 minutes", () => {
    expect(C.HOLD_TTL_SECONDS).toBe(900);
  });
  it("locks the cancellation cutoff at H-3 hours", () => {
    expect(C.CANCEL_CUTOFF_HOURS).toBe(3);
  });
  it("locks late tolerance at 15 minutes", () => {
    expect(C.LATE_TOLERANCE_MINUTES).toBe(15);
  });
  it("locks 3 chairs, 10:00-21:00 Asia/Jakarta", () => {
    expect(C.CHAIR_COUNT).toBe(3);
    expect(C.OPENING_HOUR).toBe(10);
    expect(C.CLOSING_HOUR).toBe(21);
    expect(C.TIMEZONE).toBe("Asia/Jakarta");
  });
  it("locks the slot grid, buffer and lead time", () => {
    expect(C.SLOT_GRID_STEP_MINUTES).toBe(15);
    expect(C.TURNAROUND_BUFFER_MINUTES).toBe(10);
    expect(C.MIN_LEAD_TIME_MINUTES).toBe(30);
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

```bash
npx vitest run tests/unit/constants.test.ts
```

Expected: FAIL — `Failed to resolve import "../../src/lib/config/constants.ts"`.

- [ ] **Step 3: Tulis `src/lib/config/constants.ts`** dengan 12 konstanta di blok Interfaces, tiap satu komentar `/** IDEA.md §3 — jangan diubah tanpa persetujuan owner. */`.

- [ ] **Step 4: Tulis `vitest.config.ts`** — dua project (`unit` → `tests/unit`, environment node; `integration` → `tests/integration`, environment node, `fileParallelism: false` karena berbagi DB), plus:

```ts
coverage: {
  provider: "v8",
  include: ["src/lib/**/*.ts", "src/features/*/queries/**/*.ts"],
  exclude: ["src/lib/db/server.ts"],
  thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
}
```

Alasan tertulis untuk exclude (wajib ada sebagai komentar di config): `src/lib/db/server.ts` mengimpor `server-only` yang melempar di luar runtime React Server, jadi tidak bisa di-import dari Vitest. Berkas itu baru ada di R1.

- [ ] **Step 5: Jalankan, pastikan lulus**

```bash
npx vitest run tests/unit/constants.test.ts
npm run coverage
```

Expected: 6 test PASS; coverage exit 0.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "test: add vitest with coverage gate and lock business constants"
```

---

### Task R0.4: Skema env (Zod) + pool Postgres

**Files:**
- Create: `src/lib/config/env.ts`, `src/lib/db/pg.ts`, `.env.example`, `tests/unit/env.test.ts`
- Modify: —

**Interfaces:**
- Consumes: `constants.ts` (tidak langsung)
- Produces:
  - `src/lib/config/env.ts`: `export const serverEnvSchema: z.ZodType<ServerEnv>` dan `export function readServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv` — melempar `Error` dengan daftar nama variabel yang gagal, **tanpa pernah** mencetak nilainya. `ServerEnv` = `{ DATABASE_URL: string; NEXT_PUBLIC_SUPABASE_URL: string; NEXT_PUBLIC_SUPABASE_ANON_KEY: string; SUPABASE_SERVICE_ROLE_KEY: string; MIDTRANS_SERVER_KEY: string; MOCK_MIDTRANS: boolean; MOCK_WHATSAPP: boolean; CRON_SECRET: string }`.
  - `src/lib/db/pg.ts`: `export function createPgPool(connectionString: string, max = 5): Pool` (dari `pg`). Transaksi eksplisit ditambahkan di R3 saat webhook membutuhkannya — jangan sekarang (YAGNI + coverage gate).

- [ ] **Step 1: Tulis test yang gagal** `tests/unit/env.test.ts` — assertion wajib: (a) source tanpa `DATABASE_URL` → `toThrow(/DATABASE_URL/)`; (b) `MOCK_MIDTRANS: "yes"` → throw menyebut `MOCK_MIDTRANS`; (c) source valid lengkap → `readServerEnv(src).MOCK_MIDTRANS === true` dan `=== false` untuk `"false"`; (d) pesan error tidak memuat nilai variabel (`expect(msg).not.toContain("postgres://")`).

- [ ] **Step 2: Jalankan, pastikan gagal**

```bash
npx vitest run tests/unit/env.test.ts
```

Expected: FAIL resolve import.

- [ ] **Step 3: Implement `src/lib/config/env.ts`** — Zod: `DATABASE_URL: z.string().url()`, `MOCK_MIDTRANS`/`MOCK_WHATSAPP` pakai `z.enum(["true","false"]).default("false").transform(v => v === "true")`, `CRON_SECRET: z.string().min(16)`. Error dibentuk dari `issues.map(i => i.path.join("."))`.

- [ ] **Step 4: Implement `src/lib/db/pg.ts`** — `new Pool({ connectionString, max })` saja. Tidak ada `console.log`.

- [ ] **Step 5: Tulis `.env.example`** — semua kunci dari `ServerEnv` plus `NEXT_PUBLIC_SITE_URL`, `MIDTRANS_CLIENT_KEY`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`, `WHATSAPP_GATEWAY_PROVIDER`, `FONNTE_TOKEN`, `WABLAS_TOKEN`, `WHATSAPP_TIMEOUT_MS`, komentar satu baris per kunci. Nilai contoh **kosong**, tanpa secret asli.

- [ ] **Step 6: Jalankan, pastikan lulus**

```bash
npx vitest run tests/unit/env.test.ts && npm run typecheck
```

Expected: PASS, typecheck exit 0.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(config): add zod-validated env schema and pg pool helpers"
```

---

### Task R0.5: Runner migrasi (SQL murni, tanpa Docker)

**Files:**
- Create: `scripts/migrate-lib.ts`, `scripts/migrate.ts`, `tests/unit/migrate-lib.test.ts`, `tests/integration/migrate-runner.test.ts`, `tests/helpers/db.ts`, `scripts/pg-local-setup.sh`
- Modify: —

**Interfaces:**
- Consumes: `createPgPool` (R0.4)
- Produces:
  - `scripts/migrate-lib.ts`: `export function splitSqlStatements(sql: string): string[]`, `export function sortMigrationFiles(names: string[]): string[]` (urut leksikografis berdasarkan prefix numerik 4 digit), `export function checksum(sql: string): string` (sha256 hex).
  - `scripts/migrate.ts`: CLI, `DATABASE_URL` dari env, exit 1 dengan pesan jelas kalau ada migrasi terapan yang checksum-nya berubah.
  - `tests/helpers/db.ts`: `export async function resetTestDb(): Promise<Pool>` — drop schema `public` cascade, create ulang, jalankan semua migrasi dari nol, kembalikan pool; `export function testDatabaseUrl(): string` (dari `TEST_DATABASE_URL`).

- [ ] **Step 1: Pasang Postgres 16 lokal**

```bash
bash -c 'sudo apt-get update -qq && sudo apt-get install -y -qq postgresql-16'
sudo -u postgres psql -c "CREATE ROLE damez LOGIN PASSWORD 'damez' SUPERUSER;"
sudo -u postgres createdb -O damez damez_dev
sudo -u postgres createdb -O damez damez_test
psql "postgresql://damez:damez@127.0.0.1:5432/damez_test" -c 'select version();'
```

Expected: baris versi `PostgreSQL 16.15`. Kalau `apt-get` gagal, STOP — laporkan, jangan ganti ke `pg-mem`.

- [ ] **Step 2: Tulis test unit yang gagal** `tests/unit/migrate-lib.test.ts` — assertion wajib: (a) `splitSqlStatements` pada fixture berisi `CREATE FUNCTION f() RETURNS int AS $$ BEGIN RETURN 1; END; $$ LANGUAGE plpgsql;` menghasilkan **1** statement, bukan terpotong di `;` dalam `$$`; (b) dua statement dipisah `;` pada baris baru → 2 elemen; (c) komentar `-- ...` dan baris kosong dibuang; (d) `sortMigrationFiles(["0010_b.sql","0002_a.sql","0001_a.sql"])` → `["0001_a.sql","0002_a.sql","0010_b.sql"]`; (e) `checksum` stabil untuk input sama dan beda untuk input beda.

- [ ] **Step 3: Jalankan, pastikan gagal**

```bash
npx vitest run tests/unit/migrate-lib.test.ts
```

Expected: FAIL resolve import.

- [ ] **Step 4: Implement `scripts/migrate-lib.ts`** — pemindai karakter yang melacak state: di dalam `$$`/`$tag$`, di dalam `'...'`, di dalam `--` komentar, di dalam `/* */`. Statement dipisah hanya di `;` level teratas.

- [ ] **Step 5: Jalankan, pastikan lulus**

```bash
npx vitest run tests/unit/migrate-lib.test.ts
```

Expected: PASS.

- [ ] **Step 6: Tulis test integrasi yang gagal** `tests/integration/migrate-runner.test.ts` — assertion wajib: (a) DB kosong → setelah `resetTestDb()` tabel `public.schema_migrations` ada dan berisi 3 baris `version` (`0001_core_schema.sql`, `0002_slot_hold.sql`, `0003_audit_rate_limit.sql`); (b) menjalankan runner dua kali tidak menambah baris dan tidak error; (c) mengubah isi berkas migrasi yang sudah terterap → runner exit non-zero dan pesan menyebut nama berkas (`checksum mismatch`).

- [ ] **Step 7: Implement `scripts/migrate.ts`** — baca `supabase/migrations/*.sql`, buat tabel `schema_migrations (version text primary key, checksum text not null, applied_at timestamptz not null default now())` bila belum ada, terapkan yang belum ada satu transaksi per berkas, `console.error` lalu `process.exit(1)` pada mismatch. Ini satu-satunya tempat `console.*` diizinkan (CLI), dan bukan `console.log` di kode app.

- [ ] **Step 8: Jalankan, pastikan lulus**

```bash
TEST_DATABASE_URL="postgresql://damez:damez@127.0.0.1:5432/damez_test" npx vitest run tests/integration/migrate-runner.test.ts
```

Expected: PASS (test ini butuh migrasi R0.6–R0.8 sudah ada; kalau belum, jalankan task R0.6–R0.8 dulu lalu kembali ke step ini).

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat(db): add sql migration runner with checksums and local postgres bootstrap"
```

---

### Task R0.6: Migrasi 0001 — skema inti + constraint GiST

**Files:**
- Create: `supabase/migrations/0001_core_schema.sql`, `tests/integration/schema.test.ts`, `tests/integration/exclusion-constraint.test.ts`
- Modify: —

**Interfaces:**
- Consumes: `resetTestDb()` (R0.5)
- Produces: tabel & kolom yang dipakai semua milestone. Nama persis:
  `extensions: uuid-ossp, pgcrypto, btree_gist`
  `enums: booking_status_enum (pending_payment|confirmed|in_progress|completed|cancelled|no_show|expired), booking_type_enum (online|walk_in), payment_status_enum (pending|paid|failed|expired|refunded), settlement_method_enum (none|cash|qris|transfer)`
  `tables: barbers, services, working_hours, blocked_slots, customers, bookings, booking_services, payments, settings, notifications, audit_log`
  Kolom kunci `bookings`: `id uuid pk`, `booking_code varchar(30) unique not null`, `customer_id uuid null references customers(id) on delete set null`, `full_name varchar(100) not null`, `phone_e164 varchar(20) not null`, `barber_id uuid not null references barbers(id) on delete restrict`, `booking_type booking_type_enum not null default 'online'`, `status booking_status_enum not null default 'pending_payment'`, `start_time timestamptz not null`, `end_time timestamptz not null`, `service_duration_minutes int not null`, `buffer_minutes int not null default 10`, `booking_range tstzrange generated always as (tstzrange(start_time, end_time, '[)')) stored`, `total_idr int not null`, `dp_idr int not null default 20000`, `remaining_idr int not null`, `hold_expires_at timestamptz`, `confirmed_at`, `completed_at`, `cancelled_at`, `cancellation_reason text`, `no_show_at timestamptz`, `notes text`, `created_at`, `updated_at`.

- [ ] **Step 1: Tulis test integrasi yang gagal** `tests/integration/schema.test.ts` — assertion wajib: (a) 11 tabel ada di `information_schema.tables`; (b) `bookings.booking_range` ada dan `is_generated = 'ALWAYS'`; (c) `payments.idempotency_key` punya unique constraint (`pg_constraint.contype = 'u'`); (d) `booking_range` untuk `start 10:00, end 11:00` = `["10:00","11:00")`.

- [ ] **Step 2: Jalankan, pastikan gagal**

```bash
TEST_DATABASE_URL=... npx vitest run tests/integration/schema.test.ts
```

Expected: FAIL — tabel tidak ada.

- [ ] **Step 3: Tulis `supabase/migrations/0001_core_schema.sql`** — satu blok `DO $$ ... EXCEPTION WHEN duplicate_object ... $$` untuk tiap `CREATE TYPE` (migrasi harus bisa dijalankan ulang setelah `drop schema public cascade`), `CREATE TABLE ... ` untuk 11 tabel, `ENABLE ROW LEVEL SECURITY` untuk `bookings`, `payments`, `customers`, `audit_log`, `settings`, `notifications` (kebijakan RLS ditulis di R1; di R0 cukup RLS aktif), tiap tabel transaksional punya `created_at`/`updated_at` + trigger `fn_set_updated_at()`. Constraint GiST verbatim dari Global Constraints. **Tidak ada INSERT data di berkas ini** — seed terpisah di R0.9.

- [ ] **Step 4: Tulis test integrasi yang gagal** `tests/integration/exclusion-constraint.test.ts` — assertion wajib, tiap satu test:
  (a) insert booking `pending_payment` barber X 10:00–11:00 lalu insert kedua barber X 10:30–11:30 → throw dengan `err.code === "23P01"`;
  (b) barber berbeda, rentang sama → sukses (2 baris);
  (c) booking bersebelahan `10:00–11:00` lalu `11:00–12:00` barber sama → sukses (Review Focus #3);
  (d) booking `cancelled` yang overlap → sukses;
  (e) `end_time <= start_time` → throw `23514` (CHECK).

- [ ] **Step 5: Jalankan, pastikan lulus**

```bash
TEST_DATABASE_URL=... npx vitest run tests/integration/schema.test.ts tests/integration/exclusion-constraint.test.ts
```

Expected: semua PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(db): add core schema with gist exclusion anti-double-booking"
```

---

### Task R0.7: Migrasi 0002 — hold 15 menit, expiry, anti-hoarding, harga otoritatif

**Files:**
- Create: `supabase/migrations/0002_slot_hold.sql`, `tests/integration/hold.test.ts`
- Modify: —

**Interfaces:**
- Consumes: `bookings`, `services`, `customers` (R0.6); `DOWN_PAYMENT_IDR`/`HOLD_TTL_SECONDS` (R0.3)
- Produces (dipakai R2 lewat `features/slots/queries`):
  - `public.fn_create_booking_hold(p_full_name varchar, p_phone_e164 varchar, p_barber_id uuid, p_start_time timestamptz, p_service_ids uuid[], p_booking_type booking_type_enum default 'online', p_notes text default null) returns jsonb` — sukses: `{success:true, booking_id, booking_code, hold_expires_at, total_idr, dp_idr, remaining_idr}`; gagal: `{success:false, error, message}` dengan `error ∈ {BARBER_NOT_FOUND, SLOT_TAKEN, MAX_ACTIVE_HOLDS_EXCEEDED, INVALID_SERVICE}`. Tidak ada parameter harga maupun waktu selesai dari client — server menghitung keduanya.
  - `public.fn_expire_stale_holds() returns integer` — jumlah baris yang ditandai `expired`.
  - `public.fn_hold_is_active(p_booking_id uuid) returns boolean`.

- [ ] **Step 1: Tulis test integrasi yang gagal** `tests/integration/hold.test.ts` — assertion wajib:
  (a) hold sukses → `hold_expires_at - now()` dalam rentang 895–905 detik;
  (b) `dp_idr === 20000` dan `total_idr === SUM(price_idr)` layanan yang diminta, `remaining_idr === total_idr - 20000`;
  (c) **Review Focus #2/#5:** 20 `Promise.all` hold slot identik barber sama → tepat 1 `success:true`, 19 dengan `error === "SLOT_TAKEN"` atau error Postgres `23P01`, dan **tepat 1 baris** aktif di `bookings`;
  (d) hold ke-3 dari nomor yang sama (2 aktif) → `error === "MAX_ACTIVE_HOLDS_EXCEEDED"`;
  (e) `pg_proc` untuk `fn_create_booking_hold` punya tepat **7** parameter dan tidak ada parameter bernama `total`/`price`/`end_time` (bukti total & durasi tidak bisa dititipkan client);
  (f) `fn_expire_stale_holds()` dipanggil dua kali → return `1` lalu `0`, status baris jadi `expired`, dan slotnya bisa di-hold ulang (Review Focus #4, level DB).

- [ ] **Step 2: Jalankan, pastikan gagal**

```bash
TEST_DATABASE_URL=... npx vitest run tests/integration/hold.test.ts
```

Expected: FAIL — `function public.fn_create_booking_hold(...) does not exist`.

- [ ] **Step 3: Implement `supabase/migrations/0002_slot_hold.sql`** — urutan di dalam fungsi: (1) `SELECT ... FROM barbers WHERE id = p_barber_id AND is_active FOR UPDATE`; (2) `pg_advisory_xact_lock(hashtext(p_barber_id::text || p_start_time::text))`; (3) `PERFORM fn_expire_stale_holds()`; (4) hitung total & durasi dari `services` (abaikan apa pun dari client, tolak bila ada `service_id` tidak dikenal → `INVALID_SERVICE`); (5) `end_time` = `p_start_time + durasi layanan + buffer 10 menit` — server yang menghitung, client tidak mengirim waktu selesai; (6) cek anti-hoarding `MAX_ACTIVE_HOLDS_PER_PHONE = 2`; (7) INSERT booking + `booking_services` (`price_snapshot_idr`, `duration_snapshot_minutes`); (8) `EXCEPTION WHEN exclusion_violation THEN` kembalikan `SLOT_TAKEN`. `booking_code` dari `nextval` + prefix tanggal Jakarta, format `DMZ-YYYYMMDD-XXXX`.

- [ ] **Step 4: Jalankan, pastikan lulus**

```bash
TEST_DATABASE_URL=... npx vitest run tests/integration/hold.test.ts
```

Expected: 6 test PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(db): add atomic 15-minute booking hold with anti-haarding and server-side pricing"
```

---

### Task R0.8: Migrasi 0003 — audit_log append-only + rate limit persisten

**Files:**
- Create: `supabase/migrations/0003_audit_rate_limit.sql`, `tests/integration/audit-rate-limit.test.ts`
- Modify: —

**Interfaces:**
- Consumes: `bookings` (R0.6)
- Produces (dipakai R1/R5):
  - `public.audit_log(id bigserial pk, actor_id uuid null, actor_role text not null, action text not null, entity text not null, entity_id text null, before jsonb null, after jsonb null, ip inet null, created_at timestamptz not null default now())`
  - `public.rate_limits(key text pk, hits int not null default 0, window_expires_at timestamptz not null)`
  - `public.fn_rate_limit_hit(p_key text, p_limit int, p_window_seconds int) returns boolean` — atomic upsert; `true` = diizinkan.
  - `public.fn_write_audit(p_actor_id uuid, p_actor_role text, p_action text, p_entity text, p_entity_id text, p_before jsonb, p_after jsonb) returns void`

- [ ] **Step 1: Tulis test integrasi yang gagal** `tests/integration/audit-rate-limit.test.ts` — assertion wajib:
  (a) `fn_write_audit(...)` lalu `UPDATE public.audit_log ...` → throw (append-only, trigger/rule `BEFORE UPDATE` raise), `DELETE` → throw juga;
  (b) `fn_rate_limit_hit('ip:1.1.1.1:hold', 3, 60)` empat kali → `true,true,true,false`;
  (c) setelah `window_expires_at` di-set ke masa lalu → panggilan berikutnya `true` dan `hits` kembali 1;
  (d) 20 panggilan paralel dengan limit 5 → tepat 5 `true` (atomicity).

- [ ] **Step 2: Jalankan, pastikan gagal**

```bash
TEST_DATABASE_URL=... npx vitest run tests/integration/audit-rate-limit.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `supabase/migrations/0003_audit_rate_limit.sql`** — (a) `audit_log` + trigger `BEFORE UPDATE OR DELETE` yang `RAISE EXCEPTION 'audit_log is append-only'` (return `null` tidak dipakai: harus melempar, bukan diam-diam mengabaikan); (b) `fn_write_audit(...)` satu INSERT, `before`/`after` sebagai `jsonb`; (c) `rate_limits` + `fn_rate_limit_hit(p_key, p_limit, p_window_seconds)`: `INSERT ... ON CONFLICT (key) DO UPDATE SET hits = CASE WHEN rate_limits.window_expires_at <= now() THEN 1 ELSE rate_limits.hits + 1 END, window_expires_at = CASE WHEN rate_limits.window_expires_at <= now() THEN now() + make_interval(secs => p_window_seconds) ELSE rate_limits.window_expires_at END RETURNING hits <= p_limit` — satu statement, aman dari race, tidak butuh lock eksplisit.

- [ ] **Step 4: Jalankan, pastikan lulus**

```bash
TEST_DATABASE_URL=... npx vitest run tests/integration/audit-rate-limit.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(db): add append-only audit log and persistent rate limit store"
```

---

### Task R0.9: Seed data idempoten

**Files:**
- Create: `scripts/seed.ts`, `tests/integration/seed.test.ts`
- Modify: —

**Interfaces:**
- Consumes: migrasi 0001–0003
- Produces: `export async function seed(pool: Pool): Promise<{ services: number; barbers: number; workingHours: number; blockedSlots: number }>` — idempoten (upsert by `slug`/`barber_code`/`(barber_id, day_of_week)`/`(barber_id, day_of_week, start_time, slot_type)`).

- [ ] **Step 1: Tulis test integrasi yang gagal** `tests/integration/seed.test.ts` — assertion wajib:
  (a) setelah `resetTestDb()` + `seed()` → `services 8`, `barbers 3`, `working_hours 21`, `blocked_slots 36` (3 barber × 2 istirahat × 6 hari kerja — v1 menyimpan satu baris per hari, bukan satu baris per pola);
  (b) `seed()` kedua kali → angka sama (idempoten, tidak menambah baris);
  (c) `SRV-08` harga `95000` durasi `60`; `SRV-01` harga `50000` durasi `45`;
  (d) chair 1 = "Rian Pratama" istirahat `12:00–12:55` dan `18:00–18:55`; chair 2 = "Dimas Arisandi" `13:00–13:55`/`19:00–19:55`; chair 3 = "Kevin Sanjaya" `14:00–14:55`/`20:00–20:55`;
  (e) hari off: Rian Minggu (0), Dimas Senin (1), Kevin Selasa (2) → `working_hours.is_day_off = true` tepat pada baris itu.

- [ ] **Step 2: Jalankan, pastikan gagal**

```bash
TEST_DATABASE_URL=... npx vitest run tests/integration/seed.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `scripts/seed.ts`** — data persis: 8 layanan dari `IDEA.md`/v1 (`SRV-01 Gentlemen Classic Haircut` 45 menit Rp 50.000 … `SRV-08 The Damez Signature Executive Combo` 60 menit Rp 95.000), 3 barber di atas, jam kerja 10:00–21:00 Senin–Sabtu, `settings` memuat `dp_idr=20000`, `hold_ttl_seconds=900`, `cancel_cutoff_hours=3`, `late_tolerance_minutes=15`, `timezone='Asia/Jakarta'`. Nama & harga layanan diambil verbatim dari `../.damez-analysis/docs/research/market-services-benchmark.md:547-557` (v1) — jangan menciptakan harga baru.

- [ ] **Step 4: Jalankan, pastikan lulus**

```bash
TEST_DATABASE_URL=... npx vitest run tests/integration/seed.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(db): add idempotent seed for services, barbers and staggered breaks"
```

---

### Task R0.10: Aturan batas modul (lint) yang sendirinya diuji

**Files:**
- Create: `tools/eslint-rules/index.js`, `tools/eslint-rules/no-lib-to-features.js`, `tools/eslint-rules/no-server-db-in-client.js`, `tools/eslint-rules/no-direct-db-in-api-route.js`, `tests/unit/eslint-rules.test.ts`
- Modify: `eslint.config.mjs` (buat baru)

**Interfaces:**
- Consumes: —
- Produces: plugin `damez-boundaries` dengan tiga rule: `damez-boundaries/no-lib-to-features`, `damez-boundaries/no-server-db-in-client`, `damez-boundaries/no-direct-db-in-api-route`. Semua melaporkan satu pesan per import yang melanggar.

- [ ] **Step 1: Tulis test yang gagal** `tests/unit/eslint-rules.test.ts` pakai `RuleTester` dari `eslint` (flat config), satu `describe` per rule, tiap rule minimal 1 `valid` dan 1 `invalid`, dan assertion bahwa `invalid` memunculkan tepat satu error dengan `messageId` yang diharapkan. Ini yang membuktikan rule tidak diam-diam mati.

- [ ] **Step 2: Jalankan, pastikan gagal**

```bash
npx vitest run tests/unit/eslint-rules.test.ts
```

Expected: FAIL resolve import.

- [ ] **Step 3: Implement tiga rule** — (1) `no-lib-to-features`: larang `import ... from "@/features/..."` di dalam berkas dengan path mengandung `/src/lib/`; (2) `no-server-db-in-client`: larang `@/lib/db/server` dan paket `server-only` di berkas yang punya `'use client'` atau path mengandung `/components/`; (3) `no-direct-db-in-api-route`: larang `@/lib/db/pg`, `@/lib/db/server`, dan `pg` langsung di `src/app/api/**/route.ts` — akses wajib lewat `features/*/queries`.

- [ ] **Step 4: Jalankan, pastikan lulus**

```bash
npx vitest run tests/unit/eslint-rules.test.ts
```

Expected: PASS.

- [ ] **Step 5: Tulis `eslint.config.mjs`** — `eslint-config-next` + plugin lokal `damez-boundaries` terpasang di scope `src/**`, plus `no-restricted-syntax` untuk melarang `console.log` di `src/**` (izinkan `console.error` di `src/lib/**`).

- [ ] **Step 6: Verifikasi lint bersih di repo**

```bash
npm run lint
```

Expected: exit 0, 0 error 0 warning. Kalau ada warning bawaan Next, matikan rule spesifiknya **satu per satu** di config dengan komentar alasan — jangan `--fix` global.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(lint): enforce module boundaries with tested custom eslint rules"
```

---

### Task R0.11: CI 6 tahap + `npm run verify` hijau

**Files:**
- Create: `.github/workflows/ci.yml`, `playwright.config.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `package.json` (tambah `test:e2e` ke dokumentasi; `verify` tidak menjalankan E2E lokal karena RAM VPS)

**Interfaces:**
- Consumes: semua task sebelumnya
- Produces: pipeline yang gagal pada tahap mana pun berhenti; artefak coverage di-upload.

- [ ] **Step 1: Tulis `playwright.config.ts`** — `webServer: { command: "npm run start", url: "http://127.0.0.1:3000", reuseExistingServer: false }`, project `mobile-chrome` viewport 390×844 dan `tablet` viewport 1024×768, `baseURL` dari `E2E_BASE_URL` default `http://127.0.0.1:3000`.

- [ ] **Step 2: Tulis `tests/e2e/smoke.spec.ts`** — assertion wajib: halaman `/` merespons 200, `title` memuat `Damez`, heading level 1 terlihat di kedua viewport, dan tidak ada `pageerror` (kumpulkan lewat `page.on("pageerror")`, assert panjang 0). Ini satu-satunya test E2E di R0; E2E booking milik R2.

- [ ] **Step 3: Tulis `.github/workflows/ci.yml`** dengan 6 job berurutan (`needs`): `typecheck` → `lint` → `unit` → `integration` → `e2e` → `build`. Job `integration` pakai `services: postgres: image: postgres:16, env POSTGRES_PASSWORD: damez, POSTGRES_USER: damez, POSTGRES_DB: damez_test, options: --health-cmd pg_isready --health-interval 5s --health-timeout 5s --health-retries 10`, lalu step `npm run migrate && npm run seed` dengan `DATABASE_URL=postgresql://damez:damez@127.0.0.1:5432/damez_test` dan `TEST_DATABASE_URL` yang sama. Node 22 via `actions/setup-node@v4` + `cache: npm`. Job `e2e` meng-upload `playwright-report` sebagai artefak. Semua job memakai `.npmrc` proyek (jangan override registry di CI).

- [ ] **Step 4: Jalankan `npm run verify` di VPS ini, catat hasil nyata**

```bash
cd /home/ubuntu/project-utama/damez-barbershop-v2
printf 'DATABASE_URL=postgresql://damez:damez@127.0.0.1:5432/damez_dev\nTEST_DATABASE_URL=postgresql://damez:damez@127.0.0.1:5432/damez_test\n' > .env
set -a && . ./.env && set +a
npm run verify 2>&1 | tail -40
```

Expected: exit 0; coverage ≥ ambang; 0 error typecheck; 0 error lint; build selesai. Kalau OOM pada `build`, jalankan dengan `NODE_OPTIONS=--max-old-space-size=1024` dan catat di README sebagai batasan VPS. **Laporkan output asli, bukan ringkasan.**

- [ ] **Step 5: Push ke repo v1 branch `dev` (izin Firas sudah ada) + tag arsip v1**

```bash
git push -u origin dev
git tag v1-archive origin/main -m "v1 archive — superseded by v2 on dev" 2>/dev/null || true
git push origin refs/tags/v1-archive
gh run list --limit 3
```

Expected: push sukses (tanpa `--force`), tag `v1-archive` menunjuk `921fb26`, 1 run CI muncul. Tunggu sampai selesai, laporkan status tiap job apa adanya.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "ci: add six-stage pipeline with real postgres and coverage gate"
```

---

### Task R0.12: Dokumentasi & catatan keputusan

**Files:**
- Create: `docs/adr/ADR-000-rebuild-rationale.md`, `docs/runbook/local-setup.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: semua di atas
- Produces: instruksi setup yang bisa diikuti orang lain tanpa bertanya.

- [ ] **Step 1: Tulis `docs/runbook/local-setup.md`** — langkah persis: install postgres 16, buat role/db, `.env`, `npm install`, `npm run migrate`, `npm run seed`, `npm run verify`, `npm run dev`. Termasuk catatan RAM VPS + `NODE_OPTIONS`, dan cara memakai `damez_test` vs `damez_dev`.

- [ ] **Step 2: Tulis `docs/adr/ADR-000-rebuild-rationale.md`** — ringkas: 3 alasan rebuild dari `IDEA.md` §1, temuan CRITICAL §2.1 dengan bukti kode (`lib/admin/auth.ts:157`, 4/4 route tanpa auth, tanpa `middleware.ts`), dan apa yang dipertahankan (§2.4). Rujuk ADR-001..003 v1 sebagai acuan bisnis.

- [ ] **Step 3: Tulis `README.md`** — nama proyek, 1 paragraf tujuan, daftar perintah (`verify`, `migrate`, `seed`, `dev`), prasyarat, dan tautan ke `IDEA.md`, ADR, runbook. Tanpa badge status yang tidak diverifikasi.

- [ ] **Step 4: Verifikasi dokumentasi tidak berbohong**

```bash
grep -rn "npm run verify\|npm run migrate\|npm run seed" README.md docs/runbook/local-setup.md | wc -l
```

Expected: > 0, dan setiap perintah yang disebut benar-benar ada di `package.json` (cek manual satu per satu).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "docs: add local setup runbook and rebuild rationale ADR"
```

---

### Task R0.13: Ambil alih aset v1 yang masih berlaku (§12)

**Files:**
- Create: `docs/adr/ADR-001-flat-down-payment-and-midtrans-qris.md`, `docs/adr/ADR-002-staggered-slots-and-concurrency-locking.md`, `docs/adr/ADR-003-whatsapp-multi-gateway-and-humanizer-compliance.md`, `docs/reference/v1/DEPLOYMENT.md`, `docs/reference/v1/admin-operations-guide.md`, `docs/reference/v1/market-services-benchmark.md`
- Modify: —

**Interfaces:**
- Consumes: `content/*` (sudah dipertahankan di repo), v1 clone di `/home/ubuntu/project-utama/.damez-analysis`
- Produces: sumber acuan yang dipakai R3 (template WhatsApp + humanizer), R5 (deployment + SOP kasir + latihan), dan R0.9 (harga layanan).

- [ ] **Step 1: Salin berkas yang diambil alih, verbatim**

```bash
cd /home/ubuntu/project-utama/damez-barbershop-v2
mkdir -p docs/adr docs/reference/v1
cp /home/ubuntu/project-utama/.damez-analysis/docs/decisions/ADR-00*.md docs/adr/
cp /home/ubuntu/project-utama/.damez-analysis/docs/DEPLOYMENT.md docs/reference/v1/
cp /home/ubuntu/project-utama/.damez-analysis/docs/admin-operations-guide.md docs/reference/v1/
cp /home/ubuntu/project-utama/.damez-analysis/docs/research/market-services-benchmark.md docs/reference/v1/
ls docs/adr docs/reference/v1
```

- [ ] **Step 2: Verifikasi hasil salinan tidak berubah**

```bash
diff -r /home/ubuntu/project-utama/.damez-analysis/docs/decisions docs/adr
wc -l docs/reference/v1/*.md
```

Expected: `diff` tanpa output; 3 berkas referensi ada dengan baris > 100.

- [ ] **Step 3: Commit**

```bash
git add docs content
git commit -m "docs: carry over v1 ADRs, deployment runbook and service benchmark"
```

---

## R0 Gate (bukti yang harus ada sebelum lanjut ke R1)

- `npm run verify` exit 0 di VPS ini, dengan output asli ditempel di laporan.
- CI GitHub Actions hijau pada 6 job, dari repo yang benar-benar baru.
- Migrasi naik dari nol pada DB kosong (`damez_test`) dan idempoten saat dijalankan ulang.
- Test konkurensi 20 hold paralel → tepat 1 sukses (`tests/integration/hold.test.ts`).
- 0 berkas sumber > 800 baris; 0 `console.log` di `src/**`; coverage ≥ 80% pada `src/lib/**`.
