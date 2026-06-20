'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSession, verifyPassword } from '@/lib/auth'
import { clearRateLimit, clientKey, rateLimit } from '@/lib/rate-limit'

export interface LoginState {
  error?: string
}

// Brute-force guard: the single admin password is the only secret, so cap
// login attempts per client. A correct password clears the counter so a
// legitimate admin who fat-fingered a few times isn't locked out.
const LOGIN_MAX_ATTEMPTS = 5
const LOGIN_WINDOW_MS = 5 * 60_000

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const key = `login:${clientKey(await headers())}`
  const gate = rateLimit(key, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)
  if (!gate.ok) {
    return {
      error: `Trop de tentatives. Réessayez dans ${gate.retryAfter} s.`,
    }
  }

  const password = String(formData.get('password') ?? '')
  if (!verifyPassword(password)) {
    return { error: 'Mot de passe incorrect.' }
  }

  clearRateLimit(key)
  await createSession()
  redirect('/admin')
}
