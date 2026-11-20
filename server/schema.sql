-- RAAKKY CHICKEN - SHARED CLOUDFLARE D1 DATABASE SCHEMA
-- Shared between APP A (Shop Management & POS) and APP B (Customer Ordering App)

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
  banner_message_en TEXT DEFAULT 'Fresh cuts prepared live upon order confirmation. 100% Halal certified.',
  banner_message_ta TEXT DEFAULT 'ஆர்டருக்கு ஏற்ப புதிதாக வெட்டித் தரப்படும். 100% ஹலால் சான்றிதழ் பெற்றது.',
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
  allow_skin_selection BOOLEAN DEFAULT 1,
  allow_organ_selection BOOLEAN DEFAULT 1,
  supported_cuts TEXT DEFAULT 'curry_cut,small_biryani,large_pieces',
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT 'Customer',
  email TEXT,
  is_phone_verified BOOLEAN DEFAULT 1,
  default_address_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
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
  payment_method TEXT CHECK(payment_method IN ('UPI_GPAY', 'UPI_PHONEPE', 'UPI_PAYTM', 'UPI_QR', 'UPI_ID', 'ONLINE_RAZORPAY', 'CASH_ON_DELIVERY', 'PAY_AT_STORE')) NOT NULL,
  payment_status TEXT CHECK(payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')) DEFAULT 'PENDING',
  upi_transaction_id TEXT,
  upi_app TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  estimated_time TEXT,
  notes TEXT,
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
  cut_type TEXT DEFAULT 'curry_cut',
  skin_type TEXT DEFAULT 'skin_off',
  organ_option TEXT DEFAULT 'without_liver',
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

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  status DEFAULT 'PENDING',
  method TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified_at DATETIME
);
