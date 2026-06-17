import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServer } from "@/lib/servers";
import { GAMES } from "@/lib/games";
import { ServerForm, type ServerFormValues } from "@/app/_components/ServerForm";
import { updateServerAction } from "../../actions";

export const metadata: Metadata = { title: "Éditer un serveur" };
export const dynamic = "force-dynamic";

export default async function EditServerPage(
  props: PageProps<"/admin/[slug]/edit">,
) {
  const { slug } = await props.params;
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
