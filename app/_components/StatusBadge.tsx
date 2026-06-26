import type { LiveStatus } from "@/lib/types";

export function StatusBadge({
  status,
  loading,
}: {
  status: LiveStatus | null;
  loading: boolean;
}) {
  if (loading && !status) {
    return (
      <span className="inline-flex items-center gap-2 rounded-md bg-panel-2 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-muted/60" />
        Vérif…
      </span>
    );
  }

  const online = status?.online ?? false;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.1em] ${
        online
          ? "bg-accent/15 text-accent ring-1 ring-accent/30"
          : "bg-danger/10 text-danger ring-1 ring-danger/25"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          online ? "bg-accent live-dot" : "bg-danger"
        }`}
      />
      {online ? "En ligne" : "Hors ligne"}
    </span>
  );
}
