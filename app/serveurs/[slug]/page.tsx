import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getServer, getAllServerSlugs, serverAddress } from "@/lib/servers";
import { getGame } from "@/lib/games";
import { formatBytes, formatDate } from "@/lib/format";
import { downloadFilePath, fileSize } from "@/lib/downloads";
import type { Server } from "@/lib/types";
import { GameBanner } from "../../_components/GameBanner";
import { LiveStatusPanel } from "../../_components/LiveStatusPanel";
import { LiveBootstrap } from "../../_components/LiveBootstrap";
import { ServerHistory } from "../../_components/ServerHistory";
import { CopyButton } from "../../_components/CopyButton";

// Dynamic segment: provide build-time param samples so Next can construct the
// route. Slugs added later are still served at request time (PPR).
export async function generateStaticParams() {
  return (await getAllServerSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/serveurs/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const server = await getServer(slug);
  if (!server) return { title: "Serveur introuvable" };
  return { title: server.name, description: server.summary };
}

export default async function ServerDetailPage(props: PageProps<"/serveurs/[slug]">) {
  const { slug } = await props.params;
  const server = await getServer(slug);
  if (!server) notFound();

  const game = getGame(server.gameId);
  const address = serverAddress(server);

  return (
    <div className="shell space-y-8 py-10 sm:py-14">
      <Link
        href={server.archived ? "/historique" : "/"}
        className="group inline-flex items-center gap-2 rounded-full border border-line bg-panel/80 py-1.5 pl-1.5 pr-4 text-sm text-muted backdrop-blur transition-colors hover:border-signal/40 hover:text-fg"
      >
        <span
          aria-hidden
          className="grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-base leading-none transition duration-200 group-hover:-translate-x-0.5 group-hover:bg-accent/15 group-hover:text-accent"
        >
          ←
        </span>
        {server.archived ? "Retour à l'historique" : "Retour à l'accueil"}
      </Link>

      {/* Header */}
      <header className="overflow-hidden rounded-2xl border border-line bg-surface">
        <GameBanner game={game} image={server.images?.[0]} className="h-40 sm:h-52" />
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-panel-2 px-2.5 py-1 font-mono text-xs text-fg">
              {game.emoji} {game.label}
            </span>
            {server.archived ? (
              <span className="rounded-md bg-panel-2 px-2.5 py-1 font-mono text-xs text-muted">
                Archivé
              </span>
            ) : null}
            {server.tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-panel-2 px-2.5 py-1 font-mono text-xs text-muted"
              >
                #{tag}
              </span>
            ))}
          </div>

          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {server.name}
          </h1>
          <p className="text-muted">{server.summary}</p>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
            {address ? (
              <span className="inline-flex items-center gap-1.5">
                Adresse :{" "}
                <CopyButton
                  value={address}
                  className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-fg"
                />
              </span>
            ) : null}
            <span>
              Lancé le {formatDate(server.startedAt)}
              {server.endedAt ? ` · arrêté le ${formatDate(server.endedAt)}` : ""}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left column */}
        <div className="space-y-6">
          {server.description ? (
            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                À propos
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-fg/90">
                {server.description}
              </p>
            </section>
          ) : null}

          {server.mods && server.mods.length > 0 ? (
            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                Mods
              </h2>
              <ul className="space-y-2">
                {server.mods.map((mod) => (
                  <li
                    key={mod.name}
                    className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-2/60 px-3 py-2"
                  >
                    <span className="font-medium">{mod.name}</span>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[11px] ${
                        mod.required
                          ? "bg-warn/15 text-warn"
                          : "bg-surface-2 text-muted"
                      }`}
                    >
                      {mod.required ? "Requis" : "Optionnel"}
                    </span>
                    {mod.note ? (
                      <span className="w-full text-xs text-muted">{mod.note}</span>
                    ) : null}
                    {mod.url ? (
                      <a
                        href={mod.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-xs text-accent hover:underline"
                      >
                        Lien ↗
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <DownloadsSection server={server} />

          {server.images && server.images.length > 1 ? (
            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                Galerie
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {server.images.slice(1).map((src) => (
                  <div
                    key={src}
                    className="relative aspect-video overflow-hidden rounded-xl bg-surface-2"
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, 220px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* Right column */}
        <aside className="space-y-6">
          {server.archived ? (
            <section className="rounded-2xl border border-line bg-surface p-5 text-sm text-muted">
              Ce serveur est archivé. Il n&apos;est plus en service, mais ses
              fichiers restent téléchargeables ci-contre.
            </section>
          ) : (
            <>
              {/* Live status streams in already-resolved (seeded), so it never
                  flips from "Vérif…" to real values after hydration. */}
              <Suspense fallback={<LivePanelSkeleton />}>
                <LiveBootstrap>
                  <LiveStatusPanel slug={server.slug} />
                </LiveBootstrap>
              </Suspense>
              <ServerHistory slug={server.slug} />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function DownloadsSection({ server }: { server: Server }) {
  const downloads = server.downloads;
  if (!downloads || downloads.length === 0) return null;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        Téléchargements
      </h2>
      <ul className="space-y-2">
        {downloads.map((dl) => {
          const isLocal = Boolean(dl.file);
          const filePath = isLocal && dl.file ? downloadFilePath(server, dl.file) : null;
          const size = filePath ? fileSize(filePath) : undefined;
          // A declared local file with no bytes on disk (or DOWNLOADS_DIR unset)
          // would 404 — show it as unavailable instead of a dead link.
          const missing = isLocal && size == null;
          const href = isLocal
            ? `/api/download/${server.slug}/${encodeURIComponent(dl.file!)}`
            : dl.url;

          if (!href) return null;

          if (missing) {
            return (
              <li key={dl.label}>
                <div
                  aria-disabled
                  className="flex items-center gap-3 rounded-xl border border-line border-dashed bg-surface-2/30 px-4 py-3 opacity-70"
                >
                  <span className="text-lg">⛔</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{dl.label}</span>
                    {dl.description ? (
                      <span className="block truncate text-xs text-muted">
                        {dl.description}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-xs text-muted">indisponible</span>
                </div>
              </li>
            );
          }

          return (
            <li key={dl.label}>
              <a
                href={href}
                {...(isLocal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/50 px-4 py-3 transition-colors hover:border-accent/40"
              >
                <span className="text-lg">{isLocal ? "⬇️" : "🔗"}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{dl.label}</span>
                  {dl.description ? (
                    <span className="block truncate text-xs text-muted">
                      {dl.description}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {isLocal ? (size != null ? formatBytes(size) : "fichier") : "externe ↗"}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Reserves the live panel's height while it streams in. */
function LivePanelSkeleton() {
  return (
    <section
      aria-hidden
      className="h-72 animate-pulse rounded-2xl border border-line bg-surface"
    />
  );
}
