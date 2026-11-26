import {
  decodeProtectedHeader,
  importX509,
  jwtVerify,
} from 'jose';
import type { Env, VerifiedFirebaseCustomer } from './types.ts';

type ImportedX509Key = Awaited<ReturnType<typeof importX509>>;

export const DEFAULT_FIREBASE_PROJECT_ID = 'raakky-chicken-auth';
export const GOOGLE_SECURE_TOKEN_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

const E164_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_ROTATION_REFRESH_INTERVAL_MS = 10_000;

export class AuthVerificationError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'AuthVerificationError';
    this.status = status;
    this.code = code;
  }
}

interface CertCacheState {
  certs: Record<string, string>;
  keys: Map<string, ImportedX509Key>;
  expiresAtMs: number;
  fetchedAtMs: number;
}

let certCache: CertCacheState | null = null;
let inflightCertFetch: Promise<CertCacheState> | null = null;

/**
 * Exposed purely for unit/integration test isolation
 */
export function resetFirebaseCertCache(): void {
  certCache = null;
  inflightCertFetch = null;
}

/**
 * Parses Google's HTTP Cache-Control max-age directive in seconds
 */
export function parseCacheControlMaxAgeMs(cacheControlHeader: string | null): number {
  if (!cacheControlHeader) return 0;
  const lower = cacheControlHeader.toLowerCase();
  if (lower.includes('no-store') || lower.includes('no-cache')) {
    return 0;
  }
  const match = lower.match(/max-age\s*=\s*(\d+)/);
  if (!match) return 0;
  const seconds = Number.parseInt(match[1], 10);
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return seconds * 1000;
}

async function fetchGoogleCertificates(): Promise<CertCacheState> {
  if (inflightCertFetch) {
    return inflightCertFetch;
  }

  inflightCertFetch = (async () => {
    const res = await fetch(GOOGLE_SECURE_TOKEN_CERTS_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new AuthVerificationError(
        'Unable to retrieve Google Firebase signing certificates',
        503,
        'AUTH_CERTS_UNAVAILABLE'
      );
    }

    const certs = (await res.json()) as Record<string, string>;
    if (!certs || typeof certs !== 'object' || Object.keys(certs).length === 0) {
      throw new AuthVerificationError(
        'Google Firebase signing certificate payload is invalid',
        503,
        'AUTH_CERTS_INVALID'
      );
    }

    const nowMs = Date.now();
    const maxAgeMs = parseCacheControlMaxAgeMs(res.headers.get('Cache-Control'));

    const state: CertCacheState = {
      certs,
      keys: new Map(),
      expiresAtMs: nowMs + maxAgeMs,
      fetchedAtMs: nowMs,
    };

    certCache = state;
    return state;
  })();

  try {
    return await inflightCertFetch;
  } finally {
    inflightCertFetch = null;
  }
}

async function getVerificationKeyByKid(kid: string) {
  const nowMs = Date.now();
  let state = certCache;

  // Fetch if no cache or cache TTL expired
  if (!state || nowMs >= state.expiresAtMs) {
    state = await fetchGoogleCertificates();
  }

  // Key rotation support: if kid is not in cached certs and cooldown has elapsed, refresh certs
  if (!state.certs[kid] && nowMs - state.fetchedAtMs >= MIN_ROTATION_REFRESH_INTERVAL_MS) {
    state = await fetchGoogleCertificates();
  }

  const pem = state.certs[kid];
  if (!pem || typeof pem !== 'string') {
    throw new AuthVerificationError(
      'Token key identifier (kid) is not recognized by Firebase',
      401,
      'INVALID_TOKEN_KID'
    );
  }

  let key = state.keys.get(kid);
  if (!key) {
    try {
      key = await importX509(pem, 'RS256');
      state.keys.set(kid, key);
    } catch {
      throw new AuthVerificationError(
        'Failed to load Firebase verification public key',
        401,
        'INVALID_PUBLIC_KEY'
      );
    }
  }

  return key;
}

/**
 * Cryptographically verifies a Firebase ID token against Google's Secure Token X.509 certificates.
 * Validates RS256 algorithm, kid, signature, issuer, audience, exp, iat, auth_time, and non-empty sub.
 */
export async function verifyFirebaseIdToken(
  token: string,
  projectId: string = DEFAULT_FIREBASE_PROJECT_ID
): Promise<{
  uid: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string;
  name: string;
  claims: Record<string, unknown>;
}> {
  if (!token || typeof token !== 'string' || token.length > 8192) {
    throw new AuthVerificationError(
      'Missing or malformed Firebase authentication token',
      401,
      'INVALID_AUTH_TOKEN'
    );
  }

  // Basic structural validation (3 base64url segments)
  const segments = token.split('.');
  if (segments.length !== 3 || segments.some((s) => s.length === 0)) {
    throw new AuthVerificationError(
      'Malformed JWT token structure',
      401,
      'MALFORMED_TOKEN'
    );
  }

  let protectedHeader: { alg?: string; kid?: string };
  try {
    protectedHeader = decodeProtectedHeader(token);
  } catch {
    throw new AuthVerificationError(
      'Invalid JWT protected header',
      401,
      'MALFORMED_TOKEN'
    );
  }

  if (protectedHeader.alg !== 'RS256') {
    throw new AuthVerificationError(
      'Token signing algorithm must be RS256',
      401,
      'INVALID_TOKEN_ALG'
    );
  }

  if (typeof protectedHeader.kid !== 'string' || protectedHeader.kid.trim().length === 0) {
    throw new AuthVerificationError(
      'Token protected header missing required key ID (kid)',
      401,
      'MISSING_TOKEN_KID'
    );
  }

  const publicKey = await getVerificationKeyByKid(protectedHeader.kid);
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;

  let payload: Record<string, unknown>;
  try {
    const verified = await jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: expectedIssuer,
      audience: projectId,
      clockTolerance: 5,
    });
    payload = verified.payload as Record<string, unknown>;
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'ERR_JWT_EXPIRED') {
      throw new AuthVerificationError(
        'Firebase authentication session has expired. Please retry.',
        401,
        'TOKEN_EXPIRED'
      );
    }
    if (code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') {
      throw new AuthVerificationError(
        'Firebase token claims validation failed',
        401,
        'INVALID_TOKEN_CLAIMS'
      );
    }
    throw new AuthVerificationError(
      'Firebase token signature or payload verification failed',
      401,
      'INVALID_TOKEN_SIGNATURE'
    );
  }

  const nowSec = Math.floor(Date.now() / 1000);

  // Subject (Firebase UID) must be a non-empty string up to 128 chars
  const sub = payload.sub;
  if (typeof sub !== 'string' || sub.trim().length === 0 || sub.length > 128) {
    throw new AuthVerificationError(
      'Firebase token missing valid subject UID',
      401,
      'INVALID_TOKEN_SUBJECT'
    );
  }

  if (payload.user_id !== undefined && payload.user_id !== sub) {
    throw new AuthVerificationError(
      'Firebase token user_id mismatch',
      401,
      'INVALID_TOKEN_SUBJECT'
    );
  }

  // Issued-at time must exist and be in the past (with small 60s clock drift allowance)
  if (typeof payload.iat !== 'number' || !Number.isFinite(payload.iat) || payload.iat > nowSec + 60) {
    throw new AuthVerificationError(
      'Firebase token issued-at (iat) claim is invalid or in the future',
      401,
      'INVALID_TOKEN_IAT'
    );
  }

  // Auth time (if present) must also be in the past
  if (
    payload.auth_time !== undefined &&
    (typeof payload.auth_time !== 'number' ||
      !Number.isFinite(payload.auth_time) ||
      payload.auth_time > nowSec + 60)
  ) {
    throw new AuthVerificationError(
      'Firebase token auth_time claim is invalid',
      401,
      'INVALID_TOKEN_AUTH_TIME'
    );
  }

  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const emailVerified = payload.email_verified === true;
  const phoneNumber = typeof payload.phone_number === 'string' ? payload.phone_number.trim() : '';
  const name =
    typeof payload.name === 'string' && payload.name.trim().length > 0
      ? payload.name.trim()
      : email
        ? email.split('@')[0]
        : 'Customer';

  return {
    uid: sub.trim(),
    email,
    emailVerified,
    phoneNumber,
    name,
    claims: payload,
  };
}

/**
 * Extracts Authorization Bearer token, cryptographically validates it against Google certs,
 * and strictly enforces verified Google email authentication.
 * Phone number claim from JWT is marked verified ONLY when present and valid E.164.
 */
export async function requireVerifiedCustomer(
  request: Request,
  env?: Env
): Promise<VerifiedFirebaseCustomer> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    throw new AuthVerificationError(
      'Authentication required. Missing Authorization header.',
      401,
      'MISSING_AUTHORIZATION'
    );
  }

  const match = authHeader.match(/^Bearer\s+(\S+)$/i);
  if (!match || !match[1]) {
    throw new AuthVerificationError(
      'Invalid Authorization format. Expected Bearer token.',
      401,
      'INVALID_AUTH_HEADER'
    );
  }

  const projectId = env?.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
  const verified = await verifyFirebaseIdToken(match[1], projectId);

  if (!verified.emailVerified || !EMAIL_REGEX.test(verified.email)) {
    throw new AuthVerificationError(
      'A verified Google email address is required to perform this action.',
      403,
      'EMAIL_NOT_VERIFIED'
    );
  }

  if (verified.phoneNumber && !E164_PHONE_REGEX.test(verified.phoneNumber)) {
    throw new AuthVerificationError(
      'Token contains a malformed phone_number claim.',
      403,
      'INVALID_TOKEN_PHONE'
    );
  }

  const hasVerifiedJwtPhone = Boolean(verified.phoneNumber && E164_PHONE_REGEX.test(verified.phoneNumber));

  return {
    uid: verified.uid,
    email: verified.email,
    emailVerified: true,
    jwtPhoneNumber: hasVerifiedJwtPhone ? verified.phoneNumber : '',
    jwtPhoneVerified: hasVerifiedJwtPhone,
    phone: hasVerifiedJwtPhone ? verified.phoneNumber : '',
    selfReportedPhone: '',
    phoneVerificationStatus: hasVerifiedJwtPhone ? 'VERIFIED' as const : 'NOT_PROVIDED' as const,
    name: verified.name,
  };
}
