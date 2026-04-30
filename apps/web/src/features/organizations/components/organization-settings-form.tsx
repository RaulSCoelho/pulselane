'use client'

import { FormTextField } from '@/components/ui/form-fields'
import { PendingSubmitButton } from '@/components/ui/pending-submit-button'
import { SectionCard } from '@/components/ui/section-card'
import { updateOrganizationSettingsAction } from '@/features/organizations/actions/organization-settings-actions'
import { initialOrganizationSettingsFormState } from '@/features/organizations/components/organization-settings-form-state'
import { Alert, Form, toast } from '@heroui/react'
import type { CurrentOrganizationResponse } from '@pulselane/contracts/organizations'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

type OrganizationSettingsFormProps = {
  currentOrganization: CurrentOrganizationResponse
  canEdit: boolean
}

export function OrganizationSettingsForm({ currentOrganization, canEdit }: OrganizationSettingsFormProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(updateOrganizationSettingsAction, {
    ...initialOrganizationSettingsFormState,
    fields: {
      name: currentOrganization.organization.name,
      slug: currentOrganization.organization.slug
    }
  })

  useEffect(() => {
    if (state.status === 'success' && state.message) {
      toast.success(state.message)
      router.refresh()
      return
    }

    if (state.status === 'error' && state.message) {
      toast.danger(state.message)
    }
  }, [router, state.message, state.status])

  return (
    <SectionCard
      title="Organization profile"
      description="Update the visible organization name and slug used to identify this tenant."
    >
      <Form key={state.formKey} action={formAction} className="grid gap-4 md:grid-cols-2">
        <FormTextField
          label="Name"
          name="name"
          defaultValue={state.fields.name}
          error={state.fieldErrors.name}
          isDisabled={!canEdit}
          isRequired
          placeholder="Acme Operations"
        />

        <FormTextField
          label="Slug"
          name="slug"
          defaultValue={state.fields.slug}
          error={state.fieldErrors.slug}
          isDisabled={!canEdit}
          isRequired
          placeholder="acme-operations"
        />

        {!canEdit ? (
          <Alert className="md:col-span-2" status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Read-only access</Alert.Title>
              <Alert.Description>
                Your current role can inspect organization settings, but cannot update them.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        {state.status === 'error' && state.message ? (
          <Alert className="md:col-span-2" status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Unable to update organization</Alert.Title>
              <Alert.Description>{state.message}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        {state.status === 'success' && state.message ? (
          <Alert className="md:col-span-2" status="success">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Organization saved</Alert.Title>
              <Alert.Description>{state.message}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        {canEdit ? (
          <div className="flex justify-end md:col-span-2">
            <PendingSubmitButton idleLabel="Save organization" pendingLabel="Saving organization..." size="lg" />
          </div>
        ) : null}
      </Form>
    </SectionCard>
  )
}
