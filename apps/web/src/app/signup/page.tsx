import { redirectIfAuthenticated } from '@/features/auth/api/server-queries'
import { AuthPageFrame } from '@/features/auth/components/auth-page-frame'
import { SignupForm } from '@/features/auth/components/signup-form'

export default async function SignupPage() {
  await redirectIfAuthenticated()

  return (
    <AuthPageFrame
      title="Create the workspace and start from a real operating model."
      description="Pulselane starts with an organization, then keeps clients, projects, tasks and access rules connected."
    >
      <SignupForm />
    </AuthPageFrame>
  )
}
