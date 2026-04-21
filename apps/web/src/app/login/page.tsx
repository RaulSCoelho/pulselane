import { LoginForm } from '@/components/auth/login-form'

export default async function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16">
      <LoginForm />
    </main>
  )
}
