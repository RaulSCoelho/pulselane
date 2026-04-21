import { SignupForm } from '@/components/auth/signup-form'
import { redirectIfAuthenticated } from '@/lib/auth/auth-guard'

export default async function SignupPage() {
  await redirectIfAuthenticated()

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16">
      <SignupForm />
    </main>
  )
}
