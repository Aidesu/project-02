import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      // `server-only` throws when imported outside the RSC bundler — stub it.
      { find: 'server-only', replacement: fileURLToPath(new URL('./test/empty.ts', import.meta.url)) },
      // Mirror the tsconfig `@/*` path alias.
      { find: /^@\//, replacement: root },
    ],
  },
  test: {
    environment: 'node',
    include: ['{lib,app}/**/*.test.ts', 'test/**/*.test.ts'],
  },
})
