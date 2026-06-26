'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { destroySession, isAuthenticated } from '@/lib/auth'
import {
  createServer,
  deleteServer,
  updateServer,
  type ServerInput,
} from '@/lib/db/servers-repo'
import { parseDownloads, parseMods } from '@/lib/admin-form'

export interface FormState {
  error?: string
}

async function guard(): Promise<void> {
  if (!(await isAuthenticated())) redirect('/login')
}

/** Revalidate every page that renders the catalog after a mutation. */
function revalidateCatalog(): void {
  revalidatePath('/')
  revalidatePath('/historique')
  revalidatePath('/serveurs/[slug]', 'page')
  revalidatePath('/admin')
}

function field(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function parseInput(form: FormData): { input?: ServerInput; error?: string } {
  const slug = field(form, 'slug')
  const name = field(form, 'name')
  const gameId = field(form, 'gameId')
  const summary = field(form, 'summary')
  const startedAt = field(form, 'startedAt')

  if (!slug || !name || !gameId || !summary || !startedAt) {
    return { error: 'Champs obligatoires manquants (slug, nom, jeu, résumé, date de début).' }
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: 'Le slug ne peut contenir que des minuscules, chiffres et tirets.' }
  }

  const queryPort = field(form, 'queryPort')
  const proxmoxVmid = field(form, 'proxmoxVmid')
  const proxmoxType = field(form, 'proxmoxType')
  if (proxmoxType && proxmoxType !== 'lxc' && proxmoxType !== 'qemu') {
    return { error: 'Le type Proxmox doit être « lxc » ou « qemu ».' }
  }

  const downloads = parseDownloads(form)
  if (downloads.error || !downloads.items) return { error: downloads.error }
  const mods = parseMods(form)
  if (mods.error || !mods.items) return { error: mods.error }

  const input: ServerInput = {
    slug,
    name,
    gameId,
    summary,
    description: field(form, 'description') || null,
    queryHost: field(form, 'queryHost') || null,
    queryPort: queryPort ? Number(queryPort) : null,
    connect: field(form, 'connect') || null,
    proxmoxNode: field(form, 'proxmoxNode') || null,
    proxmoxVmid: proxmoxVmid ? Number(proxmoxVmid) : null,
    proxmoxType: proxmoxType || null,
    startedAt,
    endedAt: field(form, 'endedAt') || null,
    archived: form.get('archived') === 'on',
    current: form.get('current') === 'on',
    tags: field(form, 'tags')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    mods: mods.items,
    downloads: downloads.items,
  }

  if (input.queryPort != null && !Number.isInteger(input.queryPort)) {
    return { error: 'Le port doit être un entier.' }
  }
  if (input.proxmoxVmid != null && !Number.isInteger(input.proxmoxVmid)) {
    return { error: 'Le VMID Proxmox doit être un entier.' }
  }
  return { input }
}

export async function logoutAction(): Promise<void> {
  await destroySession()
  redirect('/login')
}

export async function createServerAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await guard()
  const { input, error } = parseInput(form)
  if (error || !input) return { error }

  try {
    await createServer(input)
  } catch (err) {
    if (err instanceof Error && /unique|duplicate/i.test(err.message)) {
      return { error: `Le slug « ${input.slug} » existe déjà.` }
    }
    return { error: 'Échec de la création.' }
  }

  revalidateCatalog()
  redirect('/admin')
}

export async function updateServerAction(
  originalSlug: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await guard()
  const { input, error } = parseInput(form)
  if (error || !input) return { error }

  try {
    await updateServer(originalSlug, input)
  } catch (err) {
    if (err instanceof Error && /unique|duplicate/i.test(err.message)) {
      return { error: `Le slug « ${input.slug} » existe déjà.` }
    }
    return { error: 'Échec de la mise à jour.' }
  }

  revalidateCatalog()
  redirect('/admin')
}

export async function deleteServerAction(slug: string): Promise<void> {
  await guard()
  await deleteServer(slug)
  revalidateCatalog()
  redirect('/admin')
}
