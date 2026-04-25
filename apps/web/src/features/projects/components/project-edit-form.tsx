'use client'

import { updateProjectAction } from '@/features/projects/actions/project-actions'
import { PROJECTS_PATH } from '@/lib/projects/project-constants'
import { PROJECT_STATUS_OPTIONS } from '@/lib/projects/project-status'
import {
  Card,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
  buttonVariants,
  toast
} from '@heroui/react'
import type { ClientResponse } from '@pulselane/contracts/clients'
import type { ProjectResponse } from '@pulselane/contracts/projects'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'

import { initialProjectFormState } from './project-form-state'
import { ProjectFormSubmitButton } from './project-form-submit-button'

type ProjectEditFormProps = {
  project: ProjectResponse
  clients: ClientResponse[]
  canEdit: boolean
}

export function ProjectEditForm({ project, clients, canEdit }: ProjectEditFormProps) {
  const [state, formAction] = useActionState(updateProjectAction, {
    ...initialProjectFormState,
    fields: {
      name: project.name,
      clientId: project.clientId,
      description: project.description ?? '',
      status: project.status
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
          {canEdit ? 'Edit project' : 'Project overview'}
        </Card.Title>
        <Card.Description className="text-sm leading-6 text-muted">
          {canEdit
            ? 'Update the project while preserving tenant scope and optimistic concurrency.'
            : 'Your current role is read-only for project management.'}
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <Form key={state.formKey} action={formAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="expectedUpdatedAt" value={project.updatedAt} />

          <TextField
            className="flex flex-col gap-2 md:col-span-2"
            defaultValue={state.fields.name}
            isDisabled={!canEdit}
            isInvalid={Boolean(state.fieldErrors.name)}
            isRequired
            name="name"
          >
            <Label>Project name</Label>
            <Input type="text" variant="secondary" />
            <FieldError>{state.fieldErrors.name}</FieldError>
          </TextField>

          <Select
            className="flex flex-col gap-2"
            defaultValue={state.fields.clientId}
            isDisabled={!canEdit}
            isInvalid={Boolean(state.fieldErrors.clientId)}
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
            <FieldError>{state.fieldErrors.clientId}</FieldError>
          </Select>

          <Select
            className="flex flex-col gap-2"
            defaultValue={state.fields.status}
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
                {PROJECT_STATUS_OPTIONS.map(option => (
                  <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
                    {option.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
            <FieldError>{state.fieldErrors.status}</FieldError>
          </Select>

          <TextField
            className="flex flex-col gap-2 md:col-span-2"
            defaultValue={state.fields.description}
            isDisabled={!canEdit}
            isInvalid={Boolean(state.fieldErrors.description)}
            name="description"
          >
            <Label>Description</Label>
            <TextArea variant="secondary" />
            <FieldError>{state.fieldErrors.description}</FieldError>
          </TextField>

          <Card className="md:col-span-2" variant="tertiary">
            <Card.Content className="grid gap-3 p-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Created</p>
                <p className="mt-1 text-sm text-foreground">{new Date(project.createdAt).toLocaleString('en-US')}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Updated</p>
                <p className="mt-1 text-sm text-foreground">{new Date(project.updatedAt).toLocaleString('en-US')}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Archived at</p>
                <p className="mt-1 text-sm text-foreground">
                  {project.archivedAt ? new Date(project.archivedAt).toLocaleString('en-US') : 'Not archived'}
                </p>
              </div>
            </Card.Content>
          </Card>

          {state.status === 'error' && state.message ? (
            <p className="md:col-span-2 text-sm text-danger">{state.message}</p>
          ) : null}

          <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
            <Link href={PROJECTS_PATH} className={buttonVariants({ variant: 'outline' })}>
              Back to projects
            </Link>

            {canEdit ? (
              <ProjectFormSubmitButton idleLabel="Save changes" pendingLabel="Saving changes..." size="lg" />
            ) : null}
          </div>
        </Form>
      </Card.Content>
    </Card>
  )
}
