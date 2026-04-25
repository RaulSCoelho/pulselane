'use client'

import { createProjectAction } from '@/features/projects/actions/project-actions'
import { PROJECT_STATUS_OPTIONS } from '@/lib/projects/project-status'
import { Card, FieldError, Form, Input, Label, ListBox, Select, TextArea, TextField, toast } from '@heroui/react'
import type { ClientResponse } from '@pulselane/contracts/clients'
import { useActionState, useEffect } from 'react'

import { initialProjectFormState } from './project-form-state'
import { ProjectFormSubmitButton } from './project-form-submit-button'

type ProjectCreateFormProps = {
  clients: ClientResponse[]
}

export function ProjectCreateForm({ clients }: ProjectCreateFormProps) {
  const [state, formAction] = useActionState(createProjectAction, initialProjectFormState)
  const resolvedState = state ?? initialProjectFormState

  useEffect(() => {
    if (resolvedState.status === 'success' && resolvedState.message) {
      toast.success(resolvedState.message)
    }
  }, [resolvedState.message, resolvedState.status])

  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">Create project</Card.Title>
        <Card.Description className="text-sm leading-6 text-muted">
          Connect client work to a clear operational project before tasks are created.
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
            <Label>Project name</Label>
            <Input placeholder="Website operations" type="text" variant="secondary" />
            <FieldError>{resolvedState.fieldErrors.name}</FieldError>
          </TextField>

          <Select
            className="flex flex-col gap-2"
            defaultValue={resolvedState.fields.clientId || undefined}
            isInvalid={Boolean(resolvedState.fieldErrors.clientId)}
            isRequired
            name="clientId"
            placeholder="Select client"
            variant="secondary"
          >
            <Label>Client</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {clients.map(client => (
                  <ListBox.Item id={client.id} key={client.id} textValue={client.name}>
                    {client.name}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
            <FieldError>{resolvedState.fieldErrors.clientId}</FieldError>
          </Select>

          <Select
            className="flex flex-col gap-2"
            defaultValue={resolvedState.fields.status}
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
                {PROJECT_STATUS_OPTIONS.filter(option => option.id !== 'archived').map(option => (
                  <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
                    {option.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
            <FieldError>{resolvedState.fieldErrors.status}</FieldError>
          </Select>

          <TextField
            className="flex flex-col gap-2 md:col-span-2"
            defaultValue={resolvedState.fields.description}
            isInvalid={Boolean(resolvedState.fieldErrors.description)}
            name="description"
          >
            <Label>Description</Label>
            <TextArea placeholder="Scope, operational context, or delivery notes." variant="secondary" />
            <FieldError>{resolvedState.fieldErrors.description}</FieldError>
          </TextField>

          {resolvedState.status === 'error' && resolvedState.message ? (
            <p className="md:col-span-2 text-sm text-danger">{resolvedState.message}</p>
          ) : null}

          <div className="md:col-span-2 flex justify-end">
            <ProjectFormSubmitButton idleLabel="Create project" pendingLabel="Creating project..." size="lg" />
          </div>
        </Form>
      </Card.Content>
    </Card>
  )
}
