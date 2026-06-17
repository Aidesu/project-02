import 'server-only'
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm'
import { getDb } from './client'
import { statusSnapshots } from './schema'
import type { LiveStatus } from '../types'

/** Append one status snapshot for a server. */
export async function insertSnapshot(
  slug: string,
  status: LiveStatus,
): Promise<void> {
  const db = getDb()
  await db.insert(statusSnapshots).values({
    slug,
    online: status.online,
    playersCurrent: status.online ? status.players.current : null,
    playersMax: status.online ? status.players.max : null,
    ping: status.ping ?? null,
  })
}

export interface Uptime {
  /** Online ratio 0..1 over the window, or null when there are no samples. */
  ratio: number | null
  samples: number
}

/** Uptime ratio for a server over the last `sinceMs` milliseconds. */
export async function getUptime(slug: string, sinceMs: number): Promise<Uptime> {
  const db = getDb()
  const since = new Date(Date.now() - sinceMs)
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      online: sql<number>`count(*) filter (where ${statusSnapshots.online})::int`,
    })
    .from(statusSnapshots)
    .where(
      and(eq(statusSnapshots.slug, slug), gte(statusSnapshots.checkedAt, since)),
    )

  if (!row || row.total === 0) return { ratio: null, samples: 0 }
  return { ratio: row.online / row.total, samples: row.total }
}

export interface SnapshotPoint {
  checkedAt: string
  online: boolean
  players: number | null
}

/** The most recent `limit` snapshots for a server, oldest → newest. */
export async function getRecentSnapshots(
  slug: string,
  limit: number,
): Promise<SnapshotPoint[]> {
  const db = getDb()
  const rows = await db
    .select({
      checkedAt: statusSnapshots.checkedAt,
      online: statusSnapshots.online,
      players: statusSnapshots.playersCurrent,
    })
    .from(statusSnapshots)
    .where(eq(statusSnapshots.slug, slug))
    .orderBy(desc(statusSnapshots.checkedAt))
    .limit(limit)

  return rows
    .map((r) => ({
      checkedAt: r.checkedAt.toISOString(),
      online: r.online,
      players: r.players,
    }))
    .reverse()
}

/** Delete snapshots older than `olderThanMs` (retention). */
export async function pruneSnapshots(olderThanMs: number): Promise<void> {
  const db = getDb()
  const cutoff = new Date(Date.now() - olderThanMs)
  await db.delete(statusSnapshots).where(lt(statusSnapshots.checkedAt, cutoff))
}
