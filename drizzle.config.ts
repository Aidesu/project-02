import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit runs outside Next, so load env files ourselves (.env.local wins).
config({ path: '.env.local' })
config()

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
