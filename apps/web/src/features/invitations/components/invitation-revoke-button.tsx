'use client'

import { revokeInvitationAction } from '@/features/invitations/actions/invitation-actions'
import { initialInvitationMutationState } from '@/features/invitations/components/invitation-action-state'
import { AlertDialog, Button, toast } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

type InvitationRevokeButtonProps = {
  invitationId: string
  email: string
  isDisabled: boolean
}

export function InvitationRevokeButton({ invitationId, email, isDisabled }: InvitationRevokeButtonProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(revokeInvitationAction, initialInvitationMutationState)

  useEffect(() => {
    if (state.status === 'success' && state.message && state.invitationId === invitationId) {
      toast.success(state.message)
      router.refresh()
      return
    }

    if (state.status === 'error' && state.message) {
      toast.danger(state.message)
    }
  }, [invitationId, router, state.invitationId, state.message, state.status])

  return (
    <AlertDialog>
      <Button isDisabled={isDisabled} size="sm" variant="danger">
        Revoke
      </Button>

      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>Revoke invitation</AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body>
              Revoke the pending invitation for {email}. The user will no longer be able to accept this invitation.
            </AlertDialog.Body>

            <AlertDialog.Footer>
              <Button slot="close" variant="ghost">
                Cancel
              </Button>

              <form action={formAction}>
                <input type="hidden" name="invitationId" value={invitationId} />

                <Button isPending={pending} size="sm" type="submit" variant="danger">
                  Confirm revoke
                </Button>
              </form>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  )
}
