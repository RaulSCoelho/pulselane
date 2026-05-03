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
          <AlertDialog.Dialog className="max-w-[calc(100vw-2rem)]">
            <AlertDialog.Header>
              <AlertDialog.Heading>Revoke invitation</AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body>
              Revoke the pending invitation for {email}. The user will no longer be able to accept this invitation.
            </AlertDialog.Body>

            <AlertDialog.Footer className="flex-col sm:flex-row">
              <Button className="w-full sm:w-auto" slot="close" variant="ghost">
                Cancel
              </Button>

              <form action={formAction} className="w-full sm:w-auto">
                <input type="hidden" name="invitationId" value={invitationId} />

                <Button className="w-full sm:w-auto" isPending={pending} size="sm" type="submit" variant="danger">
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
