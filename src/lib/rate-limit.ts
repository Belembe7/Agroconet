/**
 * In-memory sliding-window rate limiter for a single Node process.
 * Suitable for local/dev and single-instance deploy; migrate to Redis
 * when running multiple app instances (SECURITY.md R12).
 */

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitRule = {
  /** Max requests in the window */
  max: number;
  /** Window length in milliseconds */
  windowMs: number;
};

export function consumeRateLimit(
  key: string,
  rule: RateLimitRule,
  now = Date.now(),
): RateLimitResult {
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return {
      allowed: true,
      remaining: rule.max - 1,
      retryAfterSec: 0,
    };
  }

  if (existing.count >= rule.max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: rule.max - existing.count,
    retryAfterSec: 0,
  };
}

/** Auth-sensitive defaults (login / OTP / recovery style actions). */
export const AUTH_RATE_LIMIT: RateLimitRule = {
  max: 5,
  windowMs: 60_000,
};

/** Test helper — clear all buckets. */
export function resetRateLimitStore(): void {
  buckets.clear();
}
