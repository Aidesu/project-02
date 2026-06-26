import 'server-only'
import { and, eq, ne } from 'drizzle-orm'
import { getDb } from './client'
import {
  serverDownloads as serverDownloadsTable,
  serverMods as serverModsTable,
  servers as serversTable,
} from './schema'
import type { DownloadEntry, ModEntry, Server } from '../types'

type Db = ReturnType<typeof getDb>
/** A transaction handle exposes the same query builders as the root client. */
type Executor = Db | Parameters<Parameters<Db['transaction']>[0]>[0]

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
  mods: ModEntry[]
  downloads: DownloadEntry[]
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
async function clearCurrentFlag(
  exec: Executor,
  exceptSlug?: string,
): Promise<void> {
  const where = exceptSlug
    ? and(eq(serversTable.current, true), ne(serversTable.slug, exceptSlug))
    : eq(serversTable.current, true)
  await exec.update(serversTable).set({ current: false }).where(where)
}

/**
 * Replace a server's mods and downloads with the submitted set. The catalog is
 * small and edited rarely, so a delete-then-insert (mirroring the seed) keeps
 * the write path simple and avoids diffing child rows.
 */
async function replaceChildren(
  exec: Executor,
  serverId: number,
  input: ServerInput,
): Promise<void> {
  await exec.delete(serverModsTable).where(eq(serverModsTable.serverId, serverId))
  await exec
    .delete(serverDownloadsTable)
    .where(eq(serverDownloadsTable.serverId, serverId))

  if (input.mods.length) {
    await exec.insert(serverModsTable).values(
      input.mods.map((m) => ({
        serverId,
        name: m.name,
        url: m.url ?? null,
        required: m.required,
        note: m.note ?? null,
      })),
    )
  }
  if (input.downloads.length) {
    await exec.insert(serverDownloadsTable).values(
      input.downloads.map((d) => ({
        serverId,
        label: d.label,
        file: d.file ?? null,
        url: d.url ?? null,
        description: d.description ?? null,
      })),
    )
  }
}

export async function createServer(input: ServerInput): Promise<void> {
  const db = getDb()
  await db.transaction(async (tx) => {
    if (input.current) await clearCurrentFlag(tx)
    const [row] = await tx
      .insert(serversTable)
      .values(toRow(input))
      .returning({ id: serversTable.id })
    await replaceChildren(tx, row.id, input)
  })
}

export async function updateServer(
  originalSlug: string,
  input: ServerInput,
): Promise<void> {
  const db = getDb()
  await db.transaction(async (tx) => {
    if (input.current) await clearCurrentFlag(tx, originalSlug)
    const [row] = await tx
      .update(serversTable)
      .set({ ...toRow(input), updatedAt: new Date() })
      .where(eq(serversTable.slug, originalSlug))
      .returning({ id: serversTable.id })
    if (!row) return // slug not found — nothing to update
    await replaceChildren(tx, row.id, input)
  })
}

export async function deleteServer(slug: string): Promise<void> {
  const db = getDb()
  await db.delete(serversTable).where(eq(serversTable.slug, slug))
}
