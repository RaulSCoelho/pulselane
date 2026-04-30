'use client'

import { FormSelectField, FormTextField } from '@/components/ui/form-fields'
import { PendingSubmitButton } from '@/components/ui/pending-submit-button'
import { SectionCard } from '@/components/ui/section-card'
import { createProjectAction } from '@/features/projects/actions/project-actions'
import { PROJECT_STATUS_OPTIONS } from '@/lib/projects/project-status'
import { Form, toast } from '@heroui/react'
import type { ClientResponse } from '@pulselane/contracts/clients'
import { useActionState, useEffect } from 'react'

import { initialProjectFormState } from './project-form-state'

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
    <SectionCard
      title="Create project"
      description="Connect client work to a clear operational project before tasks are created."
    >
      <Form key={resolvedState.formKey} action={formAction} className="grid gap-4 md:grid-cols-2">
        <FormTextField
          label="Project name"
          name="name"
          defaultValue={resolvedState.fields.name}
          error={resolvedState.fieldErrors.name}
          isRequired
          placeholder="Website operations"
          className="md:col-span-2"
        />

        <FormSelectField
          label="Client"
          name="clientId"
          options={clients.map(client => ({ id: client.id, label: client.name }))}
          defaultValue={resolvedState.fields.clientId || undefined}
          error={resolvedState.fieldErrors.clientId}
          isRequired
          placeholder="Select client"
        />

        <FormSelectField
          label="Status"
          name="status"
          options={PROJECT_STATUS_OPTIONS.filter(option => option.id !== 'archived')}
          defaultValue={resolvedState.fields.status}
          error={resolvedState.fieldErrors.status}
          placeholder="Select status"
        />

        <FormTextField
          label="Description"
          name="description"
          defaultValue={resolvedState.fields.description}
          error={resolvedState.fieldErrors.description}
          placeholder="Scope, operational context, or delivery notes."
          multiline
          className="md:col-span-2"
        />

        {resolvedState.status === 'error' && resolvedState.message ? (
          <p className="md:col-span-2 text-sm text-danger">{resolvedState.message}</p>
        ) : null}

        <div className="md:col-span-2 flex justify-end">
          <PendingSubmitButton idleLabel="Create project" pendingLabel="Creating project..." size="lg" />
        </div>
      </Form>
    </SectionCard>
  )
}
