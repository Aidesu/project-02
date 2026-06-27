import { Suspense } from "react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { logoutAction } from "./actions";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="shell space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-signal text-xs font-bold text-bg">
            DS
          </span>
          <div className="leading-none">
            <p className="font-display font-semibold">Administration</p>
            <p className="mt-1 font-mono text-[11px] text-muted">
              gestion des serveurs
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-panel hover:text-fg"
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

      {/* Gate the content behind the session check (cookies → request-time) so
          admin data never renders/streams before auth passes. Suspense keeps the
          static chrome above from being blocked. */}
      <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
        <AuthGate>{children}</AuthGate>
      </Suspense>
    </div>
  );
}

/** Redirects to /login when there is no valid session, then renders the page. */
async function AuthGate({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return <>{children}</>;
}
