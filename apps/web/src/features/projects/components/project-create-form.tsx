'use client'

import { FormSelectField, FormTextField } from '@/components/ui/form-fields'
import { PendingSubmitButton } from '@/components/ui/pending-submit-button'
import { createProjectAction } from '@/features/projects/actions/project-actions'
import { PROJECT_STATUS_OPTIONS } from '@/lib/projects/project-status'
import { cn } from '@/lib/styles'
import { Form, toast } from '@heroui/react'
import type { ClientResponse } from '@pulselane/contracts/clients'
import { useQueryClient } from '@tanstack/react-query'
import { useActionState, useEffect } from 'react'

import { initialProjectFormState } from './project-form-state'

type ProjectCreateFormProps = {
  clients: ClientResponse[]
  onSuccess?: () => void
  className?: string
}

export function ProjectCreateForm({ clients, onSuccess, className }: ProjectCreateFormProps) {
  const queryClient = useQueryClient()
  const [state, formAction] = useActionState(createProjectAction, initialProjectFormState)
  const resolvedState = state ?? initialProjectFormState

  useEffect(() => {
    if (resolvedState.status === 'success' && resolvedState.message) {
      toast.success(resolvedState.message)
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      onSuccess?.()
    }
  }, [onSuccess, queryClient, resolvedState.message, resolvedState.status])

  return (
    <Form key={resolvedState.formKey} action={formAction} className={cn('grid gap-4 md:grid-cols-2', className)}>
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

      <div className="flex justify-stretch md:col-span-2 sm:justify-end">
        <PendingSubmitButton
          className="w-full sm:w-auto"
          idleLabel="Create project"
          pendingLabel="Creating project..."
          size="lg"
        />
      </div>
    </Form>
  )
}
