"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { LiveStatus, ProxmoxStats } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
//  Single client-side live store. Instead of each card/panel polling its own
//  endpoints (N×2 requests / 15s / visitor, with duplicates), one shared
//  singleton polls the aggregated `/api/live` once per interval and fans the
//  result out to every subscriber via `useSyncExternalStore`.
//
//  Polling pauses while the tab is hidden and resumes (with an immediate
//  refresh) when it becomes visible again.
//
//  SSR seeding (no first-paint flash): the server renders the first snapshot and
//  hands it down through `LiveProvider`. `getServerSnapshot` reads it from React
//  context (per-request safe), so the streamed HTML already shows live values.
//  On the client, the same snapshot seeds the singleton so hydration matches and
//  the poll simply continues from there.
// ─────────────────────────────────────────────────────────────────────────

const REFRESH_MS = 15_000;

export interface LiveEntry {
  status: LiveStatus | null;
  proxmox: ProxmoxStats | null;
}

export interface Snapshot {
  bySlug: Record<string, LiveEntry>;
  loading: boolean;
  checkedAt: string | null;
}

const EMPTY_SNAPSHOT: Snapshot = { bySlug: {}, loading: true, checkedAt: null };

let snapshot: Snapshot = EMPTY_SNAPSHOT;
const listeners = new Set<() => void>();
let started = false;
let timer: ReturnType<typeof setTimeout> | undefined;

function emit() {
  for (const listener of listeners) listener();
}

function schedule() {
  clearTimeout(timer);
  if (typeof document === "undefined" || document.visibilityState === "visible") {
    timer = setTimeout(tick, REFRESH_MS);
  }
}

async function tick() {
  try {
    const res = await fetch("/api/live", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as {
        checkedAt: string;
        servers: Record<string, LiveEntry>;
      };
      snapshot = {
        bySlug: data.servers ?? {},
        loading: false,
        checkedAt: data.checkedAt ?? null,
      };
    } else {
      snapshot = { ...snapshot, loading: false };
    }
  } catch {
    snapshot = { ...snapshot, loading: false };
  } finally {
    emit();
    schedule();
  }
}

function ensureStarted() {
  if (started || typeof window === "undefined") return;
  started = true;
  tick();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      clearTimeout(timer);
      tick();
    } else {
      clearTimeout(timer);
    }
  });
}

function subscribe(callback: () => void) {
  ensureStarted();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return snapshot;
}

// ── SSR seed ───────────────────────────────────────────────────────────────
// The per-request seed is carried via context (module singletons are not safe
// for per-request state on the server).
const LiveContext = createContext<Snapshot | null>(null);

/**
 * Seed the client singleton once, before polling starts, so the first client
 * render matches the SSR-seeded HTML. Guarded by `started` so it never clobbers
 * fresher polled data.
 */
function seedStore(initial: Snapshot) {
  if (started) return;
  snapshot = initial;
}

/**
 * Provides the SSR live snapshot to descendants. Render it (via `LiveBootstrap`)
 * around any subtree that reads live data so values are present on first paint.
 */
export function LiveProvider({
  initial,
  children,
}: {
  initial: Snapshot;
  children: ReactNode;
}) {
  // Seed the singleton on the client so hydration matches the server HTML.
  if (typeof window !== "undefined") seedStore(initial);
  return <LiveContext.Provider value={initial}>{children}</LiveContext.Provider>;
}

/** Whole live snapshot (all active servers). Used by aggregate views. */
export function useLiveAll(): Snapshot {
  const seeded = useContext(LiveContext);
  // Server render uses getServerSnapshot (the per-request seed); client render
  // uses the singleton, which `LiveProvider` seeds to the same value.
  return useSyncExternalStore(subscribe, getSnapshot, () => seeded ?? EMPTY_SNAPSHOT);
}

/** Live data for a single server, shaped like the old `useLiveData`. */
export function useLive(slug: string): {
  status: LiveStatus | null;
  proxmox: ProxmoxStats | null;
  loading: boolean;
} {
  const snap = useLiveAll();
  const entry = snap.bySlug[slug];
  return {
    status: entry?.status ?? null,
    proxmox: entry?.proxmox ?? null,
    loading: snap.loading && !entry,
  };
}
