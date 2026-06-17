import Link from "next/link";
import {
  getActiveServers,
  getArchivedServers,
  getCurrentServer,
  serverAddress,
} from "@/lib/servers";
import { getGame } from "@/lib/games";
import type { GameInfo } from "@/lib/types";
import { ServerCard } from "./_components/ServerCard";
import { ServerHero } from "./_components/ServerHero";
import { LiveStats } from "./_components/LiveStats";
import { GameShowcase, type ShowcaseEntry } from "./_components/GameShowcase";

export default async function Home() {
  const active = await getActiveServers();
  const current = await getCurrentServer();
  const others = active.filter((s) => s.slug !== current?.slug);
  const archivedCount = (await getArchivedServers()).length;

  // Distinct games offered (with server counts) for the showcase, in the order
  // they first appear among the active servers.
  const gameEntries: ShowcaseEntry[] = [];
  const gameIndex = new Map<string, ShowcaseEntry>();
  for (const server of active) {
    const game: GameInfo = getGame(server.gameId);
    const existing = gameIndex.get(game.id);
    if (existing) {
      existing.count += 1;
    } else {
      const entry = { game, count: 1 };
      gameIndex.set(game.id, entry);
      gameEntries.push(entry);
    }
  }

  return (
    <div className="space-y-14">
      {/* ── Intro hero ─────────────────────────────────────────────── */}
      <section className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-accent live-dot" />
            Statut rafraîchi en direct
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Deafiaa{" "}
            <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
              Serv
            </span>
          </h1>
          <p className="max-w-2xl text-muted">
            Le serveur du moment et son adresse de connexion, avec son statut en
            direct. Retrouvez les autres mondes en cours de partie, les jeux
            proposés, et les anciennes saisons dans l&apos;historique.
          </p>
        </div>

        <LiveStats
          slugs={active.map((s) => s.slug)}
          serverCount={active.length}
          gameCount={gameEntries.length}
        />
      </section>

      {/* ── Serveur à la une ───────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeading title="Serveur à la une" />
        {current ? (
          <ServerHero
            server={current}
            game={getGame(current.gameId)}
            address={serverAddress(current)}
          />
        ) : (
          <EmptyState />
        )}
      </section>

      {/* ── Jeux proposés ──────────────────────────────────────────── */}
      {gameEntries.length > 0 ? (
        <section className="space-y-4">
          <SectionHeading title="Jeux proposés" />
          <GameShowcase entries={gameEntries} />
        </section>
      ) : null}

      {/* ── Autres serveurs en route ───────────────────────────────── */}
      {others.length > 0 ? (
        <section className="space-y-4">
          <SectionHeading
            title="Autres serveurs en route"
            count={others.length}
            action={
              archivedCount > 0 ? (
                <Link
                  href="/historique"
                  className="text-sm text-accent hover:underline"
                >
                  Historique ({archivedCount}) →
                </Link>
              ) : null
            }
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((server) => (
              <ServerCard
                key={server.slug}
                server={server}
                game={getGame(server.gameId)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Aperçu historique ──────────────────────────────────────── */}
      {archivedCount > 0 ? <HistoryTeaser count={archivedCount} /> : null}
    </div>
  );
}

function SectionHeading({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-medium">
        {title}
        {count != null ? <span className="text-muted"> ({count})</span> : null}
      </h2>
      {action}
    </div>
  );
}

function HistoryTeaser({ count }: { count: number }) {
  return (
    <Link
      href="/historique"
      className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface/60 p-5 transition-colors hover:border-accent/40"
    >
      <div>
        <p className="font-medium">Anciennes saisons & serveurs retirés</p>
        <p className="text-sm text-muted">
          {count} serveur{count > 1 ? "s" : ""} archivé{count > 1 ? "s" : ""} —
          leurs maps et fichiers restent téléchargeables.
        </p>
      </div>
      <span className="shrink-0 text-accent transition-transform group-hover:translate-x-0.5">
        Voir l&apos;historique →
      </span>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-10 text-center text-muted">
      <p className="text-2xl">🕹️</p>
      <p className="mt-2">Aucun serveur en route pour le moment.</p>
      <p className="mt-1 text-sm">
        Ajoutez-en un dans{" "}
        <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">
          data/servers.ts
        </code>
        .
      </p>
    </div>
  );
}
