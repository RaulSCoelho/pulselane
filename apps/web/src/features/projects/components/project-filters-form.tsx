import { PROJECTS_PATH } from '@/lib/projects/project-constants'
import { PROJECT_FILTER_STATUS_OPTIONS } from '@/lib/projects/project-status'
import { Button, Card, Checkbox, Input, Label, ListBox, Select, TextField, buttonVariants } from '@heroui/react'
import type { ClientResponse } from '@pulselane/contracts/clients'
import Link from 'next/link'

type ProjectFiltersFormProps = {
  search: string
  status: string
  clientId: string
  includeArchived: boolean
  clients: ClientResponse[]
}

export function ProjectFiltersForm({ search, status, clientId, includeArchived, clients }: ProjectFiltersFormProps) {
  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-xl font-semibold tracking-tight">Filters</Card.Title>
        <Card.Description className="text-sm text-muted">
          Narrow the project list while preserving the active organization context.
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <form method="GET" className="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr_auto]">
          <TextField className="flex flex-col gap-2" defaultValue={search}>
            <Label htmlFor="search">Search</Label>
            <Input id="search" name="search" type="text" variant="secondary" placeholder="Search by project name" />
          </TextField>

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
                {PROJECT_FILTER_STATUS_OPTIONS.map(option => (
                  <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
                    {option.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            className="flex flex-col gap-2"
            defaultValue={clientId || 'all'}
            name="clientId"
            placeholder="Select client"
            variant="secondary"
          >
            <Label>Client</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="all" textValue="All clients">
                  All clients
                </ListBox.Item>

                {clients.map(client => (
                  <ListBox.Item id={client.id} key={client.id} textValue={client.name}>
                    {client.name}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <div className="flex flex-col justify-end items-end gap-3 md:flex-row">
            <Checkbox defaultSelected={includeArchived} name="includeArchived" value="true">
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>Include archived</Checkbox.Content>
            </Checkbox>

            <Button type="submit" variant="secondary">
              Apply
            </Button>

            <Link href={PROJECTS_PATH} className={buttonVariants({ variant: 'outline' })}>
              Clear
            </Link>
          </div>
        </form>
      </Card.Content>
    </Card>
  )
}
