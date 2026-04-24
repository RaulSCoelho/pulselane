import 'server-only'

import {
  readRequestSnapshotResult,
  resolveRequestSnapshotScope,
  writeRequestSnapshot,
  writeRequestSnapshotToServerStore
} from '@/lib/http/request-snapshot/server'
import type { RequestSnapshotScope } from '@/lib/http/request-snapshot/shared'
import type { NextResponse } from 'next/server'
import type { z } from 'zod'

import type { ResilientGetResult } from './api-result'
import type { RateLimitRetryPolicy } from './rate-limit'
import { executeResilientGet } from './resilient-fetch-core'
import { serverApi, type ServerApiOptions } from './server-api-client'

type ResilientGetRequestOptions = Omit<ServerApiOptions, 'method' | 'saveSnapshot' | 'snapshotTarget'>

export type ResilientGetOptions<T> = {
  key: string
  path: string
  schema: z.ZodType<T>
  fallback?: 'last-valid' | 'none'
  tags?: string[]
  maxAgeSeconds?: number
  staleIfErrorSeconds?: number
  staleIfRateLimitedSeconds?: number
  tenantScoped?: boolean
  userScoped?: boolean
  scope?: RequestSnapshotScope
  retryPolicy?: RateLimitRetryPolicy
  request?: ResilientGetRequestOptions
  snapshotTarget?: NextResponse
}

export async function resilientGet<T>({
  key,
  path,
  schema,
  fallback = 'last-valid',
  tags = [],
  maxAgeSeconds,
  staleIfErrorSeconds,
  staleIfRateLimitedSeconds,
  tenantScoped,
  userScoped,
  scope: explicitScope,
  retryPolicy,
  request,
  snapshotTarget
}: ResilientGetOptions<T>): Promise<ResilientGetResult<T>> {
  const scope = await resolveRequestSnapshotScope({
    headers: request?.headers,
    scope: explicitScope,
    tenantScoped,
    userScoped
  })
  const snapshotTags = Array.from(new Set([`resilient:${key}`, ...tags]))
  const fallbackEnabled = fallback === 'last-valid'

  return executeResilientGet({
    retryPolicy,
    request: () =>
      serverApi(path, {
        ...request,
        method: 'GET',
        retry: 0
      }),
    parse: async response => schema.parse(await response.json()),
    readSnapshot: reason => {
      if (!fallbackEnabled) {
        return Promise.resolve({ status: 'miss', reason: 'missing' })
      }

      return readRequestSnapshotResult(path, schema, {
        method: 'GET',
        allowStaleFor: reason,
        scope,
        staleIfErrorSeconds,
        staleIfRateLimitedSeconds,
        tenantScoped,
        userScoped
      })
    },
    writeSnapshot: data => {
      if (!fallbackEnabled) {
        return Promise.resolve()
      }

      if ((userScoped && !scope.userId) || (tenantScoped && !scope.organizationId)) {
        return Promise.resolve()
      }

      if (snapshotTarget) {
        return writeRequestSnapshot(snapshotTarget, path, data, {
          method: 'GET',
          maxAgeSeconds,
          scope,
          tags: snapshotTags,
          tenantScoped,
          userScoped
        }).then(() => undefined)
      }

      return writeRequestSnapshotToServerStore(path, data, {
        method: 'GET',
        maxAgeSeconds,
        scope,
        tags: snapshotTags,
        tenantScoped,
        userScoped
      }).then(() => undefined)
    }
  })
}
