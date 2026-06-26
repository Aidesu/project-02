import type { Metadata } from "next";
import { getArchivedServers } from "@/lib/servers";
import { getGame } from "@/lib/games";
import { HistoryExplorer, type HistoryItem } from "../_components/HistoryExplorer";

export const metadata: Metadata = {
  title: "Historique",
  description: "Les serveurs passés et leurs téléchargements.",
};

// Lecture BDD à la requête : la BDD n'existe qu'au runtime, pas au build.
// Sans ceci, la page est figée au build sur le repli statique data/servers.ts.
export const dynamic = "force-dynamic";

export default async function HistoriquePage() {
  const archived = await getArchivedServers();

  const items: HistoryItem[] = archived.map((server) => ({
    slug: server.slug,
    name: server.name,
    summary: server.summary,
    image: server.images?.[0],
    startedAt: server.startedAt,
    endedAt: server.endedAt,
    downloads: server.downloads?.length ?? 0,
    tags: server.tags ?? [],
    game: getGame(server.gameId),
  }));

  const totalDownloads = items.reduce((sum, item) => sum + item.downloads, 0);

  return (
    <div className="shell space-y-8 py-12 sm:py-16">
      {/* Header band */}
      <section className="relative isolate overflow-hidden rounded-xl border border-line p-6 sm:p-8">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-panel to-bg" />
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(700px 240px at 88% -30%, rgba(244,163,193,0.10), transparent 60%)",
          }}
        />
        <p className="eyebrow">Archives · hors service</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Historique
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Les serveurs retirés du service. Leurs maps et fichiers restent
          téléchargeables.
        </p>
        {archived.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm text-muted">
            <span>
              <strong className="text-fg">{archived.length}</strong> serveur
              {archived.length > 1 ? "s" : ""} archivé
              {archived.length > 1 ? "s" : ""}
            </span>
            <span>
              <strong className="text-fg">{totalDownloads}</strong>{" "}
              téléchargement{totalDownloads > 1 ? "s" : ""}
            </span>
          </div>
        ) : null}
      </section>

      {archived.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-panel/50 p-10 text-center text-muted">
          Aucun serveur archivé pour l&apos;instant.
        </p>
      ) : (
        <HistoryExplorer items={items} />
      )}
    </div>
  );
}
