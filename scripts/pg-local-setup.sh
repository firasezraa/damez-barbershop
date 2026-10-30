#!/usr/bin/env bash
# Bootstrap Postgres 16 lokal untuk development & test integrasi.
# VPS ini tidak punya Docker, jadi Supabase CLI `supabase start` tidak dipakai
# (keputusan dikunci 2026-10-30, IDEA.md §15.2).
#
# Password di sini HANYA untuk database lokal di loopback. Tidak ada kredensial
# produksi di berkas ini; override dengan DAMEZ_DB_PASSWORD kalau mau.
set -euo pipefail

DB_USER="${DAMEZ_DB_USER:-damez}"
DB_PASSWORD="${DAMEZ_DB_PASSWORD:-damez}"
DBS=(damez_dev damez_test)

sudo apt-get update -qq
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql-16

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}' SUPERUSER;"
fi

for db in "${DBS[@]}"; do
  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${db}'" | grep -q 1; then
    sudo -u postgres createdb -O "${DB_USER}" "${db}"
  fi
done

psql "postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/damez_test" -c 'SELECT version();'
