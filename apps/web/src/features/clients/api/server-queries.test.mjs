import assert from 'node:assert/strict'
import test from 'node:test'

import { clientsListResultToState } from './clients-list-state.ts'

const clientsResponse = {
  items: [],
  meta: {
    nextCursor: null,
    hasNextPage: false
  }
}

test('maps stale clients snapshots to a ready stale state', () => {
  const state = clientsListResultToState({
    status: 'stale',
    data: clientsResponse,
    reason: 'rate_limited',
    snapshot: {
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-01-01T00:05:00.000Z',
      scope: {
        userId: 'user-1',
        organizationId: 'org-1'
      }
    }
  })

  assert.deepEqual(state, {
    status: 'ready',
    data: clientsResponse,
    freshness: 'stale'
  })
})

test('maps rate limited clients without a snapshot to a temporary state', () => {
  const state = clientsListResultToState({
    status: 'unavailable',
    reason: 'rate_limited_no_snapshot',
    statusCode: 429
  })

  assert.deepEqual(state, {
    status: 'temporarily_unavailable',
    reason: 'rate_limited'
  })
})
