'use client'

import { AppErrorState } from '@/components/feedback/app-error-state'

export default function ClientDetailErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <AppErrorState
      title="Client record failed to load"
      description="The selected client could not be rendered safely. Retry the page or go back to the clients list."
      onRetry={reset}
      homeHref="/app/clients"
      digest={error.digest ?? null}
    />
  )
}
