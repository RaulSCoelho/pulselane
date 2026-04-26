'use client'

import { updateTaskAction } from '@/features/tasks/actions/task-actions'
import { TASKS_PATH } from '@/lib/tasks/task-constants'
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '@/lib/tasks/task-status'
import {
  Card,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
  buttonVariants,
  toast
} from '@heroui/react'
import type { MembershipResponse } from '@pulselane/contracts/memberships'
import type { ProjectResponse } from '@pulselane/contracts/projects'
import type { TaskResponse } from '@pulselane/contracts/tasks'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'

import { initialTaskFormState } from './task-form-state'
import { TaskFormSubmitButton } from './task-form-submit-button'

type TaskEditFormProps = {
  task: TaskResponse
  projects: ProjectResponse[]
  memberships: MembershipResponse[]
  canEdit: boolean
}

function toDatetimeLocalValue(value: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 16)
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
      dueDate: toDatetimeLocalValue(task.dueDate)
    }
  })

  useEffect(() => {
    if (state.status === 'success' && state.message) {
      toast.success(state.message)
    }
  }, [state.message, state.status])

  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">
          {canEdit ? 'Edit task' : 'Task overview'}
        </Card.Title>
        <Card.Description className="text-sm leading-6 text-muted">
          {canEdit
            ? 'Update the task while preserving tenant scope and optimistic concurrency.'
            : 'Your current role is read-only for task management.'}
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <Form key={state.formKey} action={formAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="taskId" value={task.id} />
          <input type="hidden" name="expectedUpdatedAt" value={task.updatedAt} />

          <TextField
            className="flex flex-col gap-2 md:col-span-2"
            defaultValue={state.fields.title}
            isDisabled={!canEdit}
            isInvalid={Boolean(state.fieldErrors.title)}
            isRequired
            name="title"
          >
            <Label>Task title</Label>
            <Input type="text" variant="secondary" />
            <FieldError>{state.fieldErrors.title}</FieldError>
          </TextField>

          <Select
            className="flex flex-col gap-2"
            defaultValue={state.fields.projectId}
            isDisabled={!canEdit}
            isInvalid={Boolean(state.fieldErrors.projectId)}
            isRequired
            name="projectId"
            placeholder="Select project"
            variant="secondary"
          >
            <Label>Project</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {projects.map(project => (
                  <ListBox.Item id={project.id} key={project.id} textValue={project.name}>
                    {project.name}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
            <FieldError>{state.fieldErrors.projectId}</FieldError>
          </Select>

          <Select
            className="flex flex-col gap-2"
            defaultValue={state.fields.assigneeUserId || 'unassigned'}
            isDisabled={!canEdit}
            isInvalid={Boolean(state.fieldErrors.assigneeUserId)}
            name="assigneeUserId"
            placeholder="Select assignee"
            variant="secondary"
          >
            <Label>Assignee</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="unassigned" textValue="Unassigned">
                  Unassigned
                </ListBox.Item>

                {memberships.map(membership => (
                  <ListBox.Item id={membership.userId} key={membership.id} textValue={membership.user.name}>
                    {membership.user.name}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
            <FieldError>{state.fieldErrors.assigneeUserId}</FieldError>
          </Select>

          <Select
            className="flex flex-col gap-2"
            defaultValue={state.fields.status}
            isDisabled={!canEdit}
            isInvalid={Boolean(state.fieldErrors.status)}
            name="status"
            placeholder="Select status"
            variant="secondary"
          >
            <Label>Status</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {TASK_STATUS_OPTIONS.map(option => (
                  <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
                    {option.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
            <FieldError>{state.fieldErrors.status}</FieldError>
          </Select>

          <Select
            className="flex flex-col gap-2"
            defaultValue={state.fields.priority}
            isDisabled={!canEdit}
            isInvalid={Boolean(state.fieldErrors.priority)}
            name="priority"
            placeholder="Select priority"
            variant="secondary"
          >
            <Label>Priority</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {TASK_PRIORITY_OPTIONS.map(option => (
                  <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
                    {option.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
            <FieldError>{state.fieldErrors.priority}</FieldError>
          </Select>

          <TextField
            className="flex flex-col gap-2"
            defaultValue={state.fields.dueDate}
            isDisabled={!canEdit}
            isInvalid={Boolean(state.fieldErrors.dueDate)}
            name="dueDate"
          >
            <Label>Due date</Label>
            <Input type="datetime-local" variant="secondary" />
            <FieldError>{state.fieldErrors.dueDate}</FieldError>
          </TextField>

          <TextField
            className="flex flex-col gap-2"
            defaultValue={state.fields.blockedReason}
            isDisabled={!canEdit}
            isInvalid={Boolean(state.fieldErrors.blockedReason)}
            name="blockedReason"
          >
            <Label>Blocked reason</Label>
            <Input type="text" variant="secondary" />
            <FieldError>{state.fieldErrors.blockedReason}</FieldError>
          </TextField>

          <TextField
            className="flex flex-col gap-2 md:col-span-2"
            defaultValue={state.fields.description}
            isDisabled={!canEdit}
            isInvalid={Boolean(state.fieldErrors.description)}
            name="description"
          >
            <Label>Description</Label>
            <TextArea variant="secondary" />
            <FieldError>{state.fieldErrors.description}</FieldError>
          </TextField>

          <Card className="md:col-span-2" variant="tertiary">
            <Card.Content className="grid gap-3 p-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Created</p>
                <p className="mt-1 text-sm text-foreground">{new Date(task.createdAt).toLocaleString('en-US')}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Updated</p>
                <p className="mt-1 text-sm text-foreground">{new Date(task.updatedAt).toLocaleString('en-US')}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Archived at</p>
                <p className="mt-1 text-sm text-foreground">
                  {task.archivedAt ? new Date(task.archivedAt).toLocaleString('en-US') : 'Not archived'}
                </p>
              </div>
            </Card.Content>
          </Card>

          {state.status === 'error' && state.message ? (
            <p className="md:col-span-2 text-sm text-danger">{state.message}</p>
          ) : null}

          <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
            <Link href={TASKS_PATH} className={buttonVariants({ variant: 'outline' })}>
              Back to tasks
            </Link>

            {canEdit ? (
              <TaskFormSubmitButton idleLabel="Save changes" pendingLabel="Saving changes..." size="lg" />
            ) : null}
          </div>
        </Form>
      </Card.Content>
    </Card>
  )
}
