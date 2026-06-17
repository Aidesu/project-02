import type { Metadata } from "next";
import { GAMES } from "@/lib/games";
import { ServerForm } from "@/app/_components/ServerForm";
import { createServerAction } from "../actions";

export const metadata: Metadata = { title: "Nouveau serveur" };
export const dynamic = "force-dynamic";

export default function NewServerPage() {
  const games = Object.values(GAMES).map((g) => ({
    id: g.id,
    label: g.label,
    emoji: g.emoji,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Nouveau serveur</h1>
      <ServerForm action={createServerAction} games={games} submitLabel="Créer" />
    </div>
  );
}
