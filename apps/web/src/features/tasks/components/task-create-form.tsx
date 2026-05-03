'use client'

import { FormSelectField, FormTextField } from '@/components/ui/form-fields'
import { PendingSubmitButton } from '@/components/ui/pending-submit-button'
import { SectionCard } from '@/components/ui/section-card'
import { createTaskAction } from '@/features/tasks/actions/task-actions'
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '@/lib/tasks/task-status'
import { Form, toast } from '@heroui/react'
import type { MembershipResponse } from '@pulselane/contracts/memberships'
import type { ProjectResponse } from '@pulselane/contracts/projects'
import { useQueryClient } from '@tanstack/react-query'
import { useActionState, useEffect } from 'react'

import { initialTaskFormState } from './task-form-state'

type TaskCreateFormProps = {
  projects: ProjectResponse[]
  memberships: MembershipResponse[]
}

export function TaskCreateForm({ projects, memberships }: TaskCreateFormProps) {
  const queryClient = useQueryClient()
  const [state, formAction] = useActionState(createTaskAction, initialTaskFormState)
  const resolvedState = state ?? initialTaskFormState

  useEffect(() => {
    if (resolvedState.status === 'success' && resolvedState.message) {
      toast.success(resolvedState.message)
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  }, [queryClient, resolvedState.message, resolvedState.status])

  return (
    <SectionCard
      title="Create task"
      description="Add operational work under a project, with priority, assignee and due date when needed."
    >
      <Form key={resolvedState.formKey} action={formAction} className="grid gap-4 md:grid-cols-2">
        <FormTextField
          label="Task title"
          name="title"
          defaultValue={resolvedState.fields.title}
          error={resolvedState.fieldErrors.title}
          isRequired
          placeholder="Review client onboarding flow"
          className="md:col-span-2"
        />

        <FormSelectField
          label="Project"
          name="projectId"
          options={projects.map(project => ({ id: project.id, label: project.name }))}
          defaultValue={resolvedState.fields.projectId || undefined}
          error={resolvedState.fieldErrors.projectId}
          isRequired
          placeholder="Select project"
        />

        <FormSelectField
          label="Assignee"
          name="assigneeUserId"
          options={[
            { id: 'unassigned', label: 'Unassigned' },
            ...memberships.map(membership => ({ id: membership.userId, label: membership.user.name }))
          ]}
          defaultValue={resolvedState.fields.assigneeUserId || 'unassigned'}
          error={resolvedState.fieldErrors.assigneeUserId}
          placeholder="Select assignee"
        />

        <FormSelectField
          label="Status"
          name="status"
          options={TASK_STATUS_OPTIONS.filter(option => option.id !== 'archived')}
          defaultValue={resolvedState.fields.status}
          error={resolvedState.fieldErrors.status}
          placeholder="Select status"
        />

        <FormSelectField
          label="Priority"
          name="priority"
          options={TASK_PRIORITY_OPTIONS}
          defaultValue={resolvedState.fields.priority}
          error={resolvedState.fieldErrors.priority}
          placeholder="Select priority"
        />

        <FormTextField
          label="Due date"
          name="dueDate"
          type="datetime-local"
          defaultValue={resolvedState.fields.dueDate}
          error={resolvedState.fieldErrors.dueDate}
        />

        <FormTextField
          label="Blocked reason"
          name="blockedReason"
          defaultValue={resolvedState.fields.blockedReason}
          error={resolvedState.fieldErrors.blockedReason}
          placeholder="Required only when status is blocked"
        />

        <FormTextField
          label="Description"
          name="description"
          defaultValue={resolvedState.fields.description}
          error={resolvedState.fieldErrors.description}
          placeholder="Execution notes, context, or acceptance criteria."
          multiline
          className="md:col-span-2"
        />

        {resolvedState.status === 'error' && resolvedState.message ? (
          <p className="md:col-span-2 text-sm text-danger">{resolvedState.message}</p>
        ) : null}

        <div className="flex justify-stretch md:col-span-2 sm:justify-end">
          <PendingSubmitButton
            className="w-full sm:w-auto"
            idleLabel="Create task"
            pendingLabel="Creating task..."
            size="lg"
          />
        </div>
      </Form>
    </SectionCard>
  )
}
