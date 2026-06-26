import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line">
      <div className="shell flex flex-col items-center justify-between gap-2 py-6 font-mono text-xs text-muted sm:flex-row">
        <span className="flex items-center gap-2.5">
          <span className="grid h-5 w-5 place-items-center rounded bg-gradient-to-br from-accent to-berry text-[10px] font-bold text-bg">
            DS
          </span>
          <span className="uppercase tracking-[0.12em]">
            DServ · © {year}
          </span>
        </span>
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent live-dot" />
            statut rafraîchi en direct
          </span>
          <Link
            href="/admin"
            className="uppercase tracking-[0.12em] text-muted/60 transition-colors hover:text-signal"
          >
            Admin
          </Link>
        </span>
      </div>
    </footer>
  );
}
