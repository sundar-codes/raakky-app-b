import type { Env } from '../_lib/types.ts';
import {
  errorResponse,
  handlePreflight,
  isOriginAllowed,
  jsonResponse,
} from '../_lib/cors.ts';
import {
  AuthVerificationError,
  requireVerifiedCustomer,
} from '../_lib/firebaseJwt.ts';
import {
  CustomerApiError,
  getCustomerProfileByUid,
  updateCustomerProfileByUid,
  upsertVerifiedCustomer,
} from '../_lib/customers.ts';
import {
  OrderApiError,
  cancelCustomerOwnedOrder,
  createCustomerOrder,
  getCustomerOwnedOrder,
  listOrdersForCustomer,
} from '../_lib/orders.ts';
import { checkRateLimit, getClientIp } from '../_lib/rateLimit.ts';

async function safeJson(request: Request): Promise<any> {
  try {
    const text = await request.text();
    if (!text || text.trim().length === 0) return {};
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function mapShopSettingsRow(row: Record<string, any>) {
  return {
    isOpen: Boolean(row.is_open),
    orderAcceptancePaused: Boolean(row.order_acceptance_paused),
    pauseReasonEn: String(row.pause_reason_en || ''),
    pauseReasonTa: String(row.pause_reason_ta || ''),
    minOrderAmount: Number(row.min_order_amount ?? 120),
    deliveryFee: Number(row.delivery_fee ?? 30),
    freeDeliveryThreshold:
      row.free_delivery_threshold !== null && row.free_delivery_threshold !== undefined
        ? Number(row.free_delivery_threshold)
        : undefined,
    storePhone: String(row.store_phone || '+919843599030'),
    storeAddressEn: String(row.store_address_en || ''),
    storeAddressTa: String(row.store_address_ta || ''),
    storeMapUrl: String(row.store_map_url || ''),
    estimatedDeliveryMins: Number(row.estimated_delivery_mins ?? 35),
    estimatedPickupMins: Number(row.estimated_pickup_mins ?? 15),
    bannerMessageEn: row.banner_message_en ? String(row.banner_message_en) : undefined,
    bannerMessageTa: row.banner_message_ta ? String(row.banner_message_ta) : undefined,
    openingHours: {
      weekdays: '7:00 AM – 9:00 PM',
      sunday: '4:00 AM – 9:00 PM',
    },
  };
}

function mapCategoryRow(row: Record<string, any>) {
  return {
    id: String(row.id),
    slug: String(row.slug),
    nameEn: String(row.name_en),
    nameTa: String(row.name_ta),
    descriptionEn: String(row.description_en || ''),
    descriptionTa: String(row.description_ta || ''),
    iconName: String(row.icon_name || 'drumstick'),
    displayOrder: Number(row.display_order ?? 0),
  };
}

function safeParseJsonField<T>(val: unknown): T | undefined {
  if (!val || typeof val !== 'string') return undefined;
  try {
    return JSON.parse(val) as T;
  } catch {
    return undefined;
  }
}

function mapProductRow(row: Record<string, any>, variants: Record<string, any>[]) {
  return {
    id: String(row.id),
    categoryId: String(row.category_id),
    nameEn: String(row.name_en),
    nameTa: String(row.name_ta),
    slug: String(row.slug),
    shortDescEn: String(row.short_desc_en || ''),
    shortDescTa: String(row.short_desc_ta || ''),
    descriptionEn: String(row.description_en || ''),
    descriptionTa: String(row.description_ta || ''),
    imageUrl: String(row.image_url || '/images/products/chicken-curry-cut.jpg'),
    isAvailable: Boolean(row.is_available),
    isFeatured: Boolean(row.is_featured),
    isPopular: Boolean(row.is_popular),
    supportedCuts: String(row.supported_cuts || 'standard_cut')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    allowSkinSelection: Boolean(row.allow_skin_selection),
    defaultSkinType: row.default_skin_type ? String(row.default_skin_type) : undefined,
    bonelessType: row.boneless_type ? String(row.boneless_type) : undefined,
    searchAliases: safeParseJsonField<string[]>(row.search_aliases_json) || [],
    storageTipsEn: row.storage_tips_en ? String(row.storage_tips_en) : undefined,
    storageTipsTa: row.storage_tips_ta ? String(row.storage_tips_ta) : undefined,
    approxWeightPerPiece: safeParseJsonField(row.approx_weight_per_piece_json),
    approxPieceCount: safeParseJsonField(row.approx_piece_count_json),
    variants: (variants || []).map((v) => ({
      id: String(v.id),
      productId: String(v.product_id),
      weightGrams: Number(v.weight_grams),
      weightLabelEn: String(v.weight_label_en),
      weightLabelTa: String(v.weight_label_ta),
      price: Number(v.price),
      isAvailable: Boolean(v.is_available),
      stockCount: v.stock_count !== undefined && v.stock_count !== null ? Number(v.stock_count) : undefined,
    })),
  };
}

export const onRequest = async (context: {
  request: Request;
  env: Env;
  params?: unknown;
}): Promise<Response> => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '') || '/';
  const method = request.method.toUpperCase();

  // Strictly handle CORS preflight
  if (method === 'OPTIONS') {
    return handlePreflight(request, env);
  }

  // Enforce allowed browser Origin on cross-origin requests
  const requestOrigin = request.headers.get('Origin');
  if (requestOrigin && !isOriginAllowed(requestOrigin, env)) {
    return errorResponse(request, env, 'Origin not permitted', 403, 'CORS_ORIGIN_DENIED');
  }

  try {
    // ---------------------------------------------------------
    // HEALTH CHECK
    // ---------------------------------------------------------
    if (path === '/health' && method === 'GET') {
      return jsonResponse(request, env, {
        status: 'ok',
        service: 'raakky-app-b-api',
        databaseBound: Boolean(env.DB),
      });
    }

    // ---------------------------------------------------------
    // PUBLIC STOREFRONT READ ENDPOINTS (D1 backed)
    // ---------------------------------------------------------
    if (path === '/shop/settings' && method === 'GET') {
      if (!env.DB) {
        return errorResponse(request, env, 'Database binding unavailable', 503, 'DB_UNAVAILABLE');
      }
      const row = await env.DB
        .prepare('SELECT * FROM shop_settings WHERE id = 1')
        .first<Record<string, any>>();
      if (!row) {
        return errorResponse(request, env, 'Shop settings not initialized', 404, 'SETTINGS_NOT_FOUND');
      }
      return jsonResponse(request, env, mapShopSettingsRow(row));
    }

    if (path === '/categories' && method === 'GET') {
      if (!env.DB) {
        return errorResponse(request, env, 'Database binding unavailable', 503, 'DB_UNAVAILABLE');
      }
      const { results } = await env.DB
        .prepare(
          `SELECT * FROM categories
           WHERE slug NOT LIKE '%-legacy'
           ORDER BY display_order ASC`
        )
        .all<Record<string, any>>();
      return jsonResponse(request, env, (results || []).map(mapCategoryRow));
    }

    if (path === '/products' && method === 'GET') {
      if (!env.DB) {
        return errorResponse(request, env, 'Database binding unavailable', 503, 'DB_UNAVAILABLE');
      }
      const category = url.searchParams.get('category');
      const search = url.searchParams.get('search')?.trim().toLowerCase();

      let query = "SELECT * FROM products WHERE is_available = 1 AND slug NOT LIKE '%-legacy'";
      const params: unknown[] = [];

      if (category && category !== 'all') {
        query += ' AND category_id = ?';
        params.push(category);
      }

      query += ' ORDER BY display_order ASC';

      const { results: products } = await env.DB
        .prepare(query)
        .bind(...params)
        .all<Record<string, any>>();

      const mapped: ReturnType<typeof mapProductRow>[] = [];
      for (const product of products || []) {
        const { results: variants } = await env.DB
          .prepare(
            'SELECT * FROM product_variants WHERE product_id = ? ORDER BY weight_grams ASC'
          )
          .bind(product.id)
          .all<Record<string, any>>();

        const dto = mapProductRow(product, variants || []);

        if (search) {
          const matchesSearch =
            dto.nameEn.toLowerCase().includes(search) ||
            dto.nameTa.toLowerCase().includes(search) ||
            dto.shortDescEn.toLowerCase().includes(search) ||
            dto.searchAliases.some(
              (alias) => alias.toLowerCase().includes(search) || search.includes(alias.toLowerCase())
            );
          if (!matchesSearch) continue;
        }

        mapped.push(dto);
      }

      return jsonResponse(request, env, mapped);
    }

    if (path.startsWith('/products/') && method === 'GET') {
      if (!env.DB) {
        return errorResponse(request, env, 'Database binding unavailable', 503, 'DB_UNAVAILABLE');
      }
      const productId = decodeURIComponent(path.replace('/products/', '')).trim();
      const product = await env.DB
        .prepare('SELECT * FROM products WHERE id = ? OR slug = ? LIMIT 1')
        .bind(productId, productId)
        .first<Record<string, any>>();

      if (!product) {
        return errorResponse(request, env, 'Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      const { results: variants } = await env.DB
        .prepare(
          'SELECT * FROM product_variants WHERE product_id = ? ORDER BY weight_grams ASC'
        )
        .bind(product.id)
        .all<Record<string, any>>();

      return jsonResponse(request, env, mapProductRow(product, variants || []));
    }

    // ---------------------------------------------------------
    // DEPRECATED MOCK AUTH ROUTES (Hard-blocked for security)
    // ---------------------------------------------------------
    if (path === '/auth/send-otp' || path === '/auth/verify-otp') {
      return errorResponse(
        request,
        env,
        'Legacy mock OTP endpoints are disabled. Authenticate with Firebase Auth and send Bearer token.',
        410,
        'LEGACY_AUTH_DISABLED',
        { sensitive: true }
      );
    }

    // ---------------------------------------------------------
    // AUTHENTICATED CUSTOMER APIs (Requires verified Firebase JWT + email + E.164 phone)
    // ---------------------------------------------------------
    if (path === '/customer/profile' && method === 'GET') {
      const verified = await requireVerifiedCustomer(request, env);
      if (!env.DB) {
        return errorResponse(request, env, 'Database binding unavailable', 503, 'DB_UNAVAILABLE', {
          sensitive: true,
        });
      }

      const rl = await checkRateLimit(env.DB, `profile:get:${verified.uid}`, 60, 60);
      if (!rl.allowed) {
        return errorResponse(request, env, 'Too many requests. Please slow down.', 429, 'RATE_LIMITED', {
          sensitive: true,
          extraHeaders: { 'Retry-After': String(rl.retryAfterSeconds) },
        });
      }

      const profile = await upsertVerifiedCustomer(env.DB, verified);
      return jsonResponse(request, env, profile, 200, { sensitive: true });
    }

    if (path === '/customer/profile' && method === 'PUT') {
      const verified = await requireVerifiedCustomer(request, env);
      if (!env.DB) {
        return errorResponse(request, env, 'Database binding unavailable', 503, 'DB_UNAVAILABLE', {
          sensitive: true,
        });
      }

      const rl = await checkRateLimit(env.DB, `profile:put:${verified.uid}`, 30, 60);
      if (!rl.allowed) {
        return errorResponse(request, env, 'Too many profile updates. Please try shortly.', 429, 'RATE_LIMITED', {
          sensitive: true,
          extraHeaders: { 'Retry-After': String(rl.retryAfterSeconds) },
        });
      }

      const body = await safeJson(request);
      if (body === null) {
        return errorResponse(request, env, 'Malformed JSON request body', 400, 'INVALID_JSON', {
          sensitive: true,
        });
      }

      const updated = await updateCustomerProfileByUid(env.DB, verified, body);
      return jsonResponse(request, env, updated, 200, { sensitive: true });
    }

    if (path === '/customer/orders' && method === 'GET') {
      const verified = await requireVerifiedCustomer(request, env);
      if (!env.DB) {
        return errorResponse(request, env, 'Database binding unavailable', 503, 'DB_UNAVAILABLE', {
          sensitive: true,
        });
      }

      const rl = await checkRateLimit(env.DB, `orders:list:${verified.uid}`, 60, 60);
      if (!rl.allowed) {
        return errorResponse(request, env, 'Too many requests. Please slow down.', 429, 'RATE_LIMITED', {
          sensitive: true,
          extraHeaders: { 'Retry-After': String(rl.retryAfterSeconds) },
        });
      }

      // Ensure customer profile exists (or syncs latest login timestamp), strictly return ONLY verified.uid orders
      await upsertVerifiedCustomer(env.DB, verified).catch(() => getCustomerProfileByUid(env.DB!, verified.uid));
      const orders = await listOrdersForCustomer(env.DB, verified.uid);
      return jsonResponse(request, env, orders, 200, { sensitive: true });
    }

    // Legacy customer order path hardening: enforce Firebase token + forbid cross-customer lookups
    const legacyCustomerOrdersMatch = path.match(/^\/customers\/([^/]+)\/orders$/);
    if (legacyCustomerOrdersMatch && method === 'GET') {
      const verified = await requireVerifiedCustomer(request, env);
      const requestedId = decodeURIComponent(legacyCustomerOrdersMatch[1]);
      if (requestedId !== verified.uid) {
        return errorResponse(
          request,
          env,
          'Forbidden: Cannot access another customer order history.',
          403,
          'ORDER_FORBIDDEN',
          { sensitive: true }
        );
      }
      if (!env.DB) {
        return errorResponse(request, env, 'Database binding unavailable', 503, 'DB_UNAVAILABLE', {
          sensitive: true,
        });
      }
      const orders = await listOrdersForCustomer(env.DB, verified.uid);
      return jsonResponse(request, env, orders, 200, { sensitive: true });
    }

    // ---------------------------------------------------------
    // AUTHENTICATED ORDER CREATION, STATUS & CANCELLATION
    // ---------------------------------------------------------
    if (path === '/orders' && method === 'POST') {
      const verified = await requireVerifiedCustomer(request, env);
      if (!env.DB) {
        return errorResponse(request, env, 'Database binding unavailable', 503, 'DB_UNAVAILABLE', {
          sensitive: true,
        });
      }

      const clientIp = getClientIp(request);
      const [uidRl, ipRl] = await Promise.all([
        checkRateLimit(env.DB, `orders:create:uid:${verified.uid}`, 10, 60),
        checkRateLimit(env.DB, `orders:create:ip:${clientIp}`, 30, 60),
      ]);

      if (!uidRl.allowed || !ipRl.allowed) {
        const retryAfter = Math.max(uidRl.retryAfterSeconds, ipRl.retryAfterSeconds);
        return errorResponse(
          request,
          env,
          'Too many order requests. Please wait a minute before trying again.',
          429,
          'RATE_LIMITED',
          {
            sensitive: true,
            extraHeaders: { 'Retry-After': String(retryAfter) },
          }
        );
      }

      const body = await safeJson(request);
      if (body === null) {
        return errorResponse(request, env, 'Malformed JSON request body', 400, 'INVALID_JSON', {
          sensitive: true,
        });
      }

      const { order, idempotentReplay } = await createCustomerOrder(
        env.DB,
        verified,
        body,
        request.headers.get('X-Idempotency-Key')
      );

      return jsonResponse(
        request,
        env,
        idempotentReplay ? { ...order, idempotentReplay: true } : order,
        idempotentReplay ? 200 : 201,
        { sensitive: true }
      );
    }

    const cancelOrderMatch = path.match(/^\/orders\/([^/]+)\/cancel$/);
    if (cancelOrderMatch && method === 'POST') {
      const verified = await requireVerifiedCustomer(request, env);
      if (!env.DB) {
        return errorResponse(request, env, 'Database binding unavailable', 503, 'DB_UNAVAILABLE', {
          sensitive: true,
        });
      }

      const rl = await checkRateLimit(env.DB, `orders:cancel:${verified.uid}`, 15, 60);
      if (!rl.allowed) {
        return errorResponse(request, env, 'Too many cancellation requests.', 429, 'RATE_LIMITED', {
          sensitive: true,
          extraHeaders: { 'Retry-After': String(rl.retryAfterSeconds) },
        });
      }

      const orderId = decodeURIComponent(cancelOrderMatch[1]).trim();
      const body = await safeJson(request);
      if (body === null) {
        return errorResponse(request, env, 'Malformed JSON request body', 400, 'INVALID_JSON', {
          sensitive: true,
        });
      }

      const cancelled = await cancelCustomerOwnedOrder(
        env.DB,
        verified.uid,
        orderId,
        typeof body?.reason === 'string' ? body.reason : ''
      );

      return jsonResponse(request, env, { success: true, order: cancelled }, 200, {
        sensitive: true,
      });
    }

    const getOrderMatch = path.match(/^\/orders\/([^/]+)$/);
    if (getOrderMatch && method === 'GET') {
      const verified = await requireVerifiedCustomer(request, env);
      if (!env.DB) {
        return errorResponse(request, env, 'Database binding unavailable', 503, 'DB_UNAVAILABLE', {
          sensitive: true,
        });
      }

      const orderId = decodeURIComponent(getOrderMatch[1]).trim();
      const order = await getCustomerOwnedOrder(env.DB, verified.uid, orderId);
      return jsonResponse(request, env, order, 200, { sensitive: true });
    }

    return errorResponse(request, env, 'API endpoint not found', 404, 'NOT_FOUND');
  } catch (err: unknown) {
    if (err instanceof AuthVerificationError) {
      return errorResponse(request, env, err.message, err.status, err.code, { sensitive: true });
    }
    if (err instanceof CustomerApiError) {
      return errorResponse(request, env, err.message, err.status, err.code, { sensitive: true });
    }
    if (err instanceof OrderApiError) {
      return errorResponse(request, env, err.message, err.status, err.code, { sensitive: true });
    }

    // Never leak internal DB error stacks or PII
    console.error('[App B API Error]', err instanceof Error ? err.name : 'UnknownError');
    return errorResponse(
      request,
      env,
      'An unexpected server error occurred. Please try again.',
      500,
      'INTERNAL_SERVER_ERROR',
      { sensitive: true }
    );
  }
};
