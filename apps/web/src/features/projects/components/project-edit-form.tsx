'use client'

import { FormSelectField, FormTextField } from '@/components/ui/form-fields'
import { MetadataSummaryCard } from '@/components/ui/metric-card'
import { PendingSubmitButton } from '@/components/ui/pending-submit-button'
import { SectionCard } from '@/components/ui/section-card'
import { updateProjectAction } from '@/features/projects/actions/project-actions'
import { formatDateTime } from '@/lib/formatters'
import { PROJECTS_PATH } from '@/lib/projects/project-constants'
import { PROJECT_STATUS_OPTIONS } from '@/lib/projects/project-status'
import { Form, buttonVariants, toast } from '@heroui/react'
import type { ClientResponse } from '@pulselane/contracts/clients'
import type { ProjectResponse } from '@pulselane/contracts/projects'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'

import { initialProjectFormState } from './project-form-state'

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
    <SectionCard
      title={canEdit ? 'Edit project' : 'Project overview'}
      description={
        canEdit
          ? 'Update the project while preserving tenant scope and optimistic concurrency.'
          : 'Your current role is read-only for project management.'
      }
    >
      <Form key={state.formKey} action={formAction} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="projectId" value={project.id} />
        <input type="hidden" name="expectedUpdatedAt" value={project.updatedAt} />

        <FormTextField
          label="Project name"
          name="name"
          defaultValue={state.fields.name}
          error={state.fieldErrors.name}
          isDisabled={!canEdit}
          isRequired
          className="md:col-span-2"
        />

        <FormSelectField
          label="Client"
          name="clientId"
          options={clients.map(client => ({ id: client.id, label: client.name }))}
          defaultValue={state.fields.clientId}
          error={state.fieldErrors.clientId}
          isDisabled={!canEdit}
          isRequired
          placeholder="Select client"
        />

        <FormSelectField
          label="Status"
          name="status"
          options={PROJECT_STATUS_OPTIONS}
          defaultValue={state.fields.status}
          error={state.fieldErrors.status}
          isDisabled={!canEdit}
          placeholder="Select status"
        />

        <FormTextField
          label="Description"
          name="description"
          defaultValue={state.fields.description}
          error={state.fieldErrors.description}
          isDisabled={!canEdit}
          multiline
          className="md:col-span-2"
        />

        <MetadataSummaryCard
          className="md:col-span-2"
          items={[
            { label: 'Created', value: formatDateTime(project.createdAt) },
            { label: 'Updated', value: formatDateTime(project.updatedAt) },
            { label: 'Archived at', value: formatDateTime(project.archivedAt, 'Not archived') }
          ]}
        />

        {state.status === 'error' && state.message ? (
          <p className="md:col-span-2 text-sm text-danger">{state.message}</p>
        ) : null}

        <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
          <Link href={PROJECTS_PATH} className={buttonVariants({ variant: 'outline' })}>
            Back to projects
          </Link>

          {canEdit ? <PendingSubmitButton idleLabel="Save changes" pendingLabel="Saving changes..." size="lg" /> : null}
        </div>
      </Form>
    </SectionCard>
  )
}
