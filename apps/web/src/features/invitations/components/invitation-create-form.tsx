'use client'

import { createInvitationAction } from '@/features/invitations/actions/invitation-actions'
import { MEMBERSHIP_ROLE_OPTIONS } from '@/lib/memberships/membership-role'
import { Card, FieldError, Form, Input, Label, ListBox, Select, TextField, toast } from '@heroui/react'
import { useActionState, useEffect } from 'react'

import { initialInvitationFormState } from './invitation-action-state'
import { InvitationFormSubmitButton } from './invitation-form-submit-button'

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
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">Create invitation</Card.Title>
        <Card.Description className="text-sm leading-6 text-muted">
          Invite a user to the active organization with the correct role from the start.
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <Form key={resolvedState.formKey} action={formAction} className="grid gap-4 md:grid-cols-[1.5fr_1fr_auto]">
          <TextField
            className="flex flex-col gap-2"
            defaultValue={resolvedState.fields.email}
            isInvalid={Boolean(resolvedState.fieldErrors.email)}
            isRequired
            name="email"
          >
            <Label>Email</Label>
            <Input placeholder="teammate@example.com" type="email" variant="secondary" />
            <FieldError>{resolvedState.fieldErrors.email}</FieldError>
          </TextField>

          <Select
            className="flex flex-col gap-2"
            defaultValue={resolvedState.fields.role}
            isInvalid={Boolean(resolvedState.fieldErrors.role)}
            isRequired
            name="role"
            placeholder="Select role"
            variant="secondary"
          >
            <Label>Role</Label>
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
            <FieldError>{resolvedState.fieldErrors.role}</FieldError>
          </Select>

          <div className="flex items-end justify-end">
            <InvitationFormSubmitButton idleLabel="Create invitation" pendingLabel="Creating..." size="lg" />
          </div>
        </Form>
      </Card.Content>
    </Card>
  )
}
