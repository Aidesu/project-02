"use client";

import { useLiveAll } from "./useLive";

/**
 * Compact live summary shown in the top-right of the home intro. Reads the
 * shared live store (single `/api/live` poll) and aggregates the player/online
 * counts across the active servers.
 */
export function LiveStats({
  slugs,
  serverCount,
  gameCount,
}: {
  slugs: string[];
  serverCount: number;
  gameCount: number;
}) {
  const { bySlug, loading } = useLiveAll();

  let players = 0;
  let online = 0;
  for (const slug of slugs) {
    const status = bySlug[slug]?.status;
    if (status?.online) {
      online += 1;
      players += status.players?.current ?? 0;
    }
  }

  const dash = "—";

  return (
    <div className="shrink-0 whitespace-nowrap text-right leading-tight">
      <p className="inline-flex items-center gap-1.5 text-sm font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-accent live-dot" />
        {loading ? dash : players}
        <span className="font-normal text-muted">joueurs en ligne</span>
      </p>
      <p className="mt-0.5 text-xs text-muted">
        {loading ? dash : `${online}/${serverCount}`} serveurs · {gameCount} jeux
      </p>
    </div>
  );
}
