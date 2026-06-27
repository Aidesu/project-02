import type { Metadata } from "next";
import Link from "next/link";
import { getAllServers } from "@/lib/servers";
import { getGame } from "@/lib/games";
import { hasDatabase } from "@/lib/db/client";
import { DeleteServerButton } from "@/app/_components/DeleteServerButton";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const servers = await getAllServers();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">
          Serveurs <span className="text-muted">({servers.length})</span>
        </h1>
        <Link
          href="/admin/new"
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent/90"
        >
          + Nouveau serveur
        </Link>
      </div>

      {!hasDatabase() ? (
        <p className="rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
          Base de données non configurée (DATABASE_URL absent) : les modifications
          ne seront pas persistées.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Nom</th>
              <th className="px-4 py-2.5 font-medium">Jeu</th>
              <th className="px-4 py-2.5 font-medium">État</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {servers.map((server) => {
              const game = getGame(server.gameId);
              return (
                <tr key={server.slug} className="border-t border-line">
                  <td className="px-4 py-2.5">
                    <span className="font-medium">{server.name}</span>
                    <span className="block font-mono text-xs text-muted">
                      {server.slug}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {game.emoji} {game.label}
                  </td>
                  <td className="px-4 py-2.5">
                    {server.archived ? (
                      <span className="text-muted">Archivé</span>
                    ) : server.current ? (
                      <span className="text-accent">★ À la une</span>
                    ) : (
                      "Actif"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <Link
                      href={`/admin/${server.slug}/edit`}
                      className="text-accent hover:underline"
                    >
                      Éditer
                    </Link>
                    <DeleteServerButton slug={server.slug} name={server.name} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
