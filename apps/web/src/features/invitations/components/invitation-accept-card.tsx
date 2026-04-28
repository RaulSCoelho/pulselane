'use client'

import { acceptInvitationAction } from '@/features/invitations/actions/accept-invitation-action'
import { initialInvitationAcceptFormState } from '@/features/invitations/components/invitation-accept-state'
import { APP_HOME_PATH, SELECT_ORGANIZATION_PATH } from '@/lib/organizations/organization-context-constants'
import { Alert, Button, Card, Form, toast } from '@heroui/react'
import type { PreviewInvitationResponse } from '@pulselane/contracts/invitations'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

import { InvitationAcceptSubmitButton } from './invitation-accept-submit-button'

type InvitationAcceptCardProps = {
  token: string
  invitation: PreviewInvitationResponse
}

function formatDatetime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
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
    <Card className="w-full max-w-2xl border border-black/5 shadow-sm">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Pulselane invitation</span>
        <Card.Title className="text-3xl font-semibold tracking-tight">Join {invitation.organizationName}</Card.Title>
        <Card.Description className="text-sm leading-6 text-muted">
          {invitation.invitedByName} invited {invitation.email} to join this organization as {invitation.role}.
        </Card.Description>
      </Card.Header>

      <Card.Content className="flex flex-col gap-6 p-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border border-black/5" variant="secondary">
            <Card.Content className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Role</p>
              <p className="mt-2 text-sm font-medium">{invitation.role}</p>
            </Card.Content>
          </Card>

          <Card className="border border-black/5" variant="secondary">
            <Card.Content className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Status</p>
              <p className="mt-2 text-sm font-medium">{invitation.status}</p>
            </Card.Content>
          </Card>

          <Card className="border border-black/5" variant="secondary">
            <Card.Content className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Expires</p>
              <p className="mt-2 text-sm font-medium">{formatDatetime(invitation.expiresAt)}</p>
            </Card.Content>
          </Card>
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

        <div className="flex flex-wrap justify-end gap-3">
          <Link href={APP_HOME_PATH}>
            <Button variant="outline">Go to app</Button>
          </Link>

          {state.status === 'success' ? (
            <Link href={SELECT_ORGANIZATION_PATH}>
              <Button variant="primary">Select organization</Button>
            </Link>
          ) : null}

          {canAccept && state.status !== 'success' ? (
            <Form action={formAction}>
              <input type="hidden" name="token" value={token} />
              <InvitationAcceptSubmitButton />
            </Form>
          ) : null}
        </div>
      </Card.Content>
    </Card>
  )
}
