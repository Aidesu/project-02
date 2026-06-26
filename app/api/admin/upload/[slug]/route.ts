import { createWriteStream } from 'node:fs'
import { mkdir, readdir, stat, unlink } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { ReadableStream as NodeReadableStream } from 'node:stream/web'
import { isAuthenticated } from '@/lib/auth'
import { enforceRateLimit } from '@/lib/rate-limit'
import { uploadDir } from '@/lib/downloads'
import {
  isAllowedUpload,
  maxUploadBytes,
  sanitizeUploadName,
  uniqueName,
} from '@/lib/upload'

// Admin file upload. Streams the raw request body straight to disk (the file is
// sent as the whole body, name in `?name=`), so large worlds/modpacks never get
// buffered in memory. Writes only under UPLOADS_DIR/<slug>/ — never the
// read-only DOWNLOADS_DIR tree. Node runtime (uses fs).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SLUG_RE = /^[a-z0-9-]+$/

function err(status: number, error: string): Response {
  return Response.json(
    { error },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )
}

/** Shared guard: auth, rate limit, slug, configured storage. */
async function guard(
  req: Request,
  slug: string,
): Promise<{ dir: string } | Response> {
  if (!(await isAuthenticated())) return err(401, 'Non authentifié.')

  const limited = enforceRateLimit(req, {
    name: 'upload',
    limit: 30,
    windowMs: 60_000,
  })
  if (limited) return limited

  if (!SLUG_RE.test(slug)) return err(400, 'Slug invalide.')

  const dir = uploadDir(slug)
  if (!dir) {
    return err(503, 'Stockage des uploads non configuré (UPLOADS_DIR absent).')
  }
  return { dir }
}

function pickName(req: Request): string | Response {
  const raw = new URL(req.url).searchParams.get('name') ?? ''
  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return err(400, 'Nom de fichier invalide.')
  }
  const safe = sanitizeUploadName(decoded)
  if (!safe) return err(400, 'Nom de fichier invalide.')
  if (!isAllowedUpload(safe)) {
    return err(415, 'Type de fichier non autorisé (archives et mods uniquement).')
  }
  return safe
}

export async function POST(
  req: Request,
  ctx: RouteContext<'/api/admin/upload/[slug]'>,
) {
  const { slug } = await ctx.params
  const guarded = await guard(req, slug)
  if (guarded instanceof Response) return guarded
  const { dir } = guarded

  const picked = pickName(req)
  if (picked instanceof Response) return picked
  if (!req.body) return err(400, 'Corps de requête vide.')

  const max = maxUploadBytes()
  const declared = Number(req.headers.get('content-length') ?? '')
  if (Number.isFinite(declared) && declared > max) {
    return err(413, `Fichier trop volumineux (max ${formatMax(max)}).`)
  }

  await mkdir(dir, { recursive: true })
  const existing = await readdir(dir).catch(() => [] as string[])
  const name = uniqueName(picked, existing)
  const target = join(dir, name)

  // Count bytes as they flow and abort past the cap, so a lying/absent
  // Content-Length can't blow past the limit.
  let received = 0
  const limiter = new Transform({
    transform(chunk, _enc, cb) {
      received += chunk.length
      if (received > max) {
        cb(new Error('TOO_LARGE'))
        return
      }
      cb(null, chunk)
    },
  })

  const source = Readable.fromWeb(req.body as unknown as NodeReadableStream)
  try {
    await pipeline(source, limiter, createWriteStream(target))
  } catch (e) {
    await unlink(target).catch(() => {})
    if (e instanceof Error && e.message === 'TOO_LARGE') {
      return err(413, `Fichier trop volumineux (max ${formatMax(max)}).`)
    }
    return err(500, "Échec de l'écriture du fichier.")
  }

  const size = (await stat(target)).size
  return Response.json(
    { file: name, size },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function DELETE(
  req: Request,
  ctx: RouteContext<'/api/admin/upload/[slug]'>,
) {
  const { slug } = await ctx.params
  const guarded = await guard(req, slug)
  if (guarded instanceof Response) return guarded
  const { dir } = guarded

  const raw = new URL(req.url).searchParams.get('name') ?? ''
  let safe: string | null
  try {
    safe = sanitizeUploadName(decodeURIComponent(raw))
  } catch {
    safe = null
  }
  if (!safe) return err(400, 'Nom de fichier invalide.')

  // basename again as belt-and-suspenders; only ever touches UPLOADS_DIR.
  await unlink(join(dir, basename(safe))).catch(() => {})
  return Response.json(
    { ok: true },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

function formatMax(bytes: number): string {
  const gib = bytes / 1024 ** 3
  if (gib >= 1) return `${Number(gib.toFixed(1))} Gio`
  return `${Math.round(bytes / 1024 ** 2)} Mio`
}
