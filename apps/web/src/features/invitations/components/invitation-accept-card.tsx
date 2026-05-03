'use client'

import { MetricCard } from '@/components/ui/metric-card'
import { PendingSubmitButton } from '@/components/ui/pending-submit-button'
import { acceptInvitationAction } from '@/features/invitations/actions/accept-invitation-action'
import { initialInvitationAcceptFormState } from '@/features/invitations/components/invitation-accept-state'
import { formatDateTime } from '@/lib/formatters'
import { APP_HOME_PATH, SELECT_ORGANIZATION_PATH } from '@/lib/organizations/organization-context-constants'
import { Alert, Button, Card, Form, toast } from '@heroui/react'
import type { PreviewInvitationResponse } from '@pulselane/contracts/invitations'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

type InvitationAcceptCardProps = {
  token: string
  invitation: PreviewInvitationResponse
}

export function InvitationAcceptCard({ token, invitation }: InvitationAcceptCardProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(acceptInvitationAction, initialInvitationAcceptFormState)

  useEffect(() => {
    if (state.status === 'success' && state.message) {
      toast.success(state.message)
      router.refresh()
      return
    }

    if (state.status === 'error' && state.message) {
      toast.danger(state.message)
    }
  }, [router, state.message, state.status])

  const canAccept = invitation.canAccept && !invitation.isExpired && invitation.status === 'pending'

  return (
    <Card className="w-full max-w-2xl min-w-0 border border-border shadow-sm">
      <Card.Header className="flex min-w-0 flex-col gap-2 p-5 pb-0 sm:p-8 sm:pb-0">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Pulselane invitation</span>
        <Card.Title className="text-xl font-semibold tracking-normal sm:text-2xl">
          Join {invitation.organizationName}
        </Card.Title>
        <Card.Description className="text-sm leading-6 text-muted">
          {invitation.invitedByName} invited {invitation.email} to join this organization as {invitation.role}.
        </Card.Description>
      </Card.Header>

      <Card.Content className="flex min-w-0 flex-col gap-6 p-5 sm:p-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="Role" value={invitation.role} />
          <MetricCard label="Status" value={invitation.status} />
          <MetricCard label="Expires" value={formatDateTime(invitation.expiresAt)} />
        </div>

        {!canAccept ? (
          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Invitation cannot be accepted</Alert.Title>
              <Alert.Description>
                This invitation is {invitation.isExpired ? 'expired' : invitation.status}. Ask an organization admin to
                resend it.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        {state.status === 'success' ? (
          <Alert status="success">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Invitation accepted</Alert.Title>
              <Alert.Description>
                Select the organization context before opening the operational workspace.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        {state.status === 'error' && state.message ? (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Unable to accept invitation</Alert.Title>
              <Alert.Description>{state.message}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          <Link href={APP_HOME_PATH} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto" variant="outline">
              Go to app
            </Button>
          </Link>

          {state.status === 'success' ? (
            <Link href={SELECT_ORGANIZATION_PATH} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto" variant="primary">
                Select organization
              </Button>
            </Link>
          ) : null}

          {canAccept && state.status !== 'success' ? (
            <Form action={formAction} className="w-full sm:w-auto">
              <input type="hidden" name="token" value={token} />
              <PendingSubmitButton
                className="w-full sm:w-auto"
                idleLabel="Accept invitation"
                pendingLabel="Accepting invitation..."
                size="lg"
              />
            </Form>
          ) : null}
        </div>
      </Card.Content>
    </Card>
  )
}
