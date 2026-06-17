// Domain model for the game-server catalog.
// Everything here is plain, serializable data so it can be passed
// straight from Server Components to Client Components as props.

/** Display + query metadata for a supported game. See `lib/games.ts`. */
export interface GameInfo {
  id: string
  label: string
  /** Game id understood by GameDig (`GameDig.query({ type })`). */
  gamedigType: string
  emoji: string
  /** Accent color (hex) used for banners and badges. */
  accent: string
  /**
   * Background art shown behind this game's servers (banners, hero, showcase).
   * Path from `/`, served from `public/games/<id>.jpg`. Falls back to an
   * accent-tinted gradient when absent.
   */
  background?: string
}

/** A third-party mod / modpack a player may need to install. */
export interface ModEntry {
  name: string
  url?: string
  /** Required to join, or just optional/cosmetic. */
  required: boolean
  note?: string
}

/** A downloadable asset (world save, modpack, config...). */
export interface DownloadEntry {
  label: string
  /** Filename inside `DOWNLOADS_DIR/<slug>/`. Served by /api/download. */
  file?: string
  /** External link (Drive, Mega, own file host) used instead of `file`. */
  url?: string
  description?: string
}

/** Where the server lives in Proxmox, to read CPU/RAM via the API. */
export interface ProxmoxRef {
  node: string
  vmid: number
  type: 'lxc' | 'qemu'
}

/** Host/port used to query the live game status with GameDig. */
export interface QueryTarget {
  host: string
  /** Query/game port. Omit to let GameDig use the game default. */
  port?: number
}

/** A single game server entry. This is what you edit in `data/servers.ts`. */
export interface Server {
  slug: string
  name: string
  /** Key into the games registry (`lib/games.ts`). */
  gameId: string
  /** One-line teaser shown on cards. */
  summary: string
  /** Longer description (markdown-free plain text / paragraphs). */
  description?: string
  /** Live status query target. Omit if the server can't be queried. */
  query?: QueryTarget
  /** Address players type in to join (display only). */
  connect?: string
  /** Proxmox VM/container reference for CPU/RAM stats. */
  proxmox?: ProxmoxRef
  /** Local images under `public/servers/<slug>/...` (path from `/`). */
  images?: string[]
  /** ISO date the server went live. */
  startedAt: string
  /** ISO date the server was retired (sets it into the history). */
  endedAt?: string
  /** When true the server lives in the history/archive section. */
  archived?: boolean
  /** When true this is the featured server shown in the home banner. */
  current?: boolean
  mods?: ModEntry[]
  downloads?: DownloadEntry[]
  tags?: string[]
}

/** Live game status returned by GameDig, normalized for the UI. */
export interface LiveStatus {
  online: boolean
  name?: string
  map?: string
  version?: string
  players: {
    current: number
    max: number
    list: string[]
  }
  /** Round-trip latency in ms. */
  ping?: number
  error?: string
  /** ISO timestamp of when the check ran. */
  checkedAt: string
}

/** CPU/RAM stats pulled from the Proxmox API for one VM/container. */
export interface ProxmoxStats {
  available: boolean
  status?: 'running' | 'stopped' | string
  /** CPU usage as a fraction 0..1. */
  cpu?: number
  /** Number of allocated cores. */
  cpus?: number
  /** Used memory in bytes. */
  mem?: number
  /** Allocated memory in bytes. */
  maxmem?: number
  /** Uptime in seconds. */
  uptime?: number
  error?: string
}
