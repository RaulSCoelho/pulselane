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

test('maps successful clients responses to a ready fresh state', () => {
  const state = clientsListResultToState({
    status: 'ok',
    data: clientsResponse
  })

  assert.deepEqual(state, {
    status: 'ready',
    data: clientsResponse
  })
})

test('maps rate limited clients to a temporary state', () => {
  const state = clientsListResultToState({
    status: 'unavailable',
    reason: 'rate_limited',
    statusCode: 429
  })

  assert.deepEqual(state, {
    status: 'temporarily_unavailable',
    reason: 'rate_limited'
  })
})
