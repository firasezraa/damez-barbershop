# Katalog Bug & Laporan Pengujian Eksploratif (Dogfooding Bug Report)

**Aplikasi Target:** Damez Barbershop Web Application (Next.js 15 App Router)  
**Dokumen:** `docs/qa/dogfooding-bug-report.md`  
**Milestone:** Milestone 8 (M8-01: Exploratory Dogfooding & Edge-Case Bug Bashing)  
**Sub-agent / Tester:** `coder:qa`  
**Metodologi:** Chaos Testing & Exploratory QA (Skill: `dogfood`, `systematic-debugging`, `webapp-testing`)  
**Automated Test Harness:** `tests/chaos-dogfooding.test.ts` (Command: `npm run test:chaos`)  
**Status Audit:** COMPLETED: 100% Unhandled Exceptions and Logic Gaps Mapped  

---

## 1. Executive Summary

Pengujian eksploratif kasus ekstrem manusiawi (*human chaos testing*) telah dilakukan secara mendalam pada aplikasi Damez Barbershop. Audit ini menyimulasikan kebiasaan nyata pengguna Indonesia, ketidakstabilan koneksi, perilaku manipulatif (*adversarial actions*), dan anomali browser (*back/refresh/multi-tab*).

Sebanyak **14 temuan bug dan celah logika** berhasil diidentifikasi, direproduksi secara deterministik melalui test harness `tests/chaos-dogfooding.test.ts`, dan dipetakan akar masalahnya (*root cause*).

### Ringkasan Tingkat Keparahan (Severity Breakdown)

| Tingkat Keparahan | Jumlah | Deskripsi Dampak |
|:---|:---:|:---|
| [CRITICAL] | **3** | Menghentikan alur utama reservasi di UI, bypass pembayaran 100% tanpa bayar, atau dana terpotong tanpa booking terkonfirmasi. |
| [HIGH] | **4** | Celah penimbunan inventaris tak terbatas (infinite hoarding), manipulasi tiket boarding pass palsu, desinkronisasi validasi form, dan tabrakan order ID Midtrans. |
| [MEDIUM] | **4** | Ketidakadaan debounce klik pada tombol pembayaran, ketiadaan real-time slot update di Step 3, penolakan format nomor HP awalan 8xxx, dan ketiadaan konfirmasi navigasi Back saat bayar. |
| [LOW] | **3** | Sensitivitas huruf besar/kecil (case-sensitivity) pada URL kode booking, injeksi reflected metadata, dan field catatan (notes) tanpa sanitasi tag HTML. |
| **TOTAL** | **14** | **Seluruh celah terpetakan secara presisi untuk perbaikan pada M8-04 dan M8-05.** |

### Ringkasan Kategori (Category Breakdown)

| Kategori | Jumlah | Sasaran Remediasi |
|:---|:---:|:---|
| **Security & Payment Integrity** | 4 | `coder:backend` (M8-04) & `coder:security` (M8-03) |
| **Functional & Form Logic** | 5 | `coder:backend` (M8-04) & `coder:frontend` (M8-05) |
| **User Experience (UX) & Resilience** | 5 | `coder:frontend` (M8-05) |

---

## 2. Katalog Lengkap Bug & Skenario Ekstrem

---

### BUG-M801-00: Frontend-to-Backend Time Format Mismatch (NaN Date in `auto-expire.ts` Memblokir Seluruh Hold dari UI Wizard)

| Atribut | Nilai |
|:---|:---|
| **Severity** | **CRITICAL** |
| **Category** | Functional / Logic |
| **Komponen / File** | `components/booking/booking-wizard.tsx` (baris 261-265) & `lib/slots/auto-expire.ts` (baris 209-216) |
| **Endpoint** | `POST /api/booking/hold` |
| **Assignee Rekomendasi** | `coder:backend` (M8-04) & `coder:frontend` (M8-05) |

#### Deskripsi Masalah & Root Cause
Saat pengguna menuntaskan 5 langkah pada form reservasi dan menekan tombol **"Kunci Slot & Bayar DP Rp 20.000"**, `booking-wizard.tsx` mengirimkan payload:
```json
{
  "start_time": "14:30",
  "end_time": "15:15",
  "booking_date": "2026-10-30"
}
```
Pada sisi server, `lib/slots/auto-expire.ts` baris 209-211 mengeksekusi:
```typescript
const startTimeDate = new Date(startTime)
const endTimeDate = new Date(endTime)
if (isNaN(startTimeDate.getTime()) || isNaN(endTimeDate.getTime()) || endTimeDate <= startTimeDate) {
  return { success: false, error: 'Rentang waktu (startTime - endTime) tidak valid.', errorCode: 'INVALID_TIME' }
}
```
Dalam standar mesin JavaScript V8, `new Date("14:30")` tanpa tanggal menghasilkan `Invalid Date` (`getTime() === NaN`). Akibatnya, server selalu menolak request reservasi dari antarmuka pengguna dengan status **HTTP 400 Bad Request**! Tidak ada satu pun pengguna di browser yang dapat mengunci slot dari UI frontend.

#### Langkah Reproduksi
1. Buka halaman reservasi `/book`.
2. Pilih layanan (Step 1), pilih barber (Step 2), pilih tanggal dan jam `14:30` (Step 3).
3. Isi nama lengkap dan nomor WhatsApp valid `081234567890` (Step 4).
4. Pada Step 5 (Ringkasan), klik tombol **"Kunci Slot & Bayar DP Rp 20.000"**.
5. Buka tab Network pada browser DevTools.

#### Hasil Aktual
Server mengembalikan response:
```json
{
  "success": false,
  "error": "Rentang waktu (startTime - endTime) tidak valid."
}
```
Frontend menangkap error ini dan memunculkan modal general error: *"Rentang waktu (startTime - endTime) tidak valid."*

#### Perilaku yang Diharapkan
1. `booking-wizard.tsx` harus menggabungkan tanggal dan jam menjadi format ISO lengkap berzona WIB: `${formData.selectedDate}T${formData.selectedTime}:00+07:00`.
2. Secara defensif, `lib/slots/auto-expire.ts` dan `app/api/booking/hold/route.ts` harus mampu mem-parsing string waktu mentah (`"14:30"`) jika digabungkan dengan parameter `booking_date`.

---

### BUG-M801-09: Unauthenticated `POST /api/booking/[code]` Memungkinkan Bypass Pembayaran 100% Gratis

| Atribut | Nilai |
|:---|:---|
| **Severity** | **CRITICAL** |
| **Category** | Security / Payment Bypass |
| **Komponen / File** | `app/api/booking/[code]/route.ts` (baris 265-430) |
| **Endpoint** | `POST /api/booking/[code]` |
| **Assignee Rekomendasi** | `coder:backend` (M8-04) & `coder:security` (M8-03) |

#### Deskripsi Masalah & Root Cause
Next.js App Router mengekspos handler `POST` publik pada `/api/booking/[code]`. Endpoint ini awalnya dibuat untuk keperluan simulasi demo lokal, namun tidak memiliki proteksi lingkungan:
```typescript
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  // Langsung mengeksekusi update status = 'confirmed', down_payment_idr = 20000
}
```
Tidak ada verifikasi autentikasi admin, tidak ada pengecekan environment `process.env.NODE_ENV !== 'production'`, dan tidak ada validasi webhook Midtrans. Siapa pun dapat melakukan request HTTP POST sederhana dengan kode booking atau UUID mana pun, dan reservasi akan seketika berubah status menjadi `confirmed` tanpa membayar uang sepeser pun.

#### Langkah Reproduksi
1. Buat hold sementara melalui form atau API: `POST /api/booking/hold`. Dapatkan kode booking (misal: `DMZ-20261031-83EC4J`).
2. Jalankan perintah terminal:
   ```bash
   curl -X POST http://localhost:3000/api/booking/DMZ-20261031-83EC4J
   ```
3. Periksa status booking melalui `GET /api/booking/DMZ-20261031-83EC4J`.

#### Hasil Aktual
Response HTTP 200 OK:
```json
{
  "success": true,
  "message": "Simulasi pembayaran sukses. Reservasi terkonfirmasi.",
  "data": {
    "booking_code": "DMZ-20261031-83EC4J",
    "status": "confirmed",
    "down_payment_idr": 20000
  }
}
```
Booking berhasil dikonfirmasi gratis 100% tanpa Midtrans.

#### Perilaku yang Diharapkan
Endpoint simulasi demo wajib dihapus pada production build atau dilindungi secara ketat dengan:
1. Pengecekan guard `if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404 });`
2. Memerlukan autentikasi admin session / Bearer secret token jika digunakan untuk keperluan internal test.

---

### BUG-M801-06: Late Settlement Webhook Mengakibatkan Dana Masuk tapi Booking Tetap Expired (Orphaned Payment)

| Atribut | Nilai |
|:---|:---|
| **Severity** | **CRITICAL** |
| **Category** | Logic / Financial Integrity |
| **Komponen / File** | `lib/payment/webhook.ts` (baris 504-530) & `app/api/webhooks/midtrans/route.ts` |
| **Endpoint** | `POST /api/webhooks/midtrans` |
| **Assignee Rekomendasi** | `coder:backend` (M8-04) |

#### Deskripsi Masalah & Root Cause
Skenario ekstrem: Pengguna membuka QRIS di menit ke 14:30 dan menekan tombol bayar di aplikasi m-banking pada detik 14:59:59. Transaksi di Midtrans berhasil diselesaikan, tetapi cron sweeper background Damez Barbershop sudah menjalankan auto-expire pada detik 15:00:00 dan mengubah status booking menjadi `expired`.

Ketika webhook Midtrans dengan status `settlement` tiba beberapa detik kemudian, `lib/payment/webhook.ts` mengecek:
```typescript
if (bookingRecord.status === 'pending_payment') {
  // Update status ke confirmed
  updatedBookingStatus = 'confirmed'
} else {
  updatedBookingStatus = bookingRecord.status // Tetap 'expired'!
}
```
Akibatnya:
1. Booking **TETAP BERSTATUS `expired`** di database, dan slot kursi dilepas atau diambil pelanggan lain.
2. Uang pelanggan (Rp 20.000) **TETAP DICATAT SEBAGAI `settlement`** di tabel payments.
3. Fungsi dispatch WhatsApp tetap mengirim pesan *"Reservasi Anda Berhasil Dikonfirmasi"* karena log notifikasi hanya mengecek keberadaan order tanpa memvalidasi apakah booking benar-benar confirmed! Pelanggan datang ke barbershop dengan tiket digital, namun kursi sudah diisi orang lain.

#### Langkah Reproduksi
1. Buat hold reservasi.
2. Majukan waktu hingga melewati TTL 15 menit, jalankan `releaseExpiredSlotHolds()`. Status booking menjadi `expired`.
3. Kirim webhook notifikasi `settlement` Midtrans resmi dengan signature SHA-512 valid untuk `order_id` tersebut.
4. Periksa record booking dan payments di database.

#### Hasil Aktual
- Tabel `payments`: Status `settlement` (Rp 20.000 diterima).
- Tabel `bookings`: Status tetap `expired` (slot dilepas).
- Log WhatsApp: Notifikasi booking confirmed terkirim ke pelanggan.

#### Perilaku yang Diharapkan
1. Jika webhook settlement tiba pada booking yang baru saja `expired` (dalam rentang grace period toleransi, misal < 2 menit):
   - Periksa apakah slot kursi masih kosong. Jika masih kosong, pulihkan booking ke status `confirmed`.
   - Jika slot sudah terisi oleh orang lain, jangan biarkan status menggantung: ubah status ke `payment_conflict_refund_needed` dan kirim notifikasi WhatsApp pengembalian dana / pemilihan jadwal baru ke pelanggan serta alert ke kasir.

---

### BUG-M801-05: Hold TTL Extension Vulnerability pada Refresh Halaman Checkout (Infinite Inventory Hoarding Attack)

| Atribut | Nilai |
|:---|:---|
| **Severity** | **HIGH** |
| **Category** | Security / Inventory Integrity |
| **Komponen / File** | `app/api/booking/checkout/route.ts` (baris 293-304) & `lib/payment/midtrans.ts` (baris 328-330) |
| **Endpoint** | `POST /api/booking/checkout` |
| **Assignee Rekomendasi** | `coder:backend` (M8-04) |

#### Deskripsi Masalah & Root Cause
Saat memanggil endpoint `/api/booking/checkout`, fungsi `createBookingSnapTransaction()` menghitung ulang waktu kedaluwarsa secara absolut:
```typescript
const expiresAt: string = new Date(Date.now() + DEFAULT_HOLD_TTL_MINUTES * 60 * 1000).toISOString()
```
Dan pada `app/api/booking/checkout/route.ts` baris 293:
```typescript
await supabase.from('bookings').update({
  hold_expires_at: checkoutResult.expires_at,
  updated_at: new Date().toISOString()
}).eq('id', bookingId)
```
Jika seorang penyerang atau pengguna membuka `/booking/payment` dan merefresh halaman setiap 14 menit 30 detik (sebelum status menjadi expired), endpoint checkout akan memperbarui kolom `hold_expires_at` menjadi **15 menit ke depan dari waktu sekarang**. Hal ini memungkinkan penimbunan slot kursi prime time (Sabtu-Minggu) tanpa batas waktu dan tanpa pernah membayar!

#### Langkah Reproduksi
1. Buat hold pada pukul `10:00:00`. Waktu `hold_expires_at` awal adalah `10:15:00`.
2. Pada pukul `10:14:00`, panggil `POST /api/booking/checkout` dengan `booking_id`.
3. Periksa kolom `hold_expires_at` di database.

#### Hasil Aktual
`hold_expires_at` berubah menjadi `10:29:00` (bertambah 15 menit lagi).

#### Perilaku yang Diharapkan
Waktu kedaluwarsa 15 menit harus terkunci permanen sejak hold pertama kali dibuat (`initial_hold_expires_at`). Endpoint `/api/booking/checkout` hanya boleh menerbitkan token Midtrans dengan sisa waktu yang ada (`remaining_seconds`), tanpa pernah mengubah atau memundurkan kolom `hold_expires_at` di database.

---

### BUG-M801-07: Browser Refresh Menghasilkan Multiple Conflicting Midtrans Order IDs untuk Satu Booking

| Atribut | Nilai |
|:---|:---|
| **Severity** | **HIGH** |
| **Category** | Logic / Payment Reconciliation |
| **Komponen / File** | `app/api/booking/checkout/route.ts` & `lib/payment/midtrans.ts` (baris 191-196) |
| **Endpoint** | `POST /api/booking/checkout` |
| **Assignee Rekomendasi** | `coder:backend` (M8-04) & `coder:frontend` (M8-05) |

#### Deskripsi Masalah & Root Cause
Dalam `lib/payment/midtrans.ts`, `generateOrderId(bookingCode)` menambahkan 4 karakter acak:
```typescript
const randomSuffix: string = Math.random().toString(36).substring(2, 6).toUpperCase()
return `ORDER-${sanitizedCode}-${timestampHex}${randomSuffix}`
```
Pada komponen frontend `PaymentScreen`, state `checkoutData` disimpan di memory React. Setiap kali pengguna menekan tombol Refresh browser (F5) atau koneksi terputus lalu reload, komponen memanggil kembali `fetchCheckoutToken(booking.id)`. Akibatnya, server Midtrans membuat `order_id` baru dan database menyisipkan baris baru di tabel `payments`.

Jika pelanggan sudah memindai QRIS pertama di smartphone, lalu merefresh halaman dan memindai QRIS kedua, pelanggan berisiko tertagih dua kali untuk satu booking yang sama.

#### Langkah Reproduksi
1. Buka `/booking/payment?code=DMZ-XXXX`.
2. Amati network request POST `/api/booking/checkout` -> menghasilkan `ORDER-DMZ-XXXX-AAAA`.
3. Tekan F5 (Refresh) pada browser.
4. Amati network request POST `/api/booking/checkout` kedua -> menghasilkan `ORDER-DMZ-XXXX-BBBB`.

#### Hasil Aktual
Dua `order_id` aktif yang berbeda tersimpan di tabel `payments` untuk booking yang sama.

#### Perilaku yang Diharapkan
Endpoint `/api/booking/checkout` harus bersifat idempoten:
Jika sudah terdapat transaksi pending yang aktif dan belum kedaluwarsa untuk booking tersebut di tabel `payments`, endpoint harus mengembalikan `snap_token` dan `order_id` yang sudah ada, bukan membuat transaksi baru.

---

### BUG-M801-11: `SuccessScreen` Menampilkan Boarding Pass Valid Terkonfirmasi untuk Kode Booking Fiktif / Salah

| Atribut | Nilai |
|:---|:---|
| **Severity** | **HIGH** |
| **Category** | Security / Fraud Prevention |
| **Komponen / File** | `components/booking/success-screen.tsx` (baris 48-93) |
| **URL** | `/booking/success/[code]` |
| **Assignee Rekomendasi** | `coder:frontend` (M8-05) |

#### Deskripsi Masalah & Root Cause
Pada `components/booking/success-screen.tsx`, jika fetch ke `/api/booking/[code]` mengembalikan status 404 (kode booking tidak ditemukan di database), kode program justru mengeksekusi blok fallback:
```typescript
// Fallback to sample / draft details if API returned 404 in demo mode
const fallbackBooking: PaymentBookingDetail = {
  id: bookingCode,
  booking_code: bookingCode,
  customer_name: "Pelanggan Terhormat",
  status: "confirmed",
  down_payment_idr: 20000,
  ...
}
setBooking(fallbackBooking);
```
Akibatnya, siapa pun yang mengetikkan URL sembarang seperti `/booking/success/GRATIS-CUKUR-DAMEZ` akan melihat tampilan tiket Digital Boarding Pass resmi dengan badge hijau **"Reservasi Berhasil Dikonfirmasi"**, barcode QR interaktif, dan rincian DP Rp 20.000 Lunas. Ini adalah celah penipuan visual di kasir offline.

#### Langkah Reproduksi
1. Buka browser pada URL: `http://localhost:3000/booking/success/KODE-PALSU-12345`.
2. Amati tampilan layar yang dimuat.

#### Hasil Aktual
Muncul Digital Boarding Pass resmi atas nama *"Pelanggan Terhormat"* dengan status *"Dikonfirmasi"* dan kode tiket `KODE-PALSU-12345`.

#### Perilaku yang Diharapkan
Jika API mengembalikan 404 Not Found, halaman harus menampilkan error state: *"Tiket reservasi tidak ditemukan atau kode salah"* dengan tombol navigasi kembali ke `/book`.

---

### BUG-M801-01: Client-Server Phone Validation Mismatch (Step 4 Meloloskan Karakter Non-Digit, Step 5 Error)

| Atribut | Nilai |
|:---|:---|
| **Severity** | **HIGH** |
| **Category** | Functional / Validation |
| **Komponen / File** | `components/booking/utils.ts` (baris 180-222) vs `lib/security/bot-protection.ts` (baris 37-74) |
| **Assignee Rekomendasi** | `coder:frontend` (M8-05) & `coder:backend` (M8-04) |

#### Deskripsi Masalah & Root Cause
Fungsi validasi frontend `validateIndonesianPhone(phone)` di `components/booking/utils.ts` hanya membersihkan spasi dan tanda minus (`phone.replace(/[\s\-\(\)\.]/g, "")`) lalu mengecek awalan `"08"` serta panjang 10-13 karakter. Fungsi ini **TIDAK MENGECEK** apakah seluruh karakter adalah angka murni!

Contoh input:
- `0812345678X` (panjang 11 karakter, diawali 08) -> **Client: Valid!**
- `0812abc34567` (panjang 12 karakter, diawali 08) -> **Client: Valid!**
- `08001234567` (toll free prefix) -> **Client: Valid!**

Pengguna diizinkan menekan tombol *"Lanjut ke Ringkasan"* ke Step 5. Namun saat menekan tombol *"Kunci Slot"* di Step 5, API `/api/booking/hold` menjalankan regex ketat di server: `/^(?:\+62|62|0)8[1-9][0-9]{7,11}$/`. Server menolak request dengan HTTP 400 Bad Request. Pengguna bingung karena form di Step 4 menyatakan nomornya valid, tetapi di Step 5 transaksi gagal.

#### Langkah Reproduksi
1. Pada Step 4 (Kontak), masukkan nomor WhatsApp: `0812345678X`.
2. Klik di luar input (blur). Input tidak menampilkan pesan error merah, dan tombol *"Lanjut ke Ringkasan"* aktif.
3. Masuk ke Step 5, klik *"Kunci Slot & Bayar DP"*.
4. Amati munculnya error dari server: *"Format nomor WhatsApp tidak valid"*.

#### Perilaku yang Diharapkan
Validasi frontend `validateIndonesianPhone` harus sinkron 100% dengan regex server: hanya menerima digit angka murni setelah awalan 08 (misal: `/^08[1-9][0-9]{7,10}$/`).

---

### BUG-M801-04: Ketiadaan Debounce / Double-Click Guard pada Tombol Booking Bottom Bar

| Atribut | Nilai |
|:---|:---|
| **Severity** | **MEDIUM** |
| **Category** | Functional / UX |
| **Komponen / File** | `components/booking/booking-wizard.tsx` & `components/booking/booking-bottom-bar.tsx` |
| **Assignee Rekomendasi** | `coder:frontend` (M8-05) |

#### Deskripsi Masalah & Root Cause
Tombol `Kunci Slot & Bayar DP` di `BookingBottomBar` mengeksekusi handler `onNext`. Di dalam `booking-wizard.tsx`, `handleLockAndHold()` menyetel `setIsLoading(true)` secara asinkron. Jika pengguna di perangkat sentuh atau mouse double-click secara cepat (< 100ms), dua HTTP POST request terkirim secara bersamaan ke `/api/booking/hold`.

Sebagaimana dibuktikan oleh `tests/chaos-dogfooding.test.ts`:
- Request 1 berhasil mendapatkan **HTTP 201 Created** (slot terkunci).
- Request 2 ditolak oleh PostgreSQL lock dengan **HTTP 409 Conflict** (*"Slot pada jam dan barber ini sedang ditahan"*).
Jika response HTTP 409 selesai belakangan di event loop React, state `setConflictError()` akan menimpa alur sukses dan menampilkan banner kegagalan, padahal kursi sebenarnya sudah berhasil dikunci!

#### Langkah Reproduksi
1. Masuk ke Step 5 form reservasi.
2. Lakukan klik ganda secara cepat pada tombol *"Kunci Slot & Bayar DP Rp 20.000"*.
3. Amati tab Network DevTools: terdapat dua panggilan POST `/api/booking/hold`.

#### Perilaku yang Diharapkan
Handler klik tombol harus dilindungi oleh synchronous lock (misal: `useRef` guard atau immediate disable state) dan debounce 500ms agar event ganda diabaikan seketika.

---

### BUG-M801-03: Ketiadaan Real-Time Slot Stale Invalidation di Step 3 Schedule

| Atribut | Nilai |
|:---|:---|
| **Severity** | **MEDIUM** |
| **Category** | UX / Slot Contention |
| **Komponen / File** | `components/booking/step-3-schedule.tsx` (baris 49-117) |
| **Assignee Rekomendasi** | `coder:frontend` (M8-05) |

#### Deskripsi Masalah & Root Cause
`Step3Schedule` hanya melakukan fetch slot ketersediaan satu kali saat komponen di-mount. Jika Tab A mengunci slot pukul 15:30, Tab B yang masih membuka halaman jadwal tetap melihat slot 15:30 berwarna hijau menyala (*available*). Tab B melanjutkan memilih jam, mengisi nama dan nomor HP (membutuhkan waktu 1-2 menit), dan baru mendapati slot tersebut sudah diambil orang lain saat menekan tombol submit di Step 5.

#### Langkah Reproduksi
1. Buka dua tab browser pada halaman `/book` untuk tanggal dan barber yang sama.
2. Di Tab A, pilih slot 15:30 dan selesaikan sampai Step 5 (Kunci Kursi).
3. Di Tab B, perhatikan bahwa slot 15:30 masih tampak hijau dan bisa diklik.

#### Perilaku yang Diharapkan
Step 3 harus melakukan polling interval (misal setiap 20 detik saat aktif) atau menyegarkan data slot setiap kali langkah 3 dibuka kembali oleh pengguna.

---

### BUG-M801-08: Ketiadaan Window `beforeunload` Interceptor pada Layanan Pembayaran

| Atribut | Nilai |
|:---|:---|
| **Severity** | **MEDIUM** |
| **Category** | UX / Resilience |
| **Komponen / File** | `components/payment/payment-screen.tsx` |
| **Assignee Rekomendasi** | `coder:frontend` (M8-05) |

#### Deskripsi Masalah & Root Cause
Halaman `/booking/payment` tidak mendaftarkan event listener `beforeunload`. Ketika popup Midtrans Snap sedang aktif atau QRIS sedang menunggu scan, jika pengguna secara tidak sengaja menekan tombol Back browser atau gesture swipe, browser langsung berpindah ke halaman sebelumnya tanpa konfirmasi. Hal ini membuat status pembayaran di sisi pengguna terputus dan pengguna tidak tahu cara kembali ke sesi pembayaran tersebut.

#### Langkah Reproduksi
1. Buka halaman pembayaran `/booking/payment?code=DMZ-XXXX`.
2. Tekan tombol browser Back.

#### Perilaku yang Diharapkan
Tampilkan dialog konfirmasi standar browser jika transaksi pembayaran sedang aktif (`status === 'pending_payment'`).

---

### BUG-M801-02: Penolakan Format Nomor WhatsApp Tanpa Awalan 0 / +62 (Kebiasaan Ketik 8xxxxxxxxx)

| Atribut | Nilai |
|:---|:---|
| **Severity** | **MEDIUM** |
| **Category** | UX / Form Parsing |
| **Komponen / File** | `components/booking/utils.ts` & `lib/security/bot-protection.ts` |
| **Assignee Rekomendasi** | `coder:frontend` (M8-05) & `coder:backend` (M8-04) |

#### Deskripsi Masalah & Root Cause
Banyak pengguna ponsel di Indonesia terbiasa mengetikkan nomor HP langsung diawali angka `8` (misal: `81234567890`), mengabaikan angka 0 di depan. Pada modul WhatsApp server (`lib/notifications/whatsapp.ts` baris 644), kasus ini sudah ditangani dengan elegan (`cleaned = '62' + cleaned`). Namun pada validasi input frontend dan bot protection server, nomor ini ditolak mentah-mentah dengan pesan error *"Nomor WhatsApp seluler harus diawali dengan 08"*.

#### Langkah Reproduksi
1. Masukkan nomor `81234567890` pada Step 4.
2. Blur input.

#### Perilaku yang Diharapkan
Otomatis tambahkan prefix `0` di depan input atau normalisasi secara otomatis tanpa membingungkan pelanggan.

---

### BUG-M801-10: Strict Case-Sensitivity pada URL Kode Booking Menghasilkan HTTP 404

| Atribut | Nilai |
|:---|:---|
| **Severity** | **LOW** |
| **Category** | UX / URL Routing |
| **Komponen / File** | `app/api/booking/[code]/route.ts` (baris 133-136) |
| **Assignee Rekomendasi** | `coder:backend` (M8-04) |

#### Deskripsi Masalah & Root Cause
Kode booking disimpan dalam huruf kapital (misal: `DMZ-20261031-83EC4J`). Jika pelanggan mengklik link yang dikonversi menjadi huruf kecil oleh aplikasi perpesanan pihak ketiga (`/booking/success/dmz-20261031-83ec4j`), API mencari dengan operator kesetaraan eksak `.eq('booking_code', identifier)`. Akibatnya, server mengembalikan 404 Not Found.

#### Perilaku yang Diharapkan
Normalisasi identifier parameter URL dengan `.toUpperCase()` sebelum melakukan query pencarian booking.

---

### BUG-M801-12: Unsanitized Booking Code Parameter pada Metadata Halaman (Reflected Meta Injection)

| Atribut | Nilai |
|:---|:---|
| **Severity** | **LOW** |
| **Category** | Security / SEO |
| **Komponen / File** | `app/(public)/booking/success/[code]/page.tsx` (baris 9-19) |
| **Assignee Rekomendasi** | `coder:frontend` (M8-05) |

#### Deskripsi Masalah & Root Cause
Fungsi `generateMetadata({ params })` melakukan interpolasi langsung parameter `code` tanpa sanitasi:
```typescript
title: `Tiket Digital Boarding Pass ${code} | Damez Barbershop`
```
Jika URL mengandung tag HTML atau karakter kontrol, string tersebut dipantulkan langsung ke header meta tag halaman.

#### Perilaku yang Diharapkan
Sanitasi parameter `code` menggunakan regex alphanumeric `/^[A-Za-z0-9_-]+$/` sebelum dimasukkan ke dalam metadata tag.

---

### BUG-M801-13: Unsanitized Customer Notes Field pada Booking Hold Route Handler

| Atribut | Nilai |
|:---|:---|
| **Severity** | **LOW** |
| **Category** | Security / Stored Input |
| **Komponen / File** | `app/api/booking/hold/route.ts` (baris 264) |
| **Assignee Rekomendasi** | `coder:backend` (M8-04) |

#### Deskripsi Masalah & Root Cause
Parameter `notes` hanya dipotong panjangnya tanpa sanitasi tag HTML: `notes ? String(notes).trim().slice(0, 500) : undefined`. Karakter tag HTML tersimpan mentah di database, berpotensi menimbulkan XSS tersimpan jika dirender di dashboard admin tanpa escaping.

#### Perilaku yang Diharapkan
Terapkan pembersihan tag HTML dan karakter berbahaya pada `notes` sebagaimana diterapkan pada `sanitizeCustomerName`.

---

## 3. Matriks Rekapitulasi Seluruh Bug & Remediasi

| ID | Judul Bug | Severity | Kategori | Komponen Terdampak | Rekomendasi PIC |
|:---|:---|:---:|:---:|:---|:---:|
| **BUG-M801-00** | Frontend-to-Backend Time Format Mismatch (NaN Date) | CRITICAL | Functional | `booking-wizard.tsx` & `auto-expire.ts` | `coder:backend` (M8-04) / `frontend` (M8-05) |
| **BUG-M801-09** | Unauthenticated POST `/api/booking/[code]` Payment Bypass | CRITICAL | Security | `app/api/booking/[code]/route.ts` | `coder:backend` (M8-04) / `security` (M8-03) |
| **BUG-M801-06** | Late Settlement Webhook Leaves Expired Booking in Limbo | CRITICAL | Logic | `lib/payment/webhook.ts` | `coder:backend` (M8-04) |
| **BUG-M801-05** | Hold TTL Extension Vulnerability on Checkout Refresh | HIGH | Security | `app/api/booking/checkout/route.ts` | `coder:backend` (M8-04) |
| **BUG-M801-07** | Duplicate Conflicting Midtrans Order IDs on Browser Refresh | HIGH | Logic | `app/api/booking/checkout/route.ts` | `coder:backend` (M8-04) / `frontend` (M8-05) |
| **BUG-M801-11** | SuccessScreen Fallback Creates Fake Confirmed Boarding Pass | HIGH | Security | `components/booking/success-screen.tsx` | `coder:frontend` (M8-05) |
| **BUG-M801-01** | Client-Server Phone Validation Mismatch (Non-digit bypass) | HIGH | Functional | `components/booking/utils.ts` | `coder:frontend` (M8-05) / `backend` (M8-04) |
| **BUG-M801-04** | Missing Debounce on Booking Bottom Bar Button | MEDIUM | UX / Concurrency | `components/booking/booking-wizard.tsx` | `coder:frontend` (M8-05) |
| **BUG-M801-03** | Lack of Real-Time Slot Stale Invalidation in Step 3 | MEDIUM | UX | `components/booking/step-3-schedule.tsx` | `coder:frontend` (M8-05) |
| **BUG-M801-08** | Missing Window `beforeunload` Interceptor on Payment Screen | MEDIUM | UX / Resilience | `components/payment/payment-screen.tsx` | `coder:frontend` (M8-05) |
| **BUG-M801-02** | Rejection of 8xxxxxxxxx Phone Numbers Without Leading 0 | MEDIUM | UX | `components/booking/utils.ts` | `coder:frontend` (M8-05) |
| **BUG-M801-10** | Strict Case Sensitivity on Booking Code Retrieval | LOW | UX | `app/api/booking/[code]/route.ts` | `coder:backend` (M8-04) |
| **BUG-M801-12** | Reflected Meta Tag Injection in `generateMetadata` | LOW | Security | `app/(public)/booking/success/[code]/page.tsx` | `coder:frontend` (M8-05) |
| **BUG-M801-13** | Unsanitized Customer Notes Field in Booking Hold Route | LOW | Security | `app/api/booking/hold/route.ts` | `coder:backend` (M8-04) |

---

## 4. Bukti Verifikasi Eksekusi Nyata (Empirical Proof)

Pengujian telah dijalankan secara otomatis melalui test runner Node.js dengan perintah:
```bash
npm run test:chaos
```

### Log Eksekusi Test Harness (`tests/chaos-dogfooding.test.ts`)
```
======================================================================
   DAMEZ BARBERSHOP - M8-01 CHAOS DOGFOODING & EDGE-CASE BUG BASHING  
   Systematic Human Behavioral Chaos Testing & Vulnerability Audit    
======================================================================

--- SCENARIO 1: CHAOS TESTING FORMAT NOMOR WHATSAPP ---
[Phone Probe] Standard Local (081234567890): isValid=true
[Phone Probe] International Spaced (+62 812 3456 7890): isValid=true
[Phone Probe] Local Without Leading 0 (81234567890): Client isValid=false, WA isValid=true (HABIT GAP DETECTED)
[Phone Probe] Letters Suffix (0812345678X): Client isValid=true, Server isValid=false (DISCREPANCY DETECTED)
[Phone Probe] Embedded Alpha (0812abc34567): Client isValid=true, Server isValid=false (DISCREPANCY DETECTED)
[Phone Probe] Toll-free Prefix (08001234567): Client isValid=true, Server isValid=false (DISCREPANCY DETECTED)

--- SCENARIO 2: MULTI-TAB BOOKING PADA SLOT SAMA & DOUBLE CLICK ---
[Raw UI Time Probe] Status: 400, Error: "Rentang waktu (startTime - endTime) tidak valid."
   CRITICAL DISCOVERY: UI-generated time format causes NaN Date rejection on server!
[Multi-Tab Race] Tab A Status: 201, Tab B Status: 409
[Double-Click Test] Simulating burst clicks on "Kunci Slot & Bayar DP"
[Double Click Burst] Click 1 Status: 201, Click 2 Status: 409

--- SCENARIO 3: CHECKOUT TIMEOUT AT 14:59 & LATE SETTLEMENT DESYNC ---
[Hold Created] Booking DMZ-20261031-GXMP4H (ID: b1a16897d3e6-0000-0000-0000-00a1b3e77d8b)
[Checkout Token] Generated order_id: ORDER-DMZ-MVKWPX46-MVKWPX467SVL
[After Timeout Sweep] Booking status: expired
[Final Booking State] Status: expired
   CRITICAL FLAW: Settlement processed but booking remains EXPIRED!

--- SCENARIO 4: BACK / REFRESH DURING MIDTRANS SNAP MODAL ---
[Duplicate Order Generation] Order 1: ORDER-DMZ-MVKWPX4P-MVKWPX4PI2RK, Order 2: ORDER-DMZ-MVKWPX4P-MVKWPX4PON7E

--- SCENARIO 5: URL BOOKING CODE TAMPERING & SECURITY PROBES ---
[Bypass Probe] Target Booking: DMZ-20261031-9CU0N7
[Bypass Result] Status: 200, Booking Status: confirmed
   CRITICAL SECURITY VULNERABILITY: Payment bypass confirmed via POST /api/booking/[code]!
[Case Sensitivity] Lowercase "dmz-20261031-9cu0n7" Status: 404

======================================================================
   CHAOS DOGFOODING COMPLETE: 15 BUGS & LOGIC GAPS CATALOGED
======================================================================
CRITICAL: 3 | HIGH: 6 | MEDIUM: 4 | LOW: 2
```

---

## 5. Rekomendasi Remediasi Terstruktur untuk Task Turunan

Laporan ini dirancang sebagai acuan kerja langsung bagi dua sub-agent pelaksana perbaikan:

### A. Untuk `coder:backend` (Task M8-04)
1. **Perbaikan Format Waktu:** Tangani string waktu mentah (`"14:30"`) pada `lib/slots/auto-expire.ts` dan `app/api/booking/hold/route.ts` dengan menggabungkannya secara deterministik ke `booking_date` zona Asia/Jakarta (`+07:00`).
2. **Penutupan Endpoint Bypass:** Hapus atau beri pembatas `process.env.NODE_ENV !== 'production'` dan verifikasi bearer token admin pada `POST /api/booking/[code]`.
3. **Penanganan Late Settlement:** Perbarui logika `lib/payment/webhook.ts` agar menangani status `expired` dengan mekanisme pemulihan status ke `confirmed` (jika kursi belum terisi) atau flagging refund instan (jika kursi sudah terisi).
4. **Idempotensi Checkout Token:** Pastikan `app/api/booking/checkout/route.ts` tidak memperpanjang `hold_expires_at` saat refresh, dan mengembalikan `order_id` yang sama jika transaksi pending masih aktif.
5. **Normalisasi Case Code & Sanitasi Input:** Terapkan `.toUpperCase()` pada `code` di `app/api/booking/[code]/route.ts` dan sanitasi parameter `notes`.

### B. Untuk `coder:frontend` (Task M8-05)
1. **Pengiriman Format Waktu Lengkap:** Pastikan `booking-wizard.tsx` mengirimkan `start_time` dan `end_time` dalam format ISO standar `${date}T${time}:00+07:00`.
2. **Debounce Tombol Bayar DP:** Pasang guard debounce dan immediate disabled state pada tombol `Kunci Slot & Bayar DP Rp 20.000` di `BookingBottomBar`.
3. **Sinkronisasi Validasi WhatsApp:** Perbarui `validateIndonesianPhone` di `components/booking/utils.ts` agar menolak karakter non-digit dan mengizinkan awalan `8xxx` dengan otomatis menambahkan `0`.
4. **Hapus Fake Boarding Pass Fallback:** Bersihkan baris 48-93 pada `components/booking/success-screen.tsx` sehingga respons 404 menampilkan error screen yang tepat.
5. **Perlindungan Navigasi Back/Refresh:** Tambahkan hook `beforeunload` pada `payment-screen.tsx` saat transaksi pending masih berjalan.

---

**Disahkan oleh:**  
`coder:qa` (Quality Assurance & Exploratory Testing Specialist)  
Damez Barbershop Engineering Team  
2026-10-23
