import type { ReactNode } from "react";
import { connection } from "next/server";
import { getActiveLive } from "@/lib/live";
import { LiveProvider } from "./useLive";

/**
 * Server component that fetches the first live snapshot and seeds the shared
 * client store (via `LiveProvider`), so live values render server-side and the
 * post-hydration flash disappears. The client poll then takes over the 15 s
 * refresh.
 *
 * `getActiveLive()` is request-time (game queries / Proxmox API) and touches
 * `Date.now()` / `new Date()` (the live cache). `<Suspense>` alone does not opt
 * a component out of prerendering — if a warm cache lets the work finish
 * synchronously, Next would try to prerender it and reject the non-deterministic
 * clock. `connection()` makes this boundary explicitly request-time (and is the
 * documented fix for reading the clock), so it always streams into the Suspense
 * fallback instead of being prerendered.
 */
export async function LiveBootstrap({ children }: { children: ReactNode }) {
  await connection();
  const data = await getActiveLive();
  return (
    <LiveProvider
      initial={{ bySlug: data.servers, loading: false, checkedAt: data.checkedAt }}
    >
      {children}
    </LiveProvider>
  );
}
