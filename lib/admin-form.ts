// Pure parsers turning the admin form's repeated download/mod fields into the
// domain `DownloadEntry` / `ModEntry` shapes. Kept out of the `'use server'`
// actions file so they can be unit-tested without a server/DB.
//
// Each editor row submits one value per column (text inputs always submit, even
// empty; the mod "required" toggle rides a hidden input). So the per-column
// arrays from `FormData.getAll` stay aligned by index — we just zip them back.
import type { DownloadEntry, ModEntry } from './types'

export interface ParseResult<T> {
  items?: T[]
  error?: string
}

/** Zip the aligned per-column FormData arrays back into trimmed rows. */
function rows(form: FormData, keys: string[]): string[][] {
  const cols = keys.map((key) =>
    form.getAll(key).map((v) => (typeof v === 'string' ? v.trim() : '')),
  )
  const length = Math.max(0, ...cols.map((c) => c.length))
  const out: string[][] = []
  for (let i = 0; i < length; i++) out.push(cols.map((c) => c[i] ?? ''))
  return out
}

/**
 * Parse the downloads editor. A download needs a label and exactly one source
 * (a local file in DOWNLOADS_DIR/<slug>/ or an external URL). Fully-blank rows
 * are dropped so an empty editor row never blocks the form.
 */
export function parseDownloads(form: FormData): ParseResult<DownloadEntry> {
  const items: DownloadEntry[] = []
  for (const [label, file, url, description] of rows(form, [
    'downloadLabel',
    'downloadFile',
    'downloadUrl',
    'downloadDescription',
  ])) {
    if (!label && !file && !url) continue
    if (!label) {
      return { error: 'Chaque téléchargement doit avoir un libellé.' }
    }
    if (!file && !url) {
      return {
        error: `Le téléchargement « ${label} » doit avoir un fichier local ou une URL externe.`,
      }
    }
    if (file && url) {
      return {
        error: `Le téléchargement « ${label} » ne peut pas avoir à la fois un fichier et une URL.`,
      }
    }
    items.push({
      label,
      file: file || undefined,
      url: url || undefined,
      description: description || undefined,
    })
  }
  return { items }
}

/** Parse the mods editor. A mod needs a name; everything else is optional. */
export function parseMods(form: FormData): ParseResult<ModEntry> {
  const items: ModEntry[] = []
  for (const [name, url, required, note] of rows(form, [
    'modName',
    'modUrl',
    'modRequired',
    'modNote',
  ])) {
    if (!name && !url && !note) continue
    if (!name) {
      return { error: 'Chaque mod doit avoir un nom.' }
    }
    items.push({
      name,
      url: url || undefined,
      required: required === 'true' || required === 'on',
      note: note || undefined,
    })
  }
  return { items }
}
