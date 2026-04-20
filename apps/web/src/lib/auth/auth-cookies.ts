import { ACCESS_TOKEN_COOKIE_NAME } from '@/lib/auth/auth.constants'
import { cookies } from 'next/headers'

export async function getServerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value ?? null
}

export async function setAccessTokenCookie(accessToken: string, expiresInSeconds: number) {
  const cookieStore = await cookies()
  cookieStore.set({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: expiresInSeconds
  })
}

export async function clearAccessTokenCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME)
}
