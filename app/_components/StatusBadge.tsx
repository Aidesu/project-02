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
      <span className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">
        <span className="h-2 w-2 rounded-full bg-muted/60" />
        Vérification…
      </span>
    );
  }

  const online = status?.online ?? false;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${
        online
          ? "bg-accent/15 text-accent ring-1 ring-accent/30"
          : "bg-danger/10 text-danger ring-1 ring-danger/25"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          online ? "bg-accent live-dot" : "bg-danger"
        }`}
      />
      {online ? "En ligne" : "Hors ligne"}
    </span>
  );
}
