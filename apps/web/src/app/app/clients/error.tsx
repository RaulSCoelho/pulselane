'use client'

import { AppErrorState } from '@/components/feedback/app-error-state'

export default function ClientsErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AppErrorState
      title="Clients module failed to load"
      description="The clients workspace could not be rendered safely. Retry the page or go back to the application home."
      onRetry={reset}
      homeHref="/app"
      digest={error.digest ?? null}
    />
  )
}
