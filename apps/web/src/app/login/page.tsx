import { redirectIfAuthenticated } from '@/features/auth/api/server-queries'
import { AuthPageFrame } from '@/features/auth/components/auth-page-frame'
import { LoginForm } from '@/features/auth/components/login-form'

export default async function LoginPage() {
  await redirectIfAuthenticated()

  return (
    <AuthPageFrame
      title="Enter the operational workspace with context already in place."
      description="The authenticated area keeps organization context, role permissions and auditability close to every workflow."
    >
      <LoginForm />
    </AuthPageFrame>
  )
}
