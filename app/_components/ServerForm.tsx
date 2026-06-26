"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import type { FormState } from "@/app/admin/actions";
import type { DownloadEntry, ModEntry } from "@/lib/types";

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
  mods: ModEntry[];
  downloads: DownloadEntry[];
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
  // Controlled so the downloads uploader knows which server folder to write to.
  const [slug, setSlug] = useState(d.slug ?? "");

  return (
    <form action={formAction} className="space-y-6">
      <Section title="Identité">
        <Field label="Slug *" hint="minuscules, chiffres, tirets — sert d'URL">
          <input name="slug" required value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} placeholder="mon-serveur" />
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

      <ModsEditor defaultMods={d.mods ?? []} />
      <DownloadsEditor defaultDownloads={d.downloads ?? []} slug={slug} />

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

// Monotonic key source so added/removed editor rows keep a stable React key
// independent of their array index (index keys break on reorder/removal).
let rowKeySeq = 0;
const nextKey = () => rowKeySeq++;

interface ModRow extends ModEntry {
  key: number;
}

/**
 * Repeatable mods editor. Each row submits `modName`/`modUrl`/`modNote` (text,
 * always present) plus a hidden `modRequired` mirroring its toggle, so the
 * server can zip the columns back by index. See `lib/admin-form.ts`.
 */
function ModsEditor({ defaultMods }: { defaultMods: ModEntry[] }) {
  const [rows, setRows] = useState<ModRow[]>(() =>
    defaultMods.map((m) => ({ ...m, key: nextKey() })),
  );

  function add() {
    setRows((r) => [
      ...r,
      { key: nextKey(), name: "", url: "", required: false, note: "" },
    ]);
  }
  function remove(key: number) {
    setRows((r) => r.filter((row) => row.key !== key));
  }
  function patch(key: number, changes: Partial<ModEntry>) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...changes } : row)));
  }

  return (
    <fieldset className="space-y-3 rounded-2xl border border-line bg-surface p-5">
      <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-muted">
        Mods
      </legend>

      {rows.length === 0 ? (
        <EmptyRow>Aucun mod.</EmptyRow>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.key} className="rounded-xl border border-line bg-bg/40 p-3">
              <input
                type="hidden"
                name="modRequired"
                value={row.required ? "true" : "false"}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  name="modName"
                  value={row.name}
                  onChange={(e) => patch(row.key, { name: e.target.value })}
                  placeholder="Nom (ex. Create)"
                  className={inputClass}
                />
                <input
                  name="modUrl"
                  value={row.url ?? ""}
                  onChange={(e) => patch(row.key, { url: e.target.value })}
                  placeholder="URL (optionnel)"
                  className={inputClass}
                />
                <input
                  name="modNote"
                  value={row.note ?? ""}
                  onChange={(e) => patch(row.key, { note: e.target.value })}
                  placeholder="Note (optionnel)"
                  className={`${inputClass} sm:col-span-2`}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={row.required}
                    onChange={(e) => patch(row.key, { required: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Requis pour jouer
                </label>
                <RemoveButton onClick={() => remove(row.key)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddButton onClick={add}>+ Ajouter un mod</AddButton>
    </fieldset>
  );
}

interface DownloadRow extends DownloadEntry {
  key: number;
  /** Known size in bytes once uploaded (for display). */
  size?: number;
  uploading?: boolean;
  /** 0..100 while uploading. */
  progress?: number;
  uploadError?: string;
  /** File was written by an upload this session → safe to delete on removal. */
  uploaded?: boolean;
}

const ACCEPT_UPLOAD = ".zip,.jar,.tar,.gz,.tgz,.7z,.rar,.mrpack";

/**
 * Repeatable downloads editor. Each row carries either a local `file` (served
 * from /api/download) or an external `url` — never both. The four columns are
 * always submitted as hidden inputs (state-driven) so server-side index zipping
 * stays aligned regardless of the visible UI. Local files can be typed (for
 * out-of-band files) or uploaded here straight into UPLOADS_DIR/<slug>/.
 */
function DownloadsEditor({
  defaultDownloads,
  slug,
}: {
  defaultDownloads: DownloadEntry[];
  slug: string;
}) {
  const [rows, setRows] = useState<DownloadRow[]>(() =>
    defaultDownloads.map((d) => ({ ...d, key: nextKey() })),
  );
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const canUpload = /^[a-z0-9-]+$/.test(slug);

  function add() {
    setRows((r) => [
      ...r,
      { key: nextKey(), label: "", file: "", url: "", description: "" },
    ]);
  }
  function remove(key: number) {
    setRows((r) => {
      const row = r.find((x) => x.key === key);
      if (row?.uploaded && row.file) deleteUpload(slug, row.file);
      return r.filter((x) => x.key !== key);
    });
  }
  function patch(key: number, changes: Partial<DownloadRow>) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...changes } : row)));
  }

  /** Upload one file into a freshly-created (or given) row, tracking progress. */
  function upload(key: number, file: File) {
    patch(key, { uploading: true, progress: 0, uploadError: undefined, url: "" });
    uploadFile(slug, file, (pct) => patch(key, { progress: pct }))
      .then((res) =>
        patch(key, {
          uploading: false,
          progress: 100,
          file: res.file,
          size: res.size,
          uploaded: true,
        }),
      )
      .catch((e: Error) =>
        patch(key, { uploading: false, uploadError: e.message }),
      );
  }

  /** Bulk picker: one new row per selected file, label defaulted from name. */
  function onBulkFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const key = nextKey();
      setRows((r) => [
        ...r,
        { key, label: stripExt(file.name), file: "", url: "", description: "" },
      ]);
      upload(key, file);
    }
  }

  return (
    <fieldset className="space-y-3 rounded-2xl border border-line bg-surface p-5">
      <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-muted">
        Téléchargements
      </legend>
      <p className="text-xs text-muted">
        Téléverse les fichiers (modpack, zips de mods, maps…) ou réfère un
        fichier déposé hors-bande / une URL externe. Un fichier <em>ou</em> une
        URL par entrée.
      </p>

      {rows.length === 0 ? (
        <EmptyRow>Aucun téléchargement.</EmptyRow>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <DownloadRowFields
              key={row.key}
              row={row}
              slug={slug}
              canUpload={canUpload}
              onPatch={patch}
              onRemove={remove}
              onUpload={upload}
            />
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <AddButton onClick={add}>+ Ajouter une entrée</AddButton>
        <input
          ref={bulkInputRef}
          type="file"
          multiple
          accept={ACCEPT_UPLOAD}
          className="hidden"
          onChange={(e) => {
            onBulkFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={!canUpload}
          onClick={() => bulkInputRef.current?.click()}
          className="rounded-xl bg-accent/90 px-3 py-1.5 text-sm font-medium text-bg transition-colors hover:bg-accent disabled:opacity-50"
        >
          ⬆ Téléverser des fichiers
        </button>
        {!canUpload ? (
          <span className="text-xs text-muted">
            Renseigne d&apos;abord le slug pour téléverser.
          </span>
        ) : null}
      </div>
    </fieldset>
  );
}

function DownloadRowFields({
  row,
  slug,
  canUpload,
  onPatch,
  onRemove,
  onUpload,
}: {
  row: DownloadRow;
  slug: string;
  canUpload: boolean;
  onPatch: (key: number, changes: Partial<DownloadRow>) => void;
  onRemove: (key: number) => void;
  onUpload: (key: number, file: File) => void;
}) {
  const rowInputRef = useRef<HTMLInputElement>(null);
  const hasFile = Boolean(row.file);

  return (
    <li className="rounded-xl border border-line bg-bg/40 p-3">
      {/* Always-submitted columns (kept aligned by index server-side). */}
      <input type="hidden" name="downloadLabel" value={row.label} />
      <input type="hidden" name="downloadFile" value={row.file ?? ""} />
      <input type="hidden" name="downloadUrl" value={row.url ?? ""} />
      <input type="hidden" name="downloadDescription" value={row.description ?? ""} />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          value={row.label}
          onChange={(e) => onPatch(row.key, { label: e.target.value })}
          placeholder="Libellé (ex. World v3)"
          className={inputClass}
        />
        <input
          value={row.description ?? ""}
          onChange={(e) => onPatch(row.key, { description: e.target.value })}
          placeholder="Description (optionnel)"
          className={inputClass}
        />
      </div>

      <div className="mt-2">
        {row.uploading ? (
          <div className="space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full bg-signal transition-all"
                style={{ width: `${row.progress ?? 0}%` }}
              />
            </div>
            <p className="font-mono text-xs text-muted">
              Téléversement… {row.progress ?? 0}%
            </p>
          </div>
        ) : hasFile ? (
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-2/50 px-3 py-2">
            <span>📦</span>
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-fg">
              {row.file}
              {row.size != null ? (
                <span className="text-muted"> · {formatSize(row.size)}</span>
              ) : null}
            </span>
            <button
              type="button"
              onClick={() => {
                if (row.uploaded && row.file) deleteUpload(slug, row.file);
                onPatch(row.key, {
                  file: "",
                  size: undefined,
                  uploaded: false,
                  progress: 0,
                });
              }}
              className="text-xs text-muted transition-colors hover:text-danger"
            >
              Retirer le fichier
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex gap-2">
              <input
                value={row.file ?? ""}
                onChange={(e) =>
                  onPatch(row.key, { file: e.target.value, url: "" })
                }
                placeholder="Fichier local (ex. world.zip)"
                className={inputClass}
              />
              <input
                ref={rowInputRef}
                type="file"
                accept={ACCEPT_UPLOAD}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(row.key, file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={!canUpload}
                onClick={() => rowInputRef.current?.click()}
                title={canUpload ? "Téléverser un fichier" : "Renseigne le slug d'abord"}
                className="shrink-0 rounded-xl border border-line bg-bg/60 px-3 text-sm text-fg transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
              >
                ⬆
              </button>
            </div>
            <input
              value={row.url ?? ""}
              onChange={(e) => onPatch(row.key, { url: e.target.value, file: "" })}
              placeholder="URL externe (https://…)"
              className={inputClass}
            />
          </div>
        )}
      </div>

      {row.uploadError ? (
        <p className="mt-2 text-xs text-danger">{row.uploadError}</p>
      ) : null}

      <div className="mt-2 text-right">
        <RemoveButton onClick={() => onRemove(row.key)} />
      </div>
    </li>
  );
}

/** Drop the extension to seed a download label from a filename. */
function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  const units = ["Kio", "Mio", "Gio", "Tio"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
}

/** Stream a file to the admin upload route via XHR (for upload progress). */
function uploadFile(
  slug: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ file: string; size: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `/api/admin/upload/${encodeURIComponent(slug)}?name=${encodeURIComponent(file.name)}`;
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let body: { file?: string; size?: number; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON error body */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.file) {
        resolve({ file: body.file, size: body.size ?? 0 });
      } else {
        reject(new Error(body.error || `Échec du téléversement (${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error("Erreur réseau pendant le téléversement."));
    xhr.send(file);
  });
}

/** Best-effort cleanup of a file uploaded this session but then removed. */
function deleteUpload(slug: string, file: string): void {
  fetch(
    `/api/admin/upload/${encodeURIComponent(slug)}?name=${encodeURIComponent(file)}`,
    { method: "DELETE" },
  ).catch(() => {});
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-line bg-bg/40 px-4 py-3 text-sm text-muted">
      {children}
    </p>
  );
}

function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-line bg-bg/60 px-3 py-1.5 text-sm text-fg transition-colors hover:border-accent/50 hover:text-accent"
    >
      {children}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs text-muted transition-colors hover:text-danger"
    >
      Supprimer
    </button>
  );
}
