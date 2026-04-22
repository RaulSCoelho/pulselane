'use server'

import { cookies } from 'next/headers'

import { ACCESS_TOKEN_COOKIE_NAME, DEVICE_ID_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from './auth-constants'

export type AuthSession<TRequired extends boolean = true> = {
  accessToken: TRequired extends true ? string : string | null
  refreshToken: string | null
  deviceId: string | null
}

export type AuthSessionOptions<TRequired extends boolean = true> = {
  accessTokenRequired?: TRequired
}

export async function getAuthSession<TRequired extends boolean = false>(
  options?: AuthSessionOptions<TRequired>
): Promise<AuthSession<TRequired> | null> {
  const cookieStore = await cookies()

  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value ?? null
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value ?? null
  const deviceId = cookieStore.get(DEVICE_ID_COOKIE_NAME)?.value ?? null

  if (options?.accessTokenRequired && !accessToken) {
    return null
  }

  return {
    accessToken: accessToken as AuthSession<TRequired>['accessToken'],
    refreshToken,
    deviceId
  }
}
