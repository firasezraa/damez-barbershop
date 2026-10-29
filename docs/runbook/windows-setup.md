# Runbook: Windows dari nol sampai jalan di IDE

Untuk PC Windows tanpa PostgreSQL. Diuji di Linux/macOS dan di CI; langkah khusus Windows di
bawah belum pernah saya jalankan di mesin Windows — kalau ada langkah yang meleset, sebutkan
pesan galatnya.

Dua jalur, pilih satu:

| Jalur | Kapan dipilih | Berat |
|---|---|---|
| **A. Installer PostgreSQL 16** | ingin paling sedikit lapisan | ~350 MB, sekali install |
| **B. Docker Desktop** | sudah punya Docker | image `postgres:16` |

Sisa langkahnya sama untuk keduanya. Pakai PostgreSQL **16** supaya sama dengan CI
(project Supabase hosted memakai 17, jadi 17 juga jalan — 16 dipilih demi kesamaan dengan gate).

---

## 1A. Installer PostgreSQL 16 (EDB)

1. Unduh installer dari <https://www.postgresql.org/download/windows/> (tautan EDB).
2. Jalankan installer:
   - **Installation Directory**: biarkan default `C:\Program Files\PostgreSQL\16`.
   - **Select Components**: cukup *PostgreSQL Server* + *Command Line Tools*. Stack Builder
     tidak perlu.
   - **Data Directory**: biarkan default.
   - **Password**: isi password untuk superuser `postgres`. **Catat** — dipakai di langkah 3.
   - **Port**: `5432`.
   - **Locale**: default.
3. Tambahkan `bin` ke PATH supaya `psql` bisa dipanggil (PowerShell, sekali saja untuk user):

```powershell
[Environment]::SetEnvironmentVariable(
  "Path",
  $env:Path + ";C:\Program Files\PostgreSQL\16\bin",
  "User"
)
```

Tutup lalu buka PowerShell baru, cek:

```powershell
psql --version      # harus menampilkan psql (PostgreSQL) 16.x
```

4. Pastikan servicenya jalan: `Get-Service postgresql*` → `Running`. Kalau belum:
   `Start-Service postgresql-x64-16`.

## 1B. Docker Desktop (alternatif)

```powershell
docker run -d --name damez-pg `
  -e POSTGRES_PASSWORD=pilih-sendiri `
  -e POSTGRES_USER=damez `
  -e POSTGRES_DB=damez_dev `
  -p 5432:5432 postgres:16
docker exec -it damez-pg psql -U damez -d damez_dev -c "select version();"
```

Dengan jalur ini langkah 2 tinggal membuat `damez_test` saja (role dan `damez_dev` sudah dibuat
oleh container), dan user di `DATABASE_URL` adalah `damez`.

---

## 2. Buat role dan dua database

Di PowerShell:

```powershell
# akan diminta password superuser postgres
psql -U postgres -h 127.0.0.1 -p 5432 -c "CREATE ROLE damez LOGIN PASSWORD 'pilih-sendiri' SUPERUSER;"
psql -U postgres -h 127.0.0.1 -p 5432 -c "CREATE DATABASE damez_dev OWNER damez;"
psql -U postgres -h 127.0.0.1 -p 5432 -c "CREATE DATABASE damez_test OWNER damez;"
```

`SUPERUSER` diperlukan karena migrasi membuat role `anon`/`authenticated`/`service_role` dan
menyetel `BYPASSRLS`. Password di sini hanya untuk loopback pengembangan.

Kenapa dua database: `damez_dev` untuk kerja, `damez_test` untuk test integrasi yang menjalankan
`DROP SCHEMA public CASCADE` tiap berkas test. **Jangan** arahkan `TEST_DATABASE_URL` ke database
kerja atau ke Supabase.

## 3. Berkas `.env`

```powershell
Set-Location C:\path\ke\damez-barbershop-v2
Copy-Item .env.example .env
```

Sunting `.env`, isi minimal dua baris (ganti password sesuai langkah 2):

```
DATABASE_URL=postgresql://damez:pilih-sendiri@127.0.0.1:5432/damez_dev
TEST_DATABASE_URL=postgresql://damez:pilih-sendiri@127.0.0.1:5432/damez_test
```

`.env` ada di `.gitignore`; jangan di-commit. Untuk menjalankan aplikasi dan test, dua URL itu
sudah cukup. Autentikasi admin butuh `NEXT_PUBLIC_SUPABASE_URL` +
`NEXT_PUBLIC_SUPABASE_ANON_KEY` dari project Supabase; alur pembayaran butuh
`MOCK_MIDTRANS=true` supaya tidak menyentuh Midtrans.

## 4. Siapkan skema dan katalog

```powershell
npm install
npm run migrate     # membaca .env sendiri
npm run seed        # 8 layanan, 3 barber, jam kerja, istirahat
```

`npm run migrate` bersifat idempoten dan menolak perubahan pada migrasi yang sudah diterapkan
(checksum). Melihat riwayat:

```powershell
psql "postgresql://damez:pilih-sendiri@127.0.0.1:5432/damez_dev" -c "select version, applied_at from schema_migrations order by version"
```

## 5. Jalankan di IDE

Buka folder repo di VS Code / Cursor, lalu terminal bawaan (`` Ctrl+` ``):

```powershell
npm run dev
```

- Beranda: <http://localhost:3000>
- Booking: <http://localhost:3000/booking>
- Masuk admin: <http://localhost:3000/admin/login>
- Matriks kasir: <http://localhost:3000/admin/dashboard> (butuh sesi Supabase)

Ekstensi yang berguna di IDE (opsional): ESLint, Playwright, dan ekstensi PostgreSQL resmi
(`ms-ossdata.vscode-pgsql`) untuk menelusuri tabel.

Perintah lain: `npm run typecheck`, `npm run lint`, `npm run test:unit`,
`npm run test:integration`, `npm run verify`.

## 6. Menyambungkan alat database ke Damez

Connection string (sama dengan `DATABASE_URL`):

```
postgresql://damez:pilih-sendiri@127.0.0.1:5432/damez_dev
```

| Alat | Host | Port | User | Database | Password |
|---|---|---|---|---|---|
| pgAdmin (sudah ikut installer) | `127.0.0.1` | `5432` | `damez` | `damez_dev` | pilih sendiri |
| DBeaver / TablePlus / DataGrip | `127.0.0.1` | `5432` | `damez` | `damez_dev` | pilih sendiri |
| Ekstensi VS Code PostgreSQL | tempel connection string di atas | | | | |

Yang akan terlihat: 13 tabel (`bookings`, `booking_services`, `customers`, `payments`,
`notifications`, `services`, `barbers`, `working_hours`, `blocked_slots`, `settings`,
`audit_log`, `rate_limits`, `schema_migrations`), plus `booking_*` yang bertambah saat ada
booking baru.

Dua hal yang sering membingungkan saat memeriksa data lewat alat DB:

1. **Tabel `bookings` kosong padahal booking baru saja dibuat** — RLS aktif. Alat Anda masuk
   sebagai `damez` (pemilik, `BYPASSRLS`), jadi harus terlihat; kalau tidak, berarti Anda masuk
   sebagai role lain. Untuk membuktikan batasnya:

   ```sql
   SET ROLE anon;
   SELECT count(*) FROM public.bookings;   -- 0 baris
   SELECT count(*) FROM public.services WHERE is_active;  -- 8 baris
   RESET ROLE;
   ```

2. **`audit_log` menolak UPDATE/DELETE** — memang append-only (trigger `BEFORE UPDATE OR
   DELETE` → `RAISE EXCEPTION 'audit_log is append-only'`). Itu bukan kerusakan.

## 7. Masalah umum

| Gejala | Sebab dan tindakan |
|---|---|
| `Konfigurasi database belum lengkap. Periksa variabel: DATABASE_URL` | `.env` belum ada atau `DATABASE_URL` kosong. Ulangi langkah 3. |
| `psql : The term 'psql' is not recognized` | `bin` belum masuk PATH; ulangi langkah 1A nomor 3 dan buka PowerShell baru. |
| `psql: error: connection to server at "127.0.0.1", port 5432 failed: Connection refused` | Service PostgreSQL berhenti: `Start-Service postgresql-x64-16`. Cek juga port terpakai proses lain: `netstat -ano \| findstr :5432`. |
| `password authentication failed for user "damez"` | Password di `.env` tidak sama dengan yang dipakai di `CREATE ROLE`. Setel ulang: `ALTER ROLE damez WITH PASSWORD 'baru';` lalu perbarui `.env`. |
| `role "anon" does not exist` saat migrate | Migrasi dijalankan role non-superuser. Ulangi `CREATE ROLE damez ... SUPERUSER;`. |
| `Error: checksum mismatch` saat migrate | Sebuah berkas migrasi diubah setelah diterapkan. Skema hanya berubah lewat berkas migrasi baru; kembalikan berkas lama seperti di repo. |
| Landing page kosong tanpa layanan | `npm run seed` belum dijalankan. |
| Test integrasi menghapus data kerja | `TEST_DATABASE_URL` menunjuk ke `damez_dev`. Arahkan ke `damez_test`. |
| `E2E: locator.check timeout` / katalog kosong | Test integrasi menghapus skema di `damez_test`. Urutannya: `npm run migrate`, `npm run seed`, lalu Playwright. |

## 8. Test lokal (opsional tapi disarankan)

```powershell
npm run test:unit           # tanpa database
npm run test:integration    # butuh damez_test
npx playwright install chromium
npm run build
npm run test:e2e            # dua viewport; SOP kasir di-skip tanpa akun Supabase
```

E2E butuh katalog terisi di `damez_test` — lihat baris terakhir tabel di atas.
