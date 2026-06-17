"use client";

import { useSyncExternalStore } from "react";
import type { LiveStatus, ProxmoxStats } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
//  Single client-side live store. Instead of each card/panel polling its own
//  endpoints (N×2 requests / 15s / visitor, with duplicates), one shared
//  singleton polls the aggregated `/api/live` once per interval and fans the
//  result out to every subscriber via `useSyncExternalStore`.
//
//  Polling pauses while the tab is hidden and resumes (with an immediate
//  refresh) when it becomes visible again.
// ─────────────────────────────────────────────────────────────────────────

const REFRESH_MS = 15_000;

export interface LiveEntry {
  status: LiveStatus | null;
  proxmox: ProxmoxStats | null;
}

interface Snapshot {
  bySlug: Record<string, LiveEntry>;
  loading: boolean;
  checkedAt: string | null;
}

let snapshot: Snapshot = { bySlug: {}, loading: true, checkedAt: null };
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

/** Whole live snapshot (all active servers). Used by aggregate views. */
export function useLiveAll(): Snapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
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
