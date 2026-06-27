import { hasDatabase } from '@/lib/db/client'
import { getRecentSnapshots, getUptime } from '@/lib/db/snapshots'
import { enforceRateLimit } from '@/lib/rate-limit'

// Uptime + recent player-count history for one server, from status_snapshots.
// Reads params/headers → always request-time (no prerender).
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export async function GET(req: Request, ctx: RouteContext<'/api/history/[slug]'>) {
  const limited = enforceRateLimit(req, { name: 'history', limit: 120, windowMs: 60_000 })
  if (limited) return limited

  const { slug } = await ctx.params

  if (!hasDatabase()) {
    return Response.json(
      { available: false, uptime: null, samples: 0, snapshots: [] },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const [uptime, snapshots] = await Promise.all([
    getUptime(slug, WEEK_MS),
    getRecentSnapshots(slug, 60),
  ])

  return Response.json(
    {
      available: true,
      uptime: uptime.ratio,
      samples: uptime.samples,
      snapshots,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
