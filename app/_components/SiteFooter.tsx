import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line/70">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 text-sm text-muted flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-accent to-accent-2 text-[10px] font-bold text-bg">
            DS
          </span>
          Deafiaa Serv · © {year}
        </span>
        <span className="flex items-center gap-3">
          Statut des serveurs rafraîchi en direct.
          <Link href="/admin" className="text-muted/70 transition-colors hover:text-fg">
            Admin
          </Link>
        </span>
      </div>
    </footer>
  );
}
