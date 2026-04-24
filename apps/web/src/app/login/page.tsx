import { redirectIfAuthenticated } from '@/features/auth/api/server-queries'
import { LoginForm } from '@/features/auth/components/login-form'

export default async function LoginPage() {
  await redirectIfAuthenticated()

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <LoginForm />
    </main>
  )
}
