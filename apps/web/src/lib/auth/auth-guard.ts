import { api } from '@/http/api-client'
import { MeResponse, meResponseSchema } from '@pulselane/contracts'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { readRequestSnapshot } from '../http/request-snapshot/server'
import { DEFAULT_AUTHENTICATED_PATH } from './auth-constants'
import { buildLoginRedirectPath, buildRefreshRedirectPath } from './auth-redirect'
import { getAuthSession } from './auth-session'
import { isAccessTokenExpired } from './auth-token'

type AuthOptions = {
  redirectTo?: string
  refreshBufferInSeconds?: number
}

type SessionCheckResult = { status: 'authenticated' } | { status: 'unauthenticated' } | { status: 'expired' }

async function getSessionStatus(refreshBufferInSeconds: number): Promise<SessionCheckResult> {
  const session = await getAuthSession()

  if (!session) {
    return { status: 'unauthenticated' }
  }

  if (isAccessTokenExpired(session.accessToken, refreshBufferInSeconds)) {
    return { status: 'expired' }
  }

  return { status: 'authenticated' }
}

async function resolveCurrentUserOrSnapshot(redirectTo: string | undefined): Promise<MeResponse> {
  const meResponse = await api<MeResponse>('/api/v1/auth/me')

  if (meResponse.ok) {
    return meResponseSchema.parse(await meResponse.json())
  }

  if (meResponse.status === 429) {
    const snapshot = await readRequestSnapshot('/api/v1/auth/me', meResponseSchema)

    if (snapshot) {
      return snapshot
    }
  }

  if (meResponse.status === 401) {
    redirect(buildRefreshRedirectPath(redirectTo))
  }

  redirect(buildLoginRedirectPath(redirectTo))
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

  return resolveCurrentUserOrSnapshot(redirectTo)
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
    await resolveCurrentUserOrSnapshot(redirectTo)
    redirect(redirectTo ?? DEFAULT_AUTHENTICATED_PATH)
  }
})
