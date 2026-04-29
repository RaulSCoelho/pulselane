import { AUDIT_LOG_FILTER_ACTION_OPTIONS } from '@/lib/audit-logs/audit-log-action'
import { AUDIT_LOGS_PATH } from '@/lib/audit-logs/audit-log-constants'
import { Button, Card, Input, Label, ListBox, Select, TextField, buttonVariants } from '@heroui/react'
import Link from 'next/link'

type AuditLogsFilterFormProps = {
  action: string
  entityType: string
  entityId: string
  actorUserId: string
}

export function AuditLogsFilterForm({ action, entityType, entityId, actorUserId }: AuditLogsFilterFormProps) {
  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-xl font-semibold tracking-tight">Filters</Card.Title>
        <Card.Description className="text-sm text-muted">
          Narrow audit history by action, entity type, entity id, or actor user id.
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <form method="GET" className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <Select
            className="flex flex-col gap-2"
            defaultValue={action || 'all'}
            name="action"
            placeholder="Select action"
            variant="secondary"
          >
            <Label>Action</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {AUDIT_LOG_FILTER_ACTION_OPTIONS.map(option => (
                  <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
                    {option.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <TextField className="flex flex-col gap-2" defaultValue={entityType}>
            <Label htmlFor="entityType">Entity type</Label>
            <Input id="entityType" name="entityType" type="text" variant="secondary" placeholder="task" />
          </TextField>

          <TextField className="flex flex-col gap-2" defaultValue={entityId}>
            <Label htmlFor="entityId">Entity id</Label>
            <Input id="entityId" name="entityId" type="text" variant="secondary" placeholder="Entity id" />
          </TextField>

          <TextField className="flex flex-col gap-2" defaultValue={actorUserId}>
            <Label htmlFor="actorUserId">Actor user id</Label>
            <Input id="actorUserId" name="actorUserId" type="text" variant="secondary" placeholder="User id" />
          </TextField>

          <div className="flex items-end justify-end gap-3">
            <Button type="submit" variant="secondary">
              Apply
            </Button>

            <Link href={AUDIT_LOGS_PATH} className={buttonVariants({ variant: 'outline' })}>
              Clear
            </Link>
          </div>
        </form>
      </Card.Content>
    </Card>
  )
}
