"use client";

import { useLiveAll } from "./useLive";

/**
 * Persistent ops readout under the header — the site's "MOTD". Reads the shared
 * live store (one /api/live poll, see useLive) and reports, in the console
 * voice, how many worlds are up and how many players are connected. Boots from
 * a "connexion…" state so it reads like a terminal coming online.
 */
export function StatusLine() {
  const { bySlug, loading, checkedAt } = useLiveAll();

  const slugs = Object.keys(bySlug);
  const total = slugs.length;
  let online = 0;
  let players = 0;
  for (const slug of slugs) {
    const status = bySlug[slug]?.status;
    if (status?.online) {
      online += 1;
      players += status.players?.current ?? 0;
    }
  }

  const ready = !loading && total > 0;
  const time = checkedAt
    ? new Date(checkedAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <div className="border-b border-line bg-bg/90 backdrop-blur">
      <div className="shell flex items-center gap-x-3 overflow-hidden whitespace-nowrap py-2 font-mono text-[11px] text-muted sm:text-xs">
        <span className="text-signal">dserv</span>
        <Sep />

        {ready ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                online > 0 ? "bg-accent live-dot" : "bg-danger"
              }`}
            />
            <span className="text-fg">
              {online}/{total}
            </span>{" "}
            mondes en ligne
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <span className="caret-blink text-signal">▌</span> connexion…
          </span>
        )}

        <Sep />
        <span>
          <span className="text-fg">{ready ? players : "—"}</span> joueurs
        </span>

        <span className="ml-auto hidden items-center gap-1.5 sm:inline-flex">
          <span className="text-muted/70">maj</span>
          <span className="tabular-nums text-fg/80">{time ?? "—"}</span>
        </span>
      </div>
    </div>
  );
}

function Sep() {
  return <span className="text-line">·</span>;
}
