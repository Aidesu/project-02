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
    <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 h-16">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-sm font-bold tracking-tight text-bg shadow-[0_0_22px_-6px] shadow-accent/60 ring-1 ring-accent/40 transition-transform group-hover:scale-105">
            DS
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-semibold tracking-tight">Deafiaa Serv</span>
            <span className="text-[11px] text-muted">serveurs de jeu</span>
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
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-surface-2 text-fg"
                    : "text-muted hover:text-fg hover:bg-surface"
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
