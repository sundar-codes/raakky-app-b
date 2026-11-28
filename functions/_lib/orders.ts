import type { CustomerAddressRecord, D1Database, VerifiedFirebaseCustomer } from './types.ts';
import { ALLOWED_LOCALITIES, upsertVerifiedCustomer, validateAddressInput } from './customers.ts';

export class OrderApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'OrderApiError';
    this.status = status;
    this.code = code;
  }
}

interface OrderLineRequest {
  productId: string;
  variantId: string;
  quantity: number;
  cutType?: string;
  skinType?: string;
  specialInstructions?: string;
  unitPrice?: number;
}

const VALID_CUT_REGEX = /^[a-z0-9_]{2,40}$/;
const IDEMPOTENCY_KEY_REGEX = /^[A-Za-z0-9_-]{8,128}$/;

async function computeRequestHash(payload: {
  customerPhone: string;
  orderType: string;
  paymentMethod: string;
  deliveryAddress?: CustomerAddressRecord;
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
    cutType: string;
    skinType: string;
    specialInstructions: string;
  }>;
}): Promise<string> {
  const canonical = JSON.stringify({
    customerPhone: payload.customerPhone,
    orderType: payload.orderType,
    paymentMethod: payload.paymentMethod,
    deliveryAddress: payload.deliveryAddress
      ? {
          localityId: payload.deliveryAddress.localityId,
          flatNumber: payload.deliveryAddress.flatNumber,
          streetAddress: payload.deliveryAddress.streetAddress,
          pincode: payload.deliveryAddress.pincode,
          recipientPhone: payload.deliveryAddress.recipientPhone,
        }
      : null,
    items: [...payload.items].sort((a, b) =>
      `${a.productId}:${a.variantId}:${a.cutType}`.localeCompare(
        `${b.productId}:${b.variantId}:${b.cutType}`
      )
    ),
  });

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonical)
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function mapOrderRowsToDTO(
  orderRow: Record<string, any>,
  itemRows: Record<string, any>[],
  logRows: Record<string, any>[]
) {
  let deliveryAddress: CustomerAddressRecord | undefined;
  if (orderRow.delivery_address_json) {
    try {
      deliveryAddress = JSON.parse(String(orderRow.delivery_address_json));
    } catch {
      deliveryAddress = undefined;
    }
  }

  return {
    id: String(orderRow.id),
    orderNumber: String(orderRow.order_number),
    customerId: String(orderRow.customer_id),
    firebaseUid: orderRow.firebase_uid ? String(orderRow.firebase_uid) : undefined,
    customerName: String(orderRow.customer_name),
    customerPhone: String(orderRow.customer_phone),
    customerEmail: orderRow.customer_email ? String(orderRow.customer_email) : undefined,
    emailVerified: Boolean(orderRow.email_verified),
    phoneVerified: Boolean(orderRow.phone_verified),
    orderType: orderRow.order_type as 'DELIVERY' | 'PICKUP',
    status: String(orderRow.status),
    rejectionReason: orderRow.rejection_reason ? String(orderRow.rejection_reason) : undefined,
    cancellationReason: orderRow.cancellation_reason
      ? String(orderRow.cancellation_reason)
      : undefined,
    deliveryAddress,
    items: (itemRows || []).map((item) => ({
      id: String(item.id),
      productId: String(item.product_id),
      variantId: String(item.variant_id),
      productNameEn: String(item.product_name_en),
      productNameTa: String(item.product_name_ta),
      imageUrl: item.image_url ? String(item.image_url) : '/images/products/chicken-curry-cut.jpg',
      weightGrams: Number(item.weight_grams),
      weightLabelEn: String(item.weight_label_en),
      weightLabelTa: String(item.weight_label_ta),
      unitPrice: Number(item.unit_price),
      quantity: Number(item.quantity),
      subtotal: Number(item.subtotal),
      cutType: String(item.cut_type || 'curry_medium'),
      skinType: item.skin_type ? String(item.skin_type) : undefined,
      specialInstructions: item.special_instructions
        ? String(item.special_instructions)
        : undefined,
    })),
    itemTotal: Number(orderRow.item_total),
    deliveryFee: Number(orderRow.delivery_fee || 0),
    packagingFee: Number(orderRow.packaging_fee || 0),
    discount: Number(orderRow.discount || 0),
    finalTotal: Number(orderRow.final_total),
    paymentMethod: String(orderRow.payment_method),
    paymentStatus: String(orderRow.payment_status),
    estimatedTime: orderRow.estimated_time ? String(orderRow.estimated_time) : undefined,
    notes: orderRow.notes ? String(orderRow.notes) : undefined,
    acceptedBy: orderRow.accepted_by ? String(orderRow.accepted_by) : undefined,
    acceptedAt: orderRow.accepted_at ? String(orderRow.accepted_at) : undefined,
    completedAt: orderRow.completed_at ? String(orderRow.completed_at) : undefined,
    createdAt: String(orderRow.created_at),
    updatedAt: String(orderRow.updated_at),
    statusTimeline: (logRows || []).map((log) => ({
      status: String(log.status),
      timestamp: String(log.created_at),
      changedBy: log.changed_by ? String(log.changed_by) : 'system',
      note: log.notes ? String(log.notes) : undefined,
    })),
  };
}

export async function fetchHydratedOrderById(
  db: D1Database,
  orderIdOrNumber: string
): Promise<ReturnType<typeof mapOrderRowsToDTO> | null> {
  const orderRow = await db
    .prepare('SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1')
    .bind(orderIdOrNumber, orderIdOrNumber)
    .first<Record<string, any>>();

  if (!orderRow) return null;

  const [{ results: itemRows }, { results: logRows }] = await Promise.all([
    db
      .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC')
      .bind(orderRow.id)
      .all<Record<string, any>>(),
    db
      .prepare('SELECT * FROM order_status_logs WHERE order_id = ? ORDER BY created_at ASC')
      .bind(orderRow.id)
      .all<Record<string, any>>(),
  ]);

  return mapOrderRowsToDTO(orderRow, itemRows || [], logRows || []);
}

async function allocateSequentialOrderNumber(db: D1Database): Promise<string> {
  const year = new Date().getUTCFullYear();
  await db
    .prepare('INSERT OR IGNORE INTO order_sequences (year, last_seq) VALUES (?, 42)')
    .bind(year)
    .run();

  const updated = await db
    .prepare('UPDATE order_sequences SET last_seq = last_seq + 1 WHERE year = ? RETURNING last_seq')
    .bind(year)
    .first<{ last_seq: number }>();

  const seq = updated?.last_seq ?? Math.floor(1000 + Math.random() * 9000);
  return `RK-ORD-${year}-${String(seq).padStart(4, '0')}`;
}

export async function createCustomerOrder(
  db: D1Database,
  verified: VerifiedFirebaseCustomer,
  rawBody: any,
  headerIdempotencyKey?: string | null
): Promise<{ order: ReturnType<typeof mapOrderRowsToDTO>; idempotentReplay: boolean }> {
  if (!rawBody || typeof rawBody !== 'object') {
    throw new OrderApiError('Invalid order payload', 400, 'INVALID_PAYLOAD');
  }

  // A contact number is required for shop fulfilment, but SMS verification is not.
  // The route has already normalised self-reported numbers to Indian E.164.
  const contactPhone = (verified.phone || verified.selfReportedPhone || '').trim();
  if (!/^\+91[6-9]\d{9}$/.test(contactPhone)) {
    throw new OrderApiError(
      'A valid Indian mobile number is required to place an order. SMS verification is not required.',
      400,
      'INVALID_CUSTOMER_PHONE'
    );
  }

  // 1. Validate idempotency key (header takes precedence over body)
  const rawKey =
    (typeof headerIdempotencyKey === 'string' && headerIdempotencyKey.trim()) ||
    (typeof rawBody.idempotencyKey === 'string' && rawBody.idempotencyKey.trim()) ||
    '';

  if (!IDEMPOTENCY_KEY_REGEX.test(rawKey)) {
    throw new OrderApiError(
      'Valid X-Idempotency-Key (8-128 alphanumeric/hyphen/underscore chars) is required for order submission.',
      400,
      'INVALID_IDEMPOTENCY_KEY'
    );
  }

  // 2. Reject explicit client payment-status tampering
  if (rawBody.paymentStatus !== undefined && rawBody.paymentStatus !== 'PENDING') {
    throw new OrderApiError(
      'Invalid payment status. Orders cannot be pre-marked as paid by client requests.',
      400,
      'INVALID_PAYMENT_STATUS'
    );
  }

  // 3. Validate orderType and paymentMethod strict matching
  const orderType = rawBody.orderType;
  if (orderType !== 'DELIVERY' && orderType !== 'PICKUP') {
    throw new OrderApiError('Invalid order type. Must be DELIVERY or PICKUP.', 400, 'INVALID_ORDER_TYPE');
  }

  const paymentMethod = rawBody.paymentMethod;
  if (orderType === 'DELIVERY' && paymentMethod !== 'CASH_ON_DELIVERY') {
    throw new OrderApiError(
      'Home delivery orders currently support Cash on Delivery (CASH_ON_DELIVERY) only.',
      400,
      'INVALID_PAYMENT_METHOD'
    );
  }
  if (orderType === 'PICKUP' && paymentMethod !== 'PAY_AT_STORE') {
    throw new OrderApiError(
      'Store pickup orders currently support Pay at Store (PAY_AT_STORE) only.',
      400,
      'INVALID_PAYMENT_METHOD'
    );
  }

  // 4. Validate delivery address if DELIVERY
  let validatedAddress: CustomerAddressRecord | undefined;
  if (orderType === 'DELIVERY') {
    if (!rawBody.deliveryAddress) {
      throw new OrderApiError(
        'Delivery address is required for home delivery orders.',
        400,
        'MISSING_DELIVERY_ADDRESS'
      );
    }
    validatedAddress = validateAddressInput(rawBody.deliveryAddress);
    if (!ALLOWED_LOCALITIES[validatedAddress.localityId]) {
      throw new OrderApiError(
        'Selected delivery locality is not currently serviceable.',
        400,
        'UNSUPPORTED_LOCALITY'
      );
    }
  }

  // 5. Validate requested items array structure
  if (!Array.isArray(rawBody.items) || rawBody.items.length === 0 || rawBody.items.length > 30) {
    throw new OrderApiError(
      'Order must contain between 1 and 30 valid items.',
      400,
      'INVALID_ORDER_ITEMS'
    );
  }

  const normalizedInputItems = rawBody.items.map((rawItem: OrderLineRequest) => {
    const productId = typeof rawItem?.productId === 'string' ? rawItem.productId.trim() : '';
    const variantId = typeof rawItem?.variantId === 'string' ? rawItem.variantId.trim() : '';
    const quantity = Number(rawItem?.quantity);
    const cutType =
      typeof rawItem?.cutType === 'string' && VALID_CUT_REGEX.test(rawItem.cutType.trim())
        ? rawItem.cutType.trim()
        : 'standard_cut';
    const skinType = rawItem?.skinType === 'skin_on' ? 'skin_on' : 'skin_off';
    const specialInstructions =
      typeof rawItem?.specialInstructions === 'string'
        ? rawItem.specialInstructions.trim().slice(0, 200)
        : '';

    if (!productId || !variantId) {
      throw new OrderApiError('Each item requires valid productId and variantId', 400, 'INVALID_ORDER_ITEM');
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new OrderApiError(
        'Item quantity must be an integer between 1 and 20',
        400,
        'INVALID_QUANTITY'
      );
    }

    return {
      productId,
      variantId,
      quantity,
      cutType,
      skinType,
      specialInstructions,
      clientUnitPrice: rawItem?.unitPrice !== undefined ? Number(rawItem.unitPrice) : undefined,
    };
  });

  // 6. Compute canonical payload digest and inspect idempotency table FIRST
  const requestHash = await computeRequestHash({
    customerPhone: contactPhone,
    orderType,
    paymentMethod,
    deliveryAddress: validatedAddress,
    items: normalizedInputItems.map((i: typeof normalizedInputItems[number]) => ({
      productId: i.productId,
      variantId: i.variantId,
      quantity: i.quantity,
      cutType: i.cutType,
      skinType: i.skinType,
      specialInstructions: i.specialInstructions,
    })),
  });

  const existingIdempotency = await db
    .prepare(
      'SELECT * FROM order_idempotency_keys WHERE firebase_uid = ? AND idempotency_key = ? LIMIT 1'
    )
    .bind(verified.uid, rawKey)
    .first<Record<string, any>>();

  if (existingIdempotency) {
    if (String(existingIdempotency.request_hash) !== requestHash) {
      throw new OrderApiError(
        'Idempotency key was already used with different order details.',
        409,
        'IDEMPOTENCY_KEY_CONFLICT'
      );
    }
    if (existingIdempotency.status === 'COMPLETED' && existingIdempotency.order_id) {
      const replayOrder = await fetchHydratedOrderById(db, String(existingIdempotency.order_id));
      if (replayOrder) {
        return { order: replayOrder, idempotentReplay: true };
      }
    }
    if (existingIdempotency.status === 'IN_PROGRESS') {
      throw new OrderApiError(
        'This order submission is already being processed. Please wait.',
        409,
        'ORDER_SUBMISSION_IN_PROGRESS'
      );
    }
  }

  // 7. Atomically claim idempotency slot before business mutations
  const idempotencyRowId = `idem_${crypto.randomUUID()}`;
  try {
    if (existingIdempotency && existingIdempotency.status === 'FAILED') {
      await db
        .prepare(
          `UPDATE order_idempotency_keys
           SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND status = 'FAILED'`
        )
        .bind(existingIdempotency.id)
        .run();
    } else {
      await db
        .prepare(
          `INSERT INTO order_idempotency_keys (id, firebase_uid, idempotency_key, request_hash, status)
           VALUES (?, ?, ?, ?, 'IN_PROGRESS')`
        )
        .bind(idempotencyRowId, verified.uid, rawKey, requestHash)
        .run();
    }
  } catch (err: any) {
    if (String(err?.message || '').includes('UNIQUE')) {
      const raced = await db
        .prepare(
          'SELECT * FROM order_idempotency_keys WHERE firebase_uid = ? AND idempotency_key = ? LIMIT 1'
        )
        .bind(verified.uid, rawKey)
        .first<Record<string, any>>();
      if (raced?.status === 'COMPLETED' && raced.order_id) {
        const replayOrder = await fetchHydratedOrderById(db, String(raced.order_id));
        if (replayOrder && String(raced.request_hash) === requestHash) {
          return { order: replayOrder, idempotentReplay: true };
        }
      }
      throw new OrderApiError(
        'Duplicate concurrent order submission detected.',
        409,
        'DUPLICATE_ORDER_SUBMISSION'
      );
    }
    throw err;
  }

  try {
    // 8. Verify shop availability & operational thresholds from D1
    const settingsRow = await db
      .prepare('SELECT * FROM shop_settings WHERE id = 1')
      .first<Record<string, any>>();

    const isOpen = settingsRow ? Boolean(settingsRow.is_open) : true;
    const isPaused = settingsRow ? Boolean(settingsRow.order_acceptance_paused) : false;
    if (!isOpen || isPaused) {
      throw new OrderApiError(
        String(
          settingsRow?.pause_reason_en ||
            'Ordering is temporarily paused by the shop counter.'
        ),
        503,
        'SHOP_CLOSED'
      );
    }

    const minOrderAmount = settingsRow ? Number(settingsRow.min_order_amount ?? 120) : 120;
    const baseDeliveryFee = settingsRow ? Number(settingsRow.delivery_fee ?? 30) : 30;
    const freeDeliveryThreshold = settingsRow
      ? Number(settingsRow.free_delivery_threshold ?? 499)
      : 499;
    const estimatedDeliveryMins = settingsRow
      ? Number(settingsRow.estimated_delivery_mins ?? 35)
      : 35;
    const estimatedPickupMins = settingsRow
      ? Number(settingsRow.estimated_pickup_mins ?? 15)
      : 15;

    // 9. Validate every product & variant against D1 catalog + recalculate prices strictly server-side
    const variantQuantityTotals = new Map<string, { requested: number; stock: number; label: string }>();
    let serverItemTotal = 0;

    const preparedOrderItems: Array<{
      id: string;
      productId: string;
      variantId: string;
      productNameEn: string;
      productNameTa: string;
      imageUrl: string;
      weightGrams: number;
      weightLabelEn: string;
      weightLabelTa: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
      cutType: string;
      skinType: string;
      specialInstructions: string;
    }> = [];

    for (const item of normalizedInputItems) {
      const product = await db
        .prepare('SELECT * FROM products WHERE id = ? LIMIT 1')
        .bind(item.productId)
        .first<Record<string, any>>();

      if (!product) {
        throw new OrderApiError(`Invalid product selected: ${item.productId}`, 400, 'INVALID_PRODUCT');
      }
      if (!product.is_available) {
        throw new OrderApiError(
          `${product.name_en} is currently unavailable.`,
          409,
          'PRODUCT_UNAVAILABLE'
        );
      }

      const variant = await db
        .prepare('SELECT * FROM product_variants WHERE id = ? AND product_id = ? LIMIT 1')
        .bind(item.variantId, item.productId)
        .first<Record<string, any>>();

      if (!variant) {
        throw new OrderApiError(
          `Invalid package variant selected for ${product.name_en}`,
          400,
          'INVALID_VARIANT'
        );
      }
      if (!variant.is_available) {
        throw new OrderApiError(
          `${product.name_en} (${variant.weight_label_en}) is currently unavailable.`,
          409,
          'VARIANT_UNAVAILABLE'
        );
      }

      const serverUnitPrice = Number(variant.price);
      if (
        item.clientUnitPrice !== undefined &&
        (!Number.isFinite(item.clientUnitPrice) ||
          Math.abs(item.clientUnitPrice - serverUnitPrice) > 0.01)
      ) {
        throw new OrderApiError(
          `Product price mismatch for ${product.name_en} (${variant.weight_label_en}). Please refresh your cart.`,
          400,
          'PRICE_MISMATCH'
        );
      }

      const currentStock = Number(variant.stock_count ?? 0);
      const prevAgg = variantQuantityTotals.get(String(variant.id)) || {
        requested: 0,
        stock: currentStock,
        label: `${product.name_en} (${variant.weight_label_en})`,
      };
      prevAgg.requested += item.quantity;
      variantQuantityTotals.set(String(variant.id), prevAgg);

      if (prevAgg.requested > prevAgg.stock) {
        throw new OrderApiError(
          prevAgg.stock <= 0
            ? `${prevAgg.label} is out of stock.`
            : `Insufficient stock for ${prevAgg.label}. Available: ${prevAgg.stock}.`,
          409,
          'OUT_OF_STOCK'
        );
      }

      const lineSubtotal = Number((serverUnitPrice * item.quantity).toFixed(2));
      serverItemTotal = Number((serverItemTotal + lineSubtotal).toFixed(2));

      const effectiveSkinType = product.allow_skin_selection
        ? item.skinType
        : String(product.default_skin_type || 'skin_off');

      preparedOrderItems.push({
        id: `oi_${crypto.randomUUID()}`,
        productId: String(product.id),
        variantId: String(variant.id),
        productNameEn: String(product.name_en),
        productNameTa: String(product.name_ta),
        imageUrl: String(product.image_url || '/images/products/chicken-curry-cut.jpg'),
        weightGrams: Number(variant.weight_grams),
        weightLabelEn: String(variant.weight_label_en),
        weightLabelTa: String(variant.weight_label_ta),
        unitPrice: serverUnitPrice,
        quantity: item.quantity,
        subtotal: lineSubtotal,
        cutType: item.cutType,
        skinType: effectiveSkinType,
        specialInstructions: item.specialInstructions,
      });
    }

    // 10. Validate minimum order value & compute authoritative fees and total
    if (serverItemTotal < minOrderAmount) {
      throw new OrderApiError(
        `Minimum order value is ₹${minOrderAmount}. Current item total is ₹${serverItemTotal}.`,
        400,
        'MIN_ORDER_NOT_MET'
      );
    }

    const isFreeDelivery =
      orderType === 'PICKUP' ||
      (freeDeliveryThreshold > 0 && serverItemTotal >= freeDeliveryThreshold);

    const serverDeliveryFee = isFreeDelivery ? 0 : baseDeliveryFee;
    const serverPackagingFee = 0;
    const serverDiscount = 0;
    const serverFinalTotal = Number(
      (serverItemTotal + serverDeliveryFee + serverPackagingFee - serverDiscount).toFixed(2)
    );

    if (rawBody.itemTotal !== undefined) {
      const submittedItemTotal = Number(rawBody.itemTotal);
      if (!Number.isFinite(submittedItemTotal) || Math.abs(submittedItemTotal - serverItemTotal) > 0.01) {
        throw new OrderApiError(
          'Submitted item total does not match current catalog pricing.',
          400,
          'PRICE_MISMATCH'
        );
      }
    }

    if (rawBody.finalTotal !== undefined) {
      const submittedFinalTotal = Number(rawBody.finalTotal);
      if (!Number.isFinite(submittedFinalTotal) || Math.abs(submittedFinalTotal - serverFinalTotal) > 0.01) {
        throw new OrderApiError(
          'Submitted order total does not match server-calculated pricing and delivery rules.',
          400,
          'PRICE_MISMATCH'
        );
      }
    }

    // 11. Upsert verified customer profile from verified JWT claims ONLY
    // If customer has a self-reported phone, merge it into the verified customer for profile storage
    const customerVerifiedWithPhone: VerifiedFirebaseCustomer = {
      ...verified,
      phone: verified.phone || verified.selfReportedPhone || '',
      selfReportedPhone: verified.selfReportedPhone || '',
    };
    const customerProfile = await upsertVerifiedCustomer(db, customerVerifiedWithPhone);
    const customerNameToStore = customerProfile.name || verified.name;
    const customerPhoneToStore = customerProfile.phone || verified.phone || verified.selfReportedPhone || '';
    const isPhoneVerified = verified.jwtPhoneVerified;

    // 12. Allocate sequential order number and persist atomically
    const orderId = `ord_${crypto.randomUUID()}`;
    const orderNumber = await allocateSequentialOrderNumber(db);
    const estimatedTime =
      orderType === 'DELIVERY'
        ? `${estimatedDeliveryMins}–${estimatedDeliveryMins + 10} mins`
        : `${estimatedPickupMins}–${estimatedPickupMins + 5} mins`;

    const orderNotes =
      typeof rawBody.notes === 'string' ? rawBody.notes.trim().slice(0, 250) : null;

    const batchStatements = [
      db
        .prepare(
          `INSERT INTO orders (
            id, order_number, customer_id, firebase_uid,
            customer_name, customer_phone, customer_email,
            email_verified, phone_verified,            order_type, status, delivery_address_json,
            item_total, delivery_fee, packaging_fee, discount, final_total,
            payment_method, payment_status,
            estimated_time, notes, idempotency_key, source,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, 'APP_B', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        )
        .bind(
          orderId,
          orderNumber,
          customerProfile.id,
          verified.uid,
          customerNameToStore,
          customerPhoneToStore,
          verified.email,
          isPhoneVerified ? 1 : 0,
          orderType,
          validatedAddress ? JSON.stringify(validatedAddress) : null,
          serverItemTotal,
          serverDeliveryFee,
          serverPackagingFee,
          serverDiscount,
          serverFinalTotal,
          paymentMethod,
          estimatedTime,
          orderNotes,
          rawKey
        ),
      ...preparedOrderItems.map((line) =>
        db
          .prepare(
            `INSERT INTO order_items (
              id, order_id, product_id, variant_id,
              product_name_en, product_name_ta, image_url,
              weight_grams, weight_label_en, weight_label_ta,
              unit_price, quantity, subtotal,
              cut_type, skin_type, special_instructions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            line.id,
            orderId,
            line.productId,
            line.variantId,
            line.productNameEn,
            line.productNameTa,
            line.imageUrl,
            line.weightGrams,
            line.weightLabelEn,
            line.weightLabelTa,
            line.unitPrice,
            line.quantity,
            line.subtotal,
            line.cutType,
            line.skinType,
            line.specialInstructions || null
          )
      ),
      db
        .prepare(
          `INSERT INTO order_status_logs (id, order_id, status, changed_by, notes)
           VALUES (?, ?, 'PENDING', 'Customer (App B)', 'Authenticated order submitted to shop counter')`
        )
        .bind(`log_${crypto.randomUUID()}`, orderId),
      db
        .prepare(
          `UPDATE order_idempotency_keys
           SET status = 'COMPLETED',
               order_id = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE firebase_uid = ? AND idempotency_key = ?`
        )
        .bind(orderId, verified.uid, rawKey),
    ];

    await db.batch(batchStatements);

    const createdOrder = await fetchHydratedOrderById(db, orderId);
    if (!createdOrder) {
      throw new OrderApiError('Failed to retrieve persisted order', 500, 'ORDER_READBACK_FAILED');
    }

    return { order: createdOrder, idempotentReplay: false };
  } catch (err) {
    // Release idempotency slot on validation/pre-commit failure so corrected retry is possible
    await db
      .prepare(
        `DELETE FROM order_idempotency_keys
         WHERE firebase_uid = ? AND idempotency_key = ? AND status = 'IN_PROGRESS'`
      )
      .bind(verified.uid, rawKey)
      .run()
      .catch(() => {});
    throw err;
  }
}

export async function listOrdersForCustomer(
  db: D1Database,
  verifiedUid: string
): Promise<ReturnType<typeof mapOrderRowsToDTO>[]> {
  const customerRow = await db
    .prepare('SELECT id FROM customers WHERE firebase_uid = ? LIMIT 1')
    .bind(verifiedUid)
    .first<{ id: string }>();

  const { results: orderRows } = customerRow?.id
    ? await db
        .prepare(
          `SELECT * FROM orders
           WHERE firebase_uid = ?
              OR (firebase_uid IS NULL AND customer_id = ?)
           ORDER BY created_at DESC
           LIMIT 100`
        )
        .bind(verifiedUid, customerRow.id)
        .all<Record<string, any>>()
    : await db
        .prepare(
          `SELECT * FROM orders
           WHERE firebase_uid = ?
           ORDER BY created_at DESC
           LIMIT 100`
        )
        .bind(verifiedUid)
        .all<Record<string, any>>();

  if (!orderRows || orderRows.length === 0) return [];

  const hydrated: ReturnType<typeof mapOrderRowsToDTO>[] = [];
  for (const row of orderRows) {
    const [{ results: itemRows }, { results: logRows }] = await Promise.all([
      db
        .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC')
        .bind(row.id)
        .all<Record<string, any>>(),
      db
        .prepare('SELECT * FROM order_status_logs WHERE order_id = ? ORDER BY created_at ASC')
        .bind(row.id)
        .all<Record<string, any>>(),
    ]);
    hydrated.push(mapOrderRowsToDTO(row, itemRows || [], logRows || []));
  }

  return hydrated;
}

export async function getCustomerOwnedOrder(
  db: D1Database,
  verifiedUid: string,
  orderIdOrNumber: string
): Promise<ReturnType<typeof mapOrderRowsToDTO>> {
  const orderRow = await db
    .prepare('SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1')
    .bind(orderIdOrNumber, orderIdOrNumber)
    .first<Record<string, any>>();

  if (!orderRow) {
    throw new OrderApiError('Order not found', 404, 'ORDER_NOT_FOUND');
  }

  const customerRow = await db
    .prepare('SELECT id FROM customers WHERE firebase_uid = ? LIMIT 1')
    .bind(verifiedUid)
    .first<{ id: string }>();

  const ownsOrder =
    String(orderRow.firebase_uid || '') === verifiedUid ||
    (!orderRow.firebase_uid && Boolean(customerRow?.id) && String(orderRow.customer_id) === customerRow!.id);

  if (!ownsOrder) {
    throw new OrderApiError('Forbidden: You do not have access to this order', 403, 'ORDER_FORBIDDEN');
  }

  const [{ results: itemRows }, { results: logRows }] = await Promise.all([
    db
      .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC')
      .bind(orderRow.id)
      .all<Record<string, any>>(),
    db
      .prepare('SELECT * FROM order_status_logs WHERE order_id = ? ORDER BY created_at ASC')
      .bind(orderRow.id)
      .all<Record<string, any>>(),
  ]);

  return mapOrderRowsToDTO(orderRow, itemRows || [], logRows || []);
}

export async function cancelCustomerOwnedOrder(
  db: D1Database,
  verifiedUid: string,
  orderIdOrNumber: string,
  reason: string
): Promise<ReturnType<typeof mapOrderRowsToDTO>> {
  const orderRow = await db
    .prepare('SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1')
    .bind(orderIdOrNumber, orderIdOrNumber)
    .first<Record<string, any>>();

  if (!orderRow) {
    throw new OrderApiError('Order not found', 404, 'ORDER_NOT_FOUND');
  }

  const customerRow = await db
    .prepare('SELECT id FROM customers WHERE firebase_uid = ? LIMIT 1')
    .bind(verifiedUid)
    .first<{ id: string }>();

  const ownsOrder =
    String(orderRow.firebase_uid || '') === verifiedUid ||
    (!orderRow.firebase_uid && Boolean(customerRow?.id) && String(orderRow.customer_id) === customerRow!.id);

  if (!ownsOrder) {
    throw new OrderApiError('Forbidden: Cannot cancel another customer order', 403, 'ORDER_FORBIDDEN');
  }

  const currentStatus = String(orderRow.status);
  if (currentStatus !== 'PENDING' && currentStatus !== 'ACCEPTED') {
    throw new OrderApiError(
      `Order in status ${currentStatus} cannot be cancelled directly by customer.`,
      409,
      'ORDER_NOT_CANCELLABLE'
    );
  }

  const cleanedReason =
    typeof reason === 'string' && reason.trim().length > 0
      ? reason.trim().slice(0, 200)
      : 'Customer requested cancellation';

  const statements = [
    db
      .prepare(
        `UPDATE orders
         SET status = 'CANCELLED',
             cancellation_reason = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND status IN ('PENDING', 'ACCEPTED')`
      )
      .bind(cleanedReason, orderRow.id),
    db
      .prepare(
        `INSERT INTO order_status_logs (id, order_id, status, changed_by, notes)
         VALUES (?, ?, 'CANCELLED', 'Customer (App B)', ?)`
      )
      .bind(`log_${crypto.randomUUID()}`, orderRow.id, cleanedReason),
  ];

  // If order was already ACCEPTED (stock reserved), release reserved quantity back to product_variants
  if (currentStatus === 'ACCEPTED') {
    const { results: items } = await db
      .prepare('SELECT * FROM order_items WHERE order_id = ?')
      .bind(orderRow.id)
      .all<Record<string, any>>();

    for (const item of items || []) {
      const variant = await db
        .prepare('SELECT stock_count FROM product_variants WHERE id = ?')
        .bind(item.variant_id)
        .first<{ stock_count: number }>();

      const newBalance = (variant?.stock_count ?? 0) + Number(item.quantity);
      statements.push(
        db
          .prepare('UPDATE product_variants SET stock_count = stock_count + ? WHERE id = ?')
          .bind(Number(item.quantity), item.variant_id),
        db
          .prepare(
            `INSERT INTO inventory_logs (id, variant_id, product_id, change_type, quantity_changed, balance_after, reference_order_id, performed_by, reason)
             VALUES (?, ?, ?, 'ORDER_RELEASED', ?, ?, ?, 'Customer (App B)', ?)`
          )
          .bind(
            `invlog_${crypto.randomUUID()}`,
            item.variant_id,
            item.product_id,
            Number(item.quantity),
            newBalance,
            orderRow.id,
            `Released stock on cancellation of ${orderRow.order_number}`
          )
      );
    }
  }

  await db.batch(statements);

  return getCustomerOwnedOrder(db, verifiedUid, String(orderRow.id));
}
