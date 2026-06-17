import { beforeAll, describe, expect, it } from 'vitest'
import {
  getActiveServers,
  getAllServers,
  getArchivedServers,
  getCurrentServer,
  serverAddress,
} from './servers'
import type { Server } from './types'

// No DATABASE_URL in tests → exercises the static-data fallback path.
beforeAll(() => {
  delete process.env.DATABASE_URL
})

describe('catalog selectors (static fallback)', () => {
  it('sorts all servers by start date, most recent first', async () => {
    const all = await getAllServers()
    expect(all.length).toBeGreaterThan(0)
    for (let i = 1; i < all.length; i++) {
      expect(all[i - 1].startedAt >= all[i].startedAt).toBe(true)
    }
  })

  it('splits active and archived without overlap', async () => {
    const [all, active, archived] = await Promise.all([
      getAllServers(),
      getActiveServers(),
      getArchivedServers(),
    ])
    expect(active.every((s) => !s.archived)).toBe(true)
    expect(archived.every((s) => s.archived === true)).toBe(true)
    expect(active.length + archived.length).toBe(all.length)
  })

  it('picks a current server that is active', async () => {
    const current = await getCurrentServer()
    expect(current).toBeDefined()
    expect(current?.archived).toBeFalsy()
  })
})

describe('serverAddress', () => {
  const base: Server = {
    slug: 's',
    name: 'S',
    gameId: 'minecraft',
    summary: '',
    startedAt: '2026-01-01',
  }

  it('prefers the explicit connect address', () => {
    expect(
      serverAddress({ ...base, connect: 'play.fr', query: { host: 'h', port: 1 } }),
    ).toBe('play.fr')
  })

  it('falls back to host:port from the query target', () => {
    expect(serverAddress({ ...base, query: { host: 'h', port: 25565 } })).toBe('h:25565')
  })

  it('uses host alone when no port is set', () => {
    expect(serverAddress({ ...base, query: { host: 'h' } })).toBe('h')
  })

  it('returns undefined when there is no address', () => {
    expect(serverAddress(base)).toBeUndefined()
  })
})
