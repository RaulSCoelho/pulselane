import assert from 'node:assert/strict'
import test from 'node:test'
import { z } from 'zod'

import { buildRequestSnapshotEntry, evaluateRequestSnapshot } from '../lib/http/request-snapshot/shared.ts'
import { executeResilientGet } from './resilient-fetch-core.ts'

const payloadSchema = z.object({
  id: z.string(),
  organizationId: z.string()
})

const now = new Date('2026-01-01T00:00:00.000Z')
const expectedScope = {
  userId: 'user-1',
  organizationId: 'org-1'
}
const payload = {
  id: 'client-1',
  organizationId: 'org-1'
}

function rateLimitedResponse() {
  return new Response(null, { status: 429 })
}

function unauthorizedResponse() {
  return new Response(null, { status: 401 })
}

function readSnapshotFromEntry(entry, reason, currentTime = now) {
  return evaluateRequestSnapshot(entry, payloadSchema, {
    allowStaleFor: reason,
    now: currentTime,
    scope: expectedScope,
    staleIfErrorSeconds: 3600,
    staleIfRateLimitedSeconds: 3600,
    tenantScoped: true,
    userScoped: true
  })
}

test('returns stale data on 429 when a scoped snapshot is available', async () => {
  const snapshot = buildRequestSnapshotEntry(payload, {
    maxAgeSeconds: 300,
    now,
    scope: expectedScope
  })

  const result = await executeResilientGet({
    request: async () => rateLimitedResponse(),
    parse: async response => payloadSchema.parse(await response.json()),
    readSnapshot: async reason => readSnapshotFromEntry(snapshot, reason),
    retryPolicy: { maxRetries: 0 }
  })

  assert.equal(result.status, 'stale')
  assert.equal(result.status === 'stale' ? result.reason : null, 'rate_limited')
  assert.deepEqual(result.status === 'stale' ? result.data : null, payload)
})

test('returns unavailable on 429 when no snapshot exists', async () => {
  const result = await executeResilientGet({
    request: async () => rateLimitedResponse(),
    parse: async response => payloadSchema.parse(await response.json()),
    readSnapshot: async () => ({ status: 'miss', reason: 'missing' }),
    retryPolicy: { maxRetries: 0 }
  })

  assert.deepEqual(result, {
    status: 'unavailable',
    reason: 'rate_limited_no_snapshot',
    statusCode: 429
  })
})

test('does not treat expired snapshots as fresh, but allows them as stale inside the configured window', () => {
  const snapshot = buildRequestSnapshotEntry(payload, {
    maxAgeSeconds: 60,
    now,
    scope: expectedScope
  })
  const afterExpiry = new Date(now.getTime() + 120 * 1000)

  const freshRead = evaluateRequestSnapshot(snapshot, payloadSchema, {
    now: afterExpiry,
    scope: expectedScope,
    tenantScoped: true,
    userScoped: true
  })
  const staleRead = readSnapshotFromEntry(snapshot, 'rate_limited', afterExpiry)

  assert.deepEqual(freshRead, { status: 'miss', reason: 'expired' })
  assert.equal(staleRead.status, 'stale')
})

test('rejects snapshots from another user or organization', () => {
  const snapshot = buildRequestSnapshotEntry(payload, {
    maxAgeSeconds: 300,
    now,
    scope: {
      userId: 'user-2',
      organizationId: 'org-2'
    }
  })

  const result = evaluateRequestSnapshot(snapshot, payloadSchema, {
    now,
    scope: expectedScope,
    tenantScoped: true,
    userScoped: true
  })

  assert.deepEqual(result, { status: 'miss', reason: 'scope_mismatch' })
})

test('does not use snapshot fallback for 401 responses', async () => {
  let snapshotWasRead = false
  const result = await executeResilientGet({
    request: async () => unauthorizedResponse(),
    parse: async response => payloadSchema.parse(await response.json()),
    readSnapshot: async reason => {
      snapshotWasRead = true
      return readSnapshotFromEntry(
        buildRequestSnapshotEntry(payload, {
          maxAgeSeconds: 300,
          now,
          scope: expectedScope
        }),
        reason
      )
    },
    retryPolicy: { maxRetries: 0 }
  })

  assert.deepEqual(result, { status: 'unauthorized', statusCode: 401 })
  assert.equal(snapshotWasRead, false)
})
