# ADR-002: Manajemen Slot Staggered Break & Penguncian Konkurensi Database GiST

## Status
Accepted

## Tanggal
2026-10-23

## Konteks
Damez Barbershop mengoperasikan 3 kursi pangkas rambut dengan 3 master barber (Rian Pratama, Dimas Prasetyo, Kevin Sanjaya). Gerai beroperasi pukul 10:00 – 21:00 WIB (11 jam operasional per hari) dengan jadwal istirahat bergiliran (*staggered break*) selama 60 menit per kapster agar gerai tidak pernah kosong melompong. Layanan memiliki durasi dinamis (30 hingga 80 menit) ditambah jeda sanitasi alat dan pembersihan area pangkas selama 10 menit di setiap akhir sesi.

Tantangan teknis utama:
1. **Risiko Double Booking**: Pada jam sibuk (*peak hours* akhir pekan), banyak pelanggan dapat mengakses dan mencoba memesan slot barber yang sama pada detik yang bersamaan (*simultaneous stampede*).
2. **Tumpang Tindih Sebagian (Partial Overlap)**: Layanan majemuk (contoh: Haircut 45m + Shaving 35m + Sanitasi 10m = 90m) tidak boleh menabrak jadwal slot yang sudah terisi di tengah-tengah durasi tersebut.
3. **Penyanderaan Slot (Denial-of-Inventory / Hoarding)**: Pelanggan yang membuka pop-up pembayaran tidak boleh mengunci slot selamanya jika mereka meninggalkan peramban tanpa menyelesaikan pembayaran.

## Keputusan
Menerapkan arsitektur pencegahan bentrok multi-layer yang berpusat pada **PostgreSQL Range Types (`TSTZRANGE`)**, **GiST Exclusion Constraints**, **Penguncian Baris Pesimistik (`SELECT ... FOR UPDATE`)**, dan **Mesin Temporary Hold TTL 15 Menit**.

Rincian implementasi teknis:
- **Tipe Data Rentang Waktu**: Jadwal booking disimpan dalam kolom komputasi terindeks `booking_range TSTZRANGE GENERATED ALWAYS AS (tstzrange(booking_start, booking_end, '[)')) STORED`.
- **GiST Exclusion Constraint**: Menggunakan ekstensi PostgreSQL `btree_gist` pada level basis data:
  ```sql
  ALTER TABLE public.bookings ADD CONSTRAINT exclude_barber_slot_overlap
  EXCLUDE USING gist (
      barber_id WITH =,
      booking_range WITH &&
  ) WHERE (status IN ('pending_payment', 'confirmed', 'in_progress'));
  ```
  Ini menjamin secara matematis pada level kernel database bahwa tidak ada dua reservasi aktif yang dapat berbagi barber dan rentang waktu yang saling bersinggungan.
- **Pessimistic Concurrency Lock**: Saat inisialisasi reservasi, sistem mengeksekusi `SELECT ... FOR UPDATE` dan *transaction advisory lock* berbasis hash slot dan barber ID untuk menserialisasi request bersamaan.
- **Temporary Hold TTL 15 Menit (900 Detik)**: Slot yang baru dipesan berstatus `pending_payment` selama 15 menit. Jika pembayaran DP tidak selesai dalam 15 menit, mesin auto-expire (`fn_cleanup_expired_holds()` dan `scripts/slot-expire-worker.ts`) secara otomatis membatalkan hold dan melepaskan kursi kembali ke pasar.
- **Guard Anti-Hoarding**: Membatasi maksimal 2 hold aktif per nomor telepon/alamat IP dalam satu waktu.

## Alternatif yang Dipertimbangkan

### 1. In-Memory Distributed Lock (Redis Redlock)
- *Kelebihan*: Penguncian di memori sangat cepat (< 5 ms).
- *Kekurangan*: Menambah ketergantungan infrastruktur terpisah (Redis server/cluster), membutuhkan pengelolaan koneksi tambahan, dan rawan split-brain jika koneksi jaringan antara Node.js dan Redis terputus sementara basis data utama tetap berjalan.
- *Alasan Ditolak*: Menambah kompleksitas operasional tanpa nilai tambah signifikan dibandingkan kapabilitas native PostgreSQL GiST.

### 2. Optimistic Concurrency Control (Version Number)
- *Kelebihan*: Tidak ada penguncian baris saat membaca.
- *Kekurangan*: Pada skenario booking jam pangkas, bentrok waktu bersifat interval (rentang menit), bukan sekadar kesamaan versi baris entitas tunggal. Optimistic locking sulit memvalidasi partial overlap durasi 90 menit dengan slot 45 menit lainnya secara atomik.
- *Alasan Ditolak*: Tidak memadai untuk mencegah overlap interval waktu yang kompleks.

## Konsekuensi & Dampak
- Keandalan mutlak (Zero Double Booking): Terbukti melalui unit test konkurensi (`tests/concurrency-race-condition.test.ts`), dari 20 request simultan pada detik yang sama untuk slot yang identik, tepat 1 request berhasil (HTTP 201) dan 19 request lainnya ditolak dengan aman (`SLOT_ALREADY_LOCKED`, HTTP 409).
- Integritas data terjamin pada level database, sehingga aman dari kegagalan aplikasi web layer Next.js.
- Diperlukan background worker atau scheduled cron untuk memicu pelepasan slot expired secara berkala.
