import assert from 'node:assert/strict'
import test from 'node:test'

import { getAppShellOrganizationContextView } from './app-shell-organization-context.ts'

const readyState = {
  status: 'ready',
  freshness: 'fresh',
  data: {
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
}

test('does not show Missing when organization context is rate limited without a snapshot', () => {
  const view = getAppShellOrganizationContextView({
    status: 'temporarily_unavailable',
    reason: 'rate_limited'
  })

  assert.equal(Object.values(view).includes('Missing'), false)
  assert.equal(view.organizationName, 'Organization context temporarily unavailable')
  assert.equal(view.activeContextValue, 'Temporarily unavailable')
})

test('shows No organization selected only for not_selected state', () => {
  const notSelectedView = getAppShellOrganizationContextView({ status: 'not_selected' })
  const unavailableView = getAppShellOrganizationContextView({
    status: 'temporarily_unavailable',
    reason: 'rate_limited'
  })
  const readyView = getAppShellOrganizationContextView(readyState)

  assert.equal(notSelectedView.organizationName, 'No organization selected')
  assert.equal(notSelectedView.activeContextValue, 'No organization selected')
  assert.equal(Object.values(unavailableView).includes('No organization selected'), false)
  assert.equal(Object.values(readyView).includes('No organization selected'), false)
})
