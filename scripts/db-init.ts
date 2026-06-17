import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { getDb, hasDatabase } from '../lib/db/client'
import { servers } from '../lib/db/schema'
import { seedDatabase } from '../lib/db/seed'

// One-shot database bootstrap, run by the compose `migrate` service before the
// app starts (and usable locally via `npm run db:init`):
//   1. apply any pending Drizzle migrations (idempotent — tracked in __drizzle_migrations)
//   2. seed from the static catalog ONLY when the servers table is empty, so
//      restarts/redeploys never clobber data edited through /admin.

async function main(): Promise<void> {
  if (!hasDatabase()) {
    throw new Error('DATABASE_URL is not set — cannot initialise the database.')
  }

  const db = getDb()

  console.log('[db-init] applying migrations…')
  await migrate(db, { migrationsFolder: './lib/db/migrations' })
  console.log('[db-init] migrations up to date.')

  const [existing] = await db.select({ id: servers.id }).from(servers).limit(1)
  if (existing) {
    console.log('[db-init] servers already present — skipping seed.')
  } else {
    console.log('[db-init] empty database — seeding from static catalog…')
    const count = await seedDatabase()
    console.log(`[db-init] seeded ${count} servers.`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[db-init] failed:', err)
    process.exit(1)
  })
