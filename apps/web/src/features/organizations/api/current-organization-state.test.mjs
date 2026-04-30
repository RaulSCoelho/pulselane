import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveCurrentOrganizationState } from './current-organization-state.ts'

const currentOrganization = {
  organization: {
    id: 'org-1',
    name: 'Acme Ops',
    slug: 'acme-ops'
  },
  currentRole: 'owner',
  plan: {
    plan: 'free',
    status: 'free',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false
  },
  limits: {
    members: 3,
    clients: 10,
    projects: 10,
    activeTasks: 100
  },
  usage: {
    members: 1,
    clients: 2,
    projects: 3,
    activeTasks: 4
  }
}

test('returns ready/fresh when an active organization exists and the API returns 200', async () => {
  const state = await resolveCurrentOrganizationState({
    activeOrganizationId: 'org-1',
    loadCurrentOrganization: async () => ({
      status: 'ok',
      data: currentOrganization
    })
  })

  assert.deepEqual(state, {
    status: 'ready',
    data: currentOrganization
  })
})

test('returns temporarily_unavailable when an active organization exists and the API is rate limited', async () => {
  const state = await resolveCurrentOrganizationState({
    activeOrganizationId: 'org-1',
    loadCurrentOrganization: async () => ({
      status: 'unavailable',
      reason: 'rate_limited',
      statusCode: 429
    })
  })

  assert.deepEqual(state, {
    status: 'temporarily_unavailable',
    reason: 'rate_limited'
  })
})

test('returns not_selected without loading the API when there is no active organization', async () => {
  let called = false

  const state = await resolveCurrentOrganizationState({
    activeOrganizationId: null,
    loadCurrentOrganization: async () => {
      called = true
      return {
        status: 'ok',
        data: currentOrganization
      }
    }
  })

  assert.deepEqual(state, { status: 'not_selected' })
  assert.equal(called, false)
})

test('returns forbidden when the API returns 403', async () => {
  const state = await resolveCurrentOrganizationState({
    activeOrganizationId: 'org-1',
    loadCurrentOrganization: async () => ({
      status: 'forbidden',
      statusCode: 403
    })
  })

  assert.deepEqual(state, { status: 'forbidden' })
})

test('returns not_found when the API returns 404', async () => {
  const state = await resolveCurrentOrganizationState({
    activeOrganizationId: 'org-1',
    loadCurrentOrganization: async () => ({
      status: 'not_found',
      statusCode: 404
    })
  })

  assert.deepEqual(state, { status: 'not_found' })
})
