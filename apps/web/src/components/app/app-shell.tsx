'use client'

import { BrandLogo } from '@/components/brand/brand-logo'
import type { CurrentOrganizationState } from '@/features/organizations/api/server-queries'
import { nextClientApi } from '@/http/client-api-client'
import { AUDIT_LOGS_PATH } from '@/lib/audit-logs/audit-log-constants'
import { LOGIN_PATH } from '@/lib/auth/auth-constants'
import { BILLING_PATH } from '@/lib/billing/billing-constants'
import { CLIENTS_PATH } from '@/lib/clients/client-constants'
import { INVITATIONS_PATH } from '@/lib/invitations/invitation-constants'
import { MEMBERS_PATH } from '@/lib/memberships/membership-constants'
import { APP_HOME_PATH, SELECT_ORGANIZATION_PATH } from '@/lib/organizations/organization-context-constants'
import { ORGANIZATION_SETTINGS_PATH } from '@/lib/organizations/organization-settings-constants'
import { PROJECTS_PATH } from '@/lib/projects/project-constants'
import { SESSIONS_PATH } from '@/lib/sessions/session-constants'
import { cn } from '@/lib/styles'
import { TASKS_PATH } from '@/lib/tasks/task-constants'
import { Avatar, Button, Dropdown, Label, Separator, toast } from '@heroui/react'
import type { MeResponse } from '@pulselane/contracts'
import { useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  ClipboardList,
  CreditCard,
  FolderKanban,
  Home,
  ListChecks,
  LogOut,
  Mail,
  Menu,
  Monitor,
  Network,
  Users,
  type LucideIcon
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { getAppShellOrganizationContextView } from './app-shell-organization-context'

type AppShellProps = {
  me: MeResponse
  organizationState: CurrentOrganizationState
  children: React.ReactNode
}

type NavigationIcon =
  | 'overview'
  | 'clients'
  | 'projects'
  | 'tasks'
  | 'members'
  | 'invitations'
  | 'organization'
  | 'sessions'
  | 'billing'
  | 'audit'
  | 'context'

type NavigationItem = {
  href: string
  label: string
  icon: NavigationIcon
}

const navigationItems: NavigationItem[] = [
  {
    href: APP_HOME_PATH,
    label: 'Overview',
    icon: 'overview'
  },
  {
    href: CLIENTS_PATH,
    label: 'Clients',
    icon: 'clients'
  },
  {
    href: PROJECTS_PATH,
    label: 'Projects',
    icon: 'projects'
  },
  {
    href: TASKS_PATH,
    label: 'Tasks',
    icon: 'tasks'
  },
  {
    href: MEMBERS_PATH,
    label: 'Members',
    icon: 'members'
  },
  {
    href: INVITATIONS_PATH,
    label: 'Invitations',
    icon: 'invitations'
  },
  {
    href: ORGANIZATION_SETTINGS_PATH,
    label: 'Organization',
    icon: 'organization'
  },
  {
    href: SESSIONS_PATH,
    label: 'Sessions',
    icon: 'sessions'
  },
  {
    href: BILLING_PATH,
    label: 'Billing',
    icon: 'billing'
  },
  {
    href: AUDIT_LOGS_PATH,
    label: 'Audit logs',
    icon: 'audit'
  },
  {
    href: SELECT_ORGANIZATION_PATH,
    label: 'Organization context',
    icon: 'context'
  }
]

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}

function isRouteActive(pathname: string, href: string) {
  if (href === APP_HOME_PATH) {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

const routeIconMap = {
  overview: Home,
  clients: Users,
  projects: FolderKanban,
  tasks: ListChecks,
  members: Users,
  invitations: Mail,
  organization: Building2,
  sessions: Monitor,
  billing: CreditCard,
  audit: ClipboardList,
  context: Network
} satisfies Record<NavigationIcon, LucideIcon>

function RouteIcon({ icon }: { icon: NavigationIcon }) {
  const Icon = routeIconMap[icon]

  return <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
}

function SidebarNavigation({
  pathname,
  isCollapsed,
  onNavigate
}: {
  pathname: string
  isCollapsed: boolean
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Primary navigation">
      {navigationItems.map(item => {
        const isActive = isRouteActive(pathname, item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group flex items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition duration-150 ease-out',
              isCollapsed ? 'h-9 justify-center' : 'h-10 justify-start',
              isActive
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted hover:bg-surface-secondary hover:text-foreground focus-visible:bg-surface-secondary focus-visible:text-foreground'
            )}
          >
            <span
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-lg transition',
                isActive ? 'bg-brand-light-text/15' : 'bg-background text-muted group-hover:text-foreground'
              )}
            >
              <RouteIcon icon={item.icon} />
            </span>
            {isCollapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarPanel({
  pathname,
  organizationName,
  organizationDetail,
  isCollapsed,
  onNavigate,
  mode
}: {
  pathname: string
  organizationName: string
  organizationDetail: string
  isCollapsed: boolean
  onNavigate?: () => void
  mode: 'desktop' | 'mobile'
}) {
  return (
    <aside
      className={cn(
        'flex sticky top-0 h-screen flex-col border-r border-border bg-surface text-surface-foreground shadow-surface transition-[width] duration-200 ease-out',
        mode === 'desktop' ? (isCollapsed ? 'w-(--app-sidebar-collapsed-width)' : 'w-(--app-sidebar-width)') : 'w-80'
      )}
    >
      <div className="flex h-16 items-center justify-between gap-3 border-b border-separator px-4">
        <Link href={APP_HOME_PATH} className="flex min-w-0 items-center gap-3" onClick={onNavigate}>
          <BrandLogo
            variant={isCollapsed ? 'symbol' : 'horizontal'}
            alt="Pulselane"
            className={isCollapsed ? 'size-9 shrink-0' : 'h-auto max-w-32'}
            priority
          />
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
        <SidebarNavigation pathname={pathname} isCollapsed={isCollapsed} onNavigate={onNavigate} />
      </div>

      <div className="border-t border-separator p-4">
        {isCollapsed ? (
          <div className="mx-auto size-2 rounded-full bg-success" aria-label="Organization context active" />
        ) : (
          <div className="rounded-lg bg-surface-secondary p-4">
            <p className="text-xs font-medium uppercase text-muted">Current organization</p>
            <p className="mt-2 truncate text-sm font-medium">{organizationName}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{organizationDetail}</p>
          </div>
        )}
      </div>
    </aside>
  )
}

export function AppShell({ me, organizationState, children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLogoutPending, startLogoutTransition] = useTransition()
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const organizationContext = getAppShellOrganizationContextView(organizationState)

  function handleLogout() {
    startLogoutTransition(async () => {
      const response = await nextClientApi('/api/v1/auth/logout', {
        method: 'POST'
      })

      if (!response.ok) {
        toast.danger('Unable to sign out. Try again.')
        return
      }

      toast.success('Signed out successfully.')
      queryClient.clear()
      router.replace(LOGIN_PATH)
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="hidden min-h-screen lg:flex">
        <SidebarPanel
          pathname={pathname}
          organizationName={organizationContext.organizationName}
          organizationDetail={organizationContext.organizationDetail}
          isCollapsed={isDesktopSidebarCollapsed}
          mode="desktop"
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            me={me}
            organizationName={organizationContext.organizationName}
            activeContextValue={organizationContext.activeContextValue}
            onMenuPress={() => setIsDesktopSidebarCollapsed(value => !value)}
            onLogout={handleLogout}
            isLogoutPending={isLogoutPending}
          />
          <main className="page-container animate-in min-w-0 flex-1">{children}</main>
        </div>
      </div>

      <div className="min-h-screen lg:hidden">
        {isMobileSidebarOpen ? (
          <div className="fixed inset-0 z-50 flex">
            <button
              aria-label="Close navigation"
              className="absolute inset-0 bg-backdrop"
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="animate-slide-in-left relative z-10 h-full">
              <SidebarPanel
                pathname={pathname}
                organizationName={organizationContext.organizationName}
                organizationDetail={organizationContext.organizationDetail}
                isCollapsed={false}
                onNavigate={() => setIsMobileSidebarOpen(false)}
                mode="mobile"
              />
            </div>
          </div>
        ) : null}

        <Topbar
          me={me}
          organizationName={organizationContext.organizationName}
          activeContextValue={organizationContext.activeContextValue}
          onMenuPress={() => setIsMobileSidebarOpen(true)}
          onLogout={handleLogout}
          isLogoutPending={isLogoutPending}
        />
        <main className="page-container animate-in min-w-0">{children}</main>
      </div>
    </div>
  )
}

function Topbar({
  me,
  organizationName,
  activeContextValue,
  onMenuPress,
  onLogout,
  isLogoutPending
}: {
  me: MeResponse
  organizationName: string
  activeContextValue: string
  onMenuPress: () => void
  onLogout: () => void
  isLogoutPending: boolean
}) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-separator bg-background/85 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button aria-label="Toggle navigation" isIconOnly size="sm" variant="secondary" onPress={onMenuPress}>
          <Menu aria-hidden="true" className="size-4" strokeWidth={1.8} />
        </Button>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{organizationName}</p>
          <p className="truncate text-xs text-muted">{activeContextValue}</p>
        </div>
      </div>

      <Dropdown>
        <Button
          aria-label="Open user menu"
          className="h-10 rounded-full pl-1 pr-3"
          isDisabled={isLogoutPending}
          variant="secondary"
        >
          <Avatar size="sm" color="accent" variant="soft">
            <Avatar.Fallback>{getInitials(me.name) || 'U'}</Avatar.Fallback>
          </Avatar>
          <span className="hidden max-w-36 truncate text-sm font-medium sm:inline">{me.name}</span>
        </Button>
        <Dropdown.Popover className="min-w-64">
          <Dropdown.Menu
            onAction={key => {
              if (key === 'logout') {
                onLogout()
              }
            }}
          >
            <Dropdown.Item id="account" textValue={me.email}>
              <div className="flex min-w-0 flex-col gap-1">
                <Label className="truncate text-sm font-medium">{me.name}</Label>
                <span className="truncate text-xs text-muted">{me.email}</span>
              </div>
            </Dropdown.Item>
            <Separator />
            <Dropdown.Item id="logout" textValue="Sign out" variant="danger">
              <LogOut aria-hidden="true" className="size-4" strokeWidth={1.8} />
              <Label>{isLogoutPending ? 'Signing out...' : 'Sign out'}</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </header>
  )
}
