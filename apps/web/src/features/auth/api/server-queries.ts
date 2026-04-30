import { cachedServerApiGet } from '@/http/server-api-client'
import { serverGetResultHasData } from '@/http/server-api-result'
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
  | { status: 'rate_limited' }
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

const fetchMe = cache(async function fetchMe(): Promise<MeResult> {
  const result = await cachedServerApiGet<MeResponse>({
    path: '/api/v1/auth/me',
    schema: meResponseSchema,
    revalidate: 300
  })

  if (serverGetResultHasData(result)) {
    return { status: 'ok', data: result.data }
  }

  if (result.status === 'unauthorized') {
    return { status: 'unauthorized' }
  }

  if (result.status === 'unavailable' && result.reason === 'rate_limited') {
    return { status: 'rate_limited' }
  }

  return { status: 'error' }
})

async function resolveCurrentUser(redirectTo: string | undefined): Promise<MeResponse> {
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

const requireAuthCached = cache(async (redirectTo: string | undefined, refreshBufferInSeconds: number) => {
  const sessionStatus = await getSessionStatus(refreshBufferInSeconds)

  if (sessionStatus.status === 'unauthenticated') {
    redirect(buildLoginRedirectPath(redirectTo))
  }

  if (sessionStatus.status === 'expired') {
    redirect(buildRefreshRedirectPath(redirectTo))
  }

  return resolveCurrentUser(redirectTo)
})

const redirectIfAuthenticatedCached = cache(async (redirectTo: string | undefined, refreshBufferInSeconds: number) => {
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

export function requireAuth(options: AuthOptions = {}) {
  const { redirectTo, refreshBufferInSeconds = 60 } = options

  return requireAuthCached(redirectTo, refreshBufferInSeconds)
}

export function redirectIfAuthenticated(options: AuthOptions = {}) {
  const { redirectTo, refreshBufferInSeconds = 60 } = options

  return redirectIfAuthenticatedCached(redirectTo, refreshBufferInSeconds)
}
