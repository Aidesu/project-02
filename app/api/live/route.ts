import { getActiveLive } from '@/lib/live'
import { enforceRateLimit } from '@/lib/rate-limit'

// Aggregated live data for all active servers in a single request. The client
// polls this one endpoint instead of N×2 per-server requests. Upstream queries
// are deduplicated/cached in lib/live.ts.
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const limited = enforceRateLimit(req, { name: 'live', limit: 120, windowMs: 60_000 })
  if (limited) return limited

  const data = await getActiveLive()
  return Response.json(data, { headers: { 'Cache-Control': 'no-store' } })
}
