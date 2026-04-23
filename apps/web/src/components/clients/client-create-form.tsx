'use client'

import { createClientAction } from '@/app/app/clients/actions'
import { CLIENT_STATUS_OPTIONS } from '@/lib/clients/client-status'
import { Card, FieldError, Form, Input, Label, ListBox, Select, TextField, toast } from '@heroui/react'
import { useActionState, useEffect } from 'react'

import { initialClientFormState } from './client-form-state'
import { ClientFormSubmitButton } from './client-form-submit-button'

export function ClientCreateForm() {
  const [state, formAction] = useActionState(createClientAction, initialClientFormState)
  const resolvedState = state ?? initialClientFormState

  useEffect(() => {
    if (resolvedState.status === 'success' && resolvedState.message) {
      toast.success(resolvedState.message)
    }
  }, [resolvedState.message, resolvedState.status])

  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">Create client</Card.Title>
        <Card.Description className="text-sm leading-6 text-muted">
          Add the first operational entity that unlocks projects and tasks.
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <Form key={resolvedState.formKey} action={formAction} className="grid gap-4 md:grid-cols-2">
          <TextField
            className="flex flex-col gap-2 md:col-span-2"
            defaultValue={resolvedState.fields.name}
            isInvalid={Boolean(resolvedState.fieldErrors.name)}
            isRequired
            name="name"
          >
            <Label>Client name</Label>
            <Input placeholder="Acme Corp" type="text" variant="secondary" />
            <FieldError>{resolvedState.fieldErrors.name}</FieldError>
          </TextField>

          <TextField
            className="flex flex-col gap-2"
            defaultValue={resolvedState.fields.companyName}
            isInvalid={Boolean(resolvedState.fieldErrors.companyName)}
            name="companyName"
          >
            <Label>Company name</Label>
            <Input placeholder="Acme Corporation" type="text" variant="secondary" />
            <FieldError>{resolvedState.fieldErrors.companyName}</FieldError>
          </TextField>

          <TextField
            className="flex flex-col gap-2"
            defaultValue={resolvedState.fields.email}
            isInvalid={Boolean(resolvedState.fieldErrors.email)}
            name="email"
          >
            <Label>Email</Label>
            <Input placeholder="ops@acme.com" type="email" variant="secondary" />
            <FieldError>{resolvedState.fieldErrors.email}</FieldError>
          </TextField>

          <Select
            className="flex flex-col gap-2 md:col-span-2"
            defaultSelectedKey={resolvedState.fields.status}
            isInvalid={Boolean(resolvedState.fieldErrors.status)}
            name="status"
            placeholder="Select status"
            variant="secondary"
          >
            <Label>Status</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {CLIENT_STATUS_OPTIONS.filter(option => option.id !== 'archived').map(option => (
                  <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
                    {option.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
            <FieldError>{resolvedState.fieldErrors.status}</FieldError>
          </Select>

          {resolvedState.status === 'error' && resolvedState.message ? (
            <p className="md:col-span-2 text-sm text-danger">{resolvedState.message}</p>
          ) : null}

          <div className="md:col-span-2 flex justify-end">
            <ClientFormSubmitButton idleLabel="Create client" pendingLabel="Creating client..." size="lg" />
          </div>
        </Form>
      </Card.Content>
    </Card>
  )
}
