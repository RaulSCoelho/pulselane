import { sessionsCacheTag } from '@/features/sessions/api/cache-tags'
import { cachedServerApiGet } from '@/http/server-api-client'
import { SessionListResponse, sessionListResponseSchema } from '@pulselane/contracts/auth'
import { cache } from 'react'

import { sessionsListResultToState, type SessionsListState } from './sessions-list-state'

export type { SessionsListState, SessionsUnavailableReason } from './sessions-list-state'

export const listSessions = cache(async function listSessions(userId: string): Promise<SessionsListState> {
  const result = await cachedServerApiGet<SessionListResponse>({
    path: '/api/v1/auth/sessions',
    schema: sessionListResponseSchema,
    tags: [sessionsCacheTag(userId)],
    revalidate: 60
  })

  return sessionsListResultToState(result)
})
