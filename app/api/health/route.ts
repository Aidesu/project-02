import { connection } from 'next/server'

// Lightweight liveness probe for monitoring / uptime checks. Reports per-request
// uptime/timestamp, so opt out of prerendering with connection().
export async function GET() {
  await connection()
  return Response.json(
    {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
