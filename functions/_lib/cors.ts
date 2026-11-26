import type { Env } from './types.ts';

const DEFAULT_EXACT_ORIGINS = new Set<string>([
  'https://raakky-app-b.pages.dev',
  'https://raakky-app-a.pages.dev',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:4173',
  'http://localhost:8788',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:8788',
]);

const PAGES_PREVIEW_REGEX = /^https:\/\/[a-z0-9-]+\.raakky-app-[ab]\.pages\.dev$/i;

export function getAllowedOrigins(env?: Env): Set<string> {
  const allowed = new Set(DEFAULT_EXACT_ORIGINS);
  if (env?.ALLOWED_ORIGINS) {
    for (const entry of env.ALLOWED_ORIGINS.split(',')) {
      const cleaned = entry.trim().replace(/\/$/, '');
      if (cleaned && cleaned !== '*') {
        allowed.add(cleaned);
      }
    }
  }
  return allowed;
}

export function isOriginAllowed(origin: string | null, env?: Env): boolean {
  // Same-origin / non-CORS requests without an Origin header are allowed;
  // CORS protection restricts browser cross-origin access.
  if (!origin) return true;
  const normalized = origin.trim().replace(/\/$/, '');
  const allowed = getAllowedOrigins(env);
  if (allowed.has(normalized)) return true;
  if (PAGES_PREVIEW_REGEX.test(normalized)) return true;
  return false;
}

export function buildCorsHeaders(
  request: Request,
  env?: Env,
  sensitive: boolean = false
): Record<string, string> {
  const origin = request.headers.get('Origin');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
  };

  if (sensitive) {
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private';
    headers['Pragma'] = 'no-cache';
  }

  if (origin && isOriginAllowed(origin, env)) {
    headers['Access-Control-Allow-Origin'] = origin.trim().replace(/\/$/, '');
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Idempotency-Key';
    headers['Access-Control-Max-Age'] = '86400';
  }

  return headers;
}

export function handlePreflight(request: Request, env?: Env): Response {
  const origin = request.headers.get('Origin');
  if (origin && !isOriginAllowed(origin, env)) {
    return new Response(
      JSON.stringify({
        error: 'Cross-origin request forbidden',
        code: 'CORS_ORIGIN_DENIED',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Vary': 'Origin',
        },
      }
    );
  }

  return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(request, env, false),
  });
}

export function jsonResponse(
  request: Request,
  env: Env | undefined,
  data: unknown,
  status: number = 200,
  options?: { sensitive?: boolean; extraHeaders?: Record<string, string> }
): Response {
  const headers = buildCorsHeaders(request, env, options?.sensitive ?? false);
  if (options?.extraHeaders) {
    Object.assign(headers, options.extraHeaders);
  }
  return new Response(JSON.stringify(data), { status, headers });
}

export function errorResponse(
  request: Request,
  env: Env | undefined,
  message: string,
  status: number = 400,
  code: string = 'BAD_REQUEST',
  options?: { sensitive?: boolean; extraHeaders?: Record<string, string> }
): Response {
  return jsonResponse(
    request,
    env,
    { error: message, code },
    status,
    options
  );
}
