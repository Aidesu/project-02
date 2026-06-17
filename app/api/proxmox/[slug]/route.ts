import { getServer } from '@/lib/servers'
import { getLiveProxmox } from '@/lib/live'
import { enforceRateLimit } from '@/lib/rate-limit'

// CPU/RAM stats for one server's VM/container. Request-time, but upstream calls
// are deduplicated/cached in lib/live.ts.
export const dynamic = 'force-dynamic'

export async function GET(req: Request, ctx: RouteContext<'/api/proxmox/[slug]'>) {
  const limited = enforceRateLimit(req, { name: 'proxmox', limit: 120, windowMs: 60_000 })
  if (limited) return limited

  const { slug } = await ctx.params
  const server = await getServer(slug)
  if (!server) {
    return Response.json({ error: 'Serveur introuvable' }, { status: 404 })
  }

  const stats = await getLiveProxmox(server)
  return Response.json(stats, { headers: { 'Cache-Control': 'no-store' } })
}
