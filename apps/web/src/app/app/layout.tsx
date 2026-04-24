import { AppShell } from '@/components/app/app-shell'
import { requireAuth } from '@/features/auth/api/server-queries'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'

export default async function AuthenticatedAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const me = await requireAuth({ redirectTo: '/app' })
  const currentOrganization = await getCurrentOrganization()

  return (
    <AppShell me={me} currentOrganization={currentOrganization}>
      {children}
    </AppShell>
  )
}
