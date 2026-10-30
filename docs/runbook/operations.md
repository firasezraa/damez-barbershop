# Runbook: operasional tanpa hosting

Proyek ini hanya hidup di repo GitHub. Tidak ada Vercel, tidak ada server publik.
Semua langkah di bawah dijalankan manual dari mesin pengembangan atau dari runner CI.

## 1. Rilis

1. `npm run verify` hijau di lokal.
2. Push ke `dev`; tunggu CI **6/6** hijau (`gh run list`, `gh run view <id>`).
3. Merge `dev` → `main` **dilakukan pemilik**, bukan agen. Tidak ada `git push --force`
   dan tidak ada penulisan ulang riwayat di branch ini.

Skema database ikut rilis: setiap berkas di `supabase/migrations/` diterapkan berurutan dan
checksum-nya dicatat di `public.schema_migrations`. Mengubah migrasi yang sudah diterapkan
akan ditolak — perubahan skema selalu lewat berkas baru.

## 2. Akun admin

Tiga peran: `owner`, `cashier`, `barber`. Akun dibuat di Supabase (GoTrue); role disimpan
di `app_metadata`.

```bash
set -a && . ./.env && set +a
npm run seed:admin     # butuh SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + ADMIN_SEED_PASSWORD
```

`seed:admin` idempoten: akun yang sudah ada diperbarui (peran + konfirmasi email), yang belum
ada dibuat. Email bawaan: `owner@damez.id`, `kasir@damez.id`, `barber@damez.id`.

Kalau `SUPABASE_SERVICE_ROLE_KEY` atau password database pernah muncul di tempat yang tidak
seharusnya (riwayat obrolan, tangkapan layar, log): **rotasi di dasbor Supabase**, lalu perbarui
`.env` lokal dan GitHub Actions secret yang terkait. Kredensial produksi hanya dari secret
manager, tidak pernah dari berkas di repo.

## 3. Pekerjaan terjadwal (cron) tanpa Vercel

Dua endpoint butuh pemanggil berkala. Keduanya memakai header `x-cron-secret` yang dibandingkan
dengan `CRON_SECRET` secara panjang-tetap:

| Endpoint | Kegunaan | Saran jadwal |
|---|---|---|
| `GET /api/cron/expire-slots` | Lepaskan kursi yang hold-nya lewat 15 menit | setiap 5 menit |
| `GET /api/cron/send-notifications` | Kirim antrean WhatsApp (maks 5 percobaan) | setiap 10 menit |

Contoh crontab di mesin yang menjalankan aplikasi:

```bash
*/5 * * * * curl -fsS -H "x-cron-secret: $CRON_SECRET" http://127.0.0.1:3000/api/cron/expire-slots >/dev/null
*/10 * * * * curl -fsS -H "x-cron-secret: $CRON_SECRET" http://127.0.0.1:3000/api/cron/send-notifications >/dev/null
```

Taruh `CRON_SECRET` di berkas terpisah dengan izin `600` yang di-source crontab, bukan di baris
perintah (baris perintah terlihat di `ps`). Endpoint menjawab `{ sent, failed, drained }` atau
`{ expired }`; `drained: 0` berarti tidak ada lagi yang bisa dikirim.

## 4. Webhook Midtrans

`POST /api/webhooks/midtrans` adalah satu-satunya jalur yang boleh mengubah booking menjadi
`confirmed`. Isi **Notification URL** di dasbor Midtrans ke alamat itu. Tanda tangan SHA-512
diverifikasi (`order_id + status_code + gross_amount + server_key`), nominal wajib sama dengan
`bookings.dp_idr`, dan `payments.idempotency_key` membuat pengiriman ulang aman (`duplicate`).

Selama `MOCK_MIDTRANS=true`, alur DP tidak menyentuh Midtrans sama sekali; E2E menandatangani
webhook sendiri sebagai pengganti Midtrans.

## 5. Backup

Data hidup di Supabase Postgres. Minimal sekali sehari:

```bash
pg_dump --no-owner --format=custom "$SUPABASE_DB_URL" > damez-$(date +%F).dump
```

Simpan di luar repo. Uji restore ke database kosong sesekali; backup yang belum pernah
di-restore belum terbukti.

## 6. Yang belum ada (jujur, bukan tersembunyi)

- Belum ada hosting, jadi belum ada URL publik, TLS produksi, atau penjadwal cloud.
- Snap asli (sandbox Midtrans) belum pernah dipanggil dari kode ini; E2E memakai mock.
  Yang sudah diuji adalah bentuk muatan dan pemilihan endpoint terhadap kontrak resmi.
- Skema `0005_admin_actions.sql` sudah diterapkan di `damez_dev`; project Supabase hosted
  perlu menerima migrasi yang sama sebelum dipakai untuk menerima booking nyata.
- Belum ada peringatan otomatis kalau cron mati; pantau hasilnya di log server.
