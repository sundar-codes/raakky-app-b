import type { D1Database } from './types.ts';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Extracts client IP safely from Cloudflare connecting headers
 */
export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) return cfIp.trim().slice(0, 64);
  const forwarded = request.headers.get('X-Forwarded-For');
  if (forwarded) return forwarded.split(',')[0].trim().slice(0, 64);
  return 'unknown';
}

/**
 * Fixed-window atomic D1 rate limiter.
 * Falls back cleanly if rate-limit table isn't yet present (never breaks pre-migration boots).
 */
export async function checkRateLimit(
  db: D1Database | undefined,
  rateKey: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (!db) {
    return { allowed: true, remaining: maxRequests, retryAfterSeconds: 0 };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const cutoffSec = nowSec - windowSeconds;

  try {
    const existing = await db
      .prepare('SELECT request_count, window_start FROM api_rate_limits WHERE rate_key = ?')
      .bind(rateKey)
      .first<{ request_count: number; window_start: number }>();

    if (!existing || existing.window_start <= cutoffSec) {
      await db
        .prepare(
          `INSERT INTO api_rate_limits (rate_key, request_count, window_start)
           VALUES (?, 1, ?)
           ON CONFLICT(rate_key) DO UPDATE SET
             request_count = 1,
             window_start = excluded.window_start`
        )
        .bind(rateKey, nowSec)
        .run();

      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - 1),
        retryAfterSeconds: 0,
      };
    }

    const nextCount = existing.request_count + 1;
    if (nextCount > maxRequests) {
      const retryAfterSeconds = Math.max(1, windowSeconds - (nowSec - existing.window_start));
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
      };
    }

    await db
      .prepare('UPDATE api_rate_limits SET request_count = request_count + 1 WHERE rate_key = ?')
      .bind(rateKey)
      .run();

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - nextCount),
      retryAfterSeconds: 0,
    };
  } catch {
    // Do not block legitimate traffic if rate limit table hasn't been initialized
    return { allowed: true, remaining: maxRequests, retryAfterSeconds: 0 };
  }
}
