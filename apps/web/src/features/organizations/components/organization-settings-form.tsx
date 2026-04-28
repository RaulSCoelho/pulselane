'use client'

import { updateOrganizationSettingsAction } from '@/features/organizations/actions/organization-settings-actions'
import { initialOrganizationSettingsFormState } from '@/features/organizations/components/organization-settings-form-state'
import { Alert, Card, FieldError, Form, Input, Label, TextField, toast } from '@heroui/react'
import type { CurrentOrganizationResponse } from '@pulselane/contracts/organizations'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

import { OrganizationSettingsSubmitButton } from './organization-settings-submit-button'

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
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">Organization profile</Card.Title>
        <Card.Description className="text-sm leading-6 text-muted">
          Update the visible organization name and slug used to identify this tenant.
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <Form key={state.formKey} action={formAction} className="grid gap-4 md:grid-cols-2">
          <TextField
            className="flex flex-col gap-2"
            defaultValue={state.fields.name}
            isDisabled={!canEdit}
            isInvalid={Boolean(state.fieldErrors.name)}
            isRequired
            name="name"
          >
            <Label>Name</Label>
            <Input placeholder="Acme Operations" type="text" variant="secondary" />
            <FieldError>{state.fieldErrors.name}</FieldError>
          </TextField>

          <TextField
            className="flex flex-col gap-2"
            defaultValue={state.fields.slug}
            isDisabled={!canEdit}
            isInvalid={Boolean(state.fieldErrors.slug)}
            isRequired
            name="slug"
          >
            <Label>Slug</Label>
            <Input placeholder="acme-operations" type="text" variant="secondary" />
            <FieldError>{state.fieldErrors.slug}</FieldError>
          </TextField>

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
              <OrganizationSettingsSubmitButton />
            </div>
          ) : null}
        </Form>
      </Card.Content>
    </Card>
  )
}
