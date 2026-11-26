import crypto from 'node:crypto';
import { SignJWT } from 'jose';
import {
  DEFAULT_FIREBASE_PROJECT_ID,
  GOOGLE_SECURE_TOKEN_CERTS_URL,
  resetFirebaseCertCache,
} from '../../functions/_lib/firebaseJwt.ts';

function derLen(len: number): Buffer {
  if (len < 128) return Buffer.from([len]);
  const bytes: number[] = [];
  let n = len;
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n >>= 8;
  }
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}

function derTlv(tag: number, content: Buffer): Buffer {
  return Buffer.concat([Buffer.from([tag]), derLen(content.length), content]);
}

function derSequence(...items: Buffer[]): Buffer {
  return derTlv(0x30, Buffer.concat(items));
}

function derSet(...items: Buffer[]): Buffer {
  return derTlv(0x31, Buffer.concat(items));
}

function derOid(bytes: number[]): Buffer {
  return derTlv(0x06, Buffer.from(bytes));
}

function derInteger(buf: Buffer): Buffer {
  const padded = buf[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), buf]) : buf;
  return derTlv(0x02, padded);
}

function derUtcTime(date: Date): Buffer {
  const yy = String(date.getUTCFullYear() % 100).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mi = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return derTlv(0x17, Buffer.from(`${yy}${mm}${dd}${hh}${mi}${ss}Z`, 'ascii'));
}

function createSelfSignedX509Pem(spkiDer: Buffer, privateKeyPem: string, commonName: string): string {
  // OID 1.2.840.113549.1.1.11 (sha256WithRSAEncryption)
  const sha256RsaOid = derOid([0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0b]);
  const sigAlg = derSequence(sha256RsaOid, derTlv(0x05, Buffer.alloc(0)));

  // OID 2.5.4.3 (commonName)
  const cnAttr = derSequence(derOid([0x55, 0x04, 0x03]), derTlv(0x0c, Buffer.from(commonName, 'utf8')));
  const name = derSequence(derSet(cnAttr));

  const now = new Date();
  const future = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const validity = derSequence(derUtcTime(now), derUtcTime(future));

  const serial = derInteger(crypto.randomBytes(8));
  const version = derTlv(0xa0, derInteger(Buffer.from([0x02]))); // v3

  const tbsCertificate = derSequence(
    version,
    serial,
    sigAlg,
    name,
    validity,
    name,
    spkiDer
  );

  const signer = crypto.createSign('SHA256');
  signer.update(tbsCertificate);
  const sigBytes = signer.sign(privateKeyPem);
  const bitString = derTlv(0x03, Buffer.concat([Buffer.from([0x00]), sigBytes]));

  const fullCert = derSequence(tbsCertificate, sigAlg, bitString);
  const b64 = fullCert.toString('base64').match(/.{1,64}/g)!.join('\n');
  return `-----BEGIN CERTIFICATE-----\n${b64}\n-----END CERTIFICATE-----`;
}

export interface TestCertKeyPair {
  kid: string;
  certPem: string;
  privateKey: crypto.KeyObject;
}

export function createFirebaseSigningKeyPair(kid: string): TestCertKeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const certPem = createSelfSignedX509Pem(
    publicKey,
    privateKey,
    'securetoken.system.gserviceaccount.com'
  );

  return {
    kid,
    certPem,
    privateKey: crypto.createPrivateKey(privateKey),
  };
}

export async function signTestFirebaseJwt(
  keyPair: TestCertKeyPair,
  claims: {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    phone_number?: string;
    name?: string;
    aud?: string;
    iss?: string;
    exp?: number;
    iat?: number;
    auth_time?: number;
  } = {}
): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  const uid = claims.sub === undefined ? 'uid_test_customer_1' : claims.sub;
  const payload: Record<string, unknown> = {
    iss: claims.iss ?? `https://securetoken.google.com/${DEFAULT_FIREBASE_PROJECT_ID}`,
    aud: claims.aud ?? DEFAULT_FIREBASE_PROJECT_ID,
    auth_time: claims.auth_time ?? nowSec - 60,
    iat: claims.iat ?? nowSec - 10,
    exp: claims.exp ?? nowSec + 3600,
    ...(uid ? { sub: uid, user_id: uid } : {}),
    ...(claims.email !== undefined ? { email: claims.email } : { email: 'customer@example.com' }),
    ...(claims.email_verified !== undefined
      ? { email_verified: claims.email_verified }
      : { email_verified: true }),
    ...(claims.phone_number !== undefined
      ? { phone_number: claims.phone_number }
      : { phone_number: '+919876543210' }),
    name: claims.name ?? 'Ravi Kumar',
    firebase: {
      identities: {
        'google.com': ['10998877'],
        phone: [claims.phone_number ?? '+919876543210'],
      },
      sign_in_provider: 'google.com',
    },
  };

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: keyPair.kid, typ: 'JWT' })
    .sign(keyPair.privateKey);
}

export function installMockGoogleCertsFetch(initialCerts: Record<string, string>) {
  let activeCerts = { ...initialCerts };
  let cacheControl = 'public, max-age=3600, must-revalidate';
  let fetchCount = 0;

  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const targetUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;

    if (targetUrl === GOOGLE_SECURE_TOKEN_CERTS_URL) {
      fetchCount += 1;
      return new Response(JSON.stringify(activeCerts), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': cacheControl,
        },
      });
    }

    return originalFetch(input as any, init);
  }) as typeof fetch;

  return {
    getFetchCount: () => fetchCount,
    setCerts: (nextCerts: Record<string, string>, nextCacheControl?: string) => {
      activeCerts = { ...nextCerts };
      if (nextCacheControl !== undefined) cacheControl = nextCacheControl;
    },
    restore: () => {
      globalThis.fetch = originalFetch;
      resetFirebaseCertCache();
    },
  };
}
