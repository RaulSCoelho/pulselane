'use client'

import { AppErrorState } from '@/components/feedback/app-error-state'

export default function TaskDetailErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <AppErrorState
      title="Task record failed to load"
      description="The task detail page could not be rendered safely. Retry the page or go back to the application home."
      onRetry={reset}
      homeHref="/app"
      digest={error.digest ?? null}
    />
  )
}
