import 'server-only'
import { GameDig } from 'gamedig'
import { getGame } from './games'
import type { LiveStatus, Server } from './types'

// Queries the live status of a game server using GameDig.
// Never throws: an unreachable server resolves to `{ online: false }`.
export async function queryServer(server: Server): Promise<LiveStatus> {
  const checkedAt = new Date().toISOString()
  const empty = { current: 0, max: 0, list: [] as string[] }

  if (!server.query?.host) {
    return { online: false, players: empty, error: 'Aucune adresse de requête configurée', checkedAt }
  }

  const game = getGame(server.gameId)
  if (!game.gamedigType) {
    return { online: false, players: empty, error: `Jeu inconnu : ${server.gameId}`, checkedAt }
  }

  try {
    const state = await GameDig.query({
      type: game.gamedigType,
      host: server.query.host,
      port: server.query.port,
      socketTimeout: 2500,
      attemptTimeout: 5000,
      maxRetries: 1,
    })

    return {
      online: true,
      name: state.name || undefined,
      map: state.map || undefined,
      version: state.version || undefined,
      players: {
        current: state.numplayers ?? state.players?.length ?? 0,
        max: state.maxplayers ?? 0,
        list: (state.players ?? [])
          .map((p) => p.name)
          .filter((n): n is string => Boolean(n))
          .slice(0, 50),
      },
      ping: typeof state.ping === 'number' ? Math.round(state.ping) : undefined,
      checkedAt,
    }
  } catch (error) {
    return {
      online: false,
      players: empty,
      error: error instanceof Error ? error.message : 'Serveur injoignable',
      checkedAt,
    }
  }
}
