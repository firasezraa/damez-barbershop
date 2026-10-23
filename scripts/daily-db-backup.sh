#!/usr/bin/env bash
# ==============================================================================
# DAMEZ BARBERSHOP - AUTOMATED DAILY SUPABASE DATABASE BACKUP
# Kepatuhan: UU No. 27/2022 (UU PDP) & Retensi 30 Hari
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "${BACKUP_DIR}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_BASENAME="damez_backup_${TIMESTAMP}"
RAW_DUMP_FILE="${BACKUP_DIR}/${BACKUP_BASENAME}.dump"
ENCRYPTED_FILE="${RAW_DUMP_FILE}.gpg"
GPG_PASSPHRASE="${DB_BACKUP_ENCRYPTION_KEY:-damez_barbershop_secure_backup_key_2026}"

echo "[INFO] [$(date)] Memulai proses pencadangan basis data Supabase..."

# 1. Jalankan pg_dump jika host & password tersedia
if [ -n "${SUPABASE_DB_HOST:-}" ] && [ -n "${SUPABASE_DB_PASSWORD:-}" ]; then
  echo "[INFO] Menghubungkan ke Supabase PostgreSQL di ${SUPABASE_DB_HOST}..."
  PGPASSWORD="${SUPABASE_DB_PASSWORD}" pg_dump \
    -h "${SUPABASE_DB_HOST}" \
    -p "${SUPABASE_DB_PORT:-5432}" \
    -U "${SUPABASE_DB_USER:-postgres}" \
    -d "${SUPABASE_DB_NAME:-postgres}" \
    -F c -b -v \
    -f "${RAW_DUMP_FILE}"
elif [ -n "${DATABASE_URL:-}" ]; then
  echo "[INFO] Menghubungkan ke PostgreSQL melalui DATABASE_URL..."
  pg_dump "${DATABASE_URL}" -F c -b -v -f "${RAW_DUMP_FILE}"
else
  echo "[WARN] Kredensial Supabase remote tidak disetel. Membuat snapshot backup dari skema dan migrasi lokal..."
  tar -czf "${RAW_DUMP_FILE}" supabase/migrations/ types/
fi

echo "[INFO] Berkas dump dibuat: ${RAW_DUMP_FILE} ($(du -h "${RAW_DUMP_FILE}" | cut -f1))"

# 2. Enkripsi berkas menggunakan GPG (AES-256) untuk perlindungan data pribadi UU PDP
echo "[INFO] Mengenkripsi berkas cadangan dengan cipher AES-256..."
if command -v gpg >/dev/null 2>&1; then
  gpg --batch --yes --passphrase "${GPG_PASSPHRASE}" \
    --symmetric --cipher-algo AES256 \
    --output "${ENCRYPTED_FILE}" "${RAW_DUMP_FILE}"
elif command -v openssl >/dev/null 2>&1; then
  openssl enc -aes-256-cbc -salt -pbkdf2 \
    -pass pass:"${GPG_PASSPHRASE}" \
    -in "${RAW_DUMP_FILE}" \
    -out "${ENCRYPTED_FILE}"
else
  echo "[ERROR] gpg maupun openssl tidak ditemukan untuk enkripsi."
  exit 1
fi

# Hapus berkas mentah tidak terenkripsi demi kepatuhan keamanan
rm -f "${RAW_DUMP_FILE}"
echo "[SUCCESS] Berkas cadangan terenkripsi aman tersimpan: ${ENCRYPTED_FILE}"

# 3. Unggah ke Cloud Storage (S3 / R2 / Supabase Storage) jika dikonfigurasi
if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  echo "[INFO] Mengunggah ke bucket penyimpanan awan: ${BACKUP_S3_BUCKET}..."
  aws s3 cp "${ENCRYPTED_FILE}" "${BACKUP_S3_BUCKET}/${BACKUP_BASENAME}.dump.gpg"
fi

# 4. Kebijakan Retensi Lokal: Hapus cadangan lokal yang lebih tua dari 30 hari
echo "[INFO] Memeriksa kebijakan retensi 30 hari..."
find "${BACKUP_DIR}" -name "damez_backup_*.dump.gpg" -type f -mtime +30 -delete || true

echo "[COMPLETE] [$(date)] Backup basis data harian selesai 100%!"
