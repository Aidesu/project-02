import type { GameInfo } from './types'

// Registry of supported games. Add an entry here to support a new game,
// then reference its key as `gameId` on a server. The `gamedigType` must
// match a GameDig game id (see node_modules/gamedig/GAMES_LIST.md).
export const GAMES = {
  minecraft: {
    id: 'minecraft',
    label: 'Minecraft (Java)',
    gamedigType: 'minecraft',
    emoji: '⛏️',
    accent: '#5b9a3e',
    background: '/games/minecraft.jpg',
  },
  'minecraft-bedrock': {
    id: 'minecraft-bedrock',
    label: 'Minecraft (Bedrock)',
    gamedigType: 'mbe',
    emoji: '🟩',
    accent: '#3e8a6e',
    background: '/games/minecraft-bedrock.jpg',
  },
  valheim: {
    id: 'valheim',
    label: 'Valheim',
    gamedigType: 'valheim',
    emoji: '🪓',
    accent: '#3b82c4',
    background: '/games/valheim.jpg',
  },
  ark: {
    id: 'ark',
    label: 'ARK: Survival',
    gamedigType: 'ase',
    emoji: '🦖',
    accent: '#a8552f',
    background: '/games/ark.jpg',
  },
  cs2: {
    id: 'cs2',
    label: 'Counter-Strike 2',
    gamedigType: 'counterstrike2',
    emoji: '🔫',
    accent: '#d99a3e',
    background: '/games/cs2.jpg',
  },
  rust: {
    id: 'rust',
    label: 'Rust',
    gamedigType: 'rust',
    emoji: '🛢️',
    accent: '#b5533a',
    background: '/games/rust.jpg',
  },
  gmod: {
    id: 'gmod',
    label: "Garry's Mod",
    gamedigType: 'garrysmod',
    emoji: '🧰',
    accent: '#4b78b0',
    background: '/games/gmod.jpg',
  },
  terraria: {
    id: 'terraria',
    label: 'Terraria',
    gamedigType: 'terrariatshock',
    emoji: '🌳',
    accent: '#6aa84f',
    background: '/games/terraria.jpg',
  },
  factorio: {
    id: 'factorio',
    label: 'Factorio',
    gamedigType: 'factorio',
    emoji: '⚙️',
    accent: '#c07b2e',
    background: '/games/factorio.jpg',
  },
} satisfies Record<string, GameInfo>

const FALLBACK: GameInfo = {
  id: 'unknown',
  label: 'Jeu',
  gamedigType: '',
  emoji: '🎮',
  accent: '#6b7280',
}

export function getGame(id: string): GameInfo {
  return (GAMES as Record<string, GameInfo>)[id] ?? { ...FALLBACK, id }
}
