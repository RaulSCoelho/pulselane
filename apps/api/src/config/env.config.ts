export type EnvConfig = ReturnType<typeof configuration>;

export function configuration() {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  return {
    // app
    port: Number(process.env.PORT ?? 3001),
    nodeEnv,
    allowedCorsOrigins: process.env.ALLOWED_CORS_ORIGINS
      ? process.env.ALLOWED_CORS_ORIGINS.split(',').map((origin) =>
          origin.trim(),
        )
      : [],
    // cookie
    cookieSecret: process.env.COOKIE_SECRET ?? '',
    cookieSecure:
      process.env.COOKIE_SECURE != null
        ? process.env.COOKIE_SECURE === 'true'
        : nodeEnv === 'production',
    cookieSameSite: process.env.COOKIE_SAME_SITE ?? 'lax',
    cookieDomain: process.env.COOKIE_DOMAIN?.trim() || undefined,
    // auth
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900), // 15 minutes
    refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  };
}
