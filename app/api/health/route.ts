// Lightweight liveness probe for monitoring / uptime checks.
export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json(
    {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
