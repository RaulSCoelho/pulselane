'use server'

import { getAuthSession } from '@/lib/auth/auth-session'
import { getUserIdFromAccessToken } from '@/lib/auth/auth-token'
import { ACTIVE_ORGANIZATION_HEADER_NAME } from '@/lib/organizations/organization-context-constants'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'
import { gunzipSync, gzipSync } from 'node:zlib'
import { z } from 'zod'

import { setRequestSnapshots } from './cookies'
import {
  REQUEST_SNAPSHOT_COOKIE_NAME,
  REQUEST_SNAPSHOT_MAX_AGE_SECONDS,
  REQUEST_SNAPSHOT_MAX_COOKIE_BYTES,
  buildRequestSnapshotEntry,
  buildRequestSnapshotKey,
  compactRequestSnapshotStore,
  evaluateRequestSnapshot,
  normalizeRequestSnapshotScope,
  requestSnapshotStoreSchema,
  type EvaluateRequestSnapshotOptions,
  type RequestSnapshotReadResult,
  type RequestSnapshotScope,
  type RequestSnapshotStore
} from './shared'

type ReadRequestSnapshotOptions = EvaluateRequestSnapshotOptions & {
  method?: string
}

type WriteRequestSnapshotOptions = {
  method?: string
  maxAgeSeconds?: number
  scope?: RequestSnapshotScope
  tags?: string[]
  userScoped?: boolean
  tenantScoped?: boolean
  now?: Date
}

type SnapshotHeadersInit = HeadersInit | Record<string, string | undefined>

type ResolveRequestSnapshotScopeOptions = {
  headers?: SnapshotHeadersInit
  request?: Request
  scope?: RequestSnapshotScope
  userScoped?: boolean
  tenantScoped?: boolean
}

const REQUEST_SNAPSHOT_SERVER_MAX_ENTRIES = 512
const requestSnapshotServerStoreSymbol = Symbol.for('pulselane.request-snapshot.server-store')
const legacyRequestSnapshotStoreSchema = z.record(z.string(), z.unknown())

type GlobalWithRequestSnapshotStore = typeof globalThis & {
  [requestSnapshotServerStoreSymbol]?: RequestSnapshotStore
}

function encodeSnapshotStore(store: RequestSnapshotStore): string {
  const json = JSON.stringify(store)
  const compressed = gzipSync(Buffer.from(json, 'utf8'))

  return compressed.toString('base64url')
}

function decodeSnapshotStore(rawValue: string, now = new Date()): RequestSnapshotStore | null {
  try {
    const compressed = Buffer.from(rawValue, 'base64url')
    const json = gunzipSync(compressed).toString('utf8')
    const decoded = JSON.parse(json)
    const parsedStore = requestSnapshotStoreSchema.safeParse(decoded)

    if (parsedStore.success) {
      return parsedStore.data
    }

    const legacyStore = legacyRequestSnapshotStoreSchema.safeParse(decoded)

    if (!legacyStore.success) {
      return null
    }

    return Object.fromEntries(
      Object.entries(legacyStore.data).map(([key, value]) => [
        key,
        buildRequestSnapshotEntry(value, {
          now,
          maxAgeSeconds: REQUEST_SNAPSHOT_MAX_AGE_SECONDS
        })
      ])
    )
  } catch {
    return null
  }
}

async function readSnapshotStore(now = new Date()): Promise<RequestSnapshotStore> {
  let rawValue: string | undefined

  try {
    const cookieStore = await cookies()
    rawValue = cookieStore.get(REQUEST_SNAPSHOT_COOKIE_NAME)?.value
  } catch {
    rawValue = undefined
  }

  if (!rawValue) {
    return {}
  }

  return decodeSnapshotStore(rawValue, now) ?? {}
}

function getServerSnapshotStore(): RequestSnapshotStore {
  const globalStore = globalThis as GlobalWithRequestSnapshotStore

  globalStore[requestSnapshotServerStoreSymbol] ??= {}

  return globalStore[requestSnapshotServerStoreSymbol]
}

function buildServerSnapshotStoreKey(snapshotKey: string, scope: RequestSnapshotScope | undefined): string {
  return JSON.stringify({
    key: snapshotKey,
    scope: normalizeRequestSnapshotScope(scope)
  })
}

function normalizeReadOptions(methodOrOptions: string | ReadRequestSnapshotOptions): ReadRequestSnapshotOptions {
  return typeof methodOrOptions === 'string' ? { method: methodOrOptions } : methodOrOptions
}

function normalizeWriteOptions(methodOrOptions: string | WriteRequestSnapshotOptions): WriteRequestSnapshotOptions {
  return typeof methodOrOptions === 'string' ? { method: methodOrOptions } : methodOrOptions
}

function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null
  }

  const [scheme, token] = authorizationHeader.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token
}

function toHeaders(headers: SnapshotHeadersInit | undefined): Headers | null {
  if (!headers) {
    return null
  }

  if (headers instanceof Headers) {
    return headers
  }

  if (Array.isArray(headers)) {
    return new Headers(headers)
  }

  return new Headers(Object.entries(headers).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
}

function getHeaderValue(headers: Headers | null, headerName: string): string | null {
  const value = headers?.get(headerName)
  return value && value.length > 0 ? value : null
}

function encodeSnapshotStoreWithinCookieLimit(store: RequestSnapshotStore, protectedKey: string): string | null {
  let nextStore = store
  let encoded = encodeSnapshotStore(nextStore)

  while (Buffer.byteLength(encoded, 'utf8') > REQUEST_SNAPSHOT_MAX_COOKIE_BYTES) {
    const removableKey = Object.entries(nextStore)
      .filter(([key]) => key !== protectedKey)
      .sort(([, entryA], [, entryB]) => Date.parse(entryA.createdAt) - Date.parse(entryB.createdAt))[0]?.[0]

    if (!removableKey) {
      break
    }

    nextStore = Object.fromEntries(Object.entries(nextStore).filter(([key]) => key !== removableKey))
    encoded = encodeSnapshotStore(nextStore)
  }

  return Buffer.byteLength(encoded, 'utf8') <= REQUEST_SNAPSHOT_MAX_COOKIE_BYTES ? encoded : null
}

export async function resolveRequestSnapshotScope(
  options: ResolveRequestSnapshotScopeOptions = {}
): Promise<RequestSnapshotScope> {
  const explicitScope = normalizeRequestSnapshotScope(options.scope)
  const requestHeaders = options.request?.headers ?? toHeaders(options.headers)
  const token = extractBearerToken(getHeaderValue(requestHeaders, 'authorization'))
  const session = options.userScoped && !explicitScope.userId ? await getAuthSession() : null

  const userId =
    explicitScope.userId ??
    (token ? getUserIdFromAccessToken(token) : null) ??
    (session?.accessToken ? getUserIdFromAccessToken(session.accessToken) : null) ??
    undefined

  const organizationId =
    explicitScope.organizationId ??
    getHeaderValue(requestHeaders, ACTIVE_ORGANIZATION_HEADER_NAME) ??
    (options.tenantScoped ? await getActiveOrganizationIdFromServerCookies() : null) ??
    undefined

  return normalizeRequestSnapshotScope({
    userId,
    organizationId
  })
}

export async function readRequestSnapshotResult<T>(
  requestUrl: string,
  schema: z.ZodType<T>,
  methodOrOptions: string | ReadRequestSnapshotOptions = 'GET'
): Promise<RequestSnapshotReadResult<T>> {
  const options = normalizeReadOptions(methodOrOptions)
  const snapshotKey = buildRequestSnapshotKey(requestUrl, options.method ?? 'GET')

  if (!snapshotKey) {
    return { status: 'miss', reason: 'missing' }
  }

  const store = await readSnapshotStore(options.now)
  const cookieResult = evaluateRequestSnapshot(store[snapshotKey], schema, options)

  if (cookieResult.status === 'fresh' || cookieResult.status === 'stale') {
    return cookieResult
  }

  const serverStore = getServerSnapshotStore()
  const serverSnapshotKey = buildServerSnapshotStoreKey(snapshotKey, options.scope)

  return evaluateRequestSnapshot(serverStore[serverSnapshotKey], schema, options)
}

export async function readRequestSnapshot<T>(
  requestUrl: string,
  schema: z.ZodType<T>,
  methodOrOptions: string | ReadRequestSnapshotOptions = 'GET'
): Promise<T | null> {
  const result = await readRequestSnapshotResult(requestUrl, schema, methodOrOptions)

  return result.status === 'fresh' || result.status === 'stale' ? result.data : null
}

export async function writeRequestSnapshot(
  response: NextResponse,
  requestUrl: string,
  value: unknown,
  methodOrOptions: string | WriteRequestSnapshotOptions = 'GET'
): Promise<boolean> {
  const options = normalizeWriteOptions(methodOrOptions)
  const snapshotKey = buildRequestSnapshotKey(requestUrl, options.method ?? 'GET')

  if (!snapshotKey) {
    return false
  }

  const scope = normalizeRequestSnapshotScope(options.scope)

  if ((options.userScoped && !scope.userId) || (options.tenantScoped && !scope.organizationId)) {
    return false
  }

  const wroteServerSnapshot = writeRequestSnapshotToServerStoreByKey(snapshotKey, value, options)
  const currentStore = await readSnapshotStore(options.now)
  const nextStore = compactRequestSnapshotStore(
    {
      ...currentStore,
      [snapshotKey]: buildRequestSnapshotEntry(value, {
        maxAgeSeconds: options.maxAgeSeconds,
        now: options.now,
        scope,
        tags: options.tags
      })
    },
    { now: options.now }
  )

  const encoded = encodeSnapshotStoreWithinCookieLimit(nextStore, snapshotKey)

  if (!encoded) {
    return wroteServerSnapshot
  }

  setRequestSnapshots(response, encoded)

  return true
}

export async function writeRequestSnapshotToServerStore(
  requestUrl: string,
  value: unknown,
  methodOrOptions: string | WriteRequestSnapshotOptions = 'GET'
): Promise<boolean> {
  const options = normalizeWriteOptions(methodOrOptions)
  const snapshotKey = buildRequestSnapshotKey(requestUrl, options.method ?? 'GET')

  if (!snapshotKey) {
    return false
  }

  return writeRequestSnapshotToServerStoreByKey(snapshotKey, value, options)
}

function writeRequestSnapshotToServerStoreByKey(
  snapshotKey: string,
  value: unknown,
  options: WriteRequestSnapshotOptions
): boolean {
  const scope = normalizeRequestSnapshotScope(options.scope)

  if ((options.userScoped && !scope.userId) || (options.tenantScoped && !scope.organizationId)) {
    return false
  }

  const serverStore = getServerSnapshotStore()
  const serverSnapshotKey = buildServerSnapshotStoreKey(snapshotKey, scope)
  const nextStore = compactRequestSnapshotStore(
    {
      ...serverStore,
      [serverSnapshotKey]: buildRequestSnapshotEntry(value, {
        maxAgeSeconds: options.maxAgeSeconds,
        now: options.now,
        scope,
        tags: options.tags
      })
    },
    {
      maxEntries: REQUEST_SNAPSHOT_SERVER_MAX_ENTRIES,
      now: options.now
    }
  )

  const globalStore = globalThis as GlobalWithRequestSnapshotStore

  globalStore[requestSnapshotServerStoreSymbol] = nextStore

  return true
}
