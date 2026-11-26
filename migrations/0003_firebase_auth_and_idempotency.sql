-- RAAKKY CHICKEN - ADDITIVE MIGRATION FOR FIREBASE AUTH & ORDER IDEMPOTENCY
-- Migration: 0003_firebase_auth_and_idempotency.sql
-- Backward-compatible, non-destructive additive schema changes only.

-- 1. Extend customers with permanent Firebase UID & verified credential claims
ALTER TABLE customers ADD COLUMN firebase_uid TEXT;
ALTER TABLE customers ADD COLUMN email_verified BOOLEAN DEFAULT 0;
ALTER TABLE customers ADD COLUMN phone_verified BOOLEAN DEFAULT 0;
ALTER TABLE customers ADD COLUMN last_login_at DATETIME;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_firebase_uid
  ON customers(firebase_uid)
  WHERE firebase_uid IS NOT NULL;

-- 2. Extend customer_addresses with locality display name
ALTER TABLE customer_addresses ADD COLUMN locality_name TEXT;

-- 3. Extend orders with verified customer identity, audit fields & idempotency protection
ALTER TABLE orders ADD COLUMN firebase_uid TEXT;
ALTER TABLE orders ADD COLUMN customer_email TEXT;
ALTER TABLE orders ADD COLUMN email_verified BOOLEAN DEFAULT 0;
ALTER TABLE orders ADD COLUMN phone_verified BOOLEAN DEFAULT 0;
ALTER TABLE orders ADD COLUMN idempotency_key TEXT;
ALTER TABLE orders ADD COLUMN source TEXT DEFAULT 'APP_B';

CREATE INDEX IF NOT EXISTS idx_orders_firebase_uid_created
  ON orders(firebase_uid, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_uid_idempotency
  ON orders(firebase_uid, idempotency_key)
  WHERE firebase_uid IS NOT NULL AND idempotency_key IS NOT NULL;

-- 4. Dedicated idempotency table protecting checkout submission against retries/double-clicks
CREATE TABLE IF NOT EXISTS order_idempotency_keys (
  id TEXT PRIMARY KEY,
  firebase_uid TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  order_id TEXT REFERENCES orders(id),
  status TEXT CHECK(status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED')) NOT NULL DEFAULT 'IN_PROGRESS',
  response_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(firebase_uid, idempotency_key)
);

-- 5. Atomic sequential order numbers (RK-ORD-YYYY-XXXX)
CREATE TABLE IF NOT EXISTS order_sequences (
  year INTEGER PRIMARY KEY,
  last_seq INTEGER NOT NULL DEFAULT 42
);
INSERT OR IGNORE INTO order_sequences (year, last_seq) VALUES (2026, 42);

-- 6. Edge API rate limiting store
CREATE TABLE IF NOT EXISTS api_rate_limits (
  rate_key TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start INTEGER NOT NULL
);

-- 7. Storefront product metadata columns (additive, optional)
ALTER TABLE products ADD COLUMN default_skin_type TEXT;
ALTER TABLE products ADD COLUMN boneless_type TEXT;
ALTER TABLE products ADD COLUMN search_aliases_json TEXT;
ALTER TABLE products ADD COLUMN storage_tips_en TEXT;
ALTER TABLE products ADD COLUMN storage_tips_ta TEXT;
ALTER TABLE products ADD COLUMN approx_weight_per_piece_json TEXT;
ALTER TABLE products ADD COLUMN approx_piece_count_json TEXT;
