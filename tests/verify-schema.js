/**
 * Schema Verification Script for Damez Barbershop
 * Verifies SQL migration 001_initial_schema.sql against all requirements
 */
const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');
const typesPath = path.join(__dirname, '../types/database.types.ts');

console.log('--- 1. Checking Deliverable File Existence ---');
if (!fs.existsSync(migrationPath)) {
  console.error('FAIL: Migration file not found at', migrationPath);
  process.exit(1);
}
console.log('PASS: Migration file exists at', migrationPath);

if (!fs.existsSync(typesPath)) {
  console.error('FAIL: Types file not found at', typesPath);
  process.exit(1);
}
console.log('PASS: TypeScript types file exists at', typesPath);

const sql = fs.readFileSync(migrationPath, 'utf8');
const types = fs.readFileSync(typesPath, 'utf8');

console.log('\n--- 2. Verifying Required Tables in SQL Schema ---');
const requiredTables = [
  'barbers',
  'services',
  'working_hours',
  'blocked_slots',
  'customers',
  'bookings',
  'booking_services',
  'payments',
  'settings',
  'notification_logs'
];

let allTablesFound = true;
for (const table of requiredTables) {
  const tableRegex = new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\s*\\(`, 'i');
  if (tableRegex.test(sql)) {
    console.log(`PASS: Table public.${table} found`);
  } else {
    console.error(`FAIL: Table public.${table} NOT found in SQL`);
    allTablesFound = false;
  }
}

console.log('\n--- 3. Verifying PostgreSQL Extensions & Range Constraints ---');
const requiredExtensions = ['uuid-ossp', 'pgcrypto', 'btree_gist'];
for (const ext of requiredExtensions) {
  const extRegex = new RegExp(`CREATE EXTENSION IF NOT EXISTS "${ext}"`, 'i');
  if (extRegex.test(sql)) {
    console.log(`PASS: Extension "${ext}" found`);
  } else {
    console.error(`FAIL: Extension "${ext}" missing`);
    allTablesFound = false;
  }
}

// Check GiST exclusion constraint
const gistExclusion = /CONSTRAINT no_overlapping_active_bookings EXCLUDE USING gist\s*\(\s*barber_id WITH =,\s*booking_range WITH &&\s*\)/i;
if (gistExclusion.test(sql)) {
  console.log('PASS: GiST Exclusion Constraint on (barber_id WITH =, booking_range WITH &&) found');
} else {
  console.error('FAIL: GiST Exclusion Constraint missing or incorrect syntax');
  allTablesFound = false;
}

// Check TSTZRANGE generated column
const tstzrangeCol = /booking_range TSTZRANGE GENERATED ALWAYS AS \(tstzrange\(start_time, end_time, '\[\)'\)\) STORED/i;
if (tstzrangeCol.test(sql)) {
  console.log('PASS: Generated TSTZRANGE column for booking_range found');
} else {
  console.error('FAIL: Generated TSTZRANGE column missing or incorrect syntax');
  allTablesFound = false;
}

console.log('\n--- 4. Verifying Row Level Security (RLS) on All Tables ---');
for (const table of requiredTables) {
  const rlsRegex = new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`, 'i');
  if (rlsRegex.test(sql)) {
    console.log(`PASS: RLS enabled on public.${table}`);
  } else {
    console.error(`FAIL: RLS NOT enabled on public.${table}`);
    allTablesFound = false;
  }
}

console.log('\n--- 5. Verifying Seed Data ---');
// Check 3 Master Barbers
const barbers = ['BBR-01', 'BBR-02', 'BBR-03'];
for (const b of barbers) {
  if (sql.includes(b)) {
    console.log(`PASS: Master Barber ${b} seeded`);
  } else {
    console.error(`FAIL: Master Barber ${b} missing from seeds`);
    allTablesFound = false;
  }
}

// Check 8 Services
const services = ['SRV-01', 'SRV-02', 'SRV-03', 'SRV-04', 'SRV-05', 'SRV-06', 'SRV-07', 'SRV-08'];
for (const s of services) {
  if (sql.includes(s)) {
    console.log(`PASS: Benchmark Service ${s} seeded`);
  } else {
    console.error(`FAIL: Benchmark Service ${s} missing from seeds`);
    allTablesFound = false;
  }
}

// Check Settings
const settingsKeys = ['shop_operational_hours', 'booking_policy', 'shop_profile', 'payment_gateway'];
for (const k of settingsKeys) {
  if (sql.includes(k)) {
    console.log(`PASS: Setting key '${k}' seeded`);
  } else {
    console.error(`FAIL: Setting key '${k}' missing from seeds`);
    allTablesFound = false;
  }
}

console.log('\n--- 6. Verifying TypeScript Type Definitions ---');
for (const table of requiredTables) {
  if (types.includes(`${table}: {`) && types.includes(`Row: {`) && types.includes(`Insert: {`) && types.includes(`Update: {`)) {
    console.log(`PASS: TypeScript table definition for '${table}' found`);
  } else {
    console.error(`FAIL: TypeScript definition for '${table}' missing or incomplete`);
    allTablesFound = false;
  }
}

console.log('\n--- 7. Verifying Migration 002 (Slot Temporary Locking & Auto-Expire) ---');
const migration2Path = path.join(__dirname, '../supabase/migrations/002_slot_temporary_locking_and_auto_expire.sql');
if (fs.existsSync(migration2Path)) {
  const sql2 = fs.readFileSync(migration2Path, 'utf8');
  if (sql2.includes('CREATE OR REPLACE FUNCTION public.fn_cleanup_expired_holds()')) {
    console.log('PASS: Function public.fn_cleanup_expired_holds() found in Migration 002');
  } else {
    console.error('FAIL: Function public.fn_cleanup_expired_holds() missing in Migration 002');
    allTablesFound = false;
  }

  if (sql2.includes('trg_auto_expire_holds_before_booking_insert')) {
    console.log('PASS: Trigger trg_auto_expire_holds_before_booking_insert found in Migration 002');
  } else {
    console.error('FAIL: Trigger trg_auto_expire_holds_before_booking_insert missing in Migration 002');
    allTablesFound = false;
  }

  if (sql2.includes('CREATE OR REPLACE FUNCTION public.fn_create_booking_hold(')) {
    console.log('PASS: Stored Procedure public.fn_create_booking_hold() found in Migration 002');
  } else {
    console.error('FAIL: Stored Procedure public.fn_create_booking_hold() missing in Migration 002');
    allTablesFound = false;
  }

  if (sql2.includes('v_active_holds')) {
    console.log('PASS: Monitoring View public.v_active_holds found in Migration 002');
  } else {
    console.error('FAIL: Monitoring View public.v_active_holds missing in Migration 002');
    allTablesFound = false;
  }
} else {
  console.error('FAIL: Migration 002 file not found at', migration2Path);
  allTablesFound = false;
}

console.log('\n--- 8. Verifying Migration 003 (Security Hardening & Concurrency Locks) ---');
const migration3Path = path.join(__dirname, '../supabase/migrations/003_security_hardening_concurrency_and_locks.sql');
if (fs.existsSync(migration3Path)) {
  const sql3 = fs.readFileSync(migration3Path, 'utf8');
  if (sql3.includes('CREATE TABLE IF NOT EXISTS public.security_audit_logs')) {
    console.log('PASS: Table public.security_audit_logs found in Migration 003');
  } else {
    console.error('FAIL: Table public.security_audit_logs missing in Migration 003');
    allTablesFound = false;
  }

  if (sql3.includes('FOR UPDATE')) {
    console.log('PASS: Explicit row-lock (SELECT FOR UPDATE) found in Migration 003');
  } else {
    console.error('FAIL: Explicit row-lock (SELECT FOR UPDATE) missing in Migration 003');
    allTablesFound = false;
  }

  if (sql3.includes('pg_advisory_xact_lock')) {
    console.log('PASS: Transaction advisory lock found in Migration 003');
  } else {
    console.error('FAIL: Transaction advisory lock missing in Migration 003');
    allTablesFound = false;
  }

  if (sql3.includes('anti_hoarding_blocked')) {
    console.log('PASS: Anti-hoarding security log event found in Migration 003');
  } else {
    console.error('FAIL: Anti-hoarding security log event missing in Migration 003');
    allTablesFound = false;
  }
} else {
  console.error('FAIL: Migration 003 file not found at', migration3Path);
  allTablesFound = false;
}

if (!allTablesFound) {
  console.error('\nOVERALL STATUS: FAILED');
  process.exit(1);
} else {
  console.log('\nOVERALL STATUS: ALL CHECKS PASSED (100% PASS)');
}
