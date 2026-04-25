import type { CurrentOrganizationState } from '@/features/organizations/api/server-queries'
import { CLIENTS_PATH } from '@/lib/clients/client-constants'
import { APP_HOME_PATH, SELECT_ORGANIZATION_PATH } from '@/lib/organizations/organization-context-constants'
import { PROJECTS_PATH } from '@/lib/projects/project-constants'
import { Card } from '@heroui/react'
import type { MeResponse } from '@pulselane/contracts'
import Link from 'next/link'

import { getAppShellOrganizationContextView } from './app-shell-organization-context'

type AppShellProps = {
  me: MeResponse
  organizationState: CurrentOrganizationState
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
    href: PROJECTS_PATH,
    label: 'Projects'
  },
  {
    href: SELECT_ORGANIZATION_PATH,
    label: 'Organization context'
  }
]

export function AppShell({ me, organizationState, children }: AppShellProps) {
  const organizationContext = getAppShellOrganizationContextView(organizationState)

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

              <Card className="border border-black/5" variant="secondary">
                <Card.Content className="p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Current organization</p>
                  <p className="mt-2 font-medium">{organizationContext.organizationName}</p>
                  <p className="mt-1 text-sm text-muted">{organizationContext.organizationDetail}</p>
                  {organizationContext.syncNotice ? (
                    <p className="mt-2 text-xs font-medium text-warning">{organizationContext.syncNotice}</p>
                  ) : null}
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
                  <Card className="border border-black/5" variant="secondary">
                    <Card.Content className="p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Organizations</p>
                      <p className="mt-2 text-sm font-medium">{me.memberships.length}</p>
                    </Card.Content>
                  </Card>

                  <Card className="border border-black/5" variant="secondary">
                    <Card.Content className="p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Active context</p>
                      <p className="mt-2 text-sm font-medium">{organizationContext.activeContextValue}</p>
                      {organizationContext.syncNotice ? (
                        <p className="mt-1 text-xs font-medium text-warning">{organizationContext.syncNotice}</p>
                      ) : null}
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
