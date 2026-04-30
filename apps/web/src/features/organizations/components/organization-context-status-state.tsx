import type { CurrentOrganizationState } from '@/features/organizations/api/server-queries'
import { SELECT_ORGANIZATION_PATH } from '@/lib/organizations/organization-context-constants'
import { buttonVariants, Card } from '@heroui/react'
import Link from 'next/link'

type OrganizationContextStatusStateProps = {
  state: Exclude<CurrentOrganizationState, { status: 'ready' | 'not_selected' }>
}

export function OrganizationContextStatusState({ state }: OrganizationContextStatusStateProps) {
  const view = getOrganizationContextStatusView(state)

  return (
    <Card className="border border-border">
      <Card.Content className="flex flex-col gap-4 p-8">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Organization context</span>
          <h2 className="text-2xl font-semibold tracking-normal">{view.title}</h2>
          <p className="text-sm leading-6 text-muted">{view.description}</p>
        </div>

        {view.showSelectorLink ? (
          <div>
            <Link href={SELECT_ORGANIZATION_PATH} className={buttonVariants({ variant: 'primary', size: 'md' })}>
              Select organization
            </Link>
          </div>
        ) : null}
      </Card.Content>
    </Card>
  )
}

function getOrganizationContextStatusView(state: OrganizationContextStatusStateProps['state']): {
  title: string
  description: string
  showSelectorLink: boolean
} {
  if (state.status === 'temporarily_unavailable') {
    return {
      title: 'Organization context temporarily unavailable',
      description:
        'Pulselane could not confirm the active organization right now. Last synced organization data will stay visible when it is available.',
      showSelectorLink: false
    }
  }

  if (state.status === 'forbidden') {
    return {
      title: 'Access removed',
      description: 'Your user no longer has access to the selected organization.',
      showSelectorLink: true
    }
  }

  if (state.status === 'not_found') {
    return {
      title: 'Organization not found',
      description: 'The selected organization no longer exists or cannot be reached.',
      showSelectorLink: true
    }
  }

  return {
    title: 'Session refresh required',
    description: 'Pulselane needs to refresh your session before loading organization context.',
    showSelectorLink: false
  }
}
