import { describe, expect, it } from 'vitest'
import { parseDownloads, parseMods } from './admin-form'

/** Append one download row's four aligned columns to a FormData. */
function addDownload(
  form: FormData,
  row: { label?: string; file?: string; url?: string; description?: string },
): void {
  form.append('downloadLabel', row.label ?? '')
  form.append('downloadFile', row.file ?? '')
  form.append('downloadUrl', row.url ?? '')
  form.append('downloadDescription', row.description ?? '')
}

/** Append one mod row's four aligned columns to a FormData. */
function addMod(
  form: FormData,
  row: { name?: string; url?: string; required?: boolean; note?: string },
): void {
  form.append('modName', row.name ?? '')
  form.append('modUrl', row.url ?? '')
  form.append('modRequired', row.required ? 'true' : 'false')
  form.append('modNote', row.note ?? '')
}

describe('parseDownloads', () => {
  it('parses a local file and an external url, dropping optional blanks', () => {
    const form = new FormData()
    addDownload(form, { label: 'World', file: 'world.zip' })
    addDownload(form, { label: 'Modpack', url: 'https://ex.com/mp', description: 'v2' })

    expect(parseDownloads(form)).toEqual({
      items: [
        { label: 'World', file: 'world.zip', url: undefined, description: undefined },
        { label: 'Modpack', file: undefined, url: 'https://ex.com/mp', description: 'v2' },
      ],
    })
  })

  it('drops fully-empty rows', () => {
    const form = new FormData()
    addDownload(form, {})
    addDownload(form, { label: 'World', file: 'world.zip' })
    addDownload(form, {})

    expect(parseDownloads(form).items).toHaveLength(1)
  })

  it('rejects a row with no label', () => {
    const form = new FormData()
    addDownload(form, { file: 'orphan.zip' })

    expect(parseDownloads(form).error).toMatch(/libellé/)
  })

  it('rejects a row with neither file nor url', () => {
    const form = new FormData()
    addDownload(form, { label: 'World' })

    expect(parseDownloads(form).error).toMatch(/fichier local ou une URL/)
  })

  it('rejects a row with both a file and a url', () => {
    const form = new FormData()
    addDownload(form, { label: 'World', file: 'world.zip', url: 'https://ex.com' })

    expect(parseDownloads(form).error).toMatch(/à la fois/)
  })

  it('returns an empty list when there are no rows', () => {
    expect(parseDownloads(new FormData())).toEqual({ items: [] })
  })
})

describe('parseMods', () => {
  it('parses required and optional mods', () => {
    const form = new FormData()
    addMod(form, { name: 'Create', url: 'https://ex.com/create', required: true })
    addMod(form, { name: 'Sodium', note: 'perfs' })

    expect(parseMods(form)).toEqual({
      items: [
        { name: 'Create', url: 'https://ex.com/create', required: true, note: undefined },
        { name: 'Sodium', url: undefined, required: false, note: 'perfs' },
      ],
    })
  })

  it('drops fully-empty rows', () => {
    const form = new FormData()
    addMod(form, {})
    addMod(form, { name: 'Create' })

    expect(parseMods(form).items).toHaveLength(1)
  })

  it('rejects a row with no name', () => {
    const form = new FormData()
    addMod(form, { url: 'https://ex.com', required: true })

    expect(parseMods(form).error).toMatch(/nom/)
  })
})
