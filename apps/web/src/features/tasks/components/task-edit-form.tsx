'use client'

import { FormSelectField, FormTextField } from '@/components/ui/form-fields'
import { MetadataSummaryCard } from '@/components/ui/metric-card'
import { PendingSubmitButton } from '@/components/ui/pending-submit-button'
import { SectionCard } from '@/components/ui/section-card'
import { updateTaskAction } from '@/features/tasks/actions/task-actions'
import { formatDateTime, toDateTimeLocalValue } from '@/lib/formatters'
import { TASKS_PATH } from '@/lib/tasks/task-constants'
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '@/lib/tasks/task-status'
import { Form, buttonVariants, toast } from '@heroui/react'
import type { MembershipResponse } from '@pulselane/contracts/memberships'
import type { ProjectResponse } from '@pulselane/contracts/projects'
import type { TaskResponse } from '@pulselane/contracts/tasks'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'

import { initialTaskFormState } from './task-form-state'

type TaskEditFormProps = {
  task: TaskResponse
  projects: ProjectResponse[]
  memberships: MembershipResponse[]
  canEdit: boolean
}

export function TaskEditForm({ task, projects, memberships, canEdit }: TaskEditFormProps) {
  const [state, formAction] = useActionState(updateTaskAction, {
    ...initialTaskFormState,
    fields: {
      title: task.title,
      projectId: task.projectId,
      description: task.description ?? '',
      assigneeUserId: task.assigneeUserId ?? '',
      status: task.status,
      priority: task.priority,
      blockedReason: task.blockedReason ?? '',
      dueDate: toDateTimeLocalValue(task.dueDate)
    }
  })

  useEffect(() => {
    if (state.status === 'success' && state.message) {
      toast.success(state.message)
    }
  }, [state.message, state.status])

  return (
    <SectionCard
      title={canEdit ? 'Edit task' : 'Task overview'}
      description={
        canEdit
          ? 'Update the task while preserving tenant scope and optimistic concurrency.'
          : 'Your current role is read-only for task management.'
      }
    >
      <Form key={state.formKey} action={formAction} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="taskId" value={task.id} />
        <input type="hidden" name="expectedUpdatedAt" value={task.updatedAt} />

        <FormTextField
          label="Task title"
          name="title"
          defaultValue={state.fields.title}
          error={state.fieldErrors.title}
          isDisabled={!canEdit}
          isRequired
          className="md:col-span-2"
        />

        <FormSelectField
          label="Project"
          name="projectId"
          options={projects.map(project => ({ id: project.id, label: project.name }))}
          defaultValue={state.fields.projectId}
          error={state.fieldErrors.projectId}
          isDisabled={!canEdit}
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
          defaultValue={state.fields.assigneeUserId || 'unassigned'}
          error={state.fieldErrors.assigneeUserId}
          isDisabled={!canEdit}
          placeholder="Select assignee"
        />

        <FormSelectField
          label="Status"
          name="status"
          options={TASK_STATUS_OPTIONS}
          defaultValue={state.fields.status}
          error={state.fieldErrors.status}
          isDisabled={!canEdit}
          placeholder="Select status"
        />

        <FormSelectField
          label="Priority"
          name="priority"
          options={TASK_PRIORITY_OPTIONS}
          defaultValue={state.fields.priority}
          error={state.fieldErrors.priority}
          isDisabled={!canEdit}
          placeholder="Select priority"
        />

        <FormTextField
          label="Due date"
          name="dueDate"
          type="datetime-local"
          defaultValue={state.fields.dueDate}
          error={state.fieldErrors.dueDate}
          isDisabled={!canEdit}
        />

        <FormTextField
          label="Blocked reason"
          name="blockedReason"
          defaultValue={state.fields.blockedReason}
          error={state.fieldErrors.blockedReason}
          isDisabled={!canEdit}
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
            { label: 'Created', value: formatDateTime(task.createdAt) },
            { label: 'Updated', value: formatDateTime(task.updatedAt) },
            { label: 'Archived at', value: formatDateTime(task.archivedAt, 'Not archived') }
          ]}
        />

        {state.status === 'error' && state.message ? (
          <p className="md:col-span-2 text-sm text-danger">{state.message}</p>
        ) : null}

        <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
          <Link href={TASKS_PATH} className={buttonVariants({ variant: 'outline' })}>
            Back to tasks
          </Link>

          {canEdit ? <PendingSubmitButton idleLabel="Save changes" pendingLabel="Saving changes..." size="lg" /> : null}
        </div>
      </Form>
    </SectionCard>
  )
}
