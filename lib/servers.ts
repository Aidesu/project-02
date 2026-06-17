import 'server-only'
import { cache } from 'react'
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
 * working without a DB (and during early setup). Wrapped in React `cache()` so
 * one render only hits the DB once, no matter how many selectors run.
 */
const loadAll = cache(async (): Promise<Server[]> => {
  if (hasDatabase()) {
    try {
      return await loadServersFromDb()
    } catch (err) {
      console.error(
        '[servers] Lecture DB échouée, repli sur les données statiques :',
        err,
      )
      return staticServers
    }
  }
  return staticServers
})

/** All servers, most recent first. */
export async function getAllServers(): Promise<Server[]> {
  return [...(await loadAll())].sort(byStartDateDesc)
}

/** Servers currently in service (shown on the home page). */
export async function getActiveServers(): Promise<Server[]> {
  return (await getAllServers()).filter((s) => !s.archived)
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
