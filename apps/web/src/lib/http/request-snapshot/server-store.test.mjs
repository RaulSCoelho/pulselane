import assert from 'node:assert/strict'
import test from 'node:test'
import { z } from 'zod'

import { readRequestSnapshotResult, writeRequestSnapshotToServerStore } from './server.ts'

const payloadSchema = z.object({
  id: z.string(),
  organizationId: z.string()
})

const scope = {
  userId: 'user-server-store',
  organizationId: 'org-server-store'
}

const payload = {
  id: 'client-server-store',
  organizationId: scope.organizationId
}

test('reads a scoped server-side snapshot without a response cookie round trip', async () => {
  const wroteSnapshot = await writeRequestSnapshotToServerStore('/api/v1/clients?limit=20', payload, {
    method: 'GET',
    maxAgeSeconds: 300,
    scope,
    tenantScoped: true,
    userScoped: true
  })

  const result = await readRequestSnapshotResult('/api/v1/clients?limit=20', payloadSchema, {
    method: 'GET',
    allowStaleFor: 'rate_limited',
    scope,
    staleIfRateLimitedSeconds: 3600,
    tenantScoped: true,
    userScoped: true
  })

  assert.equal(wroteSnapshot, true)
  assert.equal(result.status, 'fresh')
  assert.deepEqual(result.status === 'fresh' ? result.data : null, payload)
})
