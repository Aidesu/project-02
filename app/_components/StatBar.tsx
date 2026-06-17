/** A labeled usage bar (CPU / RAM), value is a 0..1 fraction. */
export function StatBar({
  label,
  fraction,
  detail,
}: {
  label: string;
  fraction: number | undefined;
  detail?: string;
}) {
  const pct =
    fraction != null && Number.isFinite(fraction)
      ? Math.max(0, Math.min(1, fraction)) * 100
      : null;

  // Green → amber → red as usage climbs.
  const color =
    pct == null
      ? "bg-muted/40"
      : pct < 60
        ? "bg-accent"
        : pct < 85
          ? "bg-warn"
          : "bg-danger";

  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-mono">
          {pct == null ? "—" : `${Math.round(pct)} %`}
          {detail ? <span className="text-muted"> · {detail}</span> : null}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
    </div>
  );
}
