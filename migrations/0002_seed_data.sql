-- RAAKKY CHICKEN - BASELINE SEED DATA
-- Migration: 0002_seed_data.sql

-- 1. Initial Shop Settings
INSERT OR IGNORE INTO shop_settings (
  id, is_open, order_acceptance_paused,
  pause_reason_en, pause_reason_ta,
  min_order_amount, delivery_fee, free_delivery_threshold,
  store_phone, store_address_en, store_address_ta,
  store_map_url, delivery_radius_km, estimated_delivery_mins, estimated_pickup_mins,
  banner_message_en, banner_message_ta
) VALUES (
  1, 1, 0,
  'Our kitchen counter is experiencing heavy morning rush. Orders will resume shortly.',
  'கடையில் தற்போது கூட்டம் அதிகமாக உள்ளது. சிறிது நேரம் கழித்து ஆர்டர்கள் மீண்டும் தொடங்கும்.',
  120.0, 30.0, 499.0,
  '+919843599030',
  '81, Thiruvalluvar Nagar, Press Colony, Coimbatore, Tamil Nadu 641019',
  '81, திருவள்ளுவர் நகர், பிரஸ் காலனி, கோயம்புத்தூர், தமிழ்நாடு 641019',
  'https://www.google.com/maps/search/?api=1&query=The+Raakky+Chicken+81+Thiruvalluvar+Nagar+Press+Colony+Coimbatore',
  8.0, 35, 15,
  'Fresh broiler chicken cut on demand. Select your preferred cut and package.',
  'புத்தம் புதிய பிராய்லர் சிக்கன். உங்கள் விருப்பத்திற்கு ஏற்ப வெட்டித் தரப்படும்.'
);

-- 2. Default Staff Accounts (Owner, Manager, Staff)
INSERT OR IGNORE INTO staff_users (id, username, phone, full_name, password_hash, salt, role, is_active)
VALUES
  ('stf_owner', 'owner', '+919843599030', 'Sundar (Shop Owner)', 'raakky2026', 'salt_01', 'OWNER', 1),
  ('stf_manager', 'manager', '+919843599031', 'Kavitha (Operations Manager)', 'raakky2026', 'salt_02', 'MANAGER', 1),
  ('stf_cutting', 'staff', '+919843599032', 'Murugan (Cutting & Dispatch Staff)', 'raakky2026', 'salt_03', 'STAFF', 1);

-- 3. Initialize Invoice Sequence for 2026
INSERT OR IGNORE INTO invoice_sequences (year, last_seq) VALUES (2026, 0);
