'use client'

import { updateMembershipRoleAction } from '@/features/memberships/actions/membership-actions'
import { initialMembershipRoleFormState } from '@/features/memberships/components/membership-action-state'
import { MEMBERSHIP_ROLE_OPTIONS } from '@/lib/memberships/membership-role'
import { FieldError, Form, Label, ListBox, Select, toast } from '@heroui/react'
import type { MembershipResponse } from '@pulselane/contracts/memberships'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

import { MembershipFormSubmitButton } from './membership-form-submit-button'

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

      <Select
        className="min-w-36"
        defaultValue={state.fields.role}
        isDisabled={isDisabled}
        isInvalid={Boolean(state.fieldErrors.role)}
        name="role"
        placeholder="Select role"
        variant="secondary"
      >
        <Label className="sr-only">Role</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {MEMBERSHIP_ROLE_OPTIONS.map(option => (
              <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
                {option.label}
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
        <FieldError>{state.fieldErrors.role}</FieldError>
      </Select>

      <MembershipFormSubmitButton idleLabel="Save" pendingLabel="Saving..." size="sm" variant="outline" />
    </Form>
  )
}
