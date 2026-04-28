'use client'

import { resendInvitationAction } from '@/features/invitations/actions/invitation-actions'
import { initialInvitationMutationState } from '@/features/invitations/components/invitation-action-state'
import { Button, toast } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

type InvitationResendButtonProps = {
  invitationId: string
  isDisabled: boolean
}

export function InvitationResendButton({ invitationId, isDisabled }: InvitationResendButtonProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(resendInvitationAction, initialInvitationMutationState)

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
    <form action={formAction}>
      <input type="hidden" name="invitationId" value={invitationId} />

      <Button isDisabled={isDisabled} isPending={pending} size="sm" type="submit" variant="outline">
        Resend
      </Button>
    </form>
  )
}
