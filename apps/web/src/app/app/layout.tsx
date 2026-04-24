import { AppShell } from '@/components/app/app-shell'
import { requireAuth } from '@/features/auth/api/server-queries'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { buildRefreshRedirectPath } from '@/lib/auth/auth-redirect'
import { APP_HOME_PATH } from '@/lib/organizations/organization-context-constants'
import { redirect } from 'next/navigation'

export default async function AuthenticatedAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const me = await requireAuth({ redirectTo: APP_HOME_PATH })
  const organizationState = await getCurrentOrganization()

  if (organizationState.status === 'unauthorized') {
    redirect(buildRefreshRedirectPath(APP_HOME_PATH))
  }

  return (
    <AppShell me={me} organizationState={organizationState}>
      {children}
    </AppShell>
  )
}
