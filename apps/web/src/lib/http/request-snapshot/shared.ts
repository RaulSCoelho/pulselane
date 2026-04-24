import { z } from 'zod'

export const REQUEST_SNAPSHOT_ENDPOINT = '/api/internal/snapshots'
export const REQUEST_SNAPSHOT_COOKIE_NAME = 'request_snapshot'
export const REQUEST_SNAPSHOT_MAX_AGE_SECONDS = 60 * 5 // 5 minutes
export const REQUEST_SNAPSHOT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 // 24 hours
export const REQUEST_SNAPSHOT_MAX_COOKIE_BYTES = 3800
export const REQUEST_SNAPSHOT_MAX_ENTRIES = 16

export const requestSnapshotScopeSchema = z
  .object({
    userId: z.string().min(1).optional(),
    organizationId: z.string().min(1).optional()
  })
  .strict()

export const requestSnapshotEntrySchema = z.object({
  value: z.unknown(),
  createdAt: z.string().min(1),
  expiresAt: z.string().min(1),
  scope: requestSnapshotScopeSchema,
  tags: z.array(z.string().min(1)).optional()
})

export const requestSnapshotStoreSchema = z.record(z.string(), requestSnapshotEntrySchema)

export type RequestSnapshotScope = z.infer<typeof requestSnapshotScopeSchema>
export type RequestSnapshotEntry = z.infer<typeof requestSnapshotEntrySchema>
export type RequestSnapshotStore = z.infer<typeof requestSnapshotStoreSchema>
export type RequestSnapshotStaleReason = 'rate_limited' | 'server_error' | 'network_error'

export type RequestSnapshotMetadata = {
  createdAt: string
  expiresAt: string
  scope: RequestSnapshotScope
  tags?: string[]
}

export type RequestSnapshotReadResult<T> =
  | {
      status: 'fresh'
      data: T
      metadata: RequestSnapshotMetadata
    }
  | {
      status: 'stale'
      data: T
      metadata: RequestSnapshotMetadata
    }
  | {
      status: 'miss'
      reason: 'missing' | 'expired' | 'scope_mismatch' | 'invalid'
    }

export type EvaluateRequestSnapshotOptions = {
  scope?: RequestSnapshotScope
  userScoped?: boolean
  tenantScoped?: boolean
  allowStaleFor?: RequestSnapshotStaleReason
  staleIfErrorSeconds?: number
  staleIfRateLimitedSeconds?: number
  now?: Date
}

export function buildRequestSnapshotKey(url: string, method = 'GET'): string | null {
  try {
    const normalizedMethod = method.toUpperCase()

    if (normalizedMethod !== 'GET') {
      return null
    }

    const parsedUrl = new URL(url, 'http://localhost')
    const searchParams = new URLSearchParams(parsedUrl.search)
    const sortedEntries = Array.from(searchParams.entries()).sort(([keyA, valueA], [keyB, valueB]) => {
      if (keyA === keyB) {
        return valueA.localeCompare(valueB)
      }

      return keyA.localeCompare(keyB)
    })

    const normalizedSearch = new URLSearchParams(sortedEntries).toString()
    const normalizedPath = parsedUrl.pathname.replace(/\/+$/, '') || '/'

    return normalizedSearch.length > 0
      ? `${normalizedMethod}:${normalizedPath}?${normalizedSearch}`
      : `${normalizedMethod}:${normalizedPath}`
  } catch {
    return null
  }
}

export function buildRequestSnapshotEntry(
  value: unknown,
  options: {
    scope?: RequestSnapshotScope
    maxAgeSeconds?: number
    tags?: string[]
    now?: Date
  } = {}
): RequestSnapshotEntry {
  const now = options.now ?? new Date()
  const maxAgeSeconds = Math.max(0, options.maxAgeSeconds ?? REQUEST_SNAPSHOT_MAX_AGE_SECONDS)
  const expiresAt = new Date(now.getTime() + maxAgeSeconds * 1000)

  return {
    value,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    scope: normalizeRequestSnapshotScope(options.scope),
    tags: options.tags && options.tags.length > 0 ? Array.from(new Set(options.tags)) : undefined
  }
}

export function compactRequestSnapshotStore(
  store: RequestSnapshotStore,
  options: {
    now?: Date
    maxEntries?: number
  } = {}
): RequestSnapshotStore {
  const now = options.now ?? new Date()
  const maxEntries = options.maxEntries ?? REQUEST_SNAPSHOT_MAX_ENTRIES
  const retentionThresholdMs = now.getTime() - REQUEST_SNAPSHOT_COOKIE_MAX_AGE_SECONDS * 1000

  return Object.fromEntries(
    Object.entries(store)
      .filter(([, entry]) => {
        const createdAtMs = Date.parse(entry.createdAt)

        return Number.isFinite(createdAtMs) && createdAtMs >= retentionThresholdMs
      })
      .sort(([, entryA], [, entryB]) => Date.parse(entryB.createdAt) - Date.parse(entryA.createdAt))
      .slice(0, maxEntries)
  )
}

export function evaluateRequestSnapshot<T>(
  entry: RequestSnapshotEntry | undefined,
  schema: z.ZodType<T>,
  options: EvaluateRequestSnapshotOptions = {}
): RequestSnapshotReadResult<T> {
  if (!entry) {
    return { status: 'miss', reason: 'missing' }
  }

  if (
    !requestSnapshotScopesMatch(entry.scope, options.scope, {
      userScoped: options.userScoped,
      tenantScoped: options.tenantScoped
    })
  ) {
    return { status: 'miss', reason: 'scope_mismatch' }
  }

  const parsed = schema.safeParse(entry.value)

  if (!parsed.success) {
    return { status: 'miss', reason: 'invalid' }
  }

  const expiresAtMs = Date.parse(entry.expiresAt)

  if (!Number.isFinite(expiresAtMs)) {
    return { status: 'miss', reason: 'invalid' }
  }

  const metadata = toRequestSnapshotMetadata(entry)
  const nowMs = (options.now ?? new Date()).getTime()

  if (nowMs <= expiresAtMs) {
    return {
      status: 'fresh',
      data: parsed.data,
      metadata
    }
  }

  const staleWindowSeconds =
    options.allowStaleFor === 'rate_limited'
      ? options.staleIfRateLimitedSeconds
      : options.allowStaleFor
        ? options.staleIfErrorSeconds
        : 0

  if (staleWindowSeconds && nowMs <= expiresAtMs + staleWindowSeconds * 1000) {
    return {
      status: 'stale',
      data: parsed.data,
      metadata
    }
  }

  return { status: 'miss', reason: 'expired' }
}

export function normalizeRequestSnapshotScope(scope: RequestSnapshotScope | undefined): RequestSnapshotScope {
  return {
    ...(scope?.userId ? { userId: scope.userId } : {}),
    ...(scope?.organizationId ? { organizationId: scope.organizationId } : {})
  }
}

export function requestSnapshotScopesMatch(
  snapshotScope: RequestSnapshotScope,
  expectedScope: RequestSnapshotScope | undefined,
  options: {
    userScoped?: boolean
    tenantScoped?: boolean
  } = {}
): boolean {
  const normalizedSnapshotScope = normalizeRequestSnapshotScope(snapshotScope)
  const normalizedExpectedScope = normalizeRequestSnapshotScope(expectedScope)

  if (!scopeFieldMatches(normalizedSnapshotScope.userId, normalizedExpectedScope.userId, Boolean(options.userScoped))) {
    return false
  }

  if (
    !scopeFieldMatches(
      normalizedSnapshotScope.organizationId,
      normalizedExpectedScope.organizationId,
      Boolean(options.tenantScoped)
    )
  ) {
    return false
  }

  return true
}

function scopeFieldMatches(snapshotValue: string | undefined, expectedValue: string | undefined, required: boolean) {
  if (required) {
    return Boolean(snapshotValue && expectedValue && snapshotValue === expectedValue)
  }

  if (snapshotValue && expectedValue) {
    return snapshotValue === expectedValue
  }

  return true
}

function toRequestSnapshotMetadata(entry: RequestSnapshotEntry): RequestSnapshotMetadata {
  return {
    createdAt: entry.createdAt,
    expiresAt: entry.expiresAt,
    scope: entry.scope,
    tags: entry.tags
  }
}
