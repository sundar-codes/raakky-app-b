export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: {
    changes?: number;
    last_row_id?: number;
    duration?: number;
  };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec?(query: string): Promise<{ count: number; duration: number }>;
}

export interface Env {
  DB?: D1Database;
  BUCKET?: unknown;
  STORE_PHONE?: string;
  STORE_CITY?: string;
  ENVIRONMENT?: string;
  FIREBASE_PROJECT_ID?: string;
  ALLOWED_ORIGINS?: string;
  JWT_SECRET?: string;
}

export interface VerifiedFirebaseCustomer {
  uid: string;
  email: string;
  emailVerified: true;
  phone: string;
  name: string;
}

export interface CustomerAddressRecord {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  recipientName: string;
  recipientPhone: string;
  localityId: string;
  localityName?: string;
  flatNumber: string;
  streetAddress: string;
  landmark?: string;
  pincode: string;
  deliveryNotes?: string;
  isDefault: boolean;
}

export interface ApiErrorPayload {
  error: string;
  code: string;
  details?: string;
}
