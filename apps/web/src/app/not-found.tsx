import { AppErrorState } from '@/components/feedback/app-error-state'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16 sm:px-6">
      <AppErrorState
        title="Page not found"
        description="The resource you tried to access does not exist or is no longer available."
        homeHref="/"
      />
    </main>
  )
}
