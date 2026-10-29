# R5 — Hardening & repo-only release (Damez Barbershop v2)

Lanjutan R4. Keputusan pemilik (2026-10-30): **tidak ada deploy Vercel**. Proyek hidup
di repo GitHub saja (`firasezraa/damez-barbershop`, branch `dev`); merge ke `main`
dilakukan pemilik sendiri.

## Ruang lingkup

| Task | Isi | Status |
|---|---|---|
| R5.1 | Snap: lingkungan dipilih dari env eksplisit, muatan sesuai kontrak resmi | dikerjakan |
| R5.2 | TLS pooler: verifikasi aktif secara default, `PG_SSL_INSECURE` hanya bootstrap | dikerjakan |
| R5.3 | Dokumentasi repo-only: README + runbook (jalankan, migrasi, seed, cron tanpa Vercel) | dikerjakan |
| R5.4 | Kebersihan rahasia: audit repo + catatan rotasi kredensial yang pernah bocor di riwayat obrolan | dikerjakan |
| R5.5 | Verifikasi akhir: suite + CI hijau, ledger diperbarui | dikerjakan |

## R5.1 — Temuan terhadap kontrak resmi Midtrans

Diperiksa langsung dari dokumentasi Midtrans (Snap Integration Guide + JSON Objects),
bukan dari ingatan:

1. **Cacat nyata.** `src/features/payment/checkout.ts` memilih endpoint dari
   `process.env.NODE_ENV === "production"`. Build produksi dengan **kunci sandbox**
   (kondisi yang paling mungkin untuk gerai baru) akan mengirim kunci sandbox ke
   endpoint produksi → 401 `SNAP_UNAVAILABLE` tanpa petunjuk penyebab. Lingkungan
   wajib datang dari env eksplisit `MIDTRANS_IS_PRODUCTION`, bukan dari `NODE_ENV`.
2. `process.env` dibaca langsung di route, melewati pola `readXEnv` yang dipakai
   seluruh proyek. Konsekuensi: tidak ada validasi, tidak ada pesan galat yang jelas.
3. Muatan kurang `customer_details` dan `item_details`; keduanya direkomendasikan
   agar transaksi terekam rapi di dasbor Midtrans. Kalau `item_details` dikirim,
   subtotalnya **wajib** sama dengan `gross_amount` (aturan dokumentasi).
4. Batas panjang yang mudah terlanggar: `order_id` ≤ 50, `name` item ≤ 50,
   nama pelanggan BCA VA ≤ 30, nomor telepon BNI VA harus berawalan `+62` atau `0`.
5. `expiry.unit` menerima `minute`/`hour`/`day` (bentuk jamak juga diterima) → nilai
   `"minutes"` yang dipakai sekarang sah. Tetap dipertahankan 15 menit agar seragam
   dengan `HOLD_TTL_SECONDS = 900`.
6. Keberhasilan Snap = **201**, bukan 200. Pemeriksaan `response.ok` sudah benar.
7. Kunci sandbox berawalan `SB-Mid-server-`, produksi `Mid-server-`. Pasangan yang
   tidak cocok (kunci sandbox + flag produksi, atau sebaliknya) ditolak saat konfigurasi
   dibaca — gagal cepat lebih baik daripada 401 beruntun di depan pelanggan.

## Rencana test

Unit (tanpa jaringan, `pool` dan `fetch` disuntik):
- endpoint sandbox vs produksi mengikuti `MIDTRANS_IS_PRODUCTION`;
- header `authorization` = `Basic base64(<serverKey>:)`;
- subtotal `item_details` sama dengan `gross_amount`; nama item ≤ 50;
- `customer_details.first_name` dipotong ≤ 30 karakter (batas BCA VA);
- `callbacks.finish` hanya dikirim kalau `APP_BASE_URL` ada;
- pasangan kunci/lingkungan yang tidak cocok → galat konfigurasi;
- Snap 401/500/JSON cacat → 502 `SNAP_UNAVAILABLE`, tidak ada kebocoran kunci di body.

Integrasi: `tests/integration/payment-flow.test.ts` tetap hijau dengan tanda tangan
`createCheckout` yang baru.

## Aturan yang TIDAK diubah

- Nominal DP selalu dari baris booking, tidak pernah dari klien.
- Konfirmasi hanya dari webhook bertanda tangan (tidak berubah di R5).
- Tidak ada kredensial di `src/**`; `.env` tetap diabaikan git.
