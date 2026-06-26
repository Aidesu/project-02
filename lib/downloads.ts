import 'server-only'
import { existsSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import type { Server } from './types'

/**
 * Writable, app-owned root for admin-uploaded files (UPLOADS_DIR/<slug>/<file>).
 * Kept separate from DOWNLOADS_DIR so the web app never needs write access to
 * the live game-server tree — least privilege.
 */
export function uploadsRoot(): string | undefined {
  return process.env.UPLOADS_DIR
}

/**
 * Read-only root for files placed out-of-band (DOWNLOADS_DIR/<slug>/<file>),
 * e.g. exports dropped next to the game servers. Legacy/optional now that
 * uploads exist, but still served if present.
 */
export function downloadsRoot(): string | undefined {
  return process.env.DOWNLOADS_DIR
}

/** Configured roots, uploads first so an uploaded file shadows a manual one. */
function roots(): string[] {
  return [uploadsRoot(), downloadsRoot()].filter(
    (r): r is string => Boolean(r),
  )
}

/** True if `file` (matched by basename) is a declared local download. */
export function isDeclaredFile(server: Server, file: string): boolean {
  const wanted = basename(file)
  return Boolean(
    server.downloads?.some((d) => d.file && basename(d.file) === wanted),
  )
}

/**
 * Absolute path of a declared download, resolved across the configured roots.
 * Returns the first root where the file actually exists on disk, or null when
 * it isn't declared / no root is configured / it's missing everywhere. Using
 * `basename` strips path segments, so requests can't escape the slug folder.
 *
 * Existence-aware so the serve route and the UI agree on what's downloadable
 * (a declared-but-missing file shows as unavailable instead of 404-ing).
 */
export function downloadFilePath(server: Server, file: string): string | null {
  if (!isDeclaredFile(server, file)) return null

  const wanted = basename(file)
  for (const root of roots()) {
    const path = join(root, server.slug, wanted)
    if (existsSync(path)) return path
  }
  return null
}

/**
 * Absolute target directory for writing a server's uploads
 * (UPLOADS_DIR/<slug>). Null when no writable root is configured.
 */
export function uploadDir(slug: string): string | null {
  const root = uploadsRoot()
  return root ? join(root, slug) : null
}

/** Size in bytes if the file exists on disk, else undefined. */
export function fileSize(path: string): number | undefined {
  try {
    return statSync(path).size
  } catch {
    return undefined
  }
}
