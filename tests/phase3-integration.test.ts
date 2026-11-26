import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { SignJWT } from 'jose';
import { onRequest as appBHandler } from '../functions/api/[[route]].ts';
import { resetFirebaseCertCache } from '../functions/_lib/firebaseJwt.ts';
import { createSqliteD1Database, type D1DatabaseShim } from './helpers/d1TestAdapter.ts';
import {
  createFirebaseSigningKeyPair,
  installMockGoogleCertsFetch,
  signTestFirebaseJwt,
} from './helpers/mockFirebaseCerts.ts';
// Import App A production router from sibling workspace to verify real cross-app shared D1 flow
import { onRequest as appAHandler } from '../../raakky-app-a/functions/api/[[route]].ts';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'migrations');

const BASE_ENV = {
  ENVIRONMENT: 'production',
  FIREBASE_PROJECT_ID: 'raakky-chicken-auth',
  STORE_PHONE: '+919843599030',
  STORE_CITY: 'Coimbatore',
  ALLOWED_ORIGINS: 'https://raakky-app-b.pages.dev,https://raakky-app-a.pages.dev',
};

const APP_A_ENV = {
  ENVIRONMENT: 'production',
  JWT_SECRET: 'raakky-secure-shop-jwt-secret-key-2026',
  STORE_PHONE: '+919843599030',
  STORE_CITY: 'Coimbatore',
  ALLOWED_ORIGINS: 'https://raakky-app-a.pages.dev,https://raakky-app-b.pages.dev',
};

async function invokeAppB(
  db: D1DatabaseShim,
  routePath: string,
  options: {
    method?: string;
    token?: string;
    origin?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
) {
  const headers: Record<string, string> = {
    ...(options.origin ? { Origin: options.origin } : { Origin: 'https://raakky-app-b.pages.dev' }),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  const req = new Request(`https://raakky-app-b.pages.dev/api${routePath}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const res = await appBHandler({
    request: req,
    env: { ...BASE_ENV, DB: db },
    params: {},
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { status: res.status, headers: res.headers, json, text };
}

async function invokeAppA(
  db: D1DatabaseShim,
  routePath: string,
  options: {
    method?: string;
    token?: string;
    origin?: string;
    body?: unknown;
  } = {}
) {
  const headers: Record<string, string> = {
    ...(options.origin ? { Origin: options.origin } : { Origin: 'https://raakky-app-a.pages.dev' }),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
  };

  const req = new Request(`https://raakky-app-a.pages.dev/api${routePath}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const res = await appAHandler({
    request: req,
    env: { ...APP_A_ENV, DB: db },
    params: {},
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { status: res.status, headers: res.headers, json, text };
}

// =========================================================================
// SUITE 1: FIREBASE JWT CRYPTOGRAPHIC AUTHENTICATION & KEY ROTATION
// =========================================================================
test('Suite 1: Firebase ID token verification enforces RS256, verified email, optional phone claims, and key rotation', async () => {
  const db = createSqliteD1Database(MIGRATIONS_DIR);
  const key1 = createFirebaseSigningKeyPair('kid-rotation-1');
  const key2 = createFirebaseSigningKeyPair('kid-rotation-2');
  const rogueKey = createFirebaseSigningKeyPair('kid-rotation-1'); // Same kid, different private key

  resetFirebaseCertCache();
  const mockFetch = installMockGoogleCertsFetch({ [key1.kid]: key1.certPem });

  try {
    // 1. Missing Authorization header -> 401
    const rMissing = await invokeAppB(db, '/customer/profile');
    assert.equal(rMissing.status, 401);

    // 2. Garbage token -> 401
    const rGarbage = await invokeAppB(db, '/customer/profile', { token: 'not.a.valid.jwt' });
    assert.equal(rGarbage.status, 401);

    // 3. Wrong algorithm (HS256 signed with symmetric secret) -> 401
    const hsToken = await new SignJWT({ sub: 'uid_hs' })
      .setProtectedHeader({ alg: 'HS256', kid: key1.kid })
      .sign(new TextEncoder().encode('fake-secret-key-0123456789012345'));
    const rHs = await invokeAppB(db, '/customer/profile', { token: hsToken });
    assert.equal(rHs.status, 401);

    // 4. Forged RS256 signature (valid kid header, wrong private key) -> 401
    const forgedToken = await signTestFirebaseJwt(rogueKey, { sub: 'uid_forged' });
    const rForged = await invokeAppB(db, '/customer/profile', { token: forgedToken });
    assert.equal(rForged.status, 401);

    // 5. Wrong audience -> 401
    const wrongAudToken = await signTestFirebaseJwt(key1, { aud: 'other-firebase-project' });
    const rAud = await invokeAppB(db, '/customer/profile', { token: wrongAudToken });
    assert.equal(rAud.status, 401);

    // 6. Wrong issuer -> 401
    const wrongIssToken = await signTestFirebaseJwt(key1, {
      iss: 'https://securetoken.google.com/other-firebase-project',
    });
    const rIss = await invokeAppB(db, '/customer/profile', { token: wrongIssToken });
    assert.equal(rIss.status, 401);

    // 7. Expired token -> 401
    const pastSec = Math.floor(Date.now() / 1000) - 600;
    const expiredToken = await signTestFirebaseJwt(key1, {
      iat: pastSec - 60,
      auth_time: pastSec - 120,
      exp: pastSec,
    });
    const rExpired = await invokeAppB(db, '/customer/profile', { token: expiredToken });
    assert.equal(rExpired.status, 401);

    // 8. Missing email_verified (false) -> 403 EMAIL_NOT_VERIFIED
    const unverifiedEmailToken = await signTestFirebaseJwt(key1, {
      email_verified: false,
    });
    const rUnverifiedEmail = await invokeAppB(db, '/customer/profile', {
      token: unverifiedEmailToken,
    });
    assert.equal(rUnverifiedEmail.status, 403);
    assert.equal(rUnverifiedEmail.json.code, 'EMAIL_NOT_VERIFIED');

    // 9. Missing phone_number is allowed at profile creation; checkout collects a self-reported number.
    // The absence of a Firebase phone claim must never mark a number as verified.
    const noPhoneToken = await signTestFirebaseJwt(key1, {
      phone_number: '',
    });
    const rNoPhone = await invokeAppB(db, '/customer/profile', { token: noPhoneToken });
    assert.equal(rNoPhone.status, 200);
    assert.equal(rNoPhone.json.phone, '');
    assert.equal(rNoPhone.json.phoneVerified, false);

    // A second Google-only customer can also create a profile before entering a phone.
    const noPhoneToken2 = await signTestFirebaseJwt(key1, {
      sub: 'uid_auth_no_phone_2',
      email: 'second@example.com',
      phone_number: '',
    });
    const rNoPhone2 = await invokeAppB(db, '/customer/profile', { token: noPhoneToken2 });
    assert.equal(rNoPhone2.status, 200);
    assert.equal(rNoPhone2.json.phone, '');
    assert.equal(rNoPhone2.json.phoneVerified, false);

    // 10. Non-E.164 phone_number -> 403 INVALID_TOKEN_PHONE
    const badPhoneToken = await signTestFirebaseJwt(key1, {
      phone_number: '9876543210',
    });
    const rBadPhone = await invokeAppB(db, '/customer/profile', { token: badPhoneToken });
    assert.equal(rBadPhone.status, 403);
    assert.equal(rBadPhone.json.code, 'INVALID_TOKEN_PHONE');

    // 11. Valid token authenticates & caches public certificates
    const validToken1 = await signTestFirebaseJwt(key1, {
      sub: 'uid_auth_ok',
      email: 'ravi@example.com',
      phone_number: '+919876543210',
      name: 'Ravi Kumar',
    });
    const rOk = await invokeAppB(db, '/customer/profile', { token: validToken1 });
    assert.equal(rOk.status, 200);
    assert.equal(rOk.json.firebaseUid, 'uid_auth_ok');
    assert.equal(rOk.json.email, 'ravi@example.com');
    assert.equal(rOk.json.phone, '+919876543210');

    // Cache hit avoids redundant Google cert fetch on next call
    const fetchesBeforeSecondReq = mockFetch.getFetchCount();
    const rOk2 = await invokeAppB(db, '/customer/profile', { token: validToken1 });
    assert.equal(rOk2.status, 200);
    assert.equal(mockFetch.getFetchCount(), fetchesBeforeSecondReq);

    // 12. Key rotation without manual cache reset: advance clock past 10s cooldown -> unknown kid-rotation-2 triggers auto refresh
    const realDateNow = Date.now;
    Date.now = () => realDateNow() + 15_000;
    try {
      mockFetch.setCerts({ [key1.kid]: key1.certPem, [key2.kid]: key2.certPem }, 'public, max-age=3600');
      const validTokenKey2 = await signTestFirebaseJwt(key2, {
        sub: 'uid_auth_ok',
        email: 'ravi@example.com',
        phone_number: '+919876543210',
      });
      const rRotated = await invokeAppB(db, '/customer/profile', { token: validTokenKey2 });
      assert.equal(rRotated.status, 200);
      assert.equal(mockFetch.getFetchCount(), fetchesBeforeSecondReq + 1);
    } finally {
      Date.now = realDateNow;
    }
  } finally {
    mockFetch.restore();
    db.close();
  }
});

// =========================================================================
// SUITE 2: CUSTOMER PROFILE & IDENTITY INTEGRITY
// =========================================================================
test('Suite 2: Customer profile enforces unique Firebase UID, forbids spoofing, and blocks cross-account phone merge', async () => {
  const db = createSqliteD1Database(MIGRATIONS_DIR);
  const key1 = createFirebaseSigningKeyPair('kid-cust-1');
  resetFirebaseCertCache();
  const mockFetch = installMockGoogleCertsFetch({ [key1.kid]: key1.certPem });

  try {
    const tokenA = await signTestFirebaseJwt(key1, {
      sub: 'uid_customer_A',
      email: 'anitha@gmail.com',
      phone_number: '+919811122233',
      name: 'Anitha',
    });

    // Repeated GET creates exactly 1 row in customers
    const p1 = await invokeAppB(db, '/customer/profile', { token: tokenA });
    const p2 = await invokeAppB(db, '/customer/profile', { token: tokenA });
    assert.equal(p1.status, 200);
    assert.equal(p2.status, 200);
    const countRow = db.rawDb
      .prepare('SELECT COUNT(*) AS cnt FROM customers WHERE firebase_uid = ?')
      .get('uid_customer_A') as { cnt: number };
    assert.equal(countRow.cnt, 1);

    // Spoofing email/phone/emailVerified in PUT does not override verified claims, while name + addresses persist
    const updateRes = await invokeAppB(db, '/customer/profile', {
      method: 'PUT',
      token: tokenA,
      body: {
        name: 'Anitha Sundaram',
        email: 'spoofed@evil.com',
        phone: '+919000000000',
        addresses: [
          {
            id: 'addr_home_1',
            label: 'Home',
            recipientName: 'Anitha Sundaram',
            recipientPhone: '9811122233',
            localityId: 'press-colony',
            flatNumber: '42-B',
            streetAddress: 'Thiruvalluvar Nagar',
            landmark: 'Near Temple',
            pincode: '641019',
            isDefault: true,
          },
        ],
      },
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.json.name, 'Anitha Sundaram');
    assert.equal(updateRes.json.email, 'anitha@gmail.com');
    assert.equal(updateRes.json.phone, '+919811122233');
    assert.equal(updateRes.json.addresses.length, 1);
    assert.equal(updateRes.json.addresses[0].localityName, 'Press Colony');

    // Attempting to spoof customer UID / firebaseUid is rejected 403
    const spoofUidRes = await invokeAppB(db, '/customer/profile', {
      method: 'PUT',
      token: tokenA,
      body: { firebaseUid: 'uid_other_victim', name: 'Hacker' },
    });
    assert.equal(spoofUidRes.status, 403);

    // Different Firebase UID attempting to claim Customer A's verified phone -> 409 ACCOUNT_CONFLICT_NO_MERGE
    const tokenPhoneStealer = await signTestFirebaseJwt(key1, {
      sub: 'uid_customer_B_stealer',
      email: 'other@gmail.com',
      phone_number: '+919811122233',
      name: 'Other User',
    });
    const conflictRes = await invokeAppB(db, '/customer/profile', { token: tokenPhoneStealer });
    assert.equal(conflictRes.status, 409);
    assert.equal(conflictRes.json.code, 'ACCOUNT_CONFLICT_NO_MERGE');

    // Cross-customer order list access on legacy route -> 403
    const tokenB = await signTestFirebaseJwt(key1, {
      sub: 'uid_customer_B',
      email: 'karthik@gmail.com',
      phone_number: '+919844455566',
      name: 'Karthik',
    });
    const crossList = await invokeAppB(db, '/customers/uid_customer_A/orders', { token: tokenB });
    assert.equal(crossList.status, 403);
  } finally {
    mockFetch.restore();
    db.close();
  }
});

// =========================================================================
// SUITE 3: AUTHENTICATED ORDERS, VALIDATION, IDEMPOTENCY, SECURITY, CORS & RATE LIMIT
// =========================================================================
test('Suite 3: Server-authoritative orders reject tampering/unauth, enforce idempotency & stock, isolate ownership, restrict CORS & rate-limit', async () => {
  const db = createSqliteD1Database(MIGRATIONS_DIR);
  const key1 = createFirebaseSigningKeyPair('kid-ord-1');
  resetFirebaseCertCache();
  const mockFetch = installMockGoogleCertsFetch({ [key1.kid]: key1.certPem });

  try {
    const tokenA = await signTestFirebaseJwt(key1, {
      sub: 'uid_buyer_A',
      email: 'priya@gmail.com',
      phone_number: '+919822233344',
      name: 'Priya',
    });
    const tokenB = await signTestFirebaseJwt(key1, {
      sub: 'uid_buyer_B',
      email: 'arjun@gmail.com',
      phone_number: '+919855566677',
      name: 'Arjun',
    });

    const validAddress = {
      id: 'addr_priya_1',
      label: 'Home',
      recipientName: 'Priya',
      recipientPhone: '9822233344',
      localityId: 'press-colony',
      flatNumber: '10A',
      streetAddress: 'Main Road',
      pincode: '641019',
      isDefault: true,
    };

    // 1. Unauthenticated order creation -> 401
    const unauthOrder = await invokeAppB(db, '/orders', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': 'idem_unauth_0001' },
      body: {
        orderType: 'PICKUP',
        paymentMethod: 'PAY_AT_STORE',
        items: [{ productId: 'prod-breast', variantId: 'var-breast-500g', quantity: 1 }],
      },
    });
    assert.equal(unauthOrder.status, 401);

    // 2. Unauthorized CORS origin rejected -> 403
    const badCors = await invokeAppB(db, '/orders', {
      method: 'POST',
      origin: 'https://evil-phishing-site.com',
      token: tokenA,
      headers: { 'X-Idempotency-Key': 'idem_cors_0001' },
      body: {},
    });
    assert.equal(badCors.status, 403);
    assert.equal(badCors.json.code, 'CORS_ORIGIN_DENIED');

    // Allowed CORS origin echoed + Vary: Origin present
    const goodCors = await invokeAppB(db, '/products', {
      origin: 'https://raakky-app-b.pages.dev',
    });
    assert.equal(goodCors.status, 200);
    assert.equal(goodCors.headers.get('Access-Control-Allow-Origin'), 'https://raakky-app-b.pages.dev');
    assert.match(goodCors.headers.get('Vary') || '', /Origin/);

    // 3. Reject client paymentStatus: 'PAID' spoofing -> 400
    const paidSpoof = await invokeAppB(db, '/orders', {
      method: 'POST',
      token: tokenA,
      headers: { 'X-Idempotency-Key': 'idem_paid_spoof_01' },
      body: {
        orderType: 'PICKUP',
        paymentMethod: 'PAY_AT_STORE',
        paymentStatus: 'PAID',
        items: [{ productId: 'prod-breast', variantId: 'var-breast-500g', quantity: 1 }],
      },
    });
    assert.equal(paidSpoof.status, 400);
    assert.equal(paidSpoof.json.code, 'INVALID_PAYMENT_STATUS');

    // 4. Reject tampered unitPrice / finalTotal -> 400 PRICE_MISMATCH
    const tamperedPrice = await invokeAppB(db, '/orders', {
      method: 'POST',
      token: tokenA,
      headers: { 'X-Idempotency-Key': 'idem_price_tamper_01' },
      body: {
        orderType: 'PICKUP',
        paymentMethod: 'PAY_AT_STORE',
        items: [
          { productId: 'prod-breast', variantId: 'var-breast-500g', quantity: 2, unitPrice: 1 },
        ],
        finalTotal: 2,
      },
    });
    assert.equal(tamperedPrice.status, 400);
    assert.equal(tamperedPrice.json.code, 'PRICE_MISMATCH');

    // 5. Reject missing delivery address or unsupported locality -> 400
    const missingDeliveryAddr = await invokeAppB(db, '/orders', {
      method: 'POST',
      token: tokenA,
      headers: { 'X-Idempotency-Key': 'idem_missing_addr_01' },
      body: {
        orderType: 'DELIVERY',
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [{ productId: 'prod-breast', variantId: 'var-breast-500g', quantity: 1 }],
      },
    });
    assert.equal(missingDeliveryAddr.status, 400);

    // 6. Reject unknown / invalid product -> 400
    const unknownProduct = await invokeAppB(db, '/orders', {
      method: 'POST',
      token: tokenA,
      headers: { 'X-Idempotency-Key': 'idem_unknown_prod_01' },
      body: {
        orderType: 'PICKUP',
        paymentMethod: 'PAY_AT_STORE',
        items: [{ productId: 'prod-country-chicken-discontinued', variantId: 'v-1', quantity: 1 }],
      },
    });
    assert.equal(unknownProduct.status, 400);
    assert.equal(unknownProduct.json.code, 'INVALID_PRODUCT');

    // 7. Reject out-of-stock variant -> 409 OUT_OF_STOCK
    db.rawDb
      .prepare('UPDATE product_variants SET stock_count = 0 WHERE id = ?')
      .run('var-wings-500g');
    const outOfStockOrder = await invokeAppB(db, '/orders', {
      method: 'POST',
      token: tokenA,
      headers: { 'X-Idempotency-Key': 'idem_oos_test_0001' },
      body: {
        orderType: 'PICKUP',
        paymentMethod: 'PAY_AT_STORE',
        items: [{ productId: 'prod-wings', variantId: 'var-wings-500g', quantity: 1 }],
      },
    });
    assert.equal(outOfStockOrder.status, 409);
    assert.equal(outOfStockOrder.json.code, 'OUT_OF_STOCK');

    // 8. Valid Delivery COD order -> 201 Created, server pricing (var-breast-500g is 165 * 2 = 330 + 30 delivery = 360)
    const deliveryKey = 'idem_delivery_order_0001';
    const createdDelivery = await invokeAppB(db, '/orders', {
      method: 'POST',
      token: tokenA,
      headers: { 'X-Idempotency-Key': deliveryKey },
      body: {
        orderType: 'DELIVERY',
        paymentMethod: 'CASH_ON_DELIVERY',
        deliveryAddress: validAddress,
        items: [
          {
            productId: 'prod-breast',
            variantId: 'var-breast-500g',
            quantity: 2,
            cutType: 'boneless_cubes',
            skinType: 'skin_off',
          },
        ],
      },
    });
    assert.equal(createdDelivery.status, 201);
    assert.equal(createdDelivery.json.firebaseUid, 'uid_buyer_A');
    assert.equal(createdDelivery.json.customerEmail, 'priya@gmail.com');
    assert.equal(createdDelivery.json.customerPhone, '+919822233344');
    assert.equal(createdDelivery.json.emailVerified, true);
    assert.equal(createdDelivery.json.phoneVerified, true);
    assert.equal(createdDelivery.json.status, 'PENDING');
    assert.equal(createdDelivery.json.paymentStatus, 'PENDING');
    assert.equal(createdDelivery.json.itemTotal, 330);
    assert.equal(createdDelivery.json.deliveryFee, 30);
    assert.equal(createdDelivery.json.finalTotal, 360);
    assert.match(createdDelivery.json.orderNumber, /^RK-ORD-2026-\d{4}$/);

    // 9. Idempotent retry with SAME X-Idempotency-Key & payload returns original order without duplicating row
    const replayDelivery = await invokeAppB(db, '/orders', {
      method: 'POST',
      token: tokenA,
      headers: { 'X-Idempotency-Key': deliveryKey },
      body: {
        orderType: 'DELIVERY',
        paymentMethod: 'CASH_ON_DELIVERY',
        deliveryAddress: validAddress,
        items: [
          {
            productId: 'prod-breast',
            variantId: 'var-breast-500g',
            quantity: 2,
            cutType: 'boneless_cubes',
            skinType: 'skin_off',
          },
        ],
      },
    });
    assert.equal(replayDelivery.status, 200);
    assert.equal(replayDelivery.json.idempotentReplay, true);
    assert.equal(replayDelivery.json.id, createdDelivery.json.id);

    // Different payload under same X-Idempotency-Key -> 409 IDEMPOTENCY_KEY_CONFLICT
    const conflictIdem = await invokeAppB(db, '/orders', {
      method: 'POST',
      token: tokenA,
      headers: { 'X-Idempotency-Key': deliveryKey },
      body: {
        orderType: 'PICKUP',
        paymentMethod: 'PAY_AT_STORE',
        items: [{ productId: 'prod-breast', variantId: 'var-breast-500g', quantity: 1 }],
      },
    });
    assert.equal(conflictIdem.status, 409);
    assert.equal(conflictIdem.json.code, 'IDEMPOTENCY_KEY_CONFLICT');

    // 10. Valid Pickup order -> 201 Created with 0 delivery fee
    const createdPickup = await invokeAppB(db, '/orders', {
      method: 'POST',
      token: tokenA,
      headers: { 'X-Idempotency-Key': 'idem_pickup_order_0001' },
      body: {
        orderType: 'PICKUP',
        paymentMethod: 'PAY_AT_STORE',
        items: [{ productId: 'prod-leg', variantId: 'var-leg-500g', quantity: 1, cutType: 'whole_drumstick' }],
      },
    });
    assert.equal(createdPickup.status, 201);
    assert.equal(createdPickup.json.deliveryFee, 0);
    assert.equal(createdPickup.json.paymentMethod, 'PAY_AT_STORE');
    assert.equal(createdPickup.json.paymentStatus, 'PENDING');

    // 11. Customer A can list only their 2 orders; Customer B sees 0 and receives 403 accessing or cancelling Customer A's order
    const listA = await invokeAppB(db, '/customer/orders', { token: tokenA });
    assert.equal(listA.status, 200);
    assert.equal(listA.json.length, 2);

    const listB = await invokeAppB(db, '/customer/orders', { token: tokenB });
    assert.equal(listB.status, 200);
    assert.equal(listB.json.length, 0);

    const viewAFromB = await invokeAppB(db, `/orders/${createdDelivery.json.id}`, { token: tokenB });
    assert.equal(viewAFromB.status, 403);

    const cancelAFromB = await invokeAppB(db, `/orders/${createdDelivery.json.id}/cancel`, {
      method: 'POST',
      token: tokenB,
      body: { reason: 'Malicious cancel' },
    });
    assert.equal(cancelAFromB.status, 403);

    // Customer A cancels their PENDING pickup order
    const cancelPickup = await invokeAppB(db, `/orders/${createdPickup.json.id}/cancel`, {
      method: 'POST',
      token: tokenA,
      body: { reason: 'Changed schedule' },
    });
    assert.equal(cancelPickup.status, 200);
    assert.equal(cancelPickup.json.order.status, 'CANCELLED');

    // 12. Rate limiting triggers 429 on excessive order attempts from same UID
    let saw429 = false;
    for (let i = 0; i < 12; i++) {
      const rRate = await invokeAppB(db, '/orders', {
        method: 'POST',
        token: tokenB,
        headers: { 'X-Idempotency-Key': `idem_rate_${i}_testkey` },
        body: {
          orderType: 'PICKUP',
          paymentMethod: 'PAY_AT_STORE',
          items: [{ productId: 'prod-breast', variantId: 'var-breast-500g', quantity: 1 }],
        },
      });
      if (rRate.status === 429) {
        saw429 = true;
        break;
      }
    }
    assert.equal(saw429, true, 'Rate limiter should trigger 429 after 10 order creations in window');
  } finally {
    mockFetch.restore();
    db.close();
  }
});

// =========================================================================
// SUITE 4: END-TO-END INTEGRATION WITH APP A SHOP OPERATIONS BACKEND ON SHARED D1
// =========================================================================
test('Suite 4: End-to-End order flow from App B to App A Shop Operations (shared D1, stock reservation, invoice & payment)', async () => {
  const db = createSqliteD1Database(MIGRATIONS_DIR);
  const key1 = createFirebaseSigningKeyPair('kid-e2e-1');
  resetFirebaseCertCache();
  const mockFetch = installMockGoogleCertsFetch({ [key1.kid]: key1.certPem });

  try {
    const customerToken = await signTestFirebaseJwt(key1, {
      sub: 'uid_e2e_customer',
      email: 'lakshmi@gmail.com',
      // Explicitly override the helper's default phone claim for this unverified-phone scenario.
      phone_number: '',
      name: 'Lakshmi Narayanan',
    });

    const beforeStock = (
      db.rawDb
        .prepare('SELECT stock_count FROM product_variants WHERE id = ?')
        .get('var-curry-1kg') as { stock_count: number }
    ).stock_count;

    // 1. Customer places order on App B
    const createdOrderRes = await invokeAppB(db, '/orders', {
      method: 'POST',
      token: customerToken,
      headers: { 'X-Idempotency-Key': 'idem_e2e_order_0001' },
      body: {
        customerPhone: '+919899887766',
        orderType: 'DELIVERY',
        paymentMethod: 'CASH_ON_DELIVERY',
        deliveryAddress: {
          id: 'addr_lakshmi_1',
          label: 'Home',
          recipientName: 'Lakshmi Narayanan',
          recipientPhone: '9899887766',
          localityId: 'veerapandi-pirivu',
          flatNumber: '7/12',
          streetAddress: 'Mettupalayam Road',
          pincode: '641019',
          isDefault: true,
        },
        items: [
          {
            productId: 'prod-curry-pieces',
            variantId: 'var-curry-1kg',
            quantity: 2,
            cutType: 'curry_medium',
            skinType: 'skin_off',
          },
        ],
      },
    });
    assert.equal(createdOrderRes.status, 201);
    const orderId = createdOrderRes.json.id;

    // 2. Unauthenticated call to App A admin routes or unauthenticated POST /api/orders on App A MUST fail closed
    const appAUnauth = await invokeAppA(db, '/admin/orders');
    assert.equal(appAUnauth.status, 401);

    const appABackdoorPost = await invokeAppA(db, '/orders', {
      method: 'POST',
      body: { items: [{ productId: 'prod-curry-pieces', variantId: 'var-curry-1kg', quantity: 1 }] },
    });
    assert.equal(appABackdoorPost.status, 401);

    // App A unauthorized origin rejected -> 403
    const appABadCors = await invokeAppA(db, '/admin/orders', {
      origin: 'https://evil-site.example',
    });
    assert.equal(appABadCors.status, 403);

    // 3. Shop Owner authenticates on App A -> receives HMAC-SHA256 JWT
    const loginRes = await invokeAppA(db, '/admin/auth/login', {
      method: 'POST',
      body: { username: 'owner', password: 'raakky2026' },
    });
    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.json.token);
    assert.equal(loginRes.json.token.split('.').length, 3);
    const adminToken = loginRes.json.token;

    // 4. App A incoming orders list includes verified Google email and a collected but unverified mobile number
    const adminOrdersRes = await invokeAppA(db, '/admin/orders', { token: adminToken });
    assert.equal(adminOrdersRes.status, 200);
    const syncedOrder = adminOrdersRes.json.find((o: any) => o.id === orderId);
    assert.ok(syncedOrder, 'App B order must appear in App A GET /admin/orders');
    assert.equal(syncedOrder.customerName, 'Lakshmi Narayanan');
    assert.equal(syncedOrder.customerEmail, 'lakshmi@gmail.com');
    assert.equal(syncedOrder.customerPhone, '+919899887766');
    assert.equal(syncedOrder.emailVerified, true);
    assert.equal(syncedOrder.phoneVerified, false);
    assert.equal(syncedOrder.paymentStatus, 'PENDING');

    // 5. Shop Owner accepts order -> atomic stock reservation + RK-2026-XXXXXX invoice generated
    const acceptRes = await invokeAppA(db, `/admin/orders/${orderId}/accept`, {
      method: 'POST',
      token: adminToken,
    });
    assert.equal(acceptRes.status, 200);
    assert.equal(acceptRes.json.order.status, 'ACCEPTED');
    assert.match(acceptRes.json.invoice.invoiceNumber, /^RK-2026-\d{6}$/);
    assert.equal(acceptRes.json.order.paymentStatus, 'PENDING');

    // Duplicate accept is blocked -> 409
    const dupAcceptRes = await invokeAppA(db, `/admin/orders/${orderId}/accept`, {
      method: 'POST',
      token: adminToken,
    });
    assert.equal(dupAcceptRes.status, 409);

    const afterStock = (
      db.rawDb
        .prepare('SELECT stock_count FROM product_variants WHERE id = ?')
        .get('var-curry-1kg') as { stock_count: number }
    ).stock_count;
    assert.equal(afterStock, beforeStock - 2);

    // 6. Status progresses ACCEPTED -> PREPARING -> OUT_FOR_DELIVERY -> COMPLETED
    for (const nextStatus of ['PREPARING', 'OUT_FOR_DELIVERY', 'COMPLETED']) {
      const progRes = await invokeAppA(db, `/admin/orders/${orderId}/status`, {
        method: 'POST',
        token: adminToken,
        body: { newStatus: nextStatus },
      });
      assert.equal(progRes.status, 200);
      assert.equal(progRes.json.order.status, nextStatus);
    }

    // 7. Shop Owner records payment collection -> marks order & invoice PAID
    const payRes = await invokeAppA(db, `/admin/orders/${orderId}/record-payment`, {
      method: 'POST',
      token: adminToken,
      body: { amountCollected: createdOrderRes.json.finalTotal, paymentMethod: 'CASH_ON_DELIVERY' },
    });
    assert.equal(payRes.status, 200);
    assert.equal(payRes.json.order.paymentStatus, 'PAID');
    assert.equal(payRes.json.invoice.paymentStatus, 'PAID');

    // 8. Customer viewing live order status in App B sees COMPLETED + PAID reflected immediately from shared D1
    const appBViewUpdated = await invokeAppB(db, `/orders/${orderId}`, { token: customerToken });
    assert.equal(appBViewUpdated.status, 200);
    assert.equal(appBViewUpdated.json.status, 'COMPLETED');
    assert.equal(appBViewUpdated.json.paymentStatus, 'PAID');

    // Customer cannot cancel COMPLETED order -> 409
    const cancelCompletedRes = await invokeAppB(db, `/orders/${orderId}/cancel`, {
      method: 'POST',
      token: customerToken,
      body: { reason: 'Late attempt' },
    });
    assert.equal(cancelCompletedRes.status, 409);

    // 9. Second order rejected by App A counter -> REJECTED status and zero invoice generated
    const pickupToReject = await invokeAppB(db, '/orders', {
      method: 'POST',
      token: customerToken,
      headers: { 'X-Idempotency-Key': 'idem_e2e_reject_order_01' },
      body: {
        customerPhone: '+919899887766',
        orderType: 'PICKUP',
        paymentMethod: 'PAY_AT_STORE',
        items: [{ productId: 'prod-liver', variantId: 'var-liver-500g', quantity: 2 }],
      },
    });
    assert.equal(pickupToReject.status, 201);
    const rejRes = await invokeAppA(db, `/admin/orders/${pickupToReject.json.id}/reject`, {
      method: 'POST',
      token: adminToken,
      body: { rejectionReason: 'Counter batch fresh lot sold out' },
    });
    assert.equal(rejRes.status, 200);
    assert.equal(rejRes.json.order.status, 'REJECTED');
    const rejInvoice = db.rawDb
      .prepare('SELECT COUNT(*) AS cnt FROM invoices WHERE order_id = ?')
      .get(pickupToReject.json.id) as { cnt: number };
    assert.equal(rejInvoice.cnt, 0);
  } finally {
    mockFetch.restore();
    db.close();
  }
});
