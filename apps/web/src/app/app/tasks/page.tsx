import { PageHeader } from '@/components/ui/page-header'
import { listMemberships } from '@/features/memberships/api/server-queries'
import { getCurrentOrganization } from '@/features/organizations/api/server-queries'
import { OrganizationContextEmptyState } from '@/features/organizations/components/organization-context-empty-state'
import { OrganizationContextStatusState } from '@/features/organizations/components/organization-context-status-state'
import { listProjects } from '@/features/projects/api/server-queries'
import { TaskCreateModal } from '@/features/tasks/components/task-create-modal'
import { TasksTable } from '@/features/tasks/components/tasks-table'
import { PROJECTS_PATH } from '@/lib/projects/project-constants'
import { canCreateTasks } from '@/lib/tasks/task-permissions'
import { buttonVariants } from '@heroui/react'
import { listMembershipsQuerySchema } from '@pulselane/contracts/memberships'
import { listProjectsQuerySchema } from '@pulselane/contracts/projects'
import { FolderPlus } from 'lucide-react'
import Link from 'next/link'

export default async function TasksPage() {
  const currentOrganizationState = await getCurrentOrganization()

  if (currentOrganizationState.status === 'not_selected') {
    return <OrganizationContextEmptyState />
  }

  if (currentOrganizationState.status !== 'ready') {
    return <OrganizationContextStatusState state={currentOrganizationState} />
  }

  const currentOrganization = currentOrganizationState.data

  const projectsState = await listProjects(
    listProjectsQuerySchema.parse({
      limit: '100',
      includeArchived: false
    })
  )

  const membershipsState = await listMemberships(
    listMembershipsQuerySchema.parse({
      limit: '100'
    })
  )

  const projects = projectsState.status === 'ready' ? projectsState.data.items : []
  const memberships = membershipsState.status === 'ready' ? membershipsState.data.items : []
  const allowCreate = canCreateTasks(currentOrganization.currentRole)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operational module"
        title="Tasks"
        description="Track execution by project, assignee, priority, due date and status."
        actions={
          allowCreate && projects.length > 0 ? (
            <TaskCreateModal projects={projects} memberships={memberships} />
          ) : allowCreate ? (
            <Link href={PROJECTS_PATH} className={`${buttonVariants({ variant: 'outline' })} w-full sm:w-auto`}>
              <FolderPlus aria-hidden="true" className="size-4" strokeWidth={1.8} />
              Create project first
            </Link>
          ) : null
        }
      />

      <TasksTable currentRole={currentOrganization.currentRole} projects={projects} memberships={memberships} />
    </div>
  )
}
