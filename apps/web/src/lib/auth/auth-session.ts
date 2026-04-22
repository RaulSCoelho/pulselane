'use server'

import { cookies } from 'next/headers'

import { ACCESS_TOKEN_COOKIE_NAME, DEVICE_ID_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from './auth-constants'

export type AuthSession = {
  accessToken: string
  refreshToken: string | null
  deviceId: string | null
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies()

  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value
  if (!accessToken) return null

  return {
    accessToken,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value ?? null,
    deviceId: cookieStore.get(DEVICE_ID_COOKIE_NAME)?.value ?? null
  }
}
