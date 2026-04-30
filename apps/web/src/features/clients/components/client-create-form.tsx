'use client'

import { FormSelectField, FormTextField } from '@/components/ui/form-fields'
import { PendingSubmitButton } from '@/components/ui/pending-submit-button'
import { SectionCard } from '@/components/ui/section-card'
import { createClientAction } from '@/features/clients/actions/client-actions'
import { CLIENT_STATUS_OPTIONS } from '@/lib/clients/client-status'
import { Form, toast } from '@heroui/react'
import { useActionState, useEffect } from 'react'

import { initialClientFormState } from './client-form-state'

export function ClientCreateForm() {
  const [state, formAction] = useActionState(createClientAction, initialClientFormState)
  const resolvedState = state ?? initialClientFormState

  useEffect(() => {
    if (resolvedState.status === 'success' && resolvedState.message) {
      toast.success(resolvedState.message)
    }
  }, [resolvedState.message, resolvedState.status])

  return (
    <SectionCard title="Create client" description="Add the first operational entity that unlocks projects and tasks.">
      <Form key={resolvedState.formKey} action={formAction} className="grid gap-4 md:grid-cols-2">
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

        <div className="md:col-span-2 flex justify-end">
          <PendingSubmitButton idleLabel="Create client" pendingLabel="Creating client..." size="lg" />
        </div>
      </Form>
    </SectionCard>
  )
}
