'use client'

import { updateClientAction } from '@/app/app/clients/actions'
import { CLIENT_STATUS_OPTIONS } from '@/lib/clients/client-status'
import { Card, FieldError, Form, Input, Label, ListBox, Select, TextField, buttonVariants, toast } from '@heroui/react'
import { ClientResponse } from '@pulselane/contracts/clients'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'

import { initialClientFormState } from './client-form-state'
import { ClientFormSubmitButton } from './client-form-submit-button'

type ClientEditFormProps = {
  client: ClientResponse
  canEdit: boolean
}

export function ClientEditForm({ client, canEdit }: ClientEditFormProps) {
  const [state, formAction] = useActionState(updateClientAction, {
    ...initialClientFormState,
    fields: {
      name: client.name,
      email: client.email ?? '',
      companyName: client.companyName ?? '',
      status: client.status
    }
  })

  useEffect(() => {
    if (state.status === 'success' && state.message) {
      toast.success(state.message)
    }
  }, [state.message, state.status])

  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">
          {canEdit ? 'Edit client' : 'Client overview'}
        </Card.Title>
        <Card.Description className="text-sm leading-6 text-muted">
          {canEdit
            ? 'Update the client data using optimistic concurrency through expectedUpdatedAt.'
            : 'Your current role is read-only for client management.'}
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <Form key={state.formKey} action={formAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="clientId" value={client.id} />
          <input type="hidden" name="expectedUpdatedAt" value={client.updatedAt} />

          <TextField
            className="flex flex-col gap-2 md:col-span-2"
            defaultValue={state.fields.name}
            isDisabled={!canEdit}
            isInvalid={Boolean(state.fieldErrors.name)}
            isRequired
            name="name"
          >
            <Label>Client name</Label>
            <Input type="text" variant="secondary" />
            <FieldError>{state.fieldErrors.name}</FieldError>
          </TextField>

          <TextField
            className="flex flex-col gap-2"
            defaultValue={state.fields.companyName}
            isDisabled={!canEdit}
            isInvalid={Boolean(state.fieldErrors.companyName)}
            name="companyName"
          >
            <Label>Company name</Label>
            <Input type="text" variant="secondary" />
            <FieldError>{state.fieldErrors.companyName}</FieldError>
          </TextField>

          <TextField
            className="flex flex-col gap-2"
            defaultValue={state.fields.email}
            isDisabled={!canEdit}
            isInvalid={Boolean(state.fieldErrors.email)}
            name="email"
          >
            <Label>Email</Label>
            <Input type="email" variant="secondary" />
            <FieldError>{state.fieldErrors.email}</FieldError>
          </TextField>

          <Select
            className="flex flex-col gap-2 md:col-span-2"
            defaultSelectedKey={state.fields.status}
            isDisabled={!canEdit}
            isInvalid={Boolean(state.fieldErrors.status)}
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
                {CLIENT_STATUS_OPTIONS.map(option => (
                  <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
                    {option.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
            <FieldError>{state.fieldErrors.status}</FieldError>
          </Select>

          <Card className="md:col-span-2" variant="tertiary">
            <Card.Content className="grid gap-3 p-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Created</p>
                <p className="mt-1 text-sm text-foreground">{new Date(client.createdAt).toLocaleString('en-US')}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Updated</p>
                <p className="mt-1 text-sm text-foreground">{new Date(client.updatedAt).toLocaleString('en-US')}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Archived at</p>
                <p className="mt-1 text-sm text-foreground">
                  {client.archivedAt ? new Date(client.archivedAt).toLocaleString('en-US') : 'Not archived'}
                </p>
              </div>
            </Card.Content>
          </Card>

          {state.status === 'error' && state.message ? (
            <p className="md:col-span-2 text-sm text-danger">{state.message}</p>
          ) : null}

          <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
            <Link href="/app/clients" className={buttonVariants({ variant: 'outline' })}>
              Back to clients
            </Link>

            {canEdit ? (
              <ClientFormSubmitButton idleLabel="Save changes" pendingLabel="Saving changes..." size="lg" />
            ) : null}
          </div>
        </Form>
      </Card.Content>
    </Card>
  )
}
