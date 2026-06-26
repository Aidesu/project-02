"use client";

import Link from "next/link";
import type { GameInfo, Server } from "@/lib/types";
import { formatBytes } from "@/lib/format";
import { useLive } from "./useLive";
import { StatusBadge } from "./StatusBadge";
import { StatBar } from "./StatBar";
import { GameBanner } from "./GameBanner";

export function ServerCard({ server, game }: { server: Server; game: GameInfo }) {
  const { status, proxmox, loading } = useLive(server.slug);

  const players = status?.online ? status.players : null;
  const ramDetail =
    proxmox?.available && proxmox.maxmem
      ? `${formatBytes(proxmox.mem)} / ${formatBytes(proxmox.maxmem)}`
      : undefined;

  return (
    <Link
      href={`/serveurs/${server.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-panel transition-colors hover:border-signal/40"
    >
      <GameBanner game={game} image={server.images?.[0]} className="h-40" />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display font-semibold tracking-tight">
              {server.name}
            </h3>
            <p className="font-mono text-[11px] text-muted">
              {game.emoji} {game.label}
            </p>
          </div>
          <StatusBadge status={status} loading={loading} />
        </div>

        <p className="line-clamp-2 text-sm text-muted">{server.summary}</p>

        <div className="mt-auto space-y-2.5 border-t border-line pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              Joueurs
            </span>
            <span className="font-mono text-fg">
              {players ? `${players.current} / ${players.max}` : "—"}
            </span>
          </div>

          {proxmox?.available ? (
            <>
              <StatBar label="CPU" fraction={proxmox.cpu} />
              <StatBar label="RAM" fraction={ramFraction(proxmox.mem, proxmox.maxmem)} detail={ramDetail} />
            </>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function ramFraction(mem?: number, maxmem?: number): number | undefined {
  if (!mem || !maxmem) return undefined;
  return mem / maxmem;
}
