import 'server-only'
import { statSync } from 'node:fs'
import { basename, join } from 'node:path'
import type { Server } from './types'

/** Root directory holding downloadable files (DOWNLOADS_DIR/<slug>/<file>). */
export function downloadsRoot(): string | undefined {
  return process.env.DOWNLOADS_DIR
}

/**
 * Resolve a requested download to an absolute path — but only if the file is
 * explicitly declared on the given server. Using `basename` strips any path
 * segments, so requests can never escape the server's own download folder.
 */
export function downloadFilePath(server: Server, file: string): string | null {
  const root = downloadsRoot()
  if (!root) return null

  const wanted = basename(file)
  const declared = server.downloads?.some(
    (d) => d.file && basename(d.file) === wanted,
  )
  if (!declared) return null

  return join(root, server.slug, wanted)
}

/** Size in bytes if the file exists on disk, else undefined. */
export function fileSize(path: string): number | undefined {
  try {
    return statSync(path).size
  } catch {
    return undefined
  }
}
