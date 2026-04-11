export type EmailTransport = 'logger' | 'smtp'
export type EnvConfig = ReturnType<typeof configuration>

export function configuration() {
  const nodeEnv = process.env.NODE_ENV ?? 'development'

  return {
    // app
    port: Number(process.env.PORT ?? 3001),
    nodeEnv,
    allowedCorsOrigins: process.env.ALLOWED_CORS_ORIGINS
      ? process.env.ALLOWED_CORS_ORIGINS.split(',').map(origin => origin.trim())
      : [],

    // observability
    logLevel: process.env.LOG_LEVEL ?? (nodeEnv === 'production' ? 'info' : 'debug'),
    slowRequestThresholdMs: Number(process.env.SLOW_REQUEST_THRESHOLD_MS ?? 1000),

    // throttling
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
    emailSmtpPassword: process.env.EMAIL_SMTP_PASSWORD
  }
}
