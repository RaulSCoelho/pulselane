export type EmailTransport = 'logger' | 'smtp'
export type CorsOriginResolver =
  | string[]
  | ((origin: string | undefined, callback: (error: Error | null, allow: boolean) => void) => void)
export type TrustProxyConfig = boolean | string | string[] | number
export type EnvConfig = ReturnType<typeof configuration>

function parseAllowedCorsOrigins(rawValue: string): CorsOriginResolver {
  const value = rawValue.trim()

  if (!value) {
    return []
  }

  if (value === '*') {
    return ['*']
  }

  if (value.startsWith('.')) {
    const baseDomain = value.slice(1).trim().toLowerCase()

    return function resolveCorsOrigin(origin, callback) {
      if (!origin) {
        callback(null, true)
        return
      }

      try {
        const url = new URL(origin)
        const hostname = url.hostname.toLowerCase()

        const isHttps = url.protocol === 'https:'
        const isRootDomain = hostname === baseDomain
        const isSubdomain = hostname.endsWith(`.${baseDomain}`)

        callback(null, isHttps && (isRootDomain || isSubdomain))
      } catch {
        callback(null, false)
      }
    }
  }

  return value
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
}

export function parseTrustProxy(rawValue: string | undefined): TrustProxyConfig {
  const value = rawValue?.trim()

  if (!value) {
    return false
  }

  const lowerValue = value.toLowerCase()

  if (lowerValue === 'true') {
    return true
  }

  if (lowerValue === 'false') {
    return false
  }

  if (/^\d+$/.test(value)) {
    const hopCount = Number(value)

    if (hopCount <= 0) {
      throw new Error('TRUST_PROXY hop count must be greater than 0.')
    }

    return hopCount
  }

  const entries = value.split(',').map(entry => entry.trim())

  if (entries.some(entry => !entry)) {
    throw new Error('TRUST_PROXY contains an empty proxy entry.')
  }

  return entries.length === 1 ? entries[0] : entries
}

export function configuration() {
  const nodeEnv = process.env.NODE_ENV ?? 'development'

  return {
    // app
    port: Number(process.env.PORT ?? 3001),
    nodeEnv,
    allowedCorsOrigins: parseAllowedCorsOrigins(process.env.ALLOWED_CORS_ORIGINS ?? ''),
    trustProxy: parseTrustProxy(process.env.TRUST_PROXY),

    // observability
    logLevel: process.env.LOG_LEVEL ?? (nodeEnv === 'production' ? 'info' : 'debug'),
    slowRequestThresholdMs: Number(process.env.SLOW_REQUEST_THRESHOLD_MS ?? 1000),
    metricsBearerToken: process.env.METRICS_BEARER_TOKEN!,

    sentryEnabled: process.env.SENTRY_ENABLED === 'true',
    sentryDsn: process.env.SENTRY_DSN,
    sentryEnvironment: process.env.SENTRY_ENVIRONMENT ?? nodeEnv,
    sentryRelease: process.env.SENTRY_RELEASE,
    sentryTracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),

    // throttling
    throttlingEnabled: process.env.THROTTLING_ENABLED ? process.env.THROTTLING_ENABLED === 'true' : nodeEnv !== 'test',
    rateLimitTtlMs: Number(process.env.RATE_LIMIT_TTL_MS ?? 60_000),
    rateLimitLimit: Number(process.env.RATE_LIMIT_LIMIT ?? 120),

    // cookie
    cookieSecret: process.env.COOKIE_SECRET!,
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    cookieSameSite: process.env.COOKIE_SAME_SITE ?? 'lax',
    cookieDomain: process.env.COOKIE_DOMAIN?.trim() || undefined,
    authCookiePath: process.env.AUTH_COOKIE_PATH?.trim() || '/api/v1/auth',

    // auth
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS),
    refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS),

    // web
    appWebUrl: process.env.APP_WEB_URL,

    // email
    emailFromName: process.env.EMAIL_FROM_NAME!,
    emailFromAddress: process.env.EMAIL_FROM_ADDRESS!,
    emailTransport: process.env.EMAIL_TRANSPORT as EmailTransport,
    emailQueueDrainDelayMs: Number(process.env.EMAIL_QUEUE_DRAIN_DELAY_MS ?? 30_000),
    emailQueueStalledIntervalMs: Number(process.env.EMAIL_QUEUE_STALLED_INTERVAL_MS ?? 120_000),
    emailSmtpHost: process.env.EMAIL_SMTP_HOST,
    emailSmtpPort: Number(process.env.EMAIL_SMTP_PORT ?? 587),
    emailSmtpSecure: process.env.EMAIL_SMTP_SECURE === 'true',
    emailSmtpUser: process.env.EMAIL_SMTP_USER,
    emailSmtpPassword: process.env.EMAIL_SMTP_PASSWORD,

    // stripe
    stripeEnabled: process.env.STRIPE_ENABLED === 'true',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripePriceStarter: process.env.STRIPE_PRICE_STARTER,
    stripePriceGrowth: process.env.STRIPE_PRICE_GROWTH,

    // redis
    redisEnabled: process.env.REDIS_ENABLED === 'true',
    redisRequired: process.env.REDIS_REQUIRED === 'true',
    redisUrl: process.env.REDIS_URL
  }
}
