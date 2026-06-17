import { servers as staticServers } from '../../data/servers'
import { getDb } from './client'
import { serverDownloads, serverMods, servers } from './schema'

// Seeds the database from the static catalog in data/servers.ts.
// Clears the tables first, then re-inserts (full reseed).
//
// Side-effect free on import: the CLI wrapper lives in scripts/seed.ts so this
// can be imported (and bundled — see scripts/db-init.ts) without triggering a
// reseed. `npm run db:seed` runs the wrapper.
export async function seedDatabase(): Promise<number> {
  const db = getDb()

  // Children first isn't required (FK cascade), but be explicit.
  await db.delete(serverDownloads)
  await db.delete(serverMods)
  await db.delete(servers)

  for (const s of staticServers) {
    const [inserted] = await db
      .insert(servers)
      .values({
        slug: s.slug,
        name: s.name,
        gameId: s.gameId,
        summary: s.summary,
        description: s.description,
        queryHost: s.query?.host,
        queryPort: s.query?.port,
        connect: s.connect,
        proxmoxNode: s.proxmox?.node,
        proxmoxVmid: s.proxmox?.vmid,
        proxmoxType: s.proxmox?.type,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        archived: s.archived ?? false,
        current: s.current ?? false,
        tags: s.tags ?? [],
        images: s.images ?? [],
      })
      .returning({ id: servers.id })

    if (s.mods?.length) {
      await db.insert(serverMods).values(
        s.mods.map((m) => ({
          serverId: inserted.id,
          name: m.name,
          url: m.url,
          required: m.required,
          note: m.note,
        })),
      )
    }

    if (s.downloads?.length) {
      await db.insert(serverDownloads).values(
        s.downloads.map((d) => ({
          serverId: inserted.id,
          label: d.label,
          file: d.file,
          url: d.url,
          description: d.description,
        })),
      )
    }
  }

  return staticServers.length
}
