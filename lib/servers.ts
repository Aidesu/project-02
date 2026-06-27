import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { servers as staticServers } from '@/data/servers'
import { hasDatabase } from './db/client'
import { loadServersFromDb } from './db/servers-repo'
import type { Server } from './types'

function byStartDateDesc(a: Server, b: Server): number {
  return (b.startedAt ?? '').localeCompare(a.startedAt ?? '')
}

/**
 * Source of truth for the catalog. Reads from the database when DATABASE_URL is
 * set, otherwise falls back to the static `data/servers.ts` — so the app keeps
 * working without a DB (and during early setup). `fromDb` tells callers whether
 * the rows are real (DB) or the placeholder fallback.
 *
 * Uncached on purpose: safe to call from any context, including background jobs
 * (the poller) and route handlers that run outside React's render/cache scope.
 */
async function loadFromSource(): Promise<{ servers: Server[]; fromDb: boolean }> {
  if (hasDatabase()) {
    try {
      const rows = await loadServersFromDb()
      if (rows.length > 0) return { servers: rows, fromDb: true }
      // DB joignable mais vide (pas encore seedée, ou tout supprimé) : on
      // retombe sur le catalogue statique plutôt que d'afficher un site vide.
      console.warn(
        '[servers] Base joignable mais vide — repli sur les données statiques.',
      )
    } catch (err) {
      console.error(
        '[servers] Lecture DB échouée, repli sur les données statiques :',
        err,
      )
    }
  }
  return { servers: staticServers, fromDb: false }
}

/**
 * Cached catalog for **rendering** (the static shell). Tagged `servers`; admin
 * mutations call `updateTag('servers')`, so edits show up immediately.
 *
 * The lifetime is set per branch on purpose:
 *  - Real DB rows → `cacheLife('days')`: stable, invalidated on demand by tag.
 *  - Static fallback (no DB at `next build`, transient DB error, or empty DB) →
 *    `cacheLife('seconds')`: a short-lived "dynamic hole" so the real catalog is
 *    picked up at runtime on the next requests, without waiting for a mutation.
 *
 * RENDER ONLY: `use cache` needs a request/render context. Background jobs and
 * the live pipeline use `loadFromSource()` / `getActiveServersUncached()`.
 */
async function loadAll(): Promise<Server[]> {
  'use cache'
  cacheTag('servers')
  const { servers, fromDb } = await loadFromSource()
  // Separate literal calls (not a ternary) so the built-in profile names keep
  // their literal types for `cacheLife`'s overloads.
  if (fromDb) {
    cacheLife('days')
  } else {
    cacheLife('seconds')
  }
  return servers
}

/** All servers, most recent first. */
export async function getAllServers(): Promise<Server[]> {
  return [...(await loadAll())].sort(byStartDateDesc)
}

/** Servers currently in service (shown on the home page). */
export async function getActiveServers(): Promise<Server[]> {
  return (await getAllServers()).filter((s) => !s.archived)
}

/**
 * Active servers for non-render callers (the background poller, the live data
 * pipeline). Reads the uncached source so it never touches `use cache`, which
 * requires a React render/request context the poller doesn't have.
 */
export async function getActiveServersUncached(): Promise<Server[]> {
  const { servers } = await loadFromSource()
  return servers.filter((s) => !s.archived).sort(byStartDateDesc)
}

/** Retired servers (shown in the history/archive). */
export async function getArchivedServers(): Promise<Server[]> {
  return (await getAllServers()).filter((s) => s.archived)
}

/**
 * The featured server shown in the home banner.
 * Prefers one explicitly flagged `current: true`, otherwise falls back to the
 * most recently started active server.
 */
export async function getCurrentServer(): Promise<Server | undefined> {
  const active = await getActiveServers()
  return active.find((s) => s.current) ?? active[0]
}

export async function getServer(slug: string): Promise<Server | undefined> {
  return (await loadAll()).find((s) => s.slug === slug)
}

/**
 * All catalog slugs, from the uncached source — for `generateStaticParams`,
 * which runs at build time (often without a DB) and must not depend on
 * `use cache`. Routes with a non-leaf dynamic segment (e.g. `/admin/[slug]/edit`,
 * `/serveurs/[slug]`) need this so Next can build the route tree.
 */
export async function getAllServerSlugs(): Promise<string[]> {
  const { servers } = await loadFromSource()
  return servers.map((s) => s.slug)
}

/** Address players type in to join, falling back to the live-query target. */
export function serverAddress(server: Server): string | undefined {
  if (server.connect) return server.connect
  if (server.query?.host) {
    return server.query.port
      ? `${server.query.host}:${server.query.port}`
      : server.query.host
  }
  return undefined
}
