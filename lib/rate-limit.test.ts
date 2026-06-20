import { beforeEach, describe, expect, it } from 'vitest'
import { clearRateLimit, clientKey, rateLimit, resetRateLimits } from './rate-limit'

describe('rateLimit', () => {
  beforeEach(() => resetRateLimits())

  it('allows requests up to the limit, then blocks', () => {
    const now = 1000
    expect(rateLimit('k', 2, 1000, now).ok).toBe(true)
    expect(rateLimit('k', 2, 1000, now).ok).toBe(true)

    const blocked = rateLimit('k', 2, 1000, now)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfter).toBeGreaterThan(0)
  })

  it('resets after the window elapses', () => {
    expect(rateLimit('k', 1, 1000, 1000).ok).toBe(true)
    expect(rateLimit('k', 1, 1000, 1500).ok).toBe(false) // same window
    expect(rateLimit('k', 1, 1000, 2001).ok).toBe(true) // window passed
  })

  it('tracks keys independently', () => {
    expect(rateLimit('a', 1, 1000, 1000).ok).toBe(true)
    expect(rateLimit('b', 1, 1000, 1000).ok).toBe(true)
    expect(rateLimit('a', 1, 1000, 1000).ok).toBe(false)
  })

  it('clearRateLimit forgives a blocked key', () => {
    expect(rateLimit('k', 1, 1000, 1000).ok).toBe(true)
    expect(rateLimit('k', 1, 1000, 1000).ok).toBe(false)
    clearRateLimit('k')
    expect(rateLimit('k', 1, 1000, 1000).ok).toBe(true)
  })
})

describe('clientKey', () => {
  const reader = (h: Record<string, string>) => ({ get: (n: string) => h[n] ?? null })

  it('trusts cf-connecting-ip over forwarded headers', () => {
    expect(
      clientKey(reader({ 'cf-connecting-ip': '5.6.7.8', 'x-forwarded-for': '1.2.3.4' })),
    ).toBe('5.6.7.8')
  })

  it('falls back to leftmost x-forwarded-for, then x-real-ip, then "local"', () => {
    expect(clientKey(reader({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }))).toBe('1.2.3.4')
    expect(clientKey(reader({ 'x-real-ip': '9.9.9.9' }))).toBe('9.9.9.9')
    expect(clientKey(reader({}))).toBe('local')
  })
})
