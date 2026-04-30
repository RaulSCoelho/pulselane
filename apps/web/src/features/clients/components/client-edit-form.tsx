'use client'

import { FormSelectField, FormTextField } from '@/components/ui/form-fields'
import { MetadataSummaryCard } from '@/components/ui/metric-card'
import { PendingSubmitButton } from '@/components/ui/pending-submit-button'
import { SectionCard } from '@/components/ui/section-card'
import { updateClientAction } from '@/features/clients/actions/client-actions'
import { CLIENT_STATUS_OPTIONS } from '@/lib/clients/client-status'
import { formatDateTime } from '@/lib/formatters'
import { Form, buttonVariants, toast } from '@heroui/react'
import { ClientResponse } from '@pulselane/contracts/clients'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'

import { initialClientFormState } from './client-form-state'

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
    <SectionCard
      title={canEdit ? 'Edit client' : 'Client overview'}
      description={
        canEdit
          ? 'Update the client data using optimistic concurrency through expectedUpdatedAt.'
          : 'Your current role is read-only for client management.'
      }
    >
      <Form key={state.formKey} action={formAction} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="clientId" value={client.id} />
        <input type="hidden" name="expectedUpdatedAt" value={client.updatedAt} />

        <FormTextField
          label="Client name"
          name="name"
          defaultValue={state.fields.name}
          error={state.fieldErrors.name}
          isDisabled={!canEdit}
          isRequired
          className="md:col-span-2"
        />

        <FormTextField
          label="Company name"
          name="companyName"
          defaultValue={state.fields.companyName}
          error={state.fieldErrors.companyName}
          isDisabled={!canEdit}
        />

        <FormTextField
          label="Email"
          name="email"
          type="email"
          defaultValue={state.fields.email}
          error={state.fieldErrors.email}
          isDisabled={!canEdit}
        />

        <FormSelectField
          label="Status"
          name="status"
          options={CLIENT_STATUS_OPTIONS}
          defaultValue={state.fields.status}
          error={state.fieldErrors.status}
          isDisabled={!canEdit}
          placeholder="Select status"
          className="md:col-span-2"
        />

        <MetadataSummaryCard
          className="md:col-span-2"
          items={[
            { label: 'Created', value: formatDateTime(client.createdAt) },
            { label: 'Updated', value: formatDateTime(client.updatedAt) },
            { label: 'Archived at', value: formatDateTime(client.archivedAt, 'Not archived') }
          ]}
        />

        {state.status === 'error' && state.message ? (
          <p className="md:col-span-2 text-sm text-danger">{state.message}</p>
        ) : null}

        <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
          <Link href="/app/clients" className={buttonVariants({ variant: 'outline' })}>
            Back to clients
          </Link>

          {canEdit ? <PendingSubmitButton idleLabel="Save changes" pendingLabel="Saving changes..." size="lg" /> : null}
        </div>
      </Form>
    </SectionCard>
  )
}
