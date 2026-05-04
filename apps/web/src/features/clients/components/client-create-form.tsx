'use client'

import { FormSelectField, FormTextField } from '@/components/ui/form-fields'
import { PendingSubmitButton } from '@/components/ui/pending-submit-button'
import { createClientAction } from '@/features/clients/actions/client-actions'
import { CLIENT_STATUS_OPTIONS } from '@/lib/clients/client-status'
import { cn } from '@/lib/styles'
import { Form, toast } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { useActionState, useEffect } from 'react'

import { initialClientFormState } from './client-form-state'

type ClientCreateFormProps = {
  onSuccess?: () => void
  className?: string
}

export function ClientCreateForm({ onSuccess, className }: ClientCreateFormProps) {
  const queryClient = useQueryClient()
  const [state, formAction] = useActionState(createClientAction, initialClientFormState)
  const resolvedState = state ?? initialClientFormState

  useEffect(() => {
    if (resolvedState.status === 'success' && resolvedState.message) {
      toast.success(resolvedState.message)
      void queryClient.invalidateQueries({ queryKey: ['clients'] })
      onSuccess?.()
    }
  }, [onSuccess, queryClient, resolvedState.message, resolvedState.status])

  return (
    <Form key={resolvedState.formKey} action={formAction} className={cn('grid gap-4 md:grid-cols-2', className)}>
      <FormTextField
        label="Client name"
        name="name"
        defaultValue={resolvedState.fields.name}
        error={resolvedState.fieldErrors.name}
        isRequired
        placeholder="Acme Corp"
        className="md:col-span-2"
      />

      <FormTextField
        label="Company name"
        name="companyName"
        defaultValue={resolvedState.fields.companyName}
        error={resolvedState.fieldErrors.companyName}
        placeholder="Acme Corporation"
      />

      <FormTextField
        label="Email"
        name="email"
        type="email"
        defaultValue={resolvedState.fields.email}
        error={resolvedState.fieldErrors.email}
        placeholder="ops@acme.com"
      />

      <FormSelectField
        label="Status"
        name="status"
        options={CLIENT_STATUS_OPTIONS.filter(option => option.id !== 'archived')}
        defaultValue={resolvedState.fields.status}
        error={resolvedState.fieldErrors.status}
        placeholder="Select status"
        className="md:col-span-2"
      />

      {resolvedState.status === 'error' && resolvedState.message ? (
        <p className="md:col-span-2 text-sm text-danger">{resolvedState.message}</p>
      ) : null}

      <div className="flex justify-stretch md:col-span-2 sm:justify-end">
        <PendingSubmitButton
          className="w-full sm:w-auto"
          idleLabel="Create client"
          pendingLabel="Creating client..."
          size="lg"
        />
      </div>
    </Form>
  )
}
