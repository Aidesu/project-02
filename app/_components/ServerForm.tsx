"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { FormState } from "@/app/admin/actions";

export interface ServerFormValues {
  slug: string;
  name: string;
  gameId: string;
  summary: string;
  description: string;
  queryHost: string;
  queryPort: string;
  connect: string;
  proxmoxNode: string;
  proxmoxVmid: string;
  proxmoxType: string;
  startedAt: string;
  endedAt: string;
  archived: boolean;
  current: boolean;
  tags: string;
}

interface GameOption {
  id: string;
  label: string;
  emoji: string;
}

const inputClass =
  "w-full rounded-xl border border-line bg-bg/60 px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-accent/50 focus:outline-none";

export function ServerForm({
  action,
  games,
  defaults,
  submitLabel,
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  games: GameOption[];
  defaults?: Partial<ServerFormValues>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const d = defaults ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <Section title="Identité">
        <Field label="Slug *" hint="minuscules, chiffres, tirets — sert d'URL">
          <input name="slug" required defaultValue={d.slug} className={inputClass} placeholder="mon-serveur" />
        </Field>
        <Field label="Nom *">
          <input name="name" required defaultValue={d.name} className={inputClass} />
        </Field>
        <Field label="Jeu *">
          <select name="gameId" required defaultValue={d.gameId ?? ""} className={inputClass}>
            <option value="" disabled>
              — choisir —
            </option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.emoji} {g.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tags" hint="séparés par des virgules">
          <input name="tags" defaultValue={d.tags} className={inputClass} placeholder="survie, coop" />
        </Field>
        <Field label="Résumé *" full>
          <textarea name="summary" required defaultValue={d.summary} rows={2} className={inputClass} />
        </Field>
        <Field label="Description" full>
          <textarea name="description" defaultValue={d.description} rows={4} className={inputClass} />
        </Field>
      </Section>

      <Section title="Connexion & statut">
        <Field label="Hôte de requête (GameDig)">
          <input name="queryHost" defaultValue={d.queryHost} className={inputClass} placeholder="mc.exemple.fr" />
        </Field>
        <Field label="Port de requête">
          <input name="queryPort" type="number" defaultValue={d.queryPort} className={inputClass} placeholder="25565" />
        </Field>
        <Field label="Adresse affichée (connexion)">
          <input name="connect" defaultValue={d.connect} className={inputClass} placeholder="play.exemple.fr" />
        </Field>
      </Section>

      <Section title="Proxmox (stats CPU/RAM)">
        <Field label="Nœud">
          <input name="proxmoxNode" defaultValue={d.proxmoxNode} className={inputClass} placeholder="pve" />
        </Field>
        <Field label="VMID">
          <input name="proxmoxVmid" type="number" defaultValue={d.proxmoxVmid} className={inputClass} placeholder="101" />
        </Field>
        <Field label="Type">
          <select name="proxmoxType" defaultValue={d.proxmoxType ?? ""} className={inputClass}>
            <option value="">—</option>
            <option value="lxc">lxc</option>
            <option value="qemu">qemu</option>
          </select>
        </Field>
      </Section>

      <Section title="Dates & visibilité">
        <Field label="Date de lancement *">
          <input name="startedAt" type="date" required defaultValue={d.startedAt} className={inputClass} />
        </Field>
        <Field label="Date d'arrêt">
          <input name="endedAt" type="date" defaultValue={d.endedAt} className={inputClass} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="current" defaultChecked={d.current} className="h-4 w-4" />
          Serveur à la une (un seul)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="archived" defaultChecked={d.archived} className="h-4 w-4" />
          Archivé (passe dans l&apos;historique)
        </label>
      </Section>

      {state.error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-accent px-5 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent/90 disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : submitLabel}
        </button>
        <Link href="/admin" className="text-sm text-muted hover:text-fg">
          Annuler
        </Link>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-2xl border border-line bg-surface p-5">
      <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  hint,
  full,
  children,
}: {
  label: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-muted">
        {label}
        {hint ? <span className="ml-1 text-xs opacity-70">({hint})</span> : null}
      </span>
      {children}
    </label>
  );
}
