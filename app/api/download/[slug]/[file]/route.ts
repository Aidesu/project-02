import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { Readable } from 'node:stream'
import { getServer } from '@/lib/servers'
import { downloadFilePath } from '@/lib/downloads'
import { enforceRateLimit } from '@/lib/rate-limit'

// Streams a declared download file from disk, with HTTP Range support so
// large worlds can be resumed / partially fetched. Node runtime (uses fs).
export const dynamic = 'force-dynamic'

const CONTENT_TYPES: Record<string, string> = {
  '.zip': 'application/zip',
  '.gz': 'application/gzip',
  '.tgz': 'application/gzip',
  '.tar': 'application/x-tar',
  '.7z': 'application/x-7z-compressed',
  '.rar': 'application/vnd.rar',
  '.jar': 'application/java-archive',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
}

function toWeb(stream: NodeJS.ReadableStream): ReadableStream {
  return Readable.toWeb(stream as Readable) as unknown as ReadableStream
}

export async function GET(req: Request, ctx: RouteContext<'/api/download/[slug]/[file]'>) {
  const limited = enforceRateLimit(req, { name: 'download', limit: 60, windowMs: 60_000 })
  if (limited) return limited

  const { slug, file } = await ctx.params
  const server = await getServer(slug)
  const path = server ? downloadFilePath(server, file) : null
  if (!path) {
    return new Response('Fichier introuvable', { status: 404 })
  }

  let size: number
  try {
    size = (await stat(path)).size
  } catch {
    return new Response('Fichier introuvable', { status: 404 })
  }

  const name = basename(path)
  const type = CONTENT_TYPES[extname(name).toLowerCase()] ?? 'application/octet-stream'
  const disposition =
    `attachment; filename="${name.replace(/["\r\n]/g, '')}"; ` +
    `filename*=UTF-8''${encodeURIComponent(name)}`

  const baseHeaders: Record<string, string> = {
    'Content-Type': type,
    'Content-Disposition': disposition,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
  }

  const range = req.headers.get('range')
  const match = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim())
  if (match) {
    let start = match[1] ? Number.parseInt(match[1], 10) : 0
    let end = match[2] ? Number.parseInt(match[2], 10) : size - 1
    if (Number.isNaN(start)) start = 0
    if (Number.isNaN(end) || end >= size) end = size - 1

    if (start > end || start >= size) {
      return new Response('Range non satisfiable', {
        status: 416,
        headers: { 'Content-Range': `bytes */${size}` },
      })
    }

    return new Response(toWeb(createReadStream(path, { start, end })), {
      status: 206,
      headers: {
        ...baseHeaders,
        'Content-Length': String(end - start + 1),
        'Content-Range': `bytes ${start}-${end}/${size}`,
      },
    })
  }

  return new Response(toWeb(createReadStream(path)), {
    status: 200,
    headers: { ...baseHeaders, 'Content-Length': String(size) },
  })
}
