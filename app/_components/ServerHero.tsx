"use client";

import Link from "next/link";
import Image from "next/image";
import type { GameInfo, Server } from "@/lib/types";
import { useLive } from "./useLive";
import { StatusBadge } from "./StatusBadge";
import { StatBar } from "./StatBar";
import { CopyButton } from "./CopyButton";

/**
 * Large featured banner for the "current" server: game art, live status and a
 * prominent, copy-to-clipboard connection address.
 */
export function ServerHero({
  server,
  game,
  address,
}: {
  server: Server;
  game: GameInfo;
  address?: string;
}) {
  const { status, proxmox, loading } = useLive(server.slug);
  const online = status?.online ?? false;
  const image = server.images?.[0] ?? game.background;

  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-line">
      {/* Background: server image, or a gradient tinted with the game accent. */}
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          preload
          sizes="100vw"
          className="-z-20 object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 -z-20"
          style={{
            backgroundImage: `radial-gradient(120% 130% at 85% 0%, ${game.accent}55, transparent 55%), linear-gradient(120deg, ${game.accent}26, transparent 60%)`,
          }}
        />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/85 to-bg/40" />

      <div className="relative flex min-h-[19rem] flex-col gap-5 p-6 sm:p-8">
        {/* Tags + live badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-bg/60 px-2.5 py-1 text-xs ring-1 ring-line backdrop-blur">
            {game.emoji} {game.label}
          </span>
          <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent ring-1 ring-accent/30">
            ★ Serveur actuel
          </span>
          {server.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-bg/50 px-2.5 py-1 text-xs text-muted ring-1 ring-line backdrop-blur"
            >
              #{tag}
            </span>
          ))}
          <span className="ml-auto">
            <StatusBadge status={status} loading={loading} />
          </span>
        </div>

        {/* Title + summary, pushed to the bottom of the art. */}
        <div className="mt-auto space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {server.name}
          </h2>
          <p className="max-w-2xl text-sm text-muted sm:text-base">
            {server.summary}
          </p>
        </div>

        {/* Connection address with copy button. */}
        {address ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-bg/70 px-4 py-2.5 backdrop-blur">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                IP
              </span>
              <CopyButton value={address} className="text-base text-fg sm:text-lg" />
            </div>
          </div>
        ) : null}

        {/* Live stats + CTA. */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Stat label="Joueurs">
            {online && status
              ? `${status.players.current} / ${status.players.max}`
              : "—"}
          </Stat>
          <Stat label="Ping">
            {online && status?.ping != null ? `${status.ping} ms` : "—"}
          </Stat>
          {proxmox?.available ? (
            <>
              <div className="w-28">
                <StatBar label="CPU" fraction={proxmox.cpu} />
              </div>
              <div className="w-28">
                <StatBar
                  label="RAM"
                  fraction={ramFraction(proxmox.mem, proxmox.maxmem)}
                />
              </div>
            </>
          ) : null}

          <Link
            href={`/serveurs/${server.slug}`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent/90"
          >
            Voir les détails →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="leading-tight">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="font-mono text-sm">{children}</p>
    </div>
  );
}

function ramFraction(mem?: number, maxmem?: number): number | undefined {
  if (!mem || !maxmem) return undefined;
  return mem / maxmem;
}
