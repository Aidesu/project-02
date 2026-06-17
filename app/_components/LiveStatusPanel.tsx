"use client";

import { formatBytes, formatUptime } from "@/lib/format";
import { useLive } from "./useLive";
import { StatusBadge } from "./StatusBadge";
import { StatBar } from "./StatBar";

export function LiveStatusPanel({ slug }: { slug: string }) {
  const { status, proxmox, loading } = useLive(slug);
  const online = status?.online ?? false;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          État en direct
        </h2>
        <StatusBadge status={status} loading={loading} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <Field label="Joueurs">
          {online && status ? `${status.players.current} / ${status.players.max}` : "—"}
        </Field>
        <Field label="Ping">
          {online && status?.ping != null ? `${status.ping} ms` : "—"}
        </Field>
        <Field label="Map">{online && status?.map ? status.map : "—"}</Field>
        <Field label="Version">{online && status?.version ? status.version : "—"}</Field>
      </dl>

      {online && status && status.players.list.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">
            Connectés
          </p>
          <div className="flex flex-wrap gap-1.5">
            {status.players.list.map((name) => (
              <span
                key={name}
                className="rounded-md bg-surface-2 px-2 py-0.5 text-xs"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 border-t border-line pt-4">
        <p className="mb-3 text-xs uppercase tracking-wide text-muted">
          Machine (Proxmox)
        </p>
        {proxmox?.available ? (
          <div className="space-y-3">
            <StatBar
              label="CPU"
              fraction={proxmox.cpu}
              detail={proxmox.cpus ? `${proxmox.cpus} cœurs` : undefined}
            />
            <StatBar
              label="RAM"
              fraction={ramFraction(proxmox.mem, proxmox.maxmem)}
              detail={
                proxmox.maxmem
                  ? `${formatBytes(proxmox.mem)} / ${formatBytes(proxmox.maxmem)}`
                  : undefined
              }
            />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Field label="Statut VM">{proxmox.status ?? "—"}</Field>
              <Field label="Uptime">{formatUptime(proxmox.uptime)}</Field>
            </dl>
          </div>
        ) : (
          <p className="text-sm text-muted">
            {proxmox?.error ?? "Stats Proxmox indisponibles."}
          </p>
        )}
      </div>

      {status?.checkedAt ? (
        <p className="mt-4 text-[11px] text-muted">
          Dernière vérification :{" "}
          {new Date(status.checkedAt).toLocaleTimeString("fr-FR")}
          {" · "}
          actualisation auto toutes les 15 s
        </p>
      ) : null}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono">{children}</dd>
    </div>
  );
}

function ramFraction(mem?: number, maxmem?: number): number | undefined {
  if (!mem || !maxmem) return undefined;
  return mem / maxmem;
}
