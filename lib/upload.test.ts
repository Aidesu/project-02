import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  isAllowedUpload,
  maxUploadBytes,
  sanitizeUploadName,
  uniqueName,
} from './upload'

describe('sanitizeUploadName', () => {
  it('keeps a normal filename', () => {
    expect(sanitizeUploadName('world.zip')).toBe('world.zip')
  })
  it('strips directory components and traversal', () => {
    expect(sanitizeUploadName('../../etc/world.zip')).toBe('world.zip')
    expect(sanitizeUploadName('C:\\maps\\skyblock.zip')).toBe('skyblock.zip')
  })
  it('drops leading dots (no hidden names)', () => {
    expect(sanitizeUploadName('...world.zip')).toBe('world.zip')
  })
  it('replaces unsafe characters with underscore', () => {
    expect(sanitizeUploadName('my*world?.zip')).toBe('my_world_.zip')
  })
  it('collapses whitespace', () => {
    expect(sanitizeUploadName('  my   world.zip ')).toBe('my world.zip')
  })
  it('returns null when nothing usable remains', () => {
    expect(sanitizeUploadName('...')).toBeNull()
    expect(sanitizeUploadName('/')).toBeNull()
  })
})

describe('isAllowedUpload', () => {
  it('accepts archive and mod formats', () => {
    for (const n of ['a.zip', 'b.jar', 'c.tar', 'd.tar.gz', 'e.7z', 'f.mrpack']) {
      expect(isAllowedUpload(n)).toBe(true)
    }
  })
  it('is case-insensitive', () => {
    expect(isAllowedUpload('WORLD.ZIP')).toBe(true)
  })
  it('rejects everything else', () => {
    for (const n of ['x.exe', 'y.sh', 'z.txt', 'noext']) {
      expect(isAllowedUpload(n)).toBe(false)
    }
  })
})

describe('uniqueName', () => {
  it('returns the name when free', () => {
    expect(uniqueName('world.zip', [])).toBe('world.zip')
  })
  it('suffixes on collision, before the extension', () => {
    expect(uniqueName('world.zip', ['world.zip'])).toBe('world (1).zip')
  })
  it('skips taken suffixes', () => {
    expect(uniqueName('world.zip', ['world.zip', 'world (1).zip'])).toBe(
      'world (2).zip',
    )
  })
  it('handles names without an extension', () => {
    expect(uniqueName('README', ['README'])).toBe('README (1)')
  })
})

describe('maxUploadBytes', () => {
  const prev = process.env.MAX_UPLOAD_BYTES
  beforeEach(() => delete process.env.MAX_UPLOAD_BYTES)
  afterEach(() => {
    if (prev === undefined) delete process.env.MAX_UPLOAD_BYTES
    else process.env.MAX_UPLOAD_BYTES = prev
  })

  it('defaults to 2 GiB', () => {
    expect(maxUploadBytes()).toBe(2 * 1024 ** 3)
  })
  it('reads a valid override', () => {
    process.env.MAX_UPLOAD_BYTES = '1048576'
    expect(maxUploadBytes()).toBe(1048576)
  })
  it('ignores junk and falls back to the default', () => {
    process.env.MAX_UPLOAD_BYTES = 'lots'
    expect(maxUploadBytes()).toBe(2 * 1024 ** 3)
  })
})
