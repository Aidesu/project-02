import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Lazy, process-wide Postgres connection. The pool is stashed on globalThis so
// Next's dev hot-reload doesn't leak a new pool on every change.

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

const globalForDb = globalThis as unknown as {
  __dsPool?: Pool
  __dsDb?: DrizzleDb
}

/** True when a database is configured (DATABASE_URL present). */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

/** Drizzle client. Throws if DATABASE_URL is unset — guard with hasDatabase(). */
export function getDb(): DrizzleDb {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  globalForDb.__dsPool ??= new Pool({ connectionString: url })
  globalForDb.__dsDb ??= drizzle(globalForDb.__dsPool, { schema })
  return globalForDb.__dsDb
}
