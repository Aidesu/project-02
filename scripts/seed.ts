import { seedDatabase } from '../lib/db/seed'

// CLI for a full reseed (wipes the tables, then re-inserts the static catalog
// from data/servers.ts). Run with `npm run db:seed`.
//
// Kept separate from lib/db/seed.ts so that module stays side-effect free and
// can be imported/bundled (scripts/db-init.ts) without triggering a reseed.
seedDatabase()
  .then((count) => {
    console.log(`✓ Seed terminé : ${count} serveurs insérés.`)
    process.exit(0)
  })
  .catch((err) => {
    console.error('Seed échoué :', err)
    process.exit(1)
  })
