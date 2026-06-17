import Image from "next/image";
import type { GameInfo } from "@/lib/types";

export interface ShowcaseEntry {
  game: GameInfo;
  count: number;
}

/**
 * Visual "vitrine" of the games offered. Each tile uses the game's background
 * art (or an accent gradient fallback) with the game name and how many servers
 * run it. Purely presentational — no live data, so it stays a Server Component.
 */
export function GameShowcase({ entries }: { entries: ShowcaseEntry[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {entries.map(({ game, count }) => (
        <div
          key={game.id}
          className="group relative isolate aspect-[4/3] overflow-hidden rounded-2xl border border-line"
        >
          {game.background ? (
            <Image
              src={game.background}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
              className="-z-10 object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="absolute inset-0 -z-10"
              style={{
                backgroundImage: `radial-gradient(120% 120% at 30% 0%, ${game.accent}55, transparent 60%), linear-gradient(135deg, ${game.accent}22, transparent)`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />

          <div className="relative flex h-full flex-col justify-end gap-1 p-4">
            <span className="text-2xl drop-shadow">{game.emoji}</span>
            <h3 className="font-semibold leading-tight tracking-tight">
              {game.label}
            </h3>
            <p className="text-xs text-muted">
              {count} serveur{count > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
