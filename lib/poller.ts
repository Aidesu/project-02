import 'server-only'
import { hasDatabase } from './db/client'
import { insertSnapshot, pruneSnapshots } from './db/snapshots'
import { getLiveStatus } from './live'
import { getActiveServers } from './servers'

// ─────────────────────────────────────────────────────────────────────────
//  Background poller: every minute it records a live-status snapshot for each
//  active server into `status_snapshots`, powering the uptime/history graphs.
//
//  Started once from instrumentation.ts (Node runtime only). Reuses
//  getLiveStatus() so each poll also warms the shared live cache. Guarded by a
//  globalThis flag so dev hot-reload doesn't spin up duplicate intervals.
//
//  Single-instance assumption: if you run multiple Node workers, run the poller
//  in exactly one of them (or as an external cron) to avoid duplicate rows.
// ─────────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 60_000
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const PRUNE_EVERY = 60 // every ~60 polls (~hourly)

const globalForPoller = globalThis as unknown as { __dsPollerStarted?: boolean }

let pollCount = 0

async function recordOnce(): Promise<void> {
  try {
    const servers = await getActiveServers()
    await Promise.all(
      servers.map(async (server) => {
        const status = await getLiveStatus(server)
        await insertSnapshot(server.slug, status)
      }),
    )
    if (++pollCount % PRUNE_EVERY === 0) {
      await pruneSnapshots(RETENTION_MS)
    }
  } catch (err) {
    console.error('[poller] échec d’un cycle :', err)
  }
}

export function startPoller(): void {
  if (globalForPoller.__dsPollerStarted) return
  if (!hasDatabase()) {
    console.log('[poller] DATABASE_URL absent — poller désactivé.')
    return
  }
  globalForPoller.__dsPollerStarted = true
  console.log('[poller] démarrage (intervalle 60 s).')

  void recordOnce()
  const timer = setInterval(() => void recordOnce(), POLL_INTERVAL_MS)
  // Don't keep the process alive just for the poller.
  timer.unref?.()
}
