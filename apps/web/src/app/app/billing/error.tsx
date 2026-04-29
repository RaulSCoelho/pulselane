'use client'

import { AppErrorState } from '@/components/feedback/app-error-state'

export default function BillingErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AppErrorState
      title="Billing page failed to load"
      description="The billing workspace could not be rendered safely. Retry the page or go back to the application home."
      onRetry={reset}
      homeHref="/app"
      digest={error.digest ?? null}
    />
  )
}
