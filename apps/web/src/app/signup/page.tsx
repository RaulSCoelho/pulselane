import { redirectIfAuthenticated } from '@/features/auth/api/server-queries'
import { SignupForm } from '@/features/auth/components/signup-form'

export default async function SignupPage() {
  await redirectIfAuthenticated()

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <SignupForm />
    </main>
  )
}
