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

/** Minimal header reader satisfied by both `Request.headers` and `next/headers`. */
type HeaderReader = Pick<Headers, 'get'>

/**
 * Client identifier used to key per-IP limits.
 *
 * This deployment sits behind Cloudflare, so we trust `cf-connecting-ip`: it is
 * set by Cloudflare's edge and cannot be forged by the client — PROVIDED the
 * origin only accepts Cloudflare traffic (lock the origin firewall to
 * Cloudflare's IP ranges, or front it with a Cloudflare Tunnel). Otherwise an
 * attacker can hit the origin directly and fall through to the spoofable
 * headers below.
 *
 * The `x-forwarded-for` / `x-real-ip` fallbacks are client-claimed (spoofable)
 * and exist only for local dev / non-Cloudflare environments.
 */
export function clientKey(headers: HeaderReader): string {
  const cf = headers.get('cf-connecting-ip')?.trim()
  if (cf) return cf

  const xff = headers.get('x-forwarded-for')
  return xff?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'local'
}

/** Forget a single bucket (e.g. on a successful login, to forgive attempts). */
export function clearRateLimit(key: string): void {
  buckets.delete(key)
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
  const result = rateLimit(`${name}:${clientKey(req.headers)}`, limit, windowMs)
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
