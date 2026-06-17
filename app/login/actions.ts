'use server'

import { redirect } from 'next/navigation'
import { createSession, verifyPassword } from '@/lib/auth'

export interface LoginState {
  error?: string
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get('password') ?? '')
  if (!verifyPassword(password)) {
    return { error: 'Mot de passe incorrect.' }
  }
  await createSession()
  redirect('/admin')
}
