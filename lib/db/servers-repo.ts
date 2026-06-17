import 'server-only'
import { and, eq, ne } from 'drizzle-orm'
import { getDb } from './client'
import { servers as serversTable } from './schema'
import type { Server } from '../types'

type ServerRow = typeof import('./schema').servers.$inferSelect
type ModRow = typeof import('./schema').serverMods.$inferSelect
type DownloadRow = typeof import('./schema').serverDownloads.$inferSelect

/** Map a DB row (+ its children) onto the `Server` domain type. */
function rowToServer(
  row: ServerRow & { mods: ModRow[]; downloads: DownloadRow[] },
): Server {
  return {
    slug: row.slug,
    name: row.name,
    gameId: row.gameId,
    summary: row.summary,
    description: row.description ?? undefined,
    query: row.queryHost
      ? { host: row.queryHost, port: row.queryPort ?? undefined }
      : undefined,
    connect: row.connect ?? undefined,
    proxmox:
      row.proxmoxNode && row.proxmoxVmid != null && row.proxmoxType
        ? {
            node: row.proxmoxNode,
            vmid: row.proxmoxVmid,
            type: row.proxmoxType as 'lxc' | 'qemu',
          }
        : undefined,
    startedAt: row.startedAt,
    endedAt: row.endedAt ?? undefined,
    archived: row.archived || undefined,
    current: row.current || undefined,
    tags: row.tags?.length ? row.tags : undefined,
    images: row.images?.length ? row.images : undefined,
    mods: row.mods.length
      ? row.mods.map((m) => ({
          name: m.name,
          url: m.url ?? undefined,
          required: m.required,
          note: m.note ?? undefined,
        }))
      : undefined,
    downloads: row.downloads.length
      ? row.downloads.map((d) => ({
          label: d.label,
          file: d.file ?? undefined,
          url: d.url ?? undefined,
          description: d.description ?? undefined,
        }))
      : undefined,
  }
}

/** Load every server (with mods + downloads) from the database. */
export async function loadServersFromDb(): Promise<Server[]> {
  const db = getDb()
  const rows = await db.query.servers.findMany({
    with: { mods: true, downloads: true },
  })
  return rows.map(rowToServer)
}

// ── Writes (admin) ─────────────────────────────────────────────────────────

/** Editable server fields exposed by the admin form. */
export interface ServerInput {
  slug: string
  name: string
  gameId: string
  summary: string
  description?: string | null
  queryHost?: string | null
  queryPort?: number | null
  connect?: string | null
  proxmoxNode?: string | null
  proxmoxVmid?: number | null
  proxmoxType?: string | null
  startedAt: string
  endedAt?: string | null
  archived: boolean
  current: boolean
  tags: string[]
}

function toRow(input: ServerInput) {
  return {
    slug: input.slug,
    name: input.name,
    gameId: input.gameId,
    summary: input.summary,
    description: input.description || null,
    queryHost: input.queryHost || null,
    queryPort: input.queryPort ?? null,
    connect: input.connect || null,
    proxmoxNode: input.proxmoxNode || null,
    proxmoxVmid: input.proxmoxVmid ?? null,
    proxmoxType: input.proxmoxType || null,
    startedAt: input.startedAt,
    endedAt: input.endedAt || null,
    archived: input.archived,
    current: input.current,
    tags: input.tags,
  }
}

/** Ensure at most one server is flagged `current`. */
async function clearCurrentFlag(exceptSlug?: string): Promise<void> {
  const db = getDb()
  const where = exceptSlug
    ? and(eq(serversTable.current, true), ne(serversTable.slug, exceptSlug))
    : eq(serversTable.current, true)
  await db.update(serversTable).set({ current: false }).where(where)
}

export async function createServer(input: ServerInput): Promise<void> {
  const db = getDb()
  if (input.current) await clearCurrentFlag()
  await db.insert(serversTable).values(toRow(input))
}

export async function updateServer(
  originalSlug: string,
  input: ServerInput,
): Promise<void> {
  const db = getDb()
  if (input.current) await clearCurrentFlag(originalSlug)
  await db
    .update(serversTable)
    .set({ ...toRow(input), updatedAt: new Date() })
    .where(eq(serversTable.slug, originalSlug))
}

export async function deleteServer(slug: string): Promise<void> {
  const db = getDb()
  await db.delete(serversTable).where(eq(serversTable.slug, slug))
}
