/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach. State resets on cold starts (acceptable for Workers).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean stale entries periodically
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000; // 1 minute

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key.
 * @param key - Unique identifier (usually IP or IP + route)
 * @param limit - Max requests per window (default: 60)
 * @param windowMs - Window duration in ms (default: 60000 = 1 minute)
 */
export function rateLimit(key: string, limit = 60, windowMs = 60_000): RateLimitResult {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count++;
  const allowed = entry.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP from request headers (Cloudflare-aware).
 */
export function getClientIP(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Apply rate limiting to a request. Returns a 429 Response if limit exceeded, or null if allowed.
 * Adds standard rate limit headers to successful responses.
 */
export function checkRateLimit(
  request: Request,
  routeKey: string,
  limit = 60,
  windowMs = 60_000,
): Response | null {
  const ip = getClientIP(request);
  const key = `${ip}:${routeKey}`;
  const result = rateLimit(key, limit, windowMs);

  if (!result.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    });
  }

  return null;
}

/**
 * Add rate limit headers to an existing response.
 */
export function addRateLimitHeaders(
  response: Response,
  request: Request,
  routeKey: string,
  limit = 60,
): Response {
  const ip = getClientIP(request);
  const key = `${ip}:${routeKey}`;
  const entry = store.get(key);
  if (!entry) return response;

  const headers = new Headers(response.headers);
  headers.set("X-RateLimit-Limit", String(limit));
  headers.set("X-RateLimit-Remaining", String(Math.max(0, limit - entry.count)));
  headers.set("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
