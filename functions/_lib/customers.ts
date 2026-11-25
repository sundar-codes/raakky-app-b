import type { CustomerAddressRecord, D1Database, VerifiedFirebaseCustomer } from './types.ts';

export const ALLOWED_LOCALITIES: Record<string, { nameEn: string; defaultPincode: string }> = {
  'press-colony': { nameEn: 'Press Colony', defaultPincode: '641019' },
  'veerapandi-pirivu': { nameEn: 'Veerapandi Pirivu', defaultPincode: '641019' },
  'periyanaickenpalayam': { nameEn: 'Periyanaickenpalayam', defaultPincode: '641020' },
  'mathampalayam': { nameEn: 'Mathampalayam', defaultPincode: '641019' },
};

export interface CustomerProfileDTO {
  id: string;
  firebaseUid: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  phoneVerified: boolean;
  isPhoneVerified: boolean;
  addresses: CustomerAddressRecord[];
  defaultAddressId?: string;
  createdAt: string;
  updatedAt: string;
}

export class CustomerApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'CustomerApiError';
    this.status = status;
    this.code = code;
  }
}

export function validateAddressInput(raw: any): CustomerAddressRecord {
  if (!raw || typeof raw !== 'object') {
    throw new CustomerApiError('Invalid delivery address object', 400, 'INVALID_ADDRESS');
  }

  const label = raw.label === 'Work' || raw.label === 'Other' ? raw.label : 'Home';
  const recipientName = typeof raw.recipientName === 'string' ? raw.recipientName.trim() : '';
  const rawPhone = typeof raw.recipientPhone === 'string' ? raw.recipientPhone.trim() : '';
  const localityId = typeof raw.localityId === 'string' ? raw.localityId.trim() : '';
  const flatNumber = typeof raw.flatNumber === 'string' ? raw.flatNumber.trim() : '';
  const streetAddress = typeof raw.streetAddress === 'string' ? raw.streetAddress.trim() : '';
  const landmark = typeof raw.landmark === 'string' ? raw.landmark.trim() : '';
  const pincode = typeof raw.pincode === 'string' ? raw.pincode.trim() : '';
  const deliveryNotes = typeof raw.deliveryNotes === 'string' ? raw.deliveryNotes.trim() : '';

  if (!recipientName || recipientName.length < 2 || recipientName.length > 80) {
    throw new CustomerApiError('Recipient name is required (2-80 characters)', 400, 'INVALID_ADDRESS');
  }

  const phoneDigits = rawPhone.replace(/\D/g, '').slice(-10);
  if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
    throw new CustomerApiError('Valid 10-digit recipient mobile number is required', 400, 'INVALID_ADDRESS');
  }

  const locality = ALLOWED_LOCALITIES[localityId];
  if (!locality) {
    throw new CustomerApiError(
      'Delivery is currently supported only in Press Colony, Veerapandi Pirivu, Periyanaickenpalayam, and Mathampalayam.',
      400,
      'UNSUPPORTED_LOCALITY'
    );
  }

  if (!flatNumber || flatNumber.length > 100) {
    throw new CustomerApiError('House / Flat number is required', 400, 'INVALID_ADDRESS');
  }

  if (!streetAddress || streetAddress.length > 150) {
    throw new CustomerApiError('Street / Colony address is required', 400, 'INVALID_ADDRESS');
  }

  if (!/^\d{6}$/.test(pincode)) {
    throw new CustomerApiError('Valid 6-digit pincode is required', 400, 'INVALID_ADDRESS');
  }

  const id =
    typeof raw.id === 'string' && /^[A-Za-z0-9_-]{4,64}$/.test(raw.id)
      ? raw.id
      : `addr_${crypto.randomUUID()}`;

  return {
    id,
    label,
    recipientName,
    recipientPhone: `+91${phoneDigits}`,
    localityId,
    localityName: locality.nameEn,
    flatNumber,
    streetAddress,
    landmark: landmark.slice(0, 120),
    pincode,
    deliveryNotes: deliveryNotes.slice(0, 200),
    isDefault: Boolean(raw.isDefault),
  };
}

/**
 * Ensures one customer record exists per Firebase UID.
 * Never duplicates profiles and never merges distinct accounts purely by email/phone.
 */
export async function upsertVerifiedCustomer(
  db: D1Database,
  verified: VerifiedFirebaseCustomer
): Promise<CustomerProfileDTO> {
  const existingByUid = await db
    .prepare('SELECT * FROM customers WHERE firebase_uid = ? LIMIT 1')
    .bind(verified.uid)
    .first<Record<string, any>>();

  if (existingByUid) {
    const keptName =
      existingByUid.name && existingByUid.name !== 'Customer'
        ? String(existingByUid.name)
        : verified.name;

    try {
      await db
        .prepare(
          `UPDATE customers
           SET email = ?,
               email_verified = 1,
               phone = ?,
               phone_verified = 1,
               is_phone_verified = 1,
               name = ?,
               last_login_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        )
        .bind(verified.email, verified.phone, keptName, existingByUid.id)
        .run();
    } catch (err: any) {
      if (String(err?.message || '').includes('UNIQUE')) {
        throw new CustomerApiError(
          'This phone number is associated with a different customer record.',
          409,
          'PHONE_CONFLICT'
        );
      }
      throw err;
    }

    return getCustomerProfileByUid(db, verified.uid);
  }

  // Ensure phone is not claimed by another customer profile (no silent merges across accounts)
  const existingPhoneOwner = await db
    .prepare('SELECT id, firebase_uid FROM customers WHERE phone = ? LIMIT 1')
    .bind(verified.phone)
    .first<{ id: string; firebase_uid: string | null }>();

  if (existingPhoneOwner) {
    throw new CustomerApiError(
      'This verified mobile number is already registered under another customer profile. Cannot merge accounts automatically.',
      409,
      'ACCOUNT_CONFLICT_NO_MERGE'
    );
  }

  const newCustomerId = verified.uid;

  try {
    await db
      .prepare(
        `INSERT INTO customers (
          id, firebase_uid, phone, name, email,
          email_verified, phone_verified, is_phone_verified,
          last_login_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(newCustomerId, verified.uid, verified.phone, verified.name, verified.email)
      .run();
  } catch (err: any) {
    // Handle race condition where concurrent request created the exact same firebase_uid row
    if (String(err?.message || '').includes('UNIQUE')) {
      const racedRow = await db
        .prepare('SELECT id FROM customers WHERE firebase_uid = ? LIMIT 1')
        .bind(verified.uid)
        .first<{ id: string }>();
      if (racedRow) {
        return getCustomerProfileByUid(db, verified.uid);
      }
      throw new CustomerApiError(
        'Customer phone conflict prevented account creation.',
        409,
        'ACCOUNT_CONFLICT_NO_MERGE'
      );
    }
    throw err;
  }

  return getCustomerProfileByUid(db, verified.uid);
}

export async function getCustomerProfileByUid(
  db: D1Database,
  uid: string
): Promise<CustomerProfileDTO> {
  const row = await db
    .prepare('SELECT * FROM customers WHERE firebase_uid = ? LIMIT 1')
    .bind(uid)
    .first<Record<string, any>>();

  if (!row) {
    throw new CustomerApiError('Customer profile not found', 404, 'CUSTOMER_NOT_FOUND');
  }

  const { results: addressRows } = await db
    .prepare(
      'SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, created_at DESC'
    )
    .bind(row.id)
    .all<Record<string, any>>();

  const addresses: CustomerAddressRecord[] = (addressRows || []).map((a) => ({
    id: String(a.id),
    label: a.label === 'Work' || a.label === 'Other' ? a.label : 'Home',
    recipientName: String(a.recipient_name),
    recipientPhone: String(a.recipient_phone),
    localityId: String(a.locality_id || 'press-colony'),
    localityName:
      a.locality_name || ALLOWED_LOCALITIES[String(a.locality_id || '')]?.nameEn || 'Press Colony',
    flatNumber: String(a.flat_number),
    streetAddress: String(a.street_address),
    landmark: a.landmark ? String(a.landmark) : '',
    pincode: String(a.pincode),
    deliveryNotes: a.delivery_notes ? String(a.delivery_notes) : '',
    isDefault: Boolean(a.is_default),
  }));

  return {
    id: String(row.id),
    firebaseUid: String(row.firebase_uid),
    name: String(row.name || 'Customer'),
    email: String(row.email || ''),
    emailVerified: Boolean(row.email_verified),
    phone: String(row.phone),
    phoneVerified: Boolean(row.phone_verified ?? row.is_phone_verified),
    isPhoneVerified: Boolean(row.phone_verified ?? row.is_phone_verified),
    addresses,
    defaultAddressId: row.default_address_id ? String(row.default_address_id) : addresses[0]?.id,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/**
 * Updates ONLY permitted profile fields (display name and delivery addresses).
 * Verified email, phone, and verification flags are strictly immutable from client payloads.
 */
export async function updateCustomerProfileByUid(
  db: D1Database,
  verified: VerifiedFirebaseCustomer,
  body: any
): Promise<CustomerProfileDTO> {
  // Ensure customer exists first via verified Firebase UID
  const existing = await upsertVerifiedCustomer(db, verified);

  if (!body || typeof body !== 'object') {
    throw new CustomerApiError('Invalid update payload', 400, 'INVALID_PAYLOAD');
  }

  // Reject explicit spoofing of identity/verification columns if submitted
  if (
    (body.firebaseUid !== undefined && body.firebaseUid !== verified.uid) ||
    (body.firebase_uid !== undefined && body.firebase_uid !== verified.uid) ||
    (body.id !== undefined && body.id !== existing.id)
  ) {
    throw new CustomerApiError('Forbidden: Cannot modify customer UID', 403, 'FORBIDDEN_IDENTITY_EDIT');
  }

  if (body.name !== undefined) {
    const cleanedName = typeof body.name === 'string' ? body.name.trim() : '';
    if (!cleanedName || cleanedName.length < 2 || cleanedName.length > 80) {
      throw new CustomerApiError('Name must be between 2 and 80 characters', 400, 'INVALID_NAME');
    }

    await db
      .prepare(
        `UPDATE customers
         SET name = ?,
             email = ?,
             email_verified = 1,
             phone = ?,
             phone_verified = 1,
             is_phone_verified = 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND firebase_uid = ?`
      )
      .bind(cleanedName, verified.email, verified.phone, existing.id, verified.uid)
      .run();
  }

  if (Array.isArray(body.addresses)) {
    if (body.addresses.length > 10) {
      throw new CustomerApiError('Maximum of 10 saved addresses allowed', 400, 'TOO_MANY_ADDRESSES');
    }

    const validatedAddresses = body.addresses.map((addr: any) => validateAddressInput(addr));
    const requestedDefaultId =
      typeof body.defaultAddressId === 'string' ? body.defaultAddressId : undefined;

    if (validatedAddresses.length > 0) {
      let hasDefault = validatedAddresses.some((a: CustomerAddressRecord) => a.isDefault);
      if (requestedDefaultId) {
        const match = validatedAddresses.find((a: CustomerAddressRecord) => a.id === requestedDefaultId);
        if (match) {
          validatedAddresses.forEach((a: CustomerAddressRecord) => {
            a.isDefault = a.id === requestedDefaultId;
          });
          hasDefault = true;
        }
      }
      if (!hasDefault) {
        validatedAddresses[0].isDefault = true;
      }
    }

    const statements = [
      db.prepare('DELETE FROM customer_addresses WHERE customer_id = ?').bind(existing.id),
      ...validatedAddresses.map((addr: CustomerAddressRecord) =>
        db
          .prepare(
            `INSERT INTO customer_addresses (
              id, customer_id, label, recipient_name, recipient_phone,
              locality_id, locality_name, flat_number, street_address,
              landmark, pincode, delivery_notes, is_default
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            addr.id,
            existing.id,
            addr.label,
            addr.recipientName,
            addr.recipientPhone,
            addr.localityId,
            addr.localityName || '',
            addr.flatNumber,
            addr.streetAddress,
            addr.landmark || '',
            addr.pincode,
            addr.deliveryNotes || '',
            addr.isDefault ? 1 : 0
          )
      ),
      db
        .prepare('UPDATE customers SET default_address_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(
          validatedAddresses.find((a: CustomerAddressRecord) => a.isDefault)?.id || null,
          existing.id
        ),
    ];

    await db.batch(statements);
  }

  return getCustomerProfileByUid(db, verified.uid);
}
