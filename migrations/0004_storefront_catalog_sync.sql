-- RAAKKY CHICKEN - CANONICAL BROILER STOREFRONT CATALOG SYNC
-- Migration: 0004_storefront_catalog_sync.sql
-- Synchronizes D1 categories, products, and variants with confirmed App A & App B catalog IDs & prices.
-- Non-destructive: preserves existing historical order snapshots and deactivates legacy underscore rows if present.

-- Preserve any historical rows while freeing slugs if an older seed used prod_* underscore IDs
UPDATE products
SET is_available = 0,
    slug = id || '-legacy'
WHERE id LIKE 'prod\_%' ESCAPE '\'
  AND slug NOT LIKE '%-legacy';

UPDATE categories
SET slug = id || '-legacy'
WHERE id LIKE 'cat\_%' ESCAPE '\'
  AND slug NOT LIKE '%-legacy';

-- Synchronize shop settings baseline values cleanly without overwriting active shop status
UPDATE shop_settings
SET min_order_amount = COALESCE(min_order_amount, 120.0),
    delivery_fee = COALESCE(delivery_fee, 30.0)
WHERE id = 1;

-- 1. Confirmed 5 Broiler Chicken Categories
INSERT OR IGNORE INTO categories (id, slug, name_en, name_ta, description_en, description_ta, icon_name, display_order)
VALUES
  ('cat-curry-chukka', 'curry-chukka', 'Curry & Chukka', 'குழம்பு & சுக்கா வெட்டுகள்', 'Evenly cut fresh broiler pieces for gravies, salna, and dry chukka roasts.', 'அன்றாட வீட்டு குழம்பு, சால்னா மற்றும் சுக்காவுக்கு ஏற்றவாறு நறுக்கப்பட்ட துண்டுகள்.', 'ChefHat', 1),
  ('cat-bone-in', 'bone-in', 'Bone-in Cuts', 'எலும்புடன் சிக்கன் வெட்டுகள்', 'Selected leg drumsticks, wings, thigh cuts and traditional bone-in pieces.', 'லெக் பீஸ், விங்ஸ், தொடைப் பகுதி மற்றும் எலும்புடன் கூடிய புதிய கறி வெட்டுகள்.', 'Sparkles', 2),
  ('cat-boneless', 'boneless', 'Boneless', 'எலும்பில்லாத சிக்கன்', 'Lean, trimmed boneless breast fillets and tender boneless cubes.', 'எலும்பு நீக்கப்பட்ட சுத்தமான மார்பு மற்றும் சதை துண்டுகள். சமைக்க மிக எளிதானது.', 'Flame', 3),
  ('cat-fry-cuts', 'fry-cuts', 'Fry Cuts', 'வறுவல் துண்டுகள்', 'Bite-sized plain chicken cuts for frying. Plain meat, no seasoning.', 'வீட்டில் வறுக்க ஏற்றவாறு சிறிய துண்டுகளாக வெட்டப்பட்ட சாதாரண சிக்கன். மசாலா சேர்க்கப்படவில்லை.', 'Utensils', 4),
  ('cat-liver-feet', 'liver-feet', 'Liver & Feet', 'ஈரல் & கோழிக்கால்', 'Cleaned fresh chicken liver and trimmed chicken feet for soups and roasts.', 'சுத்தப்படுத்தப்பட்ட பிரஷ் சிக்கன் ஈரல் மற்றும் சூப்புக்கான கோழிக்கால்.', 'Soup', 5);

-- 2. Confirmed 13 Broiler Chicken Products (Broiler Only, No Country Chicken, No Marinated Items)
INSERT OR IGNORE INTO products (
  id, category_id, slug, name_en, name_ta, short_desc_en, short_desc_ta, description_en, description_ta,
  image_url, is_available, is_featured, is_popular, allow_skin_selection, default_skin_type, boneless_type,
  supported_cuts, display_order, search_aliases_json, storage_tips_en, storage_tips_ta,
  approx_weight_per_piece_json, approx_piece_count_json
) VALUES
  (
    'prod-breast', 'cat-boneless', 'chicken-breast',
    'Chicken Breast', 'சிக்கன் மார்பு கறி',
    'Whole boneless breast fillet. Tender, lean meat with minimal fat.',
    'எலும்பில்லாத முழு மார்பு கறி. மென்மையான சதைப்பகுதி, குறைந்த கொழுப்பு.',
    'Fresh broiler chicken breast fillets, deboned and trimmed of excess fat. Note: Approximate weight is ~200g - 280g per individual piece; actual piece weight may vary naturally.',
    'புத்தம் புதிய பிராய்லர் சிக்கன் மார்பு கறி. எலும்பு மற்றும் கொழுப்பு நீக்கப்பட்டது.',
    '/images/products/chicken-breast-fillet.jpg', 1, 1, 1, 0, NULL, 'breast',
    'standard_cut,boneless_cubes', 1,
    '["breast","chicken breast","marbu kari","fillet","lean chicken"]',
    'Refrigerate at 0°C – 4°C. Cook within 24 hours of delivery.',
    '0°C முதல் 4°C வரை குளிர்சாதனத்தில் வைக்கவும். 24 மணி நேரத்திற்குள் சமைக்கவும்.',
    '{"minGrams":200,"maxGrams":280,"noteEn":"Approx. 200g – 280g per piece (individual piece weights vary)","noteTa":"சுமார் 200 – 280 கிராம் ஒரு துண்டு (தனிப்பட்ட எடை மாறுபடலாம்)"}',
    NULL
  ),
  (
    'prod-leg', 'cat-bone-in', 'chicken-leg-pieces',
    'Chicken Leg Pieces', 'சிக்கன் லெக் பீஸ்',
    'Fresh broiler drumsticks with plump, succulent meat on the bone.',
    'சுவையான சதைப்பற்றுள்ள சிக்கன் லெக் பீஸ்கள் (டிரம்ஸ்டிக்).',
    'Fresh chicken drumstick portions, cleaned and trimmed. Plump and juicy on the bone. Approximate piece counts: ~4 to 5 pieces in 500g, ~8 to 10 pieces in 1kg.',
    'புத்தம் புதிய சிக்கன் லெக் பீஸ்கள். சுத்தம் செய்து தரப்படுகிறது.',
    '/images/products/chicken-leg-drumsticks.jpg', 1, 1, 1, 1, 'skin_off', NULL,
    'drumstick_cut', 2,
    '["leg","drumstick","leg piece","chicken leg","kaal piece"]',
    NULL, NULL, NULL,
    '{"500":{"min":4,"max":5},"1000":{"min":8,"max":10}}'
  ),
  (
    'prod-wings', 'cat-bone-in', 'fresh-chicken-wings',
    'Fresh Chicken Wings', 'சிக்கன் விங்ஸ்',
    'Trimmed chicken wing portions. Ideal for pan roasting and crisp frying.',
    'வறுவலுக்கு ஏற்றவாறு சுத்தப்படுத்தப்பட்ட புதிய சிறகுப் பகுதிகள்.',
    'Cleaned broiler chicken wings consisting of wingettes and drumettes. Skin-on by default to retain moisture during shallow pan frying or roasting.',
    'சுத்தப்படுத்தப்பட்ட பிராய்லர் சிக்கன் விங்ஸ் துண்டுகள்.',
    '/images/products/chicken-wings.jpg', 1, 0, 1, 1, 'skin_on', NULL,
    'wings_cut', 3,
    '["wings","chicken wings","siragu","wing pieces"]',
    NULL, NULL, NULL, NULL
  ),
  (
    'prod-thigh', 'cat-bone-in', 'chicken-thigh-pieces',
    'Chicken Thigh Pieces', 'சிக்கன் தொடைப் பகுதி',
    'Juicy, flavourful dark meat cuts that stay tender during slow cooking.',
    'குழம்பு மற்றும் பிரியாணியில் மென்மையாக வேகக்கூடிய சுவையான தொடை கறி.',
    'Fresh chicken thigh portions. Naturally moist and flavourful cut that stays tender without drying out. Choose bone-in or boneless preparation as required.',
    'புத்தம் புதிய சிக்கன் தொடைப் பகுதி. சமைக்கும்போது மிருதுவாகவும் சுவையாகவும் இருக்கும்.',
    '/images/products/chicken-thigh-quarters.jpg', 1, 0, 1, 1, 'skin_off', NULL,
    'thigh_bone_in,thigh_boneless', 4,
    '["thigh","chicken thigh","thodai kari","thigh piece"]',
    NULL, NULL, NULL, NULL
  ),
  (
    'prod-boneless-mixed', 'cat-boneless', 'boneless-chicken',
    'Boneless Chicken', 'எலும்பில்லாத சிக்கன்',
    'Tender, skinless boneless cubes. Mixed cut from breast and thigh meat.',
    'தோல் மற்றும் எலும்பு நீக்கப்பட்ட மென்மையான கறித் துண்டுகள் (மார்பு மற்றும் தொடை கலவை).',
    'Skinless boneless chicken cubes cut from fresh breast and thigh portions. Completely deboned and fat-trimmed.',
    'எலும்பு மற்றும் தோல் நீக்கப்பட்ட நடுத்தர கறித் துண்டுகள்.',
    '/images/products/chicken-boneless-cubes.jpg', 1, 1, 1, 0, NULL, 'mixed',
    'boneless_cubes', 5,
    '["boneless","elumbu illa","boneless chicken","cubes","boneless cut"]',
    NULL, NULL, NULL, NULL
  ),
  (
    'prod-with-bone', 'cat-bone-in', 'chicken-with-bone',
    'Chicken With Bone', 'எலும்புடன் சிக்கன்',
    'Traditional bone-in chicken mix for rich, flavourful home-style curries & roasts.',
    'பாரம்பரிய முறைப்படி எலும்புடன் வெட்டப்பட்ட கறி. குழம்பு மற்றும் வறுவலுக்கு சிறந்தது.',
    'Mixed bone-in broiler chicken cuts containing a natural proportion of meat, bone, and ribs.',
    'எலும்புடன் கூடிய பிராய்லர் சிக்கன் துண்டுகள்.',
    '/images/products/chicken-curry-cut.jpg', 1, 0, 0, 1, 'skin_off', NULL,
    'curry_medium,curry_small,chukka_cut', 6,
    '["with bone","bone in","bone chicken","elumbudan","elumbu kari","chukka","sukka"]',
    NULL, NULL, NULL, NULL
  ),
  (
    'prod-chicken-65-fry', 'cat-fry-cuts', 'chicken-65-fry-pieces',
    'Chicken 65 Fry Pieces', 'சிக்கன் 65 வறுவல் துண்டுகள்',
    'Fresh plain broiler chicken cut into bite-sized fry pieces. Not marinated.',
    'சிக்கன் 65 வறுவலுக்கு ஏற்றவாறு துண்டாக்கப்பட்ட புதிய கறி. மசாலா சேர்க்கப்படவில்லை.',
    'Fresh broiler chicken cut into bite-sized, skinless pieces suitable for preparing Chicken 65 at home. Unseasoned plain fresh chicken.',
    'வீட்டில் சிக்கன் 65 சமைக்க ஏற்றவாறு சிறிய அளவிலான தோல் நீக்கிய துண்டுகளாக வெட்டப்பட்டது.',
    '/images/products/chicken-65-fry.jpg', 1, 1, 1, 0, NULL, NULL,
    'fry_bite_size', 7,
    '["chicken 65","fry pieces","65 cut","fry cut","65 pieces","varuval"]',
    NULL, NULL, NULL, NULL
  ),
  (
    'prod-curry-pieces', 'cat-curry-chukka', 'chicken-curry-pieces',
    'Chicken Curry Pieces', 'சிக்கன் குழம்பு துண்டுகள்',
    'Everyday medium bone-in chicken pieces for homestyle curry and gravy.',
    'அன்றாட வீட்டு சிக்கன் குழம்பு மற்றும் கிரேவிக்கு ஏற்ற நடுத்தர கறித் துண்டுகள்.',
    'Fresh broiler chicken chopped into neat 14 to 16 medium-sized pieces. Ideal for chettinad gravies, salna, and Sunday family curries.',
    'பிராய்லர் சிக்கன் 14 முதல் 16 நடுத்தர துண்டுகளாக வெட்டப்படுகிறது.',
    '/images/products/chicken-curry.jpg', 1, 1, 1, 1, 'skin_off', NULL,
    'curry_medium,curry_small', 8,
    '["curry","curry cut","curry pieces","kulambu","kulambu thundugal","chicken curry"]',
    NULL, NULL, NULL, NULL
  ),
  (
    'prod-biryani-cut', 'cat-curry-chukka', 'chicken-biryani-cut',
    'Chicken Biryani Cut (Large Cuts)', 'சிக்கன் பிரியாணி பெரிய துண்டுகள்',
    'Large succulent bone-in pieces specially portioned for traditional Dum Biryani.',
    'பாரம்பரிய பிரியாணிக்கு ஏற்றவாறு பெரிய அளவில் நறுக்கப்பட்ட கறித் துண்டுகள்.',
    'Fresh broiler chicken portioned into generous, large cuts (approx. 6 to 8 pieces per kg). Perfect for slow dum cooking.',
    'பிராய்லர் சிக்கன் பெரிய துண்டுகளாக வெட்டப்படுகிறது.',
    '/images/products/chicken-biryani.jpg', 1, 1, 1, 1, 'skin_off', NULL,
    'curry_medium', 9,
    '["biryani","biriyani cut","briyani","large cut","biryani pieces","dum biryani"]',
    NULL, NULL, NULL, NULL
  ),
  (
    'prod-lollipop', 'cat-fry-cuts', 'chicken-lollipop-cut',
    'Chicken Lollipop Cut', 'சிக்கன் லாலிபாப் வெட்டு',
    'Clean French-trimmed chicken wing drumettes shaped for crispy frying.',
    'லாலிபாப் வடிவில் சுத்தமாக நறுக்கப்பட்ட விங்ஸ் துண்டுகள். வறுவலுக்கு ஏற்றது.',
    'Fresh chicken wing drumettes neatly scored and pushed down to create lollipop handles. Unseasoned plain meat.',
    'புத்தம் புதிய சிக்கன் விங்ஸ் லாலிபாப் வடிவத்தில் சுத்தமாக நறுக்கப்பட்டது.',
    '/images/products/chicken-lollipop.jpg', 1, 1, 1, 0, NULL, NULL,
    'wings_cut', 10,
    '["lollipop","chicken lollipop","drumette","lollypop","lollipop fry"]',
    NULL, NULL, NULL, NULL
  ),
  (
    'prod-keema', 'cat-boneless', 'chicken-keema-minced',
    'Fresh Chicken Keema (Mince)', 'சிக்கன் கீமா (கொத்துக்கறி)',
    'Freshly minced boneless chicken. Fine texture for kola urundai, cutlets & curries.',
    'புதிதாக கொத்தப்பட்ட எலும்பில்லாத சிக்கன் கொத்துக்கறி. கோலா உருண்டைக்கு சிறந்தது.',
    'Finely minced boneless broiler chicken meat. Clean, lean, and freshly prepared.',
    'எலும்பு நீக்கப்பட்டு மென்மையாக கொத்தப்பட்ட புத்தம் புதிய பிராய்லர் சிக்கன்.',
    '/images/products/chicken-minced.jpg', 1, 1, 0, 0, NULL, NULL,
    'standard_cut', 11,
    '["keema","kheema","mince","minced chicken","kothu kari"]',
    NULL, NULL, NULL, NULL
  ),
  (
    'prod-liver', 'cat-liver-feet', 'chicken-liver',
    'Chicken Liver', 'சிக்கன் ஈரல்',
    'Cleaned fresh chicken liver portions. Tender, nutrient-dense cut.',
    'சுத்தம் செய்யப்பட்ட புதிய சிக்கன் ஈரல். இரும்புச்சத்து மற்றும் சத்துக்கள் நிறைந்தது.',
    'Fresh broiler chicken liver portions, trimmed and washed. Very tender and cooks fast.',
    'புத்தம் புதிய சிக்கன் ஈரல் துண்டுகள்.',
    '/images/products/chicken-liver.jpg', 1, 0, 0, 0, NULL, NULL,
    'standard_cut', 12,
    '["liver","eral","chicken liver","eeral","liver fry"]',
    NULL, NULL, NULL, NULL
  ),
  (
    'prod-feet', 'cat-liver-feet', 'chicken-feet',
    'Chicken Feet', 'கோழிக்கால்',
    'Cleaned and nail-trimmed chicken feet. Collagen-rich cut for soups.',
    'சுத்தம் செய்து நகங்கள் வெட்டப்பட்ட கோழிக்கால்கள். சூப் மற்றும் ரசத்திற்கு ஏற்றது.',
    'Fresh broiler chicken feet, properly scaled, outer yellow skin peeled, and nails clipped clean.',
    'நகங்கள் வெட்டப்பட்டு நன்கு சுத்தம் செய்யப்பட்ட புதிய கோழிக்கால்கள்.',
    '/images/products/chicken-feet.jpg', 1, 0, 0, 0, NULL, NULL,
    'standard_cut', 13,
    '["feet","chicken feet","kaal","soup kaal","collagen","kozhi kaal"]',
    NULL, NULL, NULL, NULL
  );

-- 3. Confirmed Package Variants & Server-Authoritative Pricing
INSERT OR IGNORE INTO product_variants (id, product_id, weight_grams, weight_label_en, weight_label_ta, price, original_price, is_available, stock_count, low_stock_threshold)
VALUES
  ('var-breast-250g', 'prod-breast', 250, '250g (Quarter Kg)', '250 கிராம் (கால் கிலோ)', 85.0, NULL, 1, 50, 10),
  ('var-breast-500g', 'prod-breast', 500, '500g (Half Kg)', '500 கிராம் (அரை கிலோ)', 165.0, NULL, 1, 50, 10),
  ('var-breast-1kg', 'prod-breast', 1000, '1kg (Full Kg)', '1 கிலோ (முழு கிலோ)', 320.0, NULL, 1, 50, 5),

  ('var-leg-500g', 'prod-leg', 500, '500g (~4 to 5 Pieces)', '500 கிராம் (சுமார் 4-5 துண்டுகள்)', 155.0, NULL, 1, 50, 6),
  ('var-leg-1kg', 'prod-leg', 1000, '1kg (~8 to 10 Pieces)', '1 கிலோ (சுமார் 8-10 துண்டுகள்)', 295.0, NULL, 1, 50, 5),

  ('var-wings-500g', 'prod-wings', 500, '500g Pack', '500 கிராம் பாக்கெட்', 125.0, NULL, 1, 50, 5),
  ('var-wings-1kg', 'prod-wings', 1000, '1kg Pack', '1 கிலோ பாக்கெட்', 240.0, NULL, 1, 50, 4),

  ('var-thigh-500g', 'prod-thigh', 500, '500g (Half Kg)', '500 கிராம் (அரை கிலோ)', 145.0, NULL, 1, 50, 5),
  ('var-thigh-1kg', 'prod-thigh', 1000, '1kg (Full Kg)', '1 கிலோ (முழு கிலோ)', 280.0, NULL, 1, 50, 4),

  ('var-boneless-250g', 'prod-boneless-mixed', 250, '250g (Quarter Kg)', '250 கிராம் (கால் கிலோ)', 85.0, NULL, 1, 50, 8),
  ('var-boneless-500g', 'prod-boneless-mixed', 500, '500g (Half Kg)', '500 கிராம் (அரை கிலோ)', 165.0, NULL, 1, 50, 8),
  ('var-boneless-1kg', 'prod-boneless-mixed', 1000, '1kg (Full Kg)', '1 கிலோ (முழு கிலோ)', 320.0, NULL, 1, 50, 5),

  ('var-withbone-500g', 'prod-with-bone', 500, '500g (Half Kg)', '500 கிராம் (அரை கிலோ)', 120.0, NULL, 1, 50, 10),
  ('var-withbone-1kg', 'prod-with-bone', 1000, '1kg (Full Kg)', '1 கிலோ (முழு கிலோ)', 230.0, NULL, 1, 50, 8),
  ('var-withbone-2kg', 'prod-with-bone', 2000, '2kg Family Pack', '2 கிலோ குடும்ப பாக்கெட்', 450.0, NULL, 1, 50, 5),

  ('var-65fry-250g', 'prod-chicken-65-fry', 250, '250g (Quarter Kg)', '250 கிராம் (கால் கிலோ)', 75.0, NULL, 1, 50, 8),
  ('var-65fry-500g', 'prod-chicken-65-fry', 500, '500g (Half Kg)', '500 கிராம் (அரை கிலோ)', 140.0, NULL, 1, 50, 10),
  ('var-65fry-1kg', 'prod-chicken-65-fry', 1000, '1kg (Full Kg)', '1 கிலோ (முழு கிலோ)', 270.0, NULL, 1, 50, 8),

  ('var-curry-500g', 'prod-curry-pieces', 500, '500g (Half Kg)', '500 கிராம் (அரை கிலோ)', 120.0, NULL, 1, 50, 15),
  ('var-curry-1kg', 'prod-curry-pieces', 1000, '1kg (Full Kg)', '1 கிலோ (முழு கிலோ)', 230.0, NULL, 1, 50, 10),
  ('var-curry-2kg', 'prod-curry-pieces', 2000, '2kg Family Pack', '2 கிலோ குடும்ப பாக்கெட்', 450.0, NULL, 1, 50, 5),

  ('var-biryani-500g', 'prod-biryani-cut', 500, '500g (Half Kg)', '500 கிராம் (அரை கிலோ)', 125.0, NULL, 1, 50, 5),
  ('var-biryani-1kg', 'prod-biryani-cut', 1000, '1kg (Full Kg)', '1 கிலோ (முழு கிலோ)', 240.0, NULL, 1, 50, 5),
  ('var-biryani-2kg', 'prod-biryani-cut', 2000, '2kg Family Pack', '2 கிலோ குடும்ப பாக்கெட்', 470.0, NULL, 1, 50, 3),

  ('var-lollipop-500g', 'prod-lollipop', 500, '500g (~8 to 10 pcs)', '500 கிராம் (சுமார் 8-10 துண்டுகள்)', 160.0, NULL, 1, 50, 4),
  ('var-lollipop-1kg', 'prod-lollipop', 1000, '1kg (~16 to 20 pcs)', '1 கிலோ (சுமார் 16-20 துண்டுகள்)', 310.0, NULL, 1, 50, 4),

  ('var-keema-250g', 'prod-keema', 250, '250g (Quarter Kg)', '250 கிராம் (கால் கிலோ)', 90.0, NULL, 1, 50, 5),
  ('var-keema-500g', 'prod-keema', 500, '500g (Half Kg)', '500 கிராம் (அரை கிலோ)', 175.0, NULL, 1, 50, 5),
  ('var-keema-1kg', 'prod-keema', 1000, '1kg (Full Kg)', '1 கிலோ (முழு கிலோ)', 340.0, NULL, 1, 50, 3),

  ('var-liver-250g', 'prod-liver', 250, '250g (Quarter Kg)', '250 கிராம் (கால் கிலோ)', 60.0, NULL, 1, 50, 4),
  ('var-liver-500g', 'prod-liver', 500, '500g (Half Kg)', '500 கிராம் (அரை கிலோ)', 110.0, NULL, 1, 50, 4),

  ('var-feet-500g', 'prod-feet', 500, '500g Pack', '500 கிராம் பாக்கெட்', 80.0, NULL, 1, 50, 3),
  ('var-feet-1kg', 'prod-feet', 1000, '1kg Pack', '1 கிலோ பாக்கெட்', 150.0, NULL, 1, 50, 3);
