import { SignupForm } from '@/components/auth/signup-form'
import { redirectAuthenticatedUser } from '@/lib/auth/server-session'

export default async function SignupPage() {
  await redirectAuthenticatedUser()

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16">
      <SignupForm />
    </main>
  )
}
