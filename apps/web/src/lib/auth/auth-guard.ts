import { api } from '@/http/api-client'
import { MeResponse, meResponseSchema } from '@pulselane/contracts'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { getAuthCookie } from './auth-cookie'
import { buildLoginRedirectPath, buildRefreshRedirectPath } from './auth-redirect'
import { isAccessTokenExpired } from './auth-session'

type RequireAuthOptions = {
  redirectTo: string
  refreshBufferInSeconds?: number
}

export const requireAuth = cache(async (options: RequireAuthOptions) => {
  const { redirectTo, refreshBufferInSeconds = 60 } = options

  const session = await getAuthCookie()

  if (!session) {
    redirect(buildLoginRedirectPath(redirectTo))
  }

  if (isAccessTokenExpired(session.accessTokenExpiresAt, refreshBufferInSeconds)) {
    redirect(buildRefreshRedirectPath(redirectTo))
  }

  const meResponse = await api<MeResponse>('/api/v1/auth/me')

  if (!meResponse.ok) {
    redirect(buildLoginRedirectPath(redirectTo))
  }

  return meResponseSchema.parse(await meResponse.json())
})
