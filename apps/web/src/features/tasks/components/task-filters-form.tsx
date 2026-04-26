import { PROJECTS_PATH } from '@/lib/projects/project-constants'
import { TASKS_PATH } from '@/lib/tasks/task-constants'
import { TASK_FILTER_PRIORITY_OPTIONS, TASK_FILTER_STATUS_OPTIONS, TASK_SORT_BY_OPTIONS } from '@/lib/tasks/task-status'
import { Button, Card, Checkbox, Input, Label, ListBox, Select, TextField, buttonVariants } from '@heroui/react'
import type { MembershipResponse } from '@pulselane/contracts/memberships'
import type { ProjectResponse } from '@pulselane/contracts/projects'
import Link from 'next/link'

type TaskFiltersFormProps = {
  search: string
  projectId: string
  assigneeUserId: string
  status: string
  priority: string
  overdue: boolean
  includeArchived: boolean
  sortBy: string
  sortDirection: string
  projects: ProjectResponse[]
  memberships: MembershipResponse[]
}

export function TaskFiltersForm({
  search,
  projectId,
  assigneeUserId,
  status,
  priority,
  overdue,
  includeArchived,
  sortBy,
  sortDirection,
  projects,
  memberships
}: TaskFiltersFormProps) {
  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-xl font-semibold tracking-tight">Filters</Card.Title>
        <Card.Description className="text-sm text-muted">
          Narrow the task list by execution context, owner, status, priority and due date.
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <form method="GET" className="grid gap-4 md:grid-cols-3">
          <TextField className="flex flex-col gap-2 md:col-span-3" defaultValue={search}>
            <Label htmlFor="search">Search</Label>
            <Input id="search" name="search" type="text" variant="secondary" placeholder="Search by task title" />
          </TextField>

          <Select
            className="flex flex-col gap-2"
            defaultValue={projectId || 'all'}
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
                <ListBox.Item id="all" textValue="All projects">
                  All projects
                </ListBox.Item>

                {projects.map(project => (
                  <ListBox.Item id={project.id} key={project.id} textValue={project.name}>
                    {project.name}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            className="flex flex-col gap-2"
            defaultValue={assigneeUserId || 'all'}
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
                <ListBox.Item id="all" textValue="All assignees">
                  All assignees
                </ListBox.Item>

                {memberships.map(membership => (
                  <ListBox.Item id={membership.userId} key={membership.id} textValue={membership.user.name}>
                    {membership.user.name}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            className="flex flex-col gap-2"
            defaultValue={status || 'all'}
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
                {TASK_FILTER_STATUS_OPTIONS.map(option => (
                  <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
                    {option.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            className="flex flex-col gap-2"
            defaultValue={priority || 'all'}
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
                {TASK_FILTER_PRIORITY_OPTIONS.map(option => (
                  <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
                    {option.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            className="flex flex-col gap-2"
            defaultValue={sortBy || 'created_at'}
            name="sortBy"
            placeholder="Sort by"
            variant="secondary"
          >
            <Label>Sort by</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {TASK_SORT_BY_OPTIONS.map(option => (
                  <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
                    {option.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            className="flex flex-col gap-2"
            defaultValue={sortDirection || 'desc'}
            name="sortDirection"
            placeholder="Sort direction"
            variant="secondary"
          >
            <Label>Direction</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="desc" textValue="Descending">
                  Descending
                </ListBox.Item>
                <ListBox.Item id="asc" textValue="Ascending">
                  Ascending
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>

          <div className="flex flex-col justify-end gap-3 md:col-span-3 md:flex-row md:items-center">
            <Checkbox defaultSelected={overdue} name="overdue" value="true">
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>Only overdue</Checkbox.Content>
            </Checkbox>

            <Checkbox defaultSelected={includeArchived} name="includeArchived" value="true">
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>Include archived</Checkbox.Content>
            </Checkbox>

            <Button type="submit" variant="secondary">
              Apply
            </Button>

            <Link href={TASKS_PATH} className={buttonVariants({ variant: 'outline' })}>
              Clear
            </Link>

            {projects.length === 0 ? (
              <Link href={PROJECTS_PATH} className={buttonVariants({ variant: 'outline' })}>
                Go to projects
              </Link>
            ) : null}
          </div>
        </form>
      </Card.Content>
    </Card>
  )
}
