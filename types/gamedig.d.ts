// Minimal type declarations for gamedig v5 (the package ships no types).
declare module 'gamedig' {
  export interface QueryOptions {
    type: string
    host: string
    address?: string
    port?: number
    maxRetries?: number
    socketTimeout?: number
    attemptTimeout?: number
    givenPortOnly?: boolean
    requestRules?: boolean
    requestPlayers?: boolean
    stripColors?: boolean
    [key: string]: unknown
  }

  export interface Player {
    name: string
    raw?: Record<string, unknown>
  }

  export interface QueryResult {
    name: string
    map: string
    password: boolean
    numplayers: number
    maxplayers: number
    players: Player[]
    bots: Player[]
    connect: string
    ping: number
    queryPort: number
    version: string
    raw?: Record<string, unknown>
  }

  export const GameDig: {
    query(options: QueryOptions): Promise<QueryResult>
  }
}
