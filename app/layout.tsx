import type { Metadata } from "next";
import { Suspense } from "react";
import { Space_Grotesk, Karla, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "./_components/SiteHeader";
import { SiteFooter } from "./_components/SiteFooter";
import { StatusLine } from "./_components/StatusLine";
import { AmbientBackground } from "./_components/AmbientBackground";

// Display — headings, server names, wordmark. A mechanical-but-warm grotesque.
const display = Space_Grotesk({
  variable: "--ff-display",
  subsets: ["latin"],
  display: "swap",
});

// Body & UI — summaries, prose, labels, nav. Karla: a humanist grotesque with
// a touch more warmth and character than a neutral workhorse, still crisp small.
const body = Karla({
  variable: "--ff-body",
  subsets: ["latin"],
  display: "swap",
});

// Telemetry voice — IPs, pings, counts, labels, the connect prompt.
const mono = JetBrains_Mono({
  variable: "--ff-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DServ — serveurs de jeu",
    template: "%s · DServ",
  },
  description:
    "Le serveur du moment, son adresse de connexion et son statut en direct, avec les autres serveurs et l'historique.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AmbientBackground />
        <SiteHeader />
        <StatusLine />
        {/* Chrome (header / status line / footer) is the static shell; page
            content is request-time (catalog + live), so it streams into this
            boundary. Pages add finer boundaries of their own for live data. */}
        <main className="flex-1 w-full pb-20">
          <Suspense fallback={<PageFallback />}>{children}</Suspense>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}

/** Quiet placeholder shown while a page's request-time content streams in. */
function PageFallback() {
  return (
    <div
      className="shell flex min-h-[40vh] items-center gap-2.5 py-16 font-mono text-xs text-muted"
      aria-hidden
    >
      <span className="caret-blink text-signal">▌</span> chargement…
    </div>
  );
}
