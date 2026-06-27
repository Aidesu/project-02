import type { ReactNode } from "react";
import { getActiveLive } from "@/lib/live";
import { LiveProvider } from "./useLive";

/**
 * Server component that fetches the first live snapshot and seeds the shared
 * client store (via `LiveProvider`), so live values render server-side and the
 * post-hydration flash disappears. The client poll then takes over the 15 s
 * refresh.
 *
 * `getActiveLive()` is request-time (game queries / Proxmox API), so always
 * render this inside a `<Suspense>` boundary — it streams without blocking the
 * static shell.
 */
export async function LiveBootstrap({ children }: { children: ReactNode }) {
  const data = await getActiveLive();
  return (
    <LiveProvider
      initial={{ bySlug: data.servers, loading: false, checkedAt: data.checkedAt }}
    >
      {children}
    </LiveProvider>
  );
}
