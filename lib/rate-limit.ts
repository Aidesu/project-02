// ─────────────────────────────────────────────────────────────────────────
//  Tiny in-memory, per-IP fixed-window rate limiter for the public API routes.
//  Complements the upstream cache in lib/live.ts: the cache protects the game
//  servers/Proxmox from load amplification; this protects the dashboard itself
//  from a single client hammering the endpoints.
//
//  Per-process (per worker) — fine for a single self-hosted instance. Move to
//  Redis if you scale horizontally.
// ─────────────────────────────────────────────────────────────────────────

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  ok: boolean
  remaining: number
  /** Seconds until the window resets (when blocked). */
  retryAfter: number
}

/** Pure fixed-window check. Exported for testing. */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfter: 0 }
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  bucket.count += 1
  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 }
}

/** Best-effort client identifier from proxy headers (falls back to "local"). */
export function clientKey(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  const ip =
    xff?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local'
  return ip
}

/** Reset internal state (tests only). */
export function resetRateLimits(): void {
  buckets.clear()
}

export interface RateLimitOptions {
  /** Namespace so different routes have independent budgets. */
  name: string
  limit: number
  windowMs: number
}

/**
 * Enforce a rate limit for a request. Returns a 429 `Response` when exceeded,
 * or `null` when the request may proceed.
 */
export function enforceRateLimit(
  req: Request,
  { name, limit, windowMs }: RateLimitOptions,
): Response | null {
  const result = rateLimit(`${name}:${clientKey(req)}`, limit, windowMs)
  if (result.ok) return null

  return Response.json(
    { error: 'Trop de requêtes, réessayez dans un instant.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfter),
        'Cache-Control': 'no-store',
      },
    },
  )
}
