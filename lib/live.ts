import 'server-only'
import { getActiveServers } from './servers'
import { queryServer } from './gamedig'
import { queryProxmox } from './proxmox'
import type { LiveStatus, ProxmoxStats, Server } from './types'

// ─────────────────────────────────────────────────────────────────────────
//  Live data access with a short-lived, process-wide cache.
//
//  Why: the UI polls every ~15s. Without this layer, every poll from every
//  visitor triggers a fresh GameDig (UDP) query and a Proxmox API call —
//  upstream load grows as O(visitors × servers) and can get the dashboard IP
//  throttled by the game servers.
//
//  With this layer, results are cached for `*_TTL` and concurrent callers share
//  a single in-flight request (request coalescing). Upstream load becomes
//  O(servers) and is independent of the number of visitors.
//
//  Note: the cache is per Node process (per worker). That's fine for a single
//  self-hosted instance; move to Redis if you scale horizontally.
// ─────────────────────────────────────────────────────────────────────────

const STATUS_TTL_MS = 12_000
const PROXMOX_TTL_MS = 12_000

interface CacheEntry {
  value: unknown
  expires: number
}

const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<unknown>>()

/** Return a cached value if fresh, else compute it — coalescing concurrent calls. */
function memo<T>(key: string, ttlMs: number, compute: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value as T)

  const pending = inflight.get(key)
  if (pending) return pending as Promise<T>

  const promise = compute()
    .then((value) => {
      cache.set(key, { value, expires: Date.now() + ttlMs })
      return value
    })
    .finally(() => inflight.delete(key))

  inflight.set(key, promise)
  return promise
}

/** Live game status for a server (cached, coalesced). */
export function getLiveStatus(server: Server): Promise<LiveStatus> {
  return memo(`status:${server.slug}`, STATUS_TTL_MS, () => queryServer(server))
}

/** Proxmox CPU/RAM stats for a server (cached, coalesced). */
export function getLiveProxmox(server: Server): Promise<ProxmoxStats> {
  return memo(`proxmox:${server.slug}`, PROXMOX_TTL_MS, () => queryProxmox(server))
}

export interface LiveEntry {
  status: LiveStatus
  proxmox: ProxmoxStats
}

export interface LiveSnapshot {
  checkedAt: string
  servers: Record<string, LiveEntry>
}

/** Aggregated live data for all active servers, in one shot. Powers /api/live. */
export async function getActiveLive(): Promise<LiveSnapshot> {
  const servers = await getActiveServers()
  const entries = await Promise.all(
    servers.map(async (server) => {
      const [status, proxmox] = await Promise.all([
        getLiveStatus(server),
        getLiveProxmox(server),
      ])
      return [server.slug, { status, proxmox }] as const
    }),
  )
  return { checkedAt: new Date().toISOString(), servers: Object.fromEntries(entries) }
}
