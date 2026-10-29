# Rencana R2 — Public & Booking Core (Damez v2)

Basis: `IDEA.md` §7 (alur booking), §9 (test), §11 R2. R1 selesai (143 test, CI 6/6).

## Yang sudah ada dari R0/R1 (jangan ditulis ulang)

- `fn_create_booking_hold(...)` — harga otoritatif server, TTL 900 detik, anti-hoarding,
  tiga lapis penguncian, error `SLOT_TAKEN`/`BARBER_NOT_FOUND`/`INVALID_SERVICE`/`MAX_ACTIVE_HOLDS_EXCEEDED`.
- `fn_expire_stale_holds()` + `fn_hold_is_active(uuid)`.
- Seed katalog: 3 barber, jam kerja 10:00–21:00, istirahat bergilir 12/13/14 & 18/19/20.

## Task

### R2.1 — Slot engine (fungsi murni) + ketersediaan dari Postgres

**Files:** `src/features/slots/engine.ts`, `src/features/slots/availability.ts`,
`tests/unit/slot-engine.test.ts`, `tests/integration/availability.test.ts`.

- Fungsi murni `computeAvailableSlots(...)` bekerja dalam **menit-dari-tengah-malam WIB**,
  bukan `Date` lokal mesin. Jakarta tidak punya DST, jadi offset `+07:00` tetap.
- Aturan: slot sejajar grid 15 menit dari jam buka; `start >= now + 30 menit` (lead time);
  `start + durasi + buffer 10 <= jam tutup`; interval `[start, start+durasi+buffer)` tidak
  boleh beririsan dengan istirahat maupun booking aktif (booking sudah memuat buffer di
  `end_time`); hari off → tidak ada slot.
- Bukti wajib: unit test untuk grid, lead time, jam tutup, istirahat, booking beririsan,
  hari off; integrasi terhadap Postgres nyata dengan seed (istirahat 12:00–12:55 kursi 1
  menghapus slot 11:15–12:45) dan booking nyata yang menghapus slotnya.

### R2.2 — `POST /api/slots/available`

**Files:** `src/app/api/slots/available/route.ts`, `tests/integration/slots-route.test.ts`.

- Zod untuk body (tanggal `YYYY-MM-DD`, `serviceIds` minimal 1, `barberId` opsional),
  rate limit persisten per IP, harga/durasi dihitung dari DB (bukan payload).
- Bukti: 400 untuk payload cacat, 429 saat limit habis, 200 dengan daftar slot.

### R2.3 — `POST /api/booking/hold`

**Files:** `src/app/api/booking/hold/route.ts`, `tests/integration/hold-route.test.ts`.

- Membungkus `fn_create_booking_hold`; 201 sukses, 409 `SLOT_TAKEN`,
  429 kena limit, 400 payload cacat, 422 `MAX_ACTIVE_HOLDS_EXCEEDED`.
- Bukti: dua request paralel untuk slot sama → satu 201, satu 409 (Postgres nyata).

### R2.4 — Worker expire slot

**Files:** `src/app/api/cron/expire-slots/route.ts`, `tests/integration/cron-expire.test.ts`.

- Header `Authorization: Bearer <CRON_SECRET>` dibandingkan `timingSafeEqual`; tanpa
  header/secret salah → 401 tanpa menyentuh DB.
- Bukti: hold yang TTL-nya dimundurkan → 200 `{expired:1}`, panggilan kedua `{expired:0}`,
  slot kembali tersedia.

### R2.5 — Landing + wizard booking

**Files:** `src/app/(public)/page.tsx` (landing), `src/app/(public)/booking/page.tsx`,
`src/components/booking/*`, `tests/e2e/booking-flow.spec.ts`.

- Copy dari `content/landing-copy.md` (asli, bukan karangan), metadata `LocalBusiness`,
  wizard 4 langkah tanpa pembayaran (DP menyusul R3).
- Bukti: axe-core 0 violation critical/serious di kedua viewport, wizard mencapai tiket.

## Gate R2

- Dua pelanggan tidak bisa memegang slot yang sama (test paralel Postgres nyata) — sudah
  ada di R0, diulang di level route.
- Slot engine menghormati istirahat bergilir dan hari off, dibuktikan dengan data seed asli.
- `npm run verify` hijau, CI 6/6 hijau.