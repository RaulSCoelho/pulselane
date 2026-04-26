'use client'

import { AppErrorState } from '@/components/feedback/app-error-state'

export default function TasksErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AppErrorState
      title="Tasks module failed to load"
      description="The tasks workspace could not be rendered safely. Retry the page or go back to the application home."
      onRetry={reset}
      homeHref="/app"
      digest={error.digest ?? null}
    />
  )
}
