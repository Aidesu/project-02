// Pure helpers for the admin file-upload route. Kept framework-free (no fs, no
// 'server-only') so they unit-test cleanly. The fs-bound bits (streaming to
// disk, collision suffixing) live in the route handler.

/** Archive/mod/map formats we accept. A `.tar.gz` matches on `.gz`. */
export const ALLOWED_UPLOAD_EXTENSIONS = [
  '.zip',
  '.jar',
  '.tar',
  '.gz',
  '.tgz',
  '.7z',
  '.rar',
  '.mrpack',
] as const

/** Default upload ceiling when MAX_UPLOAD_BYTES is unset: 2 GiB. */
const DEFAULT_MAX_UPLOAD_BYTES = 2 * 1024 ** 3

/** Configured maximum upload size in bytes (falls back to the 2 GiB default). */
export function maxUploadBytes(): number {
  const raw = process.env.MAX_UPLOAD_BYTES
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_MAX_UPLOAD_BYTES
}

export function isAllowedUpload(name: string): boolean {
  const lower = name.toLowerCase()
  return ALLOWED_UPLOAD_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/**
 * Reduce a client-supplied filename to a safe basename: strips any directory
 * components (incl. Windows separators), removes leading dots (no hidden /
 * traversal names), and replaces anything outside a conservative allowlist with
 * `_`. Returns null if nothing usable remains. The caller still resolves the
 * final path under the server's own folder, so this is defense in depth.
 */
export function sanitizeUploadName(raw: string): string | null {
  const base = raw.replace(/\\/g, '/').split('/').pop() ?? ''
  const cleaned = base
    .trim()
    .replace(/^\.+/, '')
    .replace(/[^\p{L}\p{N}._ ()-]/gu, '_')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || null
}

/**
 * Build a non-colliding name from `name` given the names already present in the
 * target folder, inserting ` (n)` before the extension: `world.zip` →
 * `world (1).zip`. Pure so the route can pass it a directory listing.
 */
export function uniqueName(name: string, existing: Iterable<string>): string {
  const taken = new Set(existing)
  if (!taken.has(name)) return name

  const dot = name.lastIndexOf('.')
  const stem = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  for (let i = 1; ; i++) {
    const candidate = `${stem} (${i})${ext}`
    if (!taken.has(candidate)) return candidate
  }
}
