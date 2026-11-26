import type {
  Category,
  CutType,
  Product,
  ProductVariant,
  ShopSettings,
} from '../types/index.ts';

export const FALLBACK_SHOP_SETTINGS: ShopSettings = {
  isOpen: true,
  orderAcceptancePaused: false,
  pauseReasonEn: 'Our kitchen counter is experiencing heavy morning rush. Orders will resume shortly.',
  pauseReasonTa: 'கடையில் தற்போது கூட்டம் அதிகமாக உள்ளது. சிறிது நேரம் கழித்து ஆர்டர்கள் மீண்டும் தொடங்கும்.',
  minOrderAmount: 120,
  deliveryFee: 30,
  freeDeliveryThreshold: 499,
  storePhone: '+919843599030',
  storeAddressEn: '81, Thiruvalluvar Nagar, Press Colony, Coimbatore, Tamil Nadu 641019',
  storeAddressTa: '81, திருவள்ளுவர் நகர், பிரஸ் காலனி, கோயம்புத்தூர், தமிழ்நாடு 641019',
  storeMapUrl: 'https://www.google.com/maps/search/?api=1&query=The+Raakky+Chicken+81+Thiruvalluvar+Nagar+Press+Colony+Coimbatore',
  estimatedDeliveryMins: 35,
  estimatedPickupMins: 15,
  bannerMessageEn: 'Fresh broiler chicken cut on demand. Select your preferred cut and package.',
  bannerMessageTa: 'புத்தம் புதிய பிராய்லர் சிக்கன். உங்கள் விருப்பத்திற்கு ஏற்ப வெட்டித் தரப்படும்.',
  openingHours: {
    weekdays: '7:00 AM – 9:00 PM',
    sunday: '4:00 AM – 9:00 PM',
  },
};

export function toBooleanFlag(val: unknown, fallback = false): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    const trimmed = val.trim().toLowerCase();
    if (trimmed === '1' || trimmed === 'true') return true;
    if (trimmed === '0' || trimmed === 'false') return false;
  }
  return fallback;
}

export function parseJsonSafe<T>(val: unknown): T | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val === 'object') return val as T;
  if (typeof val !== 'string' || !val.trim()) return undefined;
  try {
    return JSON.parse(val) as T;
  } catch {
    return undefined;
  }
}

export function parseStringArray(val: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(val)) {
    return val.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    if (trimmed.startsWith('[')) {
      const parsed = parseJsonSafe<unknown[]>(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    }
    return trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return fallback;
}

export function unwrapArrayPayload(raw: unknown, preferredKeys: string[]): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    for (const key of [...preferredKeys, 'data', 'items', 'results']) {
      if (Array.isArray(record[key])) {
        return record[key] as unknown[];
      }
    }
  }
  return null;
}

export function unwrapObjectPayload(raw: unknown, preferredKeys: string[]): Record<string, any> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const record = raw as Record<string, any>;
  for (const key of preferredKeys) {
    if (record[key] && typeof record[key] === 'object' && !Array.isArray(record[key])) {
      return record[key] as Record<string, any>;
    }
  }
  if (typeof record.error === 'string' && Object.keys(record).length <= 3) {
    return null;
  }
  return record;
}

export function normalizeShopSettingsDto(
  raw: Record<string, any>,
  defaults: ShopSettings = FALLBACK_SHOP_SETTINGS
): ShopSettings {
  const openingHoursRaw = parseJsonSafe<{ weekdays?: string; sunday?: string }>(raw.openingHours);
  return {
    isOpen: toBooleanFlag(raw.isOpen ?? raw.is_open, defaults.isOpen),
    orderAcceptancePaused: toBooleanFlag(
      raw.orderAcceptancePaused ?? raw.order_acceptance_paused,
      defaults.orderAcceptancePaused
    ),
    pauseReasonEn: String(raw.pauseReasonEn ?? raw.pause_reason_en ?? defaults.pauseReasonEn),
    pauseReasonTa: String(raw.pauseReasonTa ?? raw.pause_reason_ta ?? defaults.pauseReasonTa),
    minOrderAmount: Number(raw.minOrderAmount ?? raw.min_order_amount ?? defaults.minOrderAmount),
    deliveryFee: Number(raw.deliveryFee ?? raw.delivery_fee ?? defaults.deliveryFee),
    freeDeliveryThreshold:
      (raw.freeDeliveryThreshold ?? raw.free_delivery_threshold) !== null &&
      (raw.freeDeliveryThreshold ?? raw.free_delivery_threshold) !== undefined
        ? Number(raw.freeDeliveryThreshold ?? raw.free_delivery_threshold)
        : undefined,
    storePhone: String(raw.storePhone ?? raw.store_phone ?? defaults.storePhone),
    storeAddressEn: String(raw.storeAddressEn ?? raw.store_address_en ?? defaults.storeAddressEn),
    storeAddressTa: String(raw.storeAddressTa ?? raw.store_address_ta ?? defaults.storeAddressTa),
    storeMapUrl: String(raw.storeMapUrl ?? raw.store_map_url ?? defaults.storeMapUrl),
    estimatedDeliveryMins: Number(
      raw.estimatedDeliveryMins ?? raw.estimated_delivery_mins ?? defaults.estimatedDeliveryMins
    ),
    estimatedPickupMins: Number(
      raw.estimatedPickupMins ?? raw.estimated_pickup_mins ?? defaults.estimatedPickupMins
    ),
    bannerMessageEn:
      raw.bannerMessageEn ?? raw.banner_message_en
        ? String(raw.bannerMessageEn ?? raw.banner_message_en)
        : defaults.bannerMessageEn,
    bannerMessageTa:
      raw.bannerMessageTa ?? raw.banner_message_ta
        ? String(raw.bannerMessageTa ?? raw.banner_message_ta)
        : defaults.bannerMessageTa,
    openingHours: {
      weekdays: openingHoursRaw?.weekdays || defaults.openingHours.weekdays,
      sunday: openingHoursRaw?.sunday || defaults.openingHours.sunday,
    },
  };
}

export function normalizeCategoryDto(raw: Record<string, any>): Category {
  return {
    id: String(raw.id || ''),
    slug: String(raw.slug || raw.id || ''),
    nameEn: String(raw.nameEn ?? raw.name_en ?? ''),
    nameTa: String(raw.nameTa ?? raw.name_ta ?? raw.nameEn ?? raw.name_en ?? ''),
    descriptionEn: String(raw.descriptionEn ?? raw.description_en ?? ''),
    descriptionTa: String(raw.descriptionTa ?? raw.description_ta ?? ''),
    iconName: String(raw.iconName ?? raw.icon_name ?? 'ChefHat'),
    displayOrder: Number(raw.displayOrder ?? raw.display_order ?? 0),
  };
}

export function normalizeVariantDto(raw: Record<string, any>, fallbackProductId: string): ProductVariant {
  const weightGrams = Number(raw.weightGrams ?? raw.weight_grams ?? 500);
  return {
    id: String(raw.id || ''),
    productId: String(raw.productId ?? raw.product_id ?? fallbackProductId),
    weightGrams,
    weightLabelEn: String(raw.weightLabelEn ?? raw.weight_label_en ?? `${weightGrams}g`),
    weightLabelTa: String(raw.weightLabelTa ?? raw.weight_label_ta ?? `${weightGrams} கிராம்`),
    price: Number(raw.price ?? 0),
    isAvailable: toBooleanFlag(raw.isAvailable ?? raw.is_available, true),
    stockCount:
      (raw.stockCount ?? raw.stock_count) !== null &&
      (raw.stockCount ?? raw.stock_count) !== undefined
        ? Number(raw.stockCount ?? raw.stock_count)
        : undefined,
  };
}

export function normalizeProductDto(raw: Record<string, any>): Product {
  const id = String(raw.id || '');
  const cutsList = parseStringArray(raw.supportedCuts ?? raw.supported_cuts, ['standard_cut']);
  const supportedCuts = (cutsList.length > 0 ? cutsList : ['standard_cut']) as CutType[];
  const searchAliases = parseStringArray(
    raw.searchAliases ?? raw.search_aliases_json ?? raw.search_aliases,
    []
  );
  const rawVariants = Array.isArray(raw.variants) ? raw.variants : [];
  const variants = rawVariants
    .map((v) => normalizeVariantDto(v, id))
    .filter((v) => Boolean(v.id))
    .sort((a, b) => a.weightGrams - b.weightGrams);

  const defaultSkinRaw = raw.defaultSkinType ?? raw.default_skin_type;
  const bonelessRaw = raw.bonelessType ?? raw.boneless_type;

  return {
    id,
    categoryId: String(raw.categoryId ?? raw.category_id ?? ''),
    nameEn: String(raw.nameEn ?? raw.name_en ?? ''),
    nameTa: String(raw.nameTa ?? raw.name_ta ?? raw.nameEn ?? raw.name_en ?? ''),
    slug: String(raw.slug || id),
    shortDescEn: String(raw.shortDescEn ?? raw.short_desc_en ?? ''),
    shortDescTa: String(raw.shortDescTa ?? raw.short_desc_ta ?? ''),
    descriptionEn: String(raw.descriptionEn ?? raw.description_en ?? ''),
    descriptionTa: String(raw.descriptionTa ?? raw.description_ta ?? ''),
    imageUrl: String(raw.imageUrl ?? raw.image_url ?? '/images/products/chicken-curry-cut.jpg'),
    isAvailable: toBooleanFlag(raw.isAvailable ?? raw.is_available, true),
    isFeatured: toBooleanFlag(raw.isFeatured ?? raw.is_featured, false),
    isPopular: toBooleanFlag(raw.isPopular ?? raw.is_popular, false),
    variants,
    supportedCuts,
    allowSkinSelection: toBooleanFlag(raw.allowSkinSelection ?? raw.allow_skin_selection, false),
    defaultSkinType:
      defaultSkinRaw === 'skin_on' || defaultSkinRaw === 'skin_off' ? defaultSkinRaw : undefined,
    bonelessType:
      bonelessRaw === 'breast' || bonelessRaw === 'thigh' || bonelessRaw === 'mixed'
        ? bonelessRaw
        : undefined,
    approxWeightPerPiece: parseJsonSafe(
      raw.approxWeightPerPiece ?? raw.approx_weight_per_piece_json
    ),
    approxPieceCount: parseJsonSafe(raw.approxPieceCount ?? raw.approx_piece_count_json),
    searchAliases,
    storageTipsEn:
      raw.storageTipsEn ?? raw.storage_tips_en
        ? String(raw.storageTipsEn ?? raw.storage_tips_en)
        : undefined,
    storageTipsTa:
      raw.storageTipsTa ?? raw.storage_tips_ta
        ? String(raw.storageTipsTa ?? raw.storage_tips_ta)
        : undefined,
    netWeightNoteEn: raw.netWeightNoteEn ? String(raw.netWeightNoteEn) : undefined,
    netWeightNoteTa: raw.netWeightNoteTa ? String(raw.netWeightNoteTa) : undefined,
  };
}
