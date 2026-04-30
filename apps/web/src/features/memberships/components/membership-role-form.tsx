'use client'

import { FormSelectField } from '@/components/ui/form-fields'
import { PendingSubmitButton } from '@/components/ui/pending-submit-button'
import { updateMembershipRoleAction } from '@/features/memberships/actions/membership-actions'
import { initialMembershipRoleFormState } from '@/features/memberships/components/membership-action-state'
import { MEMBERSHIP_ROLE_OPTIONS } from '@/lib/memberships/membership-role'
import { Form, toast } from '@heroui/react'
import type { MembershipResponse } from '@pulselane/contracts/memberships'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

type MembershipRoleFormProps = {
  membership: MembershipResponse
  isDisabled: boolean
}

export function MembershipRoleForm({ membership, isDisabled }: MembershipRoleFormProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(updateMembershipRoleAction, {
    ...initialMembershipRoleFormState,
    fields: {
      role: membership.role
    }
  })

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

  return (
    <Form key={state.formKey} action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="membershipId" value={membership.id} />

      <FormSelectField
        label="Role"
        name="role"
        options={MEMBERSHIP_ROLE_OPTIONS}
        defaultValue={state.fields.role}
        error={state.fieldErrors.role}
        isDisabled={isDisabled}
        labelClassName="sr-only"
        className="min-w-36"
        placeholder="Select role"
      />

      <PendingSubmitButton idleLabel="Save" pendingLabel="Saving..." size="sm" variant="outline" />
    </Form>
  )
}
