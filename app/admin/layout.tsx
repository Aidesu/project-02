import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { logoutAction } from "./actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirects to /login when there is no valid session.
  await requireAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-xs font-bold text-bg">
            DS
          </span>
          <div className="leading-none">
            <p className="font-semibold">Administration</p>
            <p className="text-[11px] text-muted">gestion des serveurs</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface hover:text-fg"
          >
            ← Voir le site
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-danger/40 hover:text-danger"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>

      {children}
    </div>
  );
}
