'use client'

import { AppErrorState } from '@/components/feedback/app-error-state'

type AppRouteErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AppRouteError({ error, reset }: AppRouteErrorProps) {
  return (
    <main className="flex min-h-[60vh] items-center px-6 py-16">
      <AppErrorState
        title="Authenticated area failed to load"
        description="The authenticated workspace could not be rendered safely."
        onRetry={reset}
        homeHref="/app"
        digest={error.digest ?? null}
      />
    </main>
  )
}
