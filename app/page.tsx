import { Suspense } from "react";
import Link from "next/link";
import {
  getActiveServers,
  getArchivedServers,
  getCurrentServer,
  serverAddress,
} from "@/lib/servers";
import { getGame } from "@/lib/games";
import { ServerCard } from "./_components/ServerCard";
import { ServerHero } from "./_components/ServerHero";
import { LiveBootstrap } from "./_components/LiveBootstrap";

export default function Home() {
  // The chrome streams together with seeded live data behind one boundary, so
  // the featured server and cards paint with real status — no vide→rempli flip.
  // The fallback reserves the layout to avoid a shift when content streams in.
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <LiveBootstrap>
        <HomeContent />
      </LiveBootstrap>
    </Suspense>
  );
}

async function HomeContent() {
  const active = await getActiveServers();
  const current = await getCurrentServer();
  const others = active.filter((s) => s.slug !== current?.slug);
  const archivedCount = (await getArchivedServers()).length;

  return (
    <>
      {/* ── Featured server: the full-bleed opening statement ──────────── */}
      {current ? (
        <ServerHero
          server={current}
          game={getGame(current.gameId)}
          address={serverAddress(current)}
        />
      ) : null}

      <div className="shell space-y-16 py-12 sm:py-16">
        {current ? null : <EmptyState />}

        {/* ── Autres serveurs en route ─────────────────────────────────── */}
        {others.length > 0 ? (
          <section className="space-y-5">
            <SectionHeading
              title="Mondes en route"
              count={others.length}
              action={
                archivedCount > 0 ? (
                  <Link
                    href="/historique"
                    className="font-mono text-xs uppercase tracking-[0.12em] text-muted transition-colors hover:text-signal"
                  >
                    Historique [{archivedCount}] →
                  </Link>
                ) : null
              }
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* ── Aperçu historique ────────────────────────────────────────── */}
        {archivedCount > 0 ? <HistoryTeaser count={archivedCount} /> : null}
      </div>
    </>
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
    <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
      <h2 className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.18em]">
        <span
          aria-hidden
          className="h-2 w-2 bg-berry shadow-[0_0_10px_-1px] shadow-berry"
        />
        <span className="text-fg">{title}</span>
        {count != null ? (
          <span className="text-muted">[{count}]</span>
        ) : null}
      </h2>
      {action}
    </div>
  );
}

function HistoryTeaser({ count }: { count: number }) {
  return (
    <Link
      href="/historique"
      className="group flex items-center justify-between gap-4 rounded-xl border border-line bg-panel/60 p-5 transition-colors hover:border-signal/40"
    >
      <div>
        <p className="font-display font-medium">
          Anciennes saisons &amp; serveurs retirés
        </p>
        <p className="mt-0.5 text-sm text-muted">
          {count} serveur{count > 1 ? "s" : ""} archivé{count > 1 ? "s" : ""} —
          leurs maps et fichiers restent téléchargeables.
        </p>
      </div>
      <span className="shrink-0 font-mono text-xs uppercase tracking-[0.12em] text-signal transition-transform group-hover:translate-x-0.5">
        Voir →
      </span>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-line bg-panel/50 p-10 text-center text-muted">
      <p className="text-2xl">🕹️</p>
      <p className="mt-2">Aucun serveur en route pour le moment.</p>
      <p className="mt-1 text-sm">
        Ajoutez-en un dans{" "}
        <code className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-xs">
          data/servers.ts
        </code>
        .
      </p>
    </div>
  );
}

/** Layout-reserving placeholder shown while the home content streams in. */
function HomeSkeleton() {
  return (
    <div aria-hidden className="animate-pulse">
      {/* Featured banner block */}
      <div className="min-h-[34rem] w-full border-b border-line bg-panel/40 sm:min-h-[clamp(36rem,70vh,54rem)]" />
      <div className="shell space-y-16 py-12 sm:py-16">
        <div className="h-5 w-40 rounded bg-panel-2/70" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-72 rounded-xl border border-line bg-panel/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
