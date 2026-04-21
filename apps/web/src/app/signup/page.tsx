import { SignupForm } from '@/components/auth/signup-form'

export default async function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16">
      <SignupForm />
    </main>
  )
}
