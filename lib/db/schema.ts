import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

// ─────────────────────────────────────────────────────────────────────────
//  Drizzle schema for the server catalog. Mirrors the `Server` domain type
//  in lib/types.ts. `mods` and `downloads` are normalized child tables;
//  `tags` and `images` stay as simple jsonb string arrays (value objects).
// ─────────────────────────────────────────────────────────────────────────

export const servers = pgTable('servers', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  gameId: text('game_id').notNull(),
  summary: text('summary').notNull(),
  description: text('description'),

  // Live-status query target (GameDig).
  queryHost: text('query_host'),
  queryPort: integer('query_port'),
  // Address shown to players (display only).
  connect: text('connect'),

  // Proxmox VM/container reference (CPU/RAM stats).
  proxmoxNode: text('proxmox_node'),
  proxmoxVmid: integer('proxmox_vmid'),
  proxmoxType: text('proxmox_type'), // 'lxc' | 'qemu'

  startedAt: date('started_at').notNull(),
  endedAt: date('ended_at'),
  archived: boolean('archived').notNull().default(false),
  current: boolean('current').notNull().default(false),

  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  images: jsonb('images').$type<string[]>().notNull().default([]),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const serverMods = pgTable('server_mods', {
  id: serial('id').primaryKey(),
  serverId: integer('server_id')
    .notNull()
    .references(() => servers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url'),
  required: boolean('required').notNull().default(false),
  note: text('note'),
})

export const serverDownloads = pgTable('server_downloads', {
  id: serial('id').primaryKey(),
  serverId: integer('server_id')
    .notNull()
    .references(() => servers.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  file: text('file'),
  url: text('url'),
  description: text('description'),
})

// Time-series of live status, written by the background poller (lib/poller.ts).
// Keyed by `slug` (not a FK) so metrics survive catalog reseeds, which change
// the servers' surrogate ids. Append-only; pruned by retention.
export const statusSnapshots = pgTable(
  'status_snapshots',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull(),
    online: boolean('online').notNull(),
    playersCurrent: integer('players_current'),
    playersMax: integer('players_max'),
    ping: integer('ping'),
    checkedAt: timestamp('checked_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('status_snapshots_slug_checked_idx').on(t.slug, t.checkedAt)],
)

export const serversRelations = relations(servers, ({ many }) => ({
  mods: many(serverMods),
  downloads: many(serverDownloads),
}))

export const serverModsRelations = relations(serverMods, ({ one }) => ({
  server: one(servers, {
    fields: [serverMods.serverId],
    references: [servers.id],
  }),
}))

export const serverDownloadsRelations = relations(serverDownloads, ({ one }) => ({
  server: one(servers, {
    fields: [serverDownloads.serverId],
    references: [servers.id],
  }),
}))
