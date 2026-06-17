"use client";

import { useEffect, useState } from "react";

interface Point {
  checkedAt: string;
  online: boolean;
  players: number | null;
}

interface History {
  available: boolean;
  uptime: number | null;
  samples: number;
  snapshots: Point[];
}

const REFRESH_MS = 60_000;

/**
 * Uptime + player-count history for a server, from `/api/history/<slug>`
 * (backed by the status_snapshots time-series). Refreshes once a minute.
 */
export function ServerHistory({ slug }: { slug: string }) {
  const [data, setData] = useState<History | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      try {
        const res = await fetch(`/api/history/${slug}`, { cache: "no-store" });
        if (res.ok && !cancelled) setData(await res.json());
      } catch {
        // ignore — keep last data
      } finally {
        if (!cancelled) {
          setLoading(false);
          timer = setTimeout(load, REFRESH_MS);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug]);

  // No database configured → nothing to show.
  if (data && !data.available) return null;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Historique
        </h2>
        <span className="text-xs text-muted">7 derniers jours</span>
      </div>

      {loading && !data ? (
        <p className="mt-4 text-sm text-muted">Chargement…</p>
      ) : !data || data.samples === 0 ? (
        <p className="mt-4 text-sm text-muted">
          L&apos;historique se remplira au fil des relevés (toutes les minutes).
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold">
              {data.uptime == null ? "—" : `${Math.round(data.uptime * 100)} %`}
            </span>
            <span className="text-xs text-muted">
              de disponibilité · {data.samples} relevés
            </span>
          </div>
          <Sparkline points={data.snapshots} />
        </div>
      )}
    </section>
  );
}

function Sparkline({ points }: { points: Point[] }) {
  if (points.length < 2) return null;

  const width = 100;
  const height = 28;
  const players = points.map((p) => (p.online && p.players != null ? p.players : 0));
  const max = Math.max(1, ...players);
  const step = width / (points.length - 1);

  const line = players
    .map((v, i) => `${(i * step).toFixed(2)},${(height - (v / max) * height).toFixed(2)}`)
    .join(" ");
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-16 w-full"
        aria-hidden
      >
        <polygon points={area} fill="var(--color-accent)" opacity="0.12" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-muted">
        <span>Joueurs · pic {max}</span>
        <span>maintenant →</span>
      </div>
    </div>
  );
}
