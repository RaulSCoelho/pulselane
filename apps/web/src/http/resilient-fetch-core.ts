import type { RequestSnapshotReadResult, RequestSnapshotStaleReason } from '@/lib/http/request-snapshot/shared'

import type { ResilientGetResult } from './api-result'
import {
  getRateLimitRetryDelayMs,
  normalizeRateLimitRetryPolicy,
  sleep as defaultSleep,
  type RateLimitRetryPolicy
} from './rate-limit'

type ResilientGetCoreOptions<T> = {
  request: () => Promise<Response>
  parse: (response: Response) => Promise<T>
  readSnapshot: (reason: RequestSnapshotStaleReason) => Promise<RequestSnapshotReadResult<T>>
  writeSnapshot?: (data: T) => Promise<void>
  retryPolicy?: RateLimitRetryPolicy
  sleep?: (ms: number) => Promise<void>
}

export async function executeResilientGet<T>({
  request,
  parse,
  readSnapshot,
  writeSnapshot,
  retryPolicy,
  sleep = defaultSleep
}: ResilientGetCoreOptions<T>): Promise<ResilientGetResult<T>> {
  const normalizedRetryPolicy = normalizeRateLimitRetryPolicy(retryPolicy)
  let retryAttempt = 0

  while (true) {
    let response: Response

    try {
      response = await request()
    } catch {
      return resolveSnapshotFallback(readSnapshot, 'network_error', 'network_error_no_snapshot')
    }

    if (response.ok) {
      const data = await parse(response)
      await writeSnapshot?.(data)

      return { status: 'fresh', data }
    }

    if (response.status === 400) {
      return { status: 'bad_request', statusCode: 400 }
    }

    if (response.status === 401) {
      return { status: 'unauthorized', statusCode: 401 }
    }

    if (response.status === 403) {
      return { status: 'forbidden', statusCode: 403 }
    }

    if (response.status === 404) {
      return { status: 'not_found', statusCode: 404 }
    }

    if (response.status === 429) {
      if (normalizedRetryPolicy.retryOnRateLimit && retryAttempt < normalizedRetryPolicy.maxRetries) {
        await sleep(getRateLimitRetryDelayMs(response.headers.get('retry-after'), retryAttempt, normalizedRetryPolicy))
        retryAttempt += 1
        continue
      }

      return resolveSnapshotFallback(readSnapshot, 'rate_limited', 'rate_limited_no_snapshot', response.status)
    }

    if (response.status >= 500) {
      return resolveSnapshotFallback(readSnapshot, 'server_error', 'server_error_no_snapshot', response.status)
    }

    return { status: 'unavailable', reason: 'http_error_no_snapshot', statusCode: response.status }
  }
}

async function resolveSnapshotFallback<T>(
  readSnapshot: (reason: RequestSnapshotStaleReason) => Promise<RequestSnapshotReadResult<T>>,
  reason: RequestSnapshotStaleReason,
  noSnapshotReason: Extract<ResilientGetResult<T>, { status: 'unavailable' }>['reason'],
  statusCode?: number
): Promise<ResilientGetResult<T>> {
  const snapshot = await readSnapshot(reason)

  if (snapshot.status === 'fresh' || snapshot.status === 'stale') {
    return {
      status: 'stale',
      data: snapshot.data,
      reason,
      snapshot: snapshot.metadata
    }
  }

  return {
    status: 'unavailable',
    reason: noSnapshotReason,
    statusCode
  }
}
