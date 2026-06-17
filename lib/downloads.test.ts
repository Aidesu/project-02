import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { downloadFilePath } from './downloads'
import type { Server } from './types'

const server: Server = {
  slug: 'smp',
  name: 'SMP',
  gameId: 'minecraft',
  summary: 'test',
  startedAt: '2026-01-01',
  downloads: [{ label: 'World', file: 'world.zip' }],
}

describe('downloadFilePath', () => {
  const previous = process.env.DOWNLOADS_DIR

  beforeEach(() => {
    process.env.DOWNLOADS_DIR = '/srv/games'
  })
  afterEach(() => {
    if (previous === undefined) delete process.env.DOWNLOADS_DIR
    else process.env.DOWNLOADS_DIR = previous
  })

  it('resolves a declared file under the server folder', () => {
    expect(downloadFilePath(server, 'world.zip')).toBe('/srv/games/smp/world.zip')
  })

  it('rejects files that are not declared on the server', () => {
    expect(downloadFilePath(server, 'secret.zip')).toBeNull()
  })

  it('strips path traversal via basename', () => {
    // basename('../../etc/passwd') === 'passwd' → not declared → null
    expect(downloadFilePath(server, '../../etc/passwd')).toBeNull()
    // even a traversal that resolves to a declared name stays inside the folder
    expect(downloadFilePath(server, '../world.zip')).toBe('/srv/games/smp/world.zip')
  })

  it('returns null when DOWNLOADS_DIR is not configured', () => {
    delete process.env.DOWNLOADS_DIR
    expect(downloadFilePath(server, 'world.zip')).toBeNull()
  })
})
