"use client";

import Link from "next/link";
import Image from "next/image";
import type { GameInfo, Server } from "@/lib/types";
import { useLive } from "./useLive";
import { StatusBadge } from "./StatusBadge";
import { StatBar } from "./StatBar";
import { CopyButton } from "./CopyButton";

/**
 * Full-bleed featured banner for the "current" server. The game art runs
 * edge-to-edge as the page's opening statement; all text lives inside a solid
 * HUD panel docked over it, so nothing is read directly off the artwork. The
 * connection address is presented as a command you run to join.
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
    <section className="relative isolate w-full overflow-hidden border-b border-line">
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

      {/* This world's own colour, as a quiet glow in the upper corner. */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `radial-gradient(70% 80% at 88% 0%, ${game.accent}40, transparent 60%)`,
        }}
      />
      {/* Legibility scrim: near-opaque ink at the bottom, clear at the top. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/80 to-bg/25" />

      <div className="shell relative flex min-h-[32rem] flex-col justify-end py-8 sm:min-h-[62vh] sm:py-12">
        {/* Live status, anchored to the top of the frame on its own solid chip. */}
        <div className="absolute right-4 top-6 sm:right-6 sm:top-8">
          <span className="inline-flex rounded-md bg-bg/85 p-0.5 ring-1 ring-line backdrop-blur">
            <StatusBadge status={status} loading={loading} />
          </span>
        </div>

        {/* HUD — solid console panel so text never sits on raw artwork. */}
        <div className="max-w-2xl rounded-xl border border-line bg-bg/85 p-5 backdrop-blur-md sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-panel-2 px-2.5 py-1 font-mono text-xs text-fg">
              {game.emoji} {game.label}
            </span>
            <span className="rounded-md bg-berry/15 px-2.5 py-1 font-mono text-xs font-medium text-berry ring-1 ring-berry/30">
              ★ serveur actuel
            </span>
            {server.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-panel-2 px-2.5 py-1 font-mono text-xs text-muted"
              >
                #{tag}
              </span>
            ))}
          </div>

          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            {server.name}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">
            {server.summary}
          </p>

          {/* Signature: the connection address as a runnable command. */}
          {address ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex w-full min-w-0 items-center gap-2.5 rounded-lg border border-line bg-panel-2 px-3.5 py-2.5 font-mono sm:w-auto">
                <span className="connect-caret shrink-0" aria-hidden>
                  ▸
                </span>
                <span className="hidden shrink-0 text-muted sm:inline">
                  connect
                </span>
                <CopyButton
                  value={address}
                  className="min-w-0 text-sm text-fg sm:text-base"
                />
              </div>
            </div>
          ) : null}

          {/* Live telemetry + a quiet path to the detail page. */}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-4">
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
                <div className="w-24">
                  <StatBar label="CPU" fraction={proxmox.cpu} />
                </div>
                <div className="w-24">
                  <StatBar
                    label="RAM"
                    fraction={ramFraction(proxmox.mem, proxmox.maxmem)}
                  />
                </div>
              </>
            ) : null}

            <Link
              href={`/serveurs/${server.slug}`}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 font-mono text-xs uppercase tracking-[0.12em] text-fg transition-colors hover:border-signal/60 hover:text-signal"
            >
              Détails →
            </Link>
          </div>
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
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-sm text-fg">{children}</p>
    </div>
  );
}

function ramFraction(mem?: number, maxmem?: number): number | undefined {
  if (!mem || !maxmem) return undefined;
  return mem / maxmem;
}
