'use client'

import { createTaskAction } from '@/features/tasks/actions/task-actions'
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '@/lib/tasks/task-status'
import { Card, FieldError, Form, Input, Label, ListBox, Select, TextArea, TextField, toast } from '@heroui/react'
import type { MembershipResponse } from '@pulselane/contracts/memberships'
import type { ProjectResponse } from '@pulselane/contracts/projects'
import { useActionState, useEffect } from 'react'

import { initialTaskFormState } from './task-form-state'
import { TaskFormSubmitButton } from './task-form-submit-button'

type TaskCreateFormProps = {
  projects: ProjectResponse[]
  memberships: MembershipResponse[]
}

export function TaskCreateForm({ projects, memberships }: TaskCreateFormProps) {
  const [state, formAction] = useActionState(createTaskAction, initialTaskFormState)
  const resolvedState = state ?? initialTaskFormState

  useEffect(() => {
    if (resolvedState.status === 'success' && resolvedState.message) {
      toast.success(resolvedState.message)
    }
  }, [resolvedState.message, resolvedState.status])

  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-2xl font-semibold tracking-tight">Create task</Card.Title>
        <Card.Description className="text-sm leading-6 text-muted">
          Add operational work under a project, with priority, assignee and due date when needed.
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <Form key={resolvedState.formKey} action={formAction} className="grid gap-4 md:grid-cols-2">
          <TextField
            className="flex flex-col gap-2 md:col-span-2"
            defaultValue={resolvedState.fields.title}
            isInvalid={Boolean(resolvedState.fieldErrors.title)}
            isRequired
            name="title"
          >
            <Label>Task title</Label>
            <Input placeholder="Review client onboarding flow" type="text" variant="secondary" />
            <FieldError>{resolvedState.fieldErrors.title}</FieldError>
          </TextField>

          <Select
            className="flex flex-col gap-2"
            defaultValue={resolvedState.fields.projectId || undefined}
            isInvalid={Boolean(resolvedState.fieldErrors.projectId)}
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
            <FieldError>{resolvedState.fieldErrors.projectId}</FieldError>
          </Select>

          <Select
            className="flex flex-col gap-2"
            defaultValue={resolvedState.fields.assigneeUserId || 'unassigned'}
            isInvalid={Boolean(resolvedState.fieldErrors.assigneeUserId)}
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
            <FieldError>{resolvedState.fieldErrors.assigneeUserId}</FieldError>
          </Select>

          <Select
            className="flex flex-col gap-2"
            defaultValue={resolvedState.fields.status}
            isInvalid={Boolean(resolvedState.fieldErrors.status)}
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
                {TASK_STATUS_OPTIONS.filter(option => option.id !== 'archived').map(option => (
                  <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
                    {option.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
            <FieldError>{resolvedState.fieldErrors.status}</FieldError>
          </Select>

          <Select
            className="flex flex-col gap-2"
            defaultValue={resolvedState.fields.priority}
            isInvalid={Boolean(resolvedState.fieldErrors.priority)}
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
            <FieldError>{resolvedState.fieldErrors.priority}</FieldError>
          </Select>

          <TextField
            className="flex flex-col gap-2"
            defaultValue={resolvedState.fields.dueDate}
            isInvalid={Boolean(resolvedState.fieldErrors.dueDate)}
            name="dueDate"
          >
            <Label>Due date</Label>
            <Input type="datetime-local" variant="secondary" />
            <FieldError>{resolvedState.fieldErrors.dueDate}</FieldError>
          </TextField>

          <TextField
            className="flex flex-col gap-2"
            defaultValue={resolvedState.fields.blockedReason}
            isInvalid={Boolean(resolvedState.fieldErrors.blockedReason)}
            name="blockedReason"
          >
            <Label>Blocked reason</Label>
            <Input placeholder="Required only when status is blocked" type="text" variant="secondary" />
            <FieldError>{resolvedState.fieldErrors.blockedReason}</FieldError>
          </TextField>

          <TextField
            className="flex flex-col gap-2 md:col-span-2"
            defaultValue={resolvedState.fields.description}
            isInvalid={Boolean(resolvedState.fieldErrors.description)}
            name="description"
          >
            <Label>Description</Label>
            <TextArea placeholder="Execution notes, context, or acceptance criteria." variant="secondary" />
            <FieldError>{resolvedState.fieldErrors.description}</FieldError>
          </TextField>

          {resolvedState.status === 'error' && resolvedState.message ? (
            <p className="md:col-span-2 text-sm text-danger">{resolvedState.message}</p>
          ) : null}

          <div className="md:col-span-2 flex justify-end">
            <TaskFormSubmitButton idleLabel="Create task" pendingLabel="Creating task..." size="lg" />
          </div>
        </Form>
      </Card.Content>
    </Card>
  )
}
