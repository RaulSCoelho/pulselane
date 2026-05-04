'use client'

import { FormSelectField, FormTextField } from '@/components/ui/form-fields'
import { PendingSubmitButton } from '@/components/ui/pending-submit-button'
import { createInvitationAction } from '@/features/invitations/actions/invitation-actions'
import { MEMBERSHIP_ROLE_OPTIONS } from '@/lib/memberships/membership-role'
import { cn } from '@/lib/styles'
import { Form, toast } from '@heroui/react'
import { useActionState, useEffect } from 'react'

import { initialInvitationFormState } from './invitation-action-state'

type InvitationCreateFormProps = {
  onSuccess?: () => void
  className?: string
}

export function InvitationCreateForm({ onSuccess, className }: InvitationCreateFormProps) {
  const [state, formAction] = useActionState(createInvitationAction, initialInvitationFormState)
  const resolvedState = state ?? initialInvitationFormState

  useEffect(() => {
    if (resolvedState.status === 'success' && resolvedState.message) {
      toast.success(resolvedState.message)
      onSuccess?.()
      return
    }

    if (resolvedState.status === 'error' && resolvedState.message) {
      toast.danger(resolvedState.message)
    }
  }, [onSuccess, resolvedState.message, resolvedState.status])

  return (
    <Form
      key={resolvedState.formKey}
      action={formAction}
      className={cn('grid gap-4 md:grid-cols-[1.5fr_1fr_auto]', className)}
    >
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

      <div className="flex items-end justify-stretch sm:justify-end">
        <PendingSubmitButton
          className="w-full sm:w-auto"
          idleLabel="Create invitation"
          pendingLabel="Creating..."
          size="lg"
        />
      </div>
    </Form>
  )
}
