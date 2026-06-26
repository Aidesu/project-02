"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/historique", label: "Historique" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="shell flex h-16 items-center justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-accent to-berry font-mono text-sm font-bold tracking-tight text-bg shadow-[0_0_22px_-6px] shadow-accent/70 transition-transform group-hover:scale-105">
            DS
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[15px] font-semibold tracking-tight">
              DServ
            </span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              serveurs de jeu
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`border-b-2 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                  active
                    ? "border-signal text-fg"
                    : "border-transparent text-muted hover:text-fg"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
