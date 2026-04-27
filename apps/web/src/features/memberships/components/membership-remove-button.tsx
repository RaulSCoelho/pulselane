'use client'

import { removeMembershipAction } from '@/features/memberships/actions/membership-actions'
import { initialRemoveMembershipState } from '@/features/memberships/components/membership-action-state'
import { AlertDialog, Button, toast } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

type MembershipRemoveButtonProps = {
  membershipId: string
  memberName: string
  isDisabled: boolean
}

export function MembershipRemoveButton({ membershipId, memberName, isDisabled }: MembershipRemoveButtonProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(removeMembershipAction, initialRemoveMembershipState)

  useEffect(() => {
    if (state.status === 'success' && state.message && state.removedMembershipId === membershipId) {
      toast.success(state.message)
      router.refresh()
      return
    }

    if (state.status === 'error' && state.message) {
      toast.danger(state.message)
    }
  }, [membershipId, router, state.message, state.removedMembershipId, state.status])

  return (
    <AlertDialog>
      <Button isDisabled={isDisabled} size="sm" variant="danger">
        Remove
      </Button>

      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>Remove member</AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body>
              Remove {memberName} from the current organization. Backend rules still protect critical cases, including
              the last owner.
            </AlertDialog.Body>

            <AlertDialog.Footer>
              <Button slot="close" variant="ghost">
                Cancel
              </Button>

              <form action={formAction}>
                <input type="hidden" name="membershipId" value={membershipId} />

                <Button isPending={pending} size="sm" type="submit" variant="danger">
                  Confirm remove
                </Button>
              </form>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  )
}
