'use server'

import { jwtDecrypt, EncryptJWT } from 'jose'
import { cookies } from 'next/headers'
import { createHash } from 'node:crypto'

import { AUTH_COOKIE_NAME } from './auth-constants'

export type AuthCookiePayload = {
  accessToken: string
  accessTokenExpiresAt: string
  refreshToken: string
  deviceId?: string
}

function getAuthSecret() {
  const secret = process.env.AUTH_COOKIE_SECRET

  if (!secret) {
    throw new Error('Missing AUTH_COOKIE_SECRET.')
  }

  return createHash('sha256').update(secret).digest()
}

export async function encryptAuthCookie(payload: AuthCookiePayload) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .encrypt(getAuthSecret())
}

export async function decryptAuthCookie(value: string) {
  const { payload } = await jwtDecrypt(value, getAuthSecret())

  return payload as unknown as AuthCookiePayload
}

export async function getAuthCookie() {
  const cookieStore = await cookies()
  const value = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!value) {
    return null
  }

  try {
    return await decryptAuthCookie(value)
  } catch {
    return null
  }
}

export async function setAuthCookie(payload: AuthCookiePayload) {
  const encrypted = await encryptAuthCookie(payload)
  const cookieStore = await cookies()

  cookieStore.set(AUTH_COOKIE_NAME, encrypted, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}
