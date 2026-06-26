import Image from "next/image";
import type { GameInfo } from "@/lib/types";

export interface ShowcaseEntry {
  game: GameInfo;
  count: number;
}

/**
 * Visual "vitrine" of the games offered. Each tile shows the game's background
 * art with a solid readout bar docked at the bottom — the name and server count
 * sit on an opaque panel (edged in the game's own colour), never directly on
 * the artwork. Purely presentational, so it stays a Server Component.
 */
export function GameShowcase({ entries }: { entries: ShowcaseEntry[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {entries.map(({ game, count }) => (
        <div
          key={game.id}
          className="group relative isolate aspect-[4/3] overflow-hidden rounded-xl border border-line"
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
              className="absolute inset-0 -z-10 grid place-items-center"
              style={{
                backgroundImage: `radial-gradient(120% 120% at 30% 0%, ${game.accent}55, transparent 60%), linear-gradient(135deg, ${game.accent}22, transparent)`,
              }}
            >
              <span className="text-4xl opacity-80">{game.emoji}</span>
            </div>
          )}

          {/* Solid readout bar — opaque so the label is always legible. */}
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 border-t border-line bg-bg/90 px-3 py-2.5 backdrop-blur">
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-0.5"
              style={{ background: game.accent }}
            />
            <span className="text-lg leading-none">{game.emoji}</span>
            <div className="min-w-0">
              <h3 className="truncate font-display text-sm font-semibold leading-tight tracking-tight">
                {game.label}
              </h3>
              <p className="font-mono text-[10px] text-muted">
                {count} serveur{count > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
