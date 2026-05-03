'use client'

import { AppErrorState } from '@/components/feedback/app-error-state'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground font-sans">
        <main className="flex min-h-screen items-center justify-center px-4 py-16 sm:px-6">
          <AppErrorState
            title="Application error"
            description="Pulselane hit an unexpected failure before the page could finish loading."
            onRetry={reset}
            homeHref="/"
            digest={error.digest ?? null}
          />
        </main>
      </body>
    </html>
  )
}
