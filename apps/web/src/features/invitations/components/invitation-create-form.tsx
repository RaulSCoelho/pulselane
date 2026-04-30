'use client'

import { FormSelectField, FormTextField } from '@/components/ui/form-fields'
import { PendingSubmitButton } from '@/components/ui/pending-submit-button'
import { SectionCard } from '@/components/ui/section-card'
import { createInvitationAction } from '@/features/invitations/actions/invitation-actions'
import { MEMBERSHIP_ROLE_OPTIONS } from '@/lib/memberships/membership-role'
import { Form, toast } from '@heroui/react'
import { useActionState, useEffect } from 'react'

import { initialInvitationFormState } from './invitation-action-state'

export function InvitationCreateForm() {
  const [state, formAction] = useActionState(createInvitationAction, initialInvitationFormState)
  const resolvedState = state ?? initialInvitationFormState

  useEffect(() => {
    if (resolvedState.status === 'success' && resolvedState.message) {
      toast.success(resolvedState.message)
      return
    }

    if (resolvedState.status === 'error' && resolvedState.message) {
      toast.danger(resolvedState.message)
    }
  }, [resolvedState.message, resolvedState.status])

  return (
    <SectionCard
      title="Create invitation"
      description="Invite a user to the active organization with the correct role from the start."
    >
      <Form key={resolvedState.formKey} action={formAction} className="grid gap-4 md:grid-cols-[1.5fr_1fr_auto]">
        <FormTextField
          label="Email"
          name="email"
          type="email"
          defaultValue={resolvedState.fields.email}
          error={resolvedState.fieldErrors.email}
          isRequired
          placeholder="teammate@example.com"
        />

        <FormSelectField
          label="Role"
          name="role"
          options={MEMBERSHIP_ROLE_OPTIONS}
          defaultValue={resolvedState.fields.role}
          error={resolvedState.fieldErrors.role}
          isRequired
          placeholder="Select role"
        />

        <div className="flex items-end justify-end">
          <PendingSubmitButton idleLabel="Create invitation" pendingLabel="Creating..." size="lg" />
        </div>
      </Form>
    </SectionCard>
  )
}
