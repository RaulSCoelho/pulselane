import {
  getFrontendSentryDsn,
  getFrontendSentryEnvironment,
  getFrontendSentryRelease,
  getFrontendSentryTracesSampleRate,
  isFrontendSentryConfigured
} from '@/lib/sentry/frontend-sentry-config'
import * as Sentry from '@sentry/nextjs'

const sentryDsn = getFrontendSentryDsn()
const shouldInitializeSentry = isFrontendSentryConfigured()

if (shouldInitializeSentry && sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: getFrontendSentryEnvironment(),
    release: getFrontendSentryRelease(),
    sendDefaultPii: false,
    tracesSampleRate: getFrontendSentryTracesSampleRate()
  })
}

export function onRouterTransitionStart(...args: Parameters<typeof Sentry.captureRouterTransitionStart>) {
  if (!shouldInitializeSentry) {
    return
  }

  Sentry.captureRouterTransitionStart(...args)
}
