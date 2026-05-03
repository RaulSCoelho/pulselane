'use client'

import { AppErrorState } from '@/components/feedback/app-error-state'

export default function InvitationAcceptErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <AppErrorState
        title="Invitation accept page failed to load"
        description="The invitation accept page could not be rendered safely. Retry the page or go back to the application home."
        onRetry={reset}
        homeHref="/app"
        digest={error.digest ?? null}
      />
    </div>
  )
}
