import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getServer, getAllServerSlugs } from "@/lib/servers";
import { GAMES } from "@/lib/games";
import { ServerForm, type ServerFormValues } from "@/app/_components/ServerForm";
import { updateServerAction } from "../../actions";

export const metadata: Metadata = { title: "Éditer un serveur" };

// A non-leaf dynamic segment (`[slug]/edit`) needs its params known at build so
// Next can construct the route tree. Read from the uncached source (build-safe).
// Slugs added later are still handled at request time (PPR).
export async function generateStaticParams() {
  return (await getAllServerSlugs()).map((slug) => ({ slug }));
}

export default function EditServerPage(props: PageProps<"/admin/[slug]/edit">) {
  // `params` and the catalog read are request-time; stream them behind Suspense.
  return (
    <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
      <EditServerForm params={props.params} />
    </Suspense>
  );
}

async function EditServerForm({
  params,
}: {
  params: PageProps<"/admin/[slug]/edit">["params"];
}) {
  const { slug } = await params;
  const server = await getServer(slug);
  if (!server) notFound();

  const games = Object.values(GAMES).map((g) => ({
    id: g.id,
    label: g.label,
    emoji: g.emoji,
  }));

  const defaults: ServerFormValues = {
    slug: server.slug,
    name: server.name,
    gameId: server.gameId,
    summary: server.summary,
    description: server.description ?? "",
    queryHost: server.query?.host ?? "",
    queryPort: server.query?.port?.toString() ?? "",
    connect: server.connect ?? "",
    proxmoxNode: server.proxmox?.node ?? "",
    proxmoxVmid: server.proxmox?.vmid?.toString() ?? "",
    proxmoxType: server.proxmox?.type ?? "",
    startedAt: server.startedAt,
    endedAt: server.endedAt ?? "",
    archived: Boolean(server.archived),
    current: Boolean(server.current),
    tags: (server.tags ?? []).join(", "),
    mods: server.mods ?? [],
    downloads: server.downloads ?? [],
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">
        Éditer : <span className="text-muted">{server.name}</span>
      </h1>
      <ServerForm
        action={updateServerAction.bind(null, server.slug)}
        games={games}
        defaults={defaults}
        submitLabel="Enregistrer"
      />
    </div>
  );
}
