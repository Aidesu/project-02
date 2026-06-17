import { beforeEach, describe, expect, it } from 'vitest'
import { rateLimit, resetRateLimits } from './rate-limit'

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
})
