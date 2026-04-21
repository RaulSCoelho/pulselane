import { api } from '@/http/api-client'
import { MeResponse, meResponseSchema } from '@pulselane/contracts'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { DEFAULT_AUTHENTICATED_PATH } from './auth-constants'
import { getAuthCookie } from './auth-cookie'
import { buildLoginRedirectPath, buildRefreshRedirectPath } from './auth-redirect'
import { isAccessTokenExpired } from './auth-session'

type AuthOptions = {
  redirectTo?: string
  refreshBufferInSeconds?: number
}

type SessionCheckResult = { status: 'authenticated' } | { status: 'unauthenticated' } | { status: 'expired' }

async function getSessionStatus(refreshBufferInSeconds: number): Promise<SessionCheckResult> {
  const session = await getAuthCookie()

  if (!session) {
    return { status: 'unauthenticated' }
  }

  if (isAccessTokenExpired(session.accessTokenExpiresAt, refreshBufferInSeconds)) {
    return { status: 'expired' }
  }

  return { status: 'authenticated' }
}

export const requireAuth = cache(async (options: AuthOptions = {}) => {
  const { redirectTo, refreshBufferInSeconds = 60 } = options

  const sessionStatus = await getSessionStatus(refreshBufferInSeconds)

  if (sessionStatus.status === 'unauthenticated') {
    redirect(buildLoginRedirectPath(redirectTo))
  }

  if (sessionStatus.status === 'expired') {
    redirect(buildRefreshRedirectPath(redirectTo))
  }

  const meResponse = await api<MeResponse>('/api/v1/auth/me')

  if (!meResponse.ok) {
    redirect(buildLoginRedirectPath(redirectTo))
  }

  return meResponseSchema.parse(await meResponse.json())
})

export const redirectIfAuthenticated = cache(async (options: AuthOptions = {}) => {
  const { redirectTo, refreshBufferInSeconds = 60 } = options

  const sessionStatus = await getSessionStatus(refreshBufferInSeconds)

  if (sessionStatus.status === 'unauthenticated') {
    return
  }

  if (sessionStatus.status === 'expired') {
    redirect(buildRefreshRedirectPath(redirectTo))
  }

  if (sessionStatus.status === 'authenticated') {
    const meResponse = await api<MeResponse>('/api/v1/auth/me')

    if (!meResponse.ok) {
      return
    }

    redirect(redirectTo ?? DEFAULT_AUTHENTICATED_PATH)
  }
})
