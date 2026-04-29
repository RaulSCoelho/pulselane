import { sessionsCacheTag } from '@/features/sessions/api/cache-tags'
import { resilientResultHasData } from '@/http/api-result'
import { resilientGet } from '@/http/resilient-fetch'
import { SessionListResponse, sessionListResponseSchema } from '@pulselane/contracts/auth'
import { cache } from 'react'

import { sessionsListResultToState, type SessionsListState } from './sessions-list-state'

export type { SessionsListState, SessionsUnavailableReason } from './sessions-list-state'

export const listSessions = cache(async function listSessions(userId: string): Promise<SessionsListState> {
  const result = await resilientGet<SessionListResponse>({
    key: 'auth.sessions',
    path: '/api/v1/auth/sessions',
    schema: sessionListResponseSchema,
    fallback: 'last-valid',
    tags: [sessionsCacheTag(userId)],
    maxAgeSeconds: 60,
    staleIfErrorSeconds: 900,
    staleIfRateLimitedSeconds: 1800,
    tenantScoped: false,
    userScoped: true
  })

  if (resilientResultHasData(result)) {
    return sessionsListResultToState(result)
  }

  return sessionsListResultToState(result)
})
