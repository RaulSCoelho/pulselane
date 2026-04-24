export type RateLimitRetryPolicy = {
  retryOnRateLimit?: boolean
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
  jitterRatio?: number
  random?: () => number
}

export const defaultRateLimitRetryPolicy = {
  retryOnRateLimit: true,
  maxRetries: 1,
  baseDelayMs: 300,
  maxDelayMs: 1200,
  jitterRatio: 0.25
} satisfies Required<Omit<RateLimitRetryPolicy, 'random'>>

export function normalizeRateLimitRetryPolicy(policy: RateLimitRetryPolicy = {}) {
  return {
    ...defaultRateLimitRetryPolicy,
    ...policy,
    maxRetries: Math.max(0, policy.maxRetries ?? defaultRateLimitRetryPolicy.maxRetries),
    baseDelayMs: Math.max(0, policy.baseDelayMs ?? defaultRateLimitRetryPolicy.baseDelayMs),
    maxDelayMs: Math.max(0, policy.maxDelayMs ?? defaultRateLimitRetryPolicy.maxDelayMs)
  }
}

export function parseRetryAfterMs(value: string | null, now = new Date()): number | null {
  if (!value) {
    return null
  }

  const seconds = Number(value)

  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000)
  }

  const retryAtMs = Date.parse(value)

  if (!Number.isFinite(retryAtMs)) {
    return null
  }

  return Math.max(0, retryAtMs - now.getTime())
}

export function getRateLimitRetryDelayMs(
  retryAfterHeader: string | null,
  attemptIndex: number,
  policy: RateLimitRetryPolicy = {}
): number {
  const normalizedPolicy = normalizeRateLimitRetryPolicy(policy)
  const retryAfterMs = parseRetryAfterMs(retryAfterHeader)

  if (retryAfterMs !== null) {
    return Math.min(retryAfterMs, normalizedPolicy.maxDelayMs)
  }

  const exponentialDelay = normalizedPolicy.baseDelayMs * 2 ** attemptIndex
  const cappedDelay = Math.min(exponentialDelay, normalizedPolicy.maxDelayMs)
  const random = normalizedPolicy.random ?? Math.random
  const jitter = cappedDelay * normalizedPolicy.jitterRatio * random()

  return Math.round(Math.min(cappedDelay + jitter, normalizedPolicy.maxDelayMs))
}

export function sleep(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms)
  })
}
