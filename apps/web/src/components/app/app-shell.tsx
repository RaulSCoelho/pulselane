import { CLIENTS_PATH } from '@/lib/clients/client-constants'
import { APP_HOME_PATH, SELECT_ORGANIZATION_PATH } from '@/lib/organizations/organization-context-constants'
import { Card } from '@heroui/react'
import type { CurrentOrganizationResponse, MeResponse } from '@pulselane/contracts'
import Link from 'next/link'

type AppShellProps = {
  me: MeResponse
  currentOrganization: CurrentOrganizationResponse | null
  children: React.ReactNode
}

const navigationItems = [
  {
    href: APP_HOME_PATH,
    label: 'Overview'
  },
  {
    href: CLIENTS_PATH,
    label: 'Clients'
  },
  {
    href: SELECT_ORGANIZATION_PATH,
    label: 'Organization context'
  }
]

export function AppShell({ me, currentOrganization, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-6 py-6">
        <aside className="hidden w-72 shrink-0 lg:block">
          <Card className="sticky top-6 border border-black/5 shadow-sm">
            <Card.Content className="flex flex-col gap-6 p-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Pulselane</span>
                <h1 className="text-xl font-semibold tracking-tight">Operations hub</h1>
              </div>

              <nav className="flex flex-col gap-2">
                {navigationItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <Card className="border border-black/5">
                <Card.Content className="p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Current organization</p>
                  <p className="mt-2 font-medium">
                    {currentOrganization ? currentOrganization.organization.name : 'No organization selected'}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {currentOrganization ? currentOrganization.currentRole : 'Choose one to unlock operational screens'}
                  </p>
                </Card.Content>
              </Card>
            </Card.Content>
          </Card>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header>
            <Card className="border border-black/5 shadow-sm">
              <Card.Content className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Authenticated workspace
                  </span>
                  <h2 className="text-2xl font-semibold tracking-tight">{me.name}</h2>
                  <p className="text-sm text-muted">{me.email}</p>
                </div>

                <div className="grid gap-3 sm:min-w-80 sm:grid-cols-2">
                  <Card className="border border-black/5">
                    <Card.Content className="p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Organizations</p>
                      <p className="mt-2 text-sm font-medium">{me.memberships.length}</p>
                    </Card.Content>
                  </Card>

                  <Card className="border border-black/5">
                    <Card.Content className="p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Active context</p>
                      <p className="mt-2 text-sm font-medium">
                        {currentOrganization ? currentOrganization.organization.slug : 'Missing'}
                      </p>
                    </Card.Content>
                  </Card>
                </div>
              </Card.Content>
            </Card>
          </header>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
