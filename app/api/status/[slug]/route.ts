import { getServer } from '@/lib/servers'
import { getLiveStatus } from '@/lib/live'
import { enforceRateLimit } from '@/lib/rate-limit'

// Live game status for one server. Reads params/headers → always request-time.
// Upstream queries are deduplicated/cached in lib/live.ts so concurrent pollers
// share one query.
export async function GET(req: Request, ctx: RouteContext<'/api/status/[slug]'>) {
  const limited = enforceRateLimit(req, { name: 'status', limit: 120, windowMs: 60_000 })
  if (limited) return limited

  const { slug } = await ctx.params
  const server = await getServer(slug)
  if (!server) {
    return Response.json({ error: 'Serveur introuvable' }, { status: 404 })
  }

  const status = await getLiveStatus(server)
  return Response.json(status, { headers: { 'Cache-Control': 'no-store' } })
}
