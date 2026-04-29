'use client'

import { AppErrorState } from '@/components/feedback/app-error-state'

export default function SessionsErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AppErrorState
      title="Sessions page failed to load"
      description="The sessions workspace could not be rendered safely. Retry the page or go back to the application home."
      onRetry={reset}
      homeHref="/app"
      digest={error.digest ?? null}
    />
  )
}
