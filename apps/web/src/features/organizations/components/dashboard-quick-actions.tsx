import { SectionCard } from '@/components/ui/section-card'
import { ClientCreateModal } from '@/features/clients/components/client-create-modal'
import { InvitationCreateModal } from '@/features/invitations/components/invitation-create-modal'
import { ProjectCreateModal } from '@/features/projects/components/project-create-modal'
import { TaskCreateModal } from '@/features/tasks/components/task-create-modal'
import { CLIENTS_PATH } from '@/lib/clients/client-constants'
import { PROJECTS_PATH } from '@/lib/projects/project-constants'
import { cn } from '@/lib/styles'
import { buttonVariants } from '@heroui/react'
import type { ClientResponse } from '@pulselane/contracts/clients'
import type { MembershipResponse } from '@pulselane/contracts/memberships'
import type { ProjectResponse } from '@pulselane/contracts/projects'
import { FolderPlus, ListPlus, MailPlus, Users } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

type DashboardQuickActionsProps = {
  clients: ClientResponse[]
  projects: ProjectResponse[]
  memberships: MembershipResponse[]
  canCreateClients: boolean
  canCreateProjects: boolean
  canCreateTasks: boolean
  canCreateInvitations: boolean
  clientsReady: boolean
  projectsReady: boolean
}

type QuickActionTone = 'accent' | 'cyan' | 'orange' | 'info'

const iconToneClassNames: Record<QuickActionTone, string> = {
  accent: 'bg-accent/10 text-accent ring-1 ring-accent/20',
  cyan: 'bg-brand-cyan/10 text-brand-cyan ring-1 ring-brand-cyan/20',
  orange: 'bg-brand-orange/10 text-brand-orange ring-1 ring-brand-orange/20',
  info: 'bg-info/10 text-info ring-1 ring-info/20'
}

function QuickActionTile({
  title,
  description,
  icon,
  tone,
  action
}: {
  title: string
  description: string
  icon: ReactNode
  tone: QuickActionTone
  action: ReactNode
}) {
  return (
    <div className="grid min-w-0 gap-3 rounded-lg border border-border bg-surface-secondary/60 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <div className={cn('grid size-10 place-items-center rounded-lg', iconToneClassNames[tone])}>{icon}</div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold tracking-normal">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
      </div>
      <div className="flex min-w-0 justify-stretch sm:justify-end">{action}</div>
    </div>
  )
}

function UnavailableAction({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-9 w-full items-center justify-center rounded-lg border border-border bg-surface px-3 text-xs font-medium text-muted sm:w-auto">
      {children}
    </span>
  )
}

export function DashboardQuickActions({
  clients,
  projects,
  memberships,
  canCreateClients,
  canCreateProjects,
  canCreateTasks,
  canCreateInvitations,
  clientsReady,
  projectsReady
}: DashboardQuickActionsProps) {
  const actions = [
    canCreateClients ? (
      <QuickActionTile
        key="client"
        title="Create client"
        description="Start a new operational account and unlock project structure."
        icon={<Users aria-hidden="true" className="size-5" strokeWidth={1.8} />}
        tone="accent"
        action={
          <ClientCreateModal triggerClassName="w-full sm:w-auto" triggerLabel="New client" triggerVariant="secondary" />
        }
      />
    ) : null,
    canCreateProjects ? (
      <QuickActionTile
        key="project"
        title="Create project"
        description="Attach execution work to an active client."
        icon={<FolderPlus aria-hidden="true" className="size-5" strokeWidth={1.8} />}
        tone="cyan"
        action={
          !clientsReady ? (
            <UnavailableAction>Clients unavailable</UnavailableAction>
          ) : clients.length > 0 ? (
            <ProjectCreateModal
              clients={clients}
              triggerClassName="w-full sm:w-auto"
              triggerLabel="New project"
              triggerVariant="secondary"
            />
          ) : (
            <Link href={CLIENTS_PATH} className={`${buttonVariants({ variant: 'outline' })} w-full sm:w-auto`}>
              <Users aria-hidden="true" className="size-4" strokeWidth={1.8} />
              Add client first
            </Link>
          )
        }
      />
    ) : null,
    canCreateTasks ? (
      <QuickActionTile
        key="task"
        title="Create task"
        description="Capture work with priority, status, assignee and due date."
        icon={<ListPlus aria-hidden="true" className="size-5" strokeWidth={1.8} />}
        tone="orange"
        action={
          !projectsReady ? (
            <UnavailableAction>Projects unavailable</UnavailableAction>
          ) : projects.length > 0 ? (
            <TaskCreateModal
              memberships={memberships}
              projects={projects}
              triggerClassName="w-full sm:w-auto"
              triggerLabel="New task"
              triggerVariant="secondary"
            />
          ) : (
            <Link href={PROJECTS_PATH} className={`${buttonVariants({ variant: 'outline' })} w-full sm:w-auto`}>
              <FolderPlus aria-hidden="true" className="size-4" strokeWidth={1.8} />
              Add project first
            </Link>
          )
        }
      />
    ) : null,
    canCreateInvitations ? (
      <QuickActionTile
        key="invitation"
        title="Invite teammate"
        description="Grant organization access with the right role from day one."
        icon={<MailPlus aria-hidden="true" className="size-5" strokeWidth={1.8} />}
        tone="info"
        action={
          <InvitationCreateModal
            triggerClassName="w-full sm:w-auto"
            triggerLabel="New invitation"
            triggerVariant="secondary"
          />
        }
      />
    ) : null
  ].filter(Boolean)

  return (
    <SectionCard
      title="Quick actions"
      description="Common setup and execution actions for the active organization."
      contentClassName="grid gap-3 p-5 sm:p-8 xl:grid-cols-2"
    >
      {actions.length > 0 ? actions : <p className="text-sm text-muted">No quick actions available for this role.</p>}
    </SectionCard>
  )
}
