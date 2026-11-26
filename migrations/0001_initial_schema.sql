-- RAAKKY CHICKEN - SHARED CLOUDFLARE D1 DATABASE SCHEMA
-- Migration: 0001_initial_schema.sql

CREATE TABLE IF NOT EXISTS shop_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  is_open BOOLEAN DEFAULT 1,
  order_acceptance_paused BOOLEAN DEFAULT 0,
  pause_reason_en TEXT DEFAULT 'Our kitchen counter is experiencing heavy morning rush. Orders will resume shortly.',
  pause_reason_ta TEXT DEFAULT 'கடையில் தற்போது கூட்டம் அதிகமாக உள்ளது. சிறிது நேரம் கழித்து ஆர்டர்கள் மீண்டும் தொடங்கும்.',
  min_order_amount REAL DEFAULT 150.0,
  delivery_fee REAL DEFAULT 35.0,
  free_delivery_threshold REAL DEFAULT 499.0,
  store_phone TEXT DEFAULT '+919843599030',
  store_address_en TEXT DEFAULT '81, Thiruvalluvar Nagar, Press Colony, Coimbatore, Tamil Nadu 641019',
  store_address_ta TEXT DEFAULT '81, திருவள்ளுவர் நகர், பிரஸ் காலனி, கோயம்புத்தூர், தமிழ்நாடு 641019',
  store_map_url TEXT DEFAULT 'https://www.google.com/maps/search/?api=1&query=The+Raakky+Chicken+81+Thiruvalluvar+Nagar+Press+Colony+Coimbatore',
  delivery_radius_km REAL DEFAULT 8.0,
  estimated_delivery_mins INTEGER DEFAULT 45,
  estimated_pickup_mins INTEGER DEFAULT 20,
  banner_message_en TEXT DEFAULT 'Fresh cuts prepared live upon order confirmation.',
  banner_message_ta TEXT DEFAULT 'ஆர்டருக்கு ஏற்ப புதிதாக வெட்டித் தரப்படும்.',
  retention_days_orders INTEGER DEFAULT 90,
  retention_days_notifications INTEGER DEFAULT 30,
  retention_days_sessions INTEGER DEFAULT 7,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ta TEXT NOT NULL,
  description_en TEXT,
  description_ta TEXT,
  icon_name TEXT DEFAULT 'drumstick',
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ta TEXT NOT NULL,
  short_desc_en TEXT,
  short_desc_ta TEXT,
  description_en TEXT,
  description_ta TEXT,
  image_url TEXT NOT NULL,
  is_available BOOLEAN DEFAULT 1,
  is_featured BOOLEAN DEFAULT 0,
  is_popular BOOLEAN DEFAULT 0,
  allow_skin_selection BOOLEAN DEFAULT 0,
  supported_cuts TEXT DEFAULT 'curry_medium,curry_small',
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  weight_grams INTEGER NOT NULL,
  weight_label_en TEXT NOT NULL,
  weight_label_ta TEXT NOT NULL,
  price REAL NOT NULL,
  original_price REAL,
  is_available BOOLEAN DEFAULT 1,
  stock_count INTEGER DEFAULT 100,
  low_stock_threshold INTEGER DEFAULT 10,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT 'Customer',
  email TEXT,
  is_phone_verified BOOLEAN DEFAULT 1,
  default_address_id TEXT,
  total_orders_completed INTEGER DEFAULT 0,
  total_spent REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  locality_id TEXT DEFAULT 'press-colony',
  flat_number TEXT NOT NULL,
  street_address TEXT NOT NULL,
  landmark TEXT,
  pincode TEXT NOT NULL,
  delivery_notes TEXT,
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_type TEXT CHECK(order_type IN ('DELIVERY', 'PICKUP')) NOT NULL,
  status TEXT CHECK(status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED')) DEFAULT 'PENDING',
  rejection_reason TEXT,
  cancellation_reason TEXT,
  delivery_address_json TEXT,
  item_total REAL NOT NULL,
  delivery_fee REAL DEFAULT 0.0,
  packaging_fee REAL DEFAULT 0.0,
  discount REAL DEFAULT 0.0,
  final_total REAL NOT NULL,
  payment_method TEXT CHECK(payment_method IN ('CASH_ON_DELIVERY', 'PAY_AT_STORE', 'PAY_ONLINE', 'UPI_GPAY', 'UPI_PHONEPE', 'UPI_PAYTM', 'UPI_QR', 'UPI_ID')) NOT NULL,
  payment_status TEXT CHECK(payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')) DEFAULT 'PENDING',
  upi_transaction_id TEXT,
  upi_app TEXT,
  estimated_time TEXT,
  notes TEXT,
  accepted_by TEXT,
  accepted_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  product_name_en TEXT NOT NULL,
  product_name_ta TEXT NOT NULL,
  image_url TEXT,
  weight_grams INTEGER NOT NULL,
  weight_label_en TEXT NOT NULL,
  weight_label_ta TEXT NOT NULL,
  unit_price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal REAL NOT NULL,
  cut_type TEXT DEFAULT 'curry_medium',
  skin_type TEXT DEFAULT 'skin_off',
  special_instructions TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_status_logs (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by TEXT DEFAULT 'system',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_sequences (
  year INTEGER PRIMARY KEY,
  last_seq INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  order_id TEXT UNIQUE NOT NULL REFERENCES orders(id),
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_type TEXT NOT NULL,
  delivery_address TEXT,
  item_total REAL NOT NULL,
  delivery_fee REAL DEFAULT 0.0,
  discount REAL DEFAULT 0.0,
  final_total REAL NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  items_snapshot_json TEXT NOT NULL,
  issued_by TEXT NOT NULL,
  is_void BOOLEAN DEFAULT 0,
  void_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  invoice_id TEXT REFERENCES invoices(id),
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT CHECK(status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')) DEFAULT 'PENDING',
  payment_method TEXT NOT NULL,
  collected_by TEXT,
  collected_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_logs (
  id TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL REFERENCES product_variants(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  change_type TEXT CHECK(change_type IN ('ORDER_RESERVED', 'ORDER_DEDUCTED', 'ORDER_RELEASED', 'MANUAL_ADJUSTMENT', 'RESTOCK')) NOT NULL,
  quantity_changed INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_order_id TEXT,
  performed_by TEXT NOT NULL,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT CHECK(role IN ('OWNER', 'MANAGER', 'STAFF')) NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_resource TEXT NOT NULL,
  target_id TEXT,
  details_json TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS retention_logs (
  id TEXT PRIMARY KEY,
  run_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  records_reviewed INTEGER NOT NULL,
  records_eligible INTEGER NOT NULL,
  records_deleted INTEGER NOT NULL,
  records_skipped INTEGER NOT NULL,
  reasons_skipped TEXT,
  status TEXT DEFAULT 'COMPLETED'
);
