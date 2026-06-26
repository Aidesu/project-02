import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { downloadFilePath, isDeclaredFile, uploadDir } from './downloads'
import type { Server } from './types'

const server: Server = {
  slug: 'smp',
  name: 'SMP',
  gameId: 'minecraft',
  summary: 'test',
  startedAt: '2026-01-01',
  downloads: [{ label: 'World', file: 'world.zip' }],
}

// Snapshot/restore the roots around every test so they don't leak.
const ENV = ['UPLOADS_DIR', 'DOWNLOADS_DIR'] as const
let saved: Record<string, string | undefined>

beforeEach(() => {
  saved = {}
  for (const k of ENV) saved[k] = process.env[k]
})
afterEach(() => {
  for (const k of ENV) {
    const v = saved[k]
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
})

describe('isDeclaredFile', () => {
  it('matches a declared file', () => {
    expect(isDeclaredFile(server, 'world.zip')).toBe(true)
  })
  it('rejects an undeclared file', () => {
    expect(isDeclaredFile(server, 'secret.zip')).toBe(false)
  })
  it('matches by basename so traversal is stripped', () => {
    expect(isDeclaredFile(server, '../world.zip')).toBe(true)
    expect(isDeclaredFile(server, '../../etc/passwd')).toBe(false)
  })
})

describe('downloadFilePath', () => {
  let uploads: string
  let downloads: string

  beforeEach(() => {
    uploads = mkdtempSync(join(tmpdir(), 'up-'))
    downloads = mkdtempSync(join(tmpdir(), 'dl-'))
    process.env.UPLOADS_DIR = uploads
    process.env.DOWNLOADS_DIR = downloads
    mkdirSync(join(uploads, 'smp'), { recursive: true })
    mkdirSync(join(downloads, 'smp'), { recursive: true })
  })
  afterEach(() => {
    rmSync(uploads, { recursive: true, force: true })
    rmSync(downloads, { recursive: true, force: true })
  })

  it('resolves a declared file present in the uploads root', () => {
    writeFileSync(join(uploads, 'smp', 'world.zip'), 'x')
    expect(downloadFilePath(server, 'world.zip')).toBe(
      join(uploads, 'smp', 'world.zip'),
    )
  })

  it('falls back to the downloads root', () => {
    writeFileSync(join(downloads, 'smp', 'world.zip'), 'x')
    expect(downloadFilePath(server, 'world.zip')).toBe(
      join(downloads, 'smp', 'world.zip'),
    )
  })

  it('prefers the uploads root when both have the file', () => {
    writeFileSync(join(uploads, 'smp', 'world.zip'), 'x')
    writeFileSync(join(downloads, 'smp', 'world.zip'), 'x')
    expect(downloadFilePath(server, 'world.zip')).toBe(
      join(uploads, 'smp', 'world.zip'),
    )
  })

  it('returns null when declared but missing on disk', () => {
    expect(downloadFilePath(server, 'world.zip')).toBeNull()
  })

  it('returns null for an undeclared file even if present', () => {
    writeFileSync(join(uploads, 'smp', 'secret.zip'), 'x')
    expect(downloadFilePath(server, 'secret.zip')).toBeNull()
  })

  it('strips path traversal via basename', () => {
    writeFileSync(join(uploads, 'smp', 'world.zip'), 'x')
    expect(downloadFilePath(server, '../world.zip')).toBe(
      join(uploads, 'smp', 'world.zip'),
    )
  })

  it('returns null when no root is configured', () => {
    delete process.env.UPLOADS_DIR
    delete process.env.DOWNLOADS_DIR
    expect(downloadFilePath(server, 'world.zip')).toBeNull()
  })
})

describe('uploadDir', () => {
  it('joins UPLOADS_DIR and the slug', () => {
    process.env.UPLOADS_DIR = '/srv/uploads'
    expect(uploadDir('smp')).toBe('/srv/uploads/smp')
  })
  it('is null without UPLOADS_DIR', () => {
    delete process.env.UPLOADS_DIR
    expect(uploadDir('smp')).toBeNull()
  })
})
