import 'server-only'
import { createHash, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignJWT, jwtVerify } from 'jose'

// Single-admin auth: a password in ADMIN_PASSWORD, and a signed (HS256) session
// JWT stored in an httpOnly cookie. AUTH_SECRET signs the token.

const COOKIE = 'ds_session'
const MAX_AGE_S = 60 * 60 * 24 * 7 // 7 days

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')
  return new TextEncoder().encode(secret)
}

/** Constant-time check of a submitted password against ADMIN_PASSWORD. */
export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  const a = createHash('sha256').update(input).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

/** Sign a session token and set it as an httpOnly cookie. */
export async function createSession(): Promise<void> {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_S}s`)
    .sign(secretKey())

  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_S,
  })
}

/** Clear the session cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}

/** True when the current request carries a valid session. */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const store = await cookies()
    const token = store.get(COOKIE)?.value
    if (!token) return false
    await jwtVerify(token, secretKey())
    return true
  } catch {
    return false
  }
}

/** Redirect to the login page when not authenticated. */
export async function requireAuth(): Promise<void> {
  if (!(await isAuthenticated())) redirect('/login')
}
