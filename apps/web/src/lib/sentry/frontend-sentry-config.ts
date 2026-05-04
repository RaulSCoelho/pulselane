const DEFAULT_TRACES_SAMPLE_RATE = 0

function normalizeOptionalEnvValue(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim()

  return trimmedValue ? trimmedValue : undefined
}

export function getFrontendSentryDsn(): string | undefined {
  return normalizeOptionalEnvValue(process.env.NEXT_PUBLIC_SENTRY_DSN)
}

export function isFrontendSentryConfigured(): boolean {
  return Boolean(getFrontendSentryDsn()) && process.env.NEXT_PUBLIC_SENTRY_ENABLED !== 'false'
}

export function getFrontendSentryEnvironment(): string {
  return normalizeOptionalEnvValue(process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT) ?? process.env.NODE_ENV ?? 'development'
}

export function getFrontendSentryRelease(): string | undefined {
  return normalizeOptionalEnvValue(process.env.NEXT_PUBLIC_SENTRY_RELEASE)
}

export function getFrontendSentryTracesSampleRate(): number {
  const rawValue = normalizeOptionalEnvValue(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE)

  if (!rawValue) {
    return DEFAULT_TRACES_SAMPLE_RATE
  }

  const parsedValue = Number(rawValue)

  if (!Number.isFinite(parsedValue) || parsedValue < 0 || parsedValue > 1) {
    return DEFAULT_TRACES_SAMPLE_RATE
  }

  return parsedValue
}
