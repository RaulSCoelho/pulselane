import { serverApiFetch } from '@/http/server-api-client'
import { buildLoginRedirectPath } from '@/lib/auth/auth-redirect'
import { DEFAULT_AUTHENTICATED_PATH } from '@/lib/auth/auth.constants'
import { meResponseSchema, type MeResponse } from '@pulselane/contracts/auth'
import { redirect } from 'next/navigation'
import { cache } from 'react'

export type ServerSessionState =
  | {
      status: 'authenticated'
      me: MeResponse
    }
  | {
      status: 'unauthenticated'
    }
  | {
      status: 'error'
    }

const getCachedServerSessionState = cache(async (): Promise<ServerSessionState> => {
  const response = await serverApiFetch<MeResponse>('auth/me')

  if (response.status === 401) {
    return {
      status: 'unauthenticated'
    }
  }

  if (!response.ok) {
    return {
      status: 'error'
    }
  }

  return {
    status: 'authenticated',
    me: meResponseSchema.parse(await response.json())
  }
})

export async function getServerSessionState(): Promise<ServerSessionState> {
  return getCachedServerSessionState()
}

export async function requireServerSession(redirectTo: string): Promise<MeResponse> {
  const session = await getServerSessionState()

  if (session.status === 'authenticated') {
    return session.me
  }

  if (session.status === 'unauthenticated') {
    redirect(buildLoginRedirectPath(redirectTo))
  }

  throw new Error('Failed to validate the authenticated session')
}

export async function redirectAuthenticatedUser(redirectTo = DEFAULT_AUTHENTICATED_PATH): Promise<void> {
  const session = await getServerSessionState()

  if (session.status === 'authenticated') {
    redirect(redirectTo)
  }
}
