import { resilientResultHasData } from '@/http/api-result'
import { resilientGet } from '@/http/resilient-fetch'
import { DEFAULT_AUTHENTICATED_PATH } from '@/lib/auth/auth-constants'
import { buildLoginRedirectPath, buildRefreshRedirectPath } from '@/lib/auth/auth-redirect'
import { getAuthSession } from '@/lib/auth/auth-session'
import { isAccessTokenExpired } from '@/lib/auth/auth-token'
import { MeResponse, meResponseSchema } from '@pulselane/contracts'
import { redirect } from 'next/navigation'
import { cache } from 'react'

type AuthOptions = {
  redirectTo?: string
  refreshBufferInSeconds?: number
}

type SessionCheckResult = { status: 'authenticated' } | { status: 'unauthenticated' } | { status: 'expired' }

type MeResult =
  | { status: 'ok'; data: MeResponse }
  | { status: 'rate_limited_no_snapshot' }
  | { status: 'unauthorized' }
  | { status: 'error' }

async function getSessionStatus(refreshBufferInSeconds: number): Promise<SessionCheckResult> {
  const session = await getAuthSession({ accessTokenRequired: true })

  if (!session) {
    return { status: 'unauthenticated' }
  }

  if (isAccessTokenExpired(session.accessToken, refreshBufferInSeconds)) {
    return { status: 'expired' }
  }

  return { status: 'authenticated' }
}

async function fetchMe(): Promise<MeResult> {
  const result = await resilientGet<MeResponse>({
    key: 'auth.me',
    path: '/api/v1/auth/me',
    schema: meResponseSchema,
    fallback: 'last-valid',
    maxAgeSeconds: 300,
    staleIfErrorSeconds: 900,
    staleIfRateLimitedSeconds: 3600,
    userScoped: true
  })

  if (resilientResultHasData(result)) {
    return { status: 'ok', data: result.data }
  }

  if (result.status === 'unauthorized') {
    return { status: 'unauthorized' }
  }

  if (result.status === 'unavailable' && result.reason === 'rate_limited_no_snapshot') {
    return { status: 'rate_limited_no_snapshot' }
  }

  return { status: 'error' }
}

async function resolveCurrentUserOrSnapshot(redirectTo: string | undefined): Promise<MeResponse> {
  const result = await fetchMe()

  if (result.status === 'ok') {
    return result.data
  }

  if (result.status === 'unauthorized') {
    redirect(buildRefreshRedirectPath(redirectTo))
  }

  redirect(buildLoginRedirectPath(redirectTo))
}

async function isAuthenticatedServerSide(): Promise<boolean> {
  const result = await fetchMe()
  return result.status === 'ok'
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

  if (!(await isAuthenticatedServerSide())) {
    return
  }

  redirect(redirectTo ?? DEFAULT_AUTHENTICATED_PATH)
})
