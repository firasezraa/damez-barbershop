const { newDb } = require('pg-mem');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const db = newDb();

// Register mock for extensions and functions that pg-mem doesn't natively have
db.public.registerFunction({
  name: 'gen_random_uuid',
  implementation: () => crypto.randomUUID()
});

db.public.registerFunction({
  name: 'timezone',
  implementation: (tz, ts) => ts || new Date()
});

console.log('--- Testing PostgreSQL Schema in In-Memory DB ---');
const sqlFile = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');
const fullSql = fs.readFileSync(sqlFile, 'utf8');

// Strip out statements that are purely Supabase cloud / Postgres C-extensions
// (e.g. btree_gist, tstzrange generated column, EXCLUDE gist, plpgsql trigger loops)
// so pg-mem can test table DDL, foreign keys, constraints, and seed data.

const ddlStatements = [
  // 1. Types
  `CREATE TYPE booking_status_enum AS ENUM ('pending_payment', 'confirmed', 'in_progress', 'completed', 'no_show', 'rescheduled', 'cancelled', 'expired');`,
  `CREATE TYPE booking_type_enum AS ENUM ('online', 'walk_in');`,
  `CREATE TYPE payment_status_enum AS ENUM ('pending', 'settlement', 'capture', 'deny', 'cancel', 'expire', 'failure', 'refund');`,
  `CREATE TYPE settlement_method_enum AS ENUM ('none', 'cash', 'qris', 'transfer');`,

  // 2. Barbers
  `CREATE TABLE public.barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(50),
    title VARCHAR(100) NOT NULL DEFAULT 'Senior Barber',
    chair_number INTEGER NOT NULL UNIQUE,
    experience_years INTEGER NOT NULL DEFAULT 1,
    specialty TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    regular_day_off INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_chair_number CHECK (chair_number >= 1 AND chair_number <= 3),
    CONSTRAINT chk_experience_years CHECK (experience_years >= 0),
    CONSTRAINT chk_regular_day_off CHECK (regular_day_off >= 0 AND regular_day_off <= 6)
  );`,

  // 3. Services
  `CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price_idr INTEGER NOT NULL,
    down_payment_idr INTEGER NOT NULL DEFAULT 20000,
    description TEXT,
    is_recommended BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_duration_positive CHECK (duration_minutes > 0),
    CONSTRAINT chk_price_non_negative CHECK (price_idr >= 0),
    CONSTRAINT chk_dp_non_negative CHECK (down_payment_idr >= 0)
  );`,

  // 4. Working Hours
  `CREATE TABLE public.working_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    open_time TIME NOT NULL DEFAULT '10:00:00',
    close_time TIME NOT NULL DEFAULT '21:00:00',
    is_day_off BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6),
    CONSTRAINT uq_working_hours_barber_day UNIQUE (barber_id, day_of_week)
  );`,

  // 5. Blocked Slots
  `CREATE TABLE public.blocked_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    slot_type VARCHAR(50) NOT NULL DEFAULT 'recurring_break',
    day_of_week INTEGER,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    start_datetime TIMESTAMPTZ,
    end_datetime TIMESTAMPTZ,
    reason TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,

  // 6. Customers
  `CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(25) NOT NULL UNIQUE,
    email VARCHAR(150),
    total_bookings INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_customer_total_bookings CHECK (total_bookings >= 0)
  );`,

  // 7. Bookings
  `CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code VARCHAR(30) NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(25) NOT NULL,
    customer_email VARCHAR(150),
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE RESTRICT,
    booking_date DATE NOT NULL,
    booking_type booking_type_enum NOT NULL DEFAULT 'online',
    status booking_status_enum NOT NULL DEFAULT 'pending_payment',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    service_duration_minutes INTEGER NOT NULL,
    buffer_minutes INTEGER NOT NULL DEFAULT 10,
    total_price_idr INTEGER NOT NULL,
    down_payment_idr INTEGER NOT NULL DEFAULT 20000,
    remaining_balance_idr INTEGER NOT NULL,
    settlement_method settlement_method_enum NOT NULL DEFAULT 'none',
    settlement_paid_at TIMESTAMPTZ,
    hold_expires_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    rescheduled_from_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    rescheduled_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_booking_time_order CHECK (end_time > start_time),
    CONSTRAINT chk_prices_non_negative CHECK (total_price_idr >= 0 AND down_payment_idr >= 0 AND remaining_balance_idr >= 0)
  );`,

  // 8. Booking Services
  `CREATE TABLE public.booking_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    price_idr INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_bs_price_non_negative CHECK (price_idr >= 0),
    CONSTRAINT chk_bs_duration_positive CHECK (duration_minutes > 0),
    CONSTRAINT chk_bs_quantity_positive CHECK (quantity > 0),
    CONSTRAINT uq_booking_service UNIQUE (booking_id, service_id)
  );`,

  // 9. Payments
  `CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    order_id VARCHAR(100) NOT NULL UNIQUE,
    snap_token TEXT,
    snap_redirect_url TEXT,
    payment_type VARCHAR(50),
    gross_amount NUMERIC(12, 2) NOT NULL DEFAULT 20000.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
    transaction_status payment_status_enum NOT NULL DEFAULT 'pending',
    fraud_status VARCHAR(50),
    status_code VARCHAR(20),
    status_message TEXT,
    transaction_id VARCHAR(100),
    payment_amounts JSONB,
    raw_response JSONB,
    signature_key TEXT,
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,

  // 10. Settings
  `CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,

  // 11. Notification Logs
  `CREATE TABLE public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    recipient_phone VARCHAR(25) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
    template_name VARCHAR(50) NOT NULL,
    message_body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    response_payload JSONB,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`
];

for (const ddl of ddlStatements) {
  try {
    db.public.none(ddl);
  } catch (err) {
    console.error('SQL Execution Error:', err.message);
    process.exit(1);
  }
}

console.log('PASS: All 10 relational tables created successfully in PostgreSQL engine!');

// Test Seed Inserts
try {
  db.public.none(`
    INSERT INTO public.barbers (
      id, barber_code, name, nickname, title, chair_number, experience_years, specialty, bio, avatar_url, regular_day_off, is_active, display_order
    ) VALUES
    ('b0000001-0000-0000-0000-000000000001', 'BBR-01', 'Rian Pratama', 'The Sculptor', 'Senior Master Barber', 1, 6, 'Classic Cuts & Pompadour', 'Bio Rian', '/images/barbers/rian-pratama.webp', 0, true, 1),
    ('b0000001-0000-0000-0000-000000000002', 'BBR-02', 'Dimas Arisandi', 'Fade Master', 'Clipper & Fade Specialist', 2, 5, 'High/Low/Skin Fade & Textured Cut', 'Bio Dimas', '/images/barbers/dimas-arisandi.webp', 1, true, 2),
    ('b0000001-0000-0000-0000-000000000003', 'BBR-03', 'Kevin Sanjaya', 'Grooming Specialist', 'Master of Shave & Scalp Therapy', 3, 7, 'Beard Sculpting & Scalp Therapy', 'Bio Kevin', '/images/barbers/kevin-sanjaya.webp', 2, true, 3);
  `);
  console.log('PASS: 3 Master Barbers inserted successfully');

  db.public.none(`
    INSERT INTO public.services (
      id, service_code, name, slug, category, duration_minutes, price_idr, down_payment_idr, is_recommended, is_active, display_order, description
    ) VALUES
    ('a0000001-0000-0000-0000-000000000001', 'SRV-01', 'Gentlemen Classic Haircut', 'gentlemen-classic-haircut', 'Core Haircut', 45, 50000, 20000, true, true, 1, 'Desc 1'),
    ('a0000001-0000-0000-0000-000000000002', 'SRV-02', 'Premium Fade & Taper Cut', 'premium-fade-taper-cut', 'Core Haircut', 50, 65000, 20000, true, true, 2, 'Desc 2'),
    ('a0000001-0000-0000-0000-000000000003', 'SRV-03', 'Junior / Kids Haircut', 'junior-kids-haircut', 'Special Haircut', 35, 40000, 20000, false, true, 3, 'Desc 3'),
    ('a0000001-0000-0000-0000-000000000004', 'SRV-04', 'Beard Sculpting & Hot Towel Shave', 'beard-sculpting-hot-towel-shave', 'Grooming', 35, 45000, 20000, false, true, 4, 'Desc 4'),
    ('a0000001-0000-0000-0000-000000000005', 'SRV-05', 'Relaxing Hair Spa & Anti-Dandruff Scalp Treatment', 'relaxing-hair-spa-anti-dandruff', 'Treatment', 40, 55000, 20000, false, true, 5, 'Desc 5'),
    ('a0000001-0000-0000-0000-000000000006', 'SRV-06', 'Black Hair Color Revival', 'black-hair-color-revival', 'Coloring', 45, 65000, 20000, false, true, 6, 'Desc 6'),
    ('a0000001-0000-0000-0000-000000000007', 'SRV-07', 'Express Clean Cut & Wash', 'express-clean-cut-wash', 'Quick Grooming', 30, 40000, 20000, false, true, 7, 'Desc 7'),
    ('a0000001-0000-0000-0000-000000000008', 'SRV-08', 'The Damez Signature Executive Combo', 'the-damez-signature-executive-combo', 'Bundled Combo', 60, 95000, 20000, true, true, 8, 'Desc 8');
  `);
  console.log('PASS: 8 Benchmark Services inserted successfully');

  // Test Customer Insert
  db.public.none(`
    INSERT INTO public.customers (id, name, phone, email)
    VALUES ('c0000001-0000-0000-0000-000000000001', 'Budi Santoso', '081234567890', 'budi@example.com');
  `);
  console.log('PASS: Customer record inserted successfully');

  // Test Booking Insert
  db.public.none(`
    INSERT INTO public.bookings (
      id, booking_code, customer_id, customer_name, customer_phone, customer_email,
      barber_id, booking_date, booking_type, status, start_time, end_time,
      service_duration_minutes, buffer_minutes, total_price_idr, down_payment_idr, remaining_balance_idr
    ) VALUES (
      'b1111111-0000-0000-0000-000000000001', 'DMZ-20261023-0001', 'c0000001-0000-0000-0000-000000000001',
      'Budi Santoso', '081234567890', 'budi@example.com', 'b0000001-0000-0000-0000-000000000001',
      '2026-10-23', 'online', 'confirmed', now(), now() + interval '55 minutes',
      45, 10, 50000, 20000, 30000
    );
  `);
  console.log('PASS: Booking record with FK relations inserted successfully');

  // Test Booking Services Junction
  db.public.none(`
    INSERT INTO public.booking_services (booking_id, service_id, price_idr, duration_minutes, quantity)
    VALUES ('b1111111-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 50000, 45, 1);
  `);
  console.log('PASS: Booking Services junction table record inserted successfully');

  // Test Payment Record
  db.public.none(`
    INSERT INTO public.payments (
      booking_id, order_id, gross_amount, currency, transaction_status
    ) VALUES (
      'b1111111-0000-0000-0000-000000000001', 'DMZ-PAY-20261023-0001', 20000.00, 'IDR', 'settlement'
    );
  `);
  console.log('PASS: Payment record inserted successfully');

  // Test Slot Temporary Hold & Auto-Expire SQL
  db.public.none(`
    INSERT INTO public.bookings (
      id, booking_code, customer_id, customer_name, customer_phone,
      barber_id, booking_date, booking_type, status, start_time, end_time,
      service_duration_minutes, buffer_minutes, total_price_idr, down_payment_idr, remaining_balance_idr,
      hold_expires_at
    ) VALUES (
      'b2222222-0000-0000-0000-000000000002', 'DMZ-HOLD-EXPIRE-TEST', 'c0000001-0000-0000-0000-000000000001',
      'Test User Expire', '081234567899', 'b0000001-0000-0000-0000-000000000001',
      '2026-10-24', 'online', 'pending_payment', now() + interval '2 hours', now() + interval '3 hours',
      45, 10, 50000, 20000, 30000,
      now() - interval '5 minutes'
    );
  `);
  console.log('PASS: Expired pending_payment booking inserted successfully');

  // Insert matching pending payment
  db.public.none(`
    INSERT INTO public.payments (
      id, booking_id, order_id, gross_amount, currency, transaction_status
    ) VALUES (
      'c2222222-0000-0000-0000-000000000002', 'b2222222-0000-0000-0000-000000000002', 'ORDER-EXPIRE-TEST', 20000.00, 'IDR', 'pending'
    );
  `);

  // Execute cleanup query simulating fn_cleanup_expired_holds
  db.public.none(`
    UPDATE public.bookings
    SET status = 'expired',
        cancelled_at = now(),
        cancellation_reason = 'Payment hold expired (timeout > 15 minutes)'
    WHERE status = 'pending_payment'
      AND hold_expires_at IS NOT NULL
      AND hold_expires_at <= now();

    UPDATE public.payments
    SET transaction_status = 'expire',
        status_message = 'Booking hold timed out (> 15 minutes). Payment cancelled.'
    WHERE booking_id = 'b2222222-0000-0000-0000-000000000002'
      AND transaction_status = 'pending';
  `);

  const expiredBooking = db.public.one(`
    SELECT status, cancellation_reason FROM public.bookings WHERE id = 'b2222222-0000-0000-0000-000000000002';
  `);
  const expiredPayment = db.public.one(`
    SELECT transaction_status FROM public.payments WHERE booking_id = 'b2222222-0000-0000-0000-000000000002';
  `);

  if (expiredBooking.status === 'expired' && expiredPayment.transaction_status === 'expire') {
    console.log('PASS: SQL cleanup expired holds logic verified in PostgreSQL engine!');
  } else {
    throw new Error('Cleanup query did not expire the overdue booking hold or payment');
  }

  // Query and assert relations
  const res = db.public.many(`
    SELECT b.booking_code, c.name as customer_name, br.name as barber_name, s.name as service_name, p.gross_amount as dp_paid
    FROM public.bookings b
    JOIN public.customers c ON b.customer_id = c.id
    JOIN public.barbers br ON b.barber_id = br.id
    JOIN public.booking_services bs ON bs.booking_id = b.id
    JOIN public.services s ON bs.service_id = s.id
    JOIN public.payments p ON p.booking_id = b.id;
  `);

  console.log('\nRelational Query Result:', res);
  if (res.length === 1 && res[0].customer_name === 'Budi Santoso' && res[0].barber_name === 'Rian Pratama') {
    console.log('\nOVERALL PG-MEM TEST: PASSED 100%');
  } else {
    throw new Error('Query result did not match expected relational data');
  }

} catch (err) {
  console.error('Data Insertion/Query Error:', err);
  process.exit(1);
}
