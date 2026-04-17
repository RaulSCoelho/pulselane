export type EmailTransport = 'logger' | 'smtp'
export type CorsOriginResolver =
  | string[]
  | ((origin: string | undefined, callback: (error: Error | null, allow: boolean) => void) => void)
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

export function configuration() {
  const nodeEnv = process.env.NODE_ENV ?? 'development'

  return {
    // app
    port: Number(process.env.PORT ?? 3001),
    nodeEnv,
    allowedCorsOrigins: parseAllowedCorsOrigins(process.env.ALLOWED_CORS_ORIGINS ?? ''),

    // observability
    logLevel: process.env.LOG_LEVEL ?? (nodeEnv === 'production' ? 'info' : 'debug'),
    slowRequestThresholdMs: Number(process.env.SLOW_REQUEST_THRESHOLD_MS ?? 1000),

    sentryEnabled: process.env.SENTRY_ENABLED === 'true',
    sentryDsn: process.env.SENTRY_DSN,
    sentryEnvironment: process.env.SENTRY_ENVIRONMENT ?? nodeEnv,
    sentryRelease: process.env.SENTRY_RELEASE,
    sentryTracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),

    // throttling
    throttlingEnabled: process.env.THROTTLING_ENABLED ? process.env.THROTTLING_ENABLED === 'true' : nodeEnv !== 'test',
    rateLimitTtlMs: Number(process.env.RATE_LIMIT_TTL_MS ?? 60_000),
    rateLimitLimit: Number(process.env.RATE_LIMIT_LIMIT ?? 120),
    authRateLimitTtlMs: Number(process.env.AUTH_RATE_LIMIT_TTL_MS ?? 60_000),
    authRateLimitLimit: Number(process.env.AUTH_RATE_LIMIT_LIMIT ?? 5),

    // cookie
    cookieSecret: process.env.COOKIE_SECRET!,
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    cookieSameSite: process.env.COOKIE_SAME_SITE ?? 'lax',
    cookieDomain: process.env.COOKIE_DOMAIN?.trim() || undefined,

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
