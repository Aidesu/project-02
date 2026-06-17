"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import type { GameInfo } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { GameBanner } from "./GameBanner";

export interface HistoryItem {
  slug: string;
  name: string;
  summary: string;
  image?: string;
  startedAt: string;
  endedAt?: string;
  downloads: number;
  tags: string[];
  game: GameInfo;
}

type Sort = "recent" | "old";

/** Date a server left service (falls back to its start date), used for sorting. */
function retiredAt(item: HistoryItem): string {
  return item.endedAt ?? item.startedAt;
}

/**
 * Interactive history browser: search, filter by game and sort the archived
 * servers on the client. Data is precomputed on the server and passed in.
 */
export function HistoryExplorer({ items }: { items: HistoryItem[] }) {
  const [query, setQuery] = useState("");
  const [gameId, setGameId] = useState("all");
  const [sort, setSort] = useState<Sort>("recent");

  // Distinct games among the archived servers, with counts, for the chips.
  const games = useMemo(() => {
    const map = new Map<string, { game: GameInfo; count: number }>();
    for (const item of items) {
      const entry = map.get(item.game.id);
      if (entry) entry.count += 1;
      else map.set(item.game.id, { game: item.game, count: 1 });
    }
    return [...map.values()];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((item) => {
      if (gameId !== "all" && item.game.id !== gameId) return false;
      if (!q) return true;
      const haystack =
        `${item.name} ${item.summary} ${item.tags.join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
    list.sort((a, b) => {
      const cmp = retiredAt(a).localeCompare(retiredAt(b));
      return sort === "recent" ? -cmp : cmp;
    });
    return list;
  }, [items, query, gameId, sort]);

  const isFiltered = gameId !== "all" || query.trim() !== "";

  function reset() {
    setQuery("");
    setGameId("all");
  }

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface/60 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              🔍
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un serveur, un tag…"
              className="w-full rounded-xl border border-line bg-bg/60 py-2 pl-9 pr-3 text-sm text-fg placeholder:text-muted focus:border-accent/50 focus:outline-none"
            />
          </label>

          <div className="flex shrink-0 items-center rounded-xl border border-line bg-bg/60 p-0.5 text-sm">
            <SortButton active={sort === "recent"} onClick={() => setSort("recent")}>
              Récents
            </SortButton>
            <SortButton active={sort === "old"} onClick={() => setSort("old")}>
              Anciens
            </SortButton>
          </div>
        </div>

        {games.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            <Chip active={gameId === "all"} onClick={() => setGameId("all")}>
              Tous <span className="opacity-70">({items.length})</span>
            </Chip>
            {games.map(({ game, count }) => (
              <Chip
                key={game.id}
                active={gameId === game.id}
                onClick={() => setGameId(game.id)}
              >
                {game.emoji} {game.label} <span className="opacity-70">({count})</span>
              </Chip>
            ))}
          </div>
        ) : null}
      </div>

      <p className="text-sm text-muted">
        {isFiltered
          ? `${filtered.length} résultat${filtered.length > 1 ? "s" : ""} sur ${items.length}`
          : `${items.length} serveur${items.length > 1 ? "s" : ""} archivé${items.length > 1 ? "s" : ""}`}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-10 text-center text-muted">
          <p className="text-2xl">🗃️</p>
          <p className="mt-2">Aucun serveur ne correspond à ces filtres.</p>
          <button
            onClick={reset}
            className="mt-3 text-sm text-accent hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/serveurs/${item.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-accent/40"
              >
                <div className="relative">
                  <GameBanner game={item.game} image={item.image} className="h-28" />
                  <span className="absolute left-3 top-3 rounded-md bg-bg/70 px-2 py-0.5 text-[11px] text-muted ring-1 ring-line backdrop-blur">
                    Archivé
                  </span>
                  {item.downloads > 0 ? (
                    <span className="absolute right-3 top-3 rounded-md bg-bg/70 px-2 py-0.5 text-[11px] text-accent ring-1 ring-accent/30 backdrop-blur">
                      ⬇ {item.downloads}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div>
                    <h2 className="font-semibold tracking-tight">{item.name}</h2>
                    <p className="text-xs text-muted">
                      {item.game.emoji} {item.game.label}
                    </p>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted">{item.summary}</p>

                  <p className="mt-auto text-xs text-muted">
                    {formatDate(item.startedAt)}
                    {item.endedAt ? ` → ${formatDate(item.endedAt)}` : ""}
                  </p>

                  {item.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 transition-colors ${
        active ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-accent/40 bg-accent/15 text-accent"
          : "border-line bg-bg/40 text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
