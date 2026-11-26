import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCategoryDto,
  normalizeProductDto,
  normalizeShopSettingsDto,
  unwrapArrayPayload,
  unwrapObjectPayload,
} from '../src/services/dtoNormalizers.ts';
import { isFirebaseConfigured, auth } from '../src/services/firebase.ts';

test('Frontend DTO normalizers handle live raw D1 snake_case payloads cleanly without crashing', () => {
  // Exact snake_case shapes returned by production https://raakky-app-b.pages.dev/api/*
  const rawCategory = {
    id: 'cat-curry-chukka',
    slug: 'curry-chukka',
    name_en: 'Curry & Chukka',
    name_ta: 'குழம்பு & சுக்கா வெட்டுகள்',
    description_en: 'Evenly cut fresh broiler pieces',
    description_ta: 'புதிய சிக்கன்',
    icon_name: 'ChefHat',
    display_order: 1,
    created_at: '2026-11-26 04:08:25',
  };
  const cat = normalizeCategoryDto(rawCategory);
  assert.equal(cat.id, 'cat-curry-chukka');
  assert.equal(cat.nameEn, 'Curry & Chukka');
  assert.equal(cat.displayOrder, 1);

  const rawProduct = {
    id: 'prod-breast',
    category_id: 'cat-boneless',
    slug: 'chicken-breast',
    name_en: 'Chicken Breast',
    name_ta: 'சிக்கன் மார்பு கறி',
    short_desc_en: 'Whole boneless breast fillet.',
    short_desc_ta: 'எலும்பில்லாத முழு மார்பு கறி.',
    description_en: 'Fresh broiler chicken breast fillets.',
    description_ta: 'புத்தம் புதிய பிராய்லர் சிக்கன் மார்பு கறி.',
    image_url: '/images/products/chicken-breast-fillet.jpg',
    is_available: 1,
    is_featured: 1,
    is_popular: 1,
    allow_skin_selection: 0,
    supported_cuts: 'standard_cut,boneless_cubes',
    search_aliases_json: '["breast","chicken breast","fillet"]',
    approx_weight_per_piece_json: '{"minGrams":200,"maxGrams":280}',
    variants: [
      {
        id: 'var-breast-500g',
        product_id: 'prod-breast',
        weight_grams: 500,
        weight_label_en: '500g (Half Kg)',
        weight_label_ta: '500 கிராம்',
        price: 165,
        is_available: 1,
        stock_count: 50,
      },
      {
        id: 'var-breast-250g',
        product_id: 'prod-breast',
        weight_grams: 250,
        weight_label_en: '250g (Quarter Kg)',
        weight_label_ta: '250 கிராம்',
        price: 85,
        is_available: 1,
        stock_count: 50,
      },
    ],
  };

  const product = normalizeProductDto(rawProduct);
  assert.equal(product.categoryId, 'cat-boneless');
  assert.equal(product.nameEn, 'Chicken Breast');
  assert.equal(product.isAvailable, true);
  assert.equal(product.allowSkinSelection, false);
  assert.deepEqual(product.supportedCuts, ['standard_cut', 'boneless_cubes']);
  assert.deepEqual(product.searchAliases, ['breast', 'chicken breast', 'fillet']);
  assert.equal(product.approxWeightPerPiece?.minGrams, 200);
  assert.equal(product.variants.length, 2);
  // Sorted ascending by weightGrams
  assert.equal(product.variants[0].weightGrams, 250);
  assert.equal(product.variants[0].isAvailable, true);

  const rawSettings = {
    id: 1,
    is_open: 1,
    order_acceptance_paused: 0,
    pause_reason_en: 'Paused',
    pause_reason_ta: 'நிறுத்தம்',
    min_order_amount: 120,
    delivery_fee: 30,
    free_delivery_threshold: 499,
    store_phone: '+919843599030',
    store_address_en: '81, Thiruvalluvar Nagar',
    store_address_ta: '81, திருவள்ளுவர் நகர்',
    store_map_url: 'https://maps.google.com',
    estimated_delivery_mins: 35,
    estimated_pickup_mins: 15,
  };
  const settings = normalizeShopSettingsDto(rawSettings);
  assert.equal(settings.isOpen, true);
  assert.equal(settings.orderAcceptancePaused, false);
  assert.equal(settings.minOrderAmount, 120);
  assert.equal(settings.deliveryFee, 30);
  assert.equal(settings.freeDeliveryThreshold, 499);
  assert.equal(settings.openingHours.weekdays, '7:00 AM – 9:00 PM');
});

test('Product normalizer provides safe defaults when supported_cuts, search_aliases, or variants are null/empty', () => {
  const sparse = normalizeProductDto({
    id: 'prod-sparse',
    category_id: 'cat-curry-chukka',
    name_en: 'Test Cut',
    name_ta: 'Test Cut Ta',
    supported_cuts: null,
    variants: null,
  });

  assert.deepEqual(sparse.supportedCuts, ['standard_cut']);
  assert.deepEqual(sparse.variants, []);
  assert.deepEqual(sparse.searchAliases, []);
});

test('Payload unwrappers reject error envelopes cleanly and support wrapped/direct responses', () => {
  assert.equal(unwrapArrayPayload({ error: 'D1_ERROR: no such table' }, ['products']), null);
  assert.equal(unwrapObjectPayload({ error: 'SQLITE_ERROR' }, ['settings']), null);
  assert.equal(unwrapArrayPayload('<html>error</html>', ['products']), null);

  const wrappedList = unwrapArrayPayload({ products: [{ id: 'prod-breast' }] }, ['products']);
  assert.equal(wrappedList?.length, 1);

  const wrappedObj = unwrapObjectPayload({ settings: { is_open: 1 } }, ['settings']);
  assert.equal(wrappedObj?.is_open, 1);
});

test('Firebase client safely handles unset Vite env variables without crashing app startup', () => {
  // In Node environment without Vite env injection, auth should gracefully report unconfigured (null) instead of throwing at import time
  assert.equal(isFirebaseConfigured, false);
  assert.equal(auth, null);
});
