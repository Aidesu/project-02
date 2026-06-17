// Runs once when a Next.js server instance starts. We use it to launch the
// background status poller — but only in the Node.js runtime (it uses sockets,
// the DB and timers, none of which belong in the Edge runtime).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startPoller } = await import('./lib/poller')
    startPoller()
  }
}
