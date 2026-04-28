import { INVITATIONS_PATH } from '@/lib/invitations/invitation-constants'
import { INVITATION_FILTER_STATUS_OPTIONS } from '@/lib/invitations/invitation-status'
import { Button, Card, Input, Label, ListBox, Select, TextField, buttonVariants } from '@heroui/react'
import Link from 'next/link'

type InvitationsFilterFormProps = {
  email: string
  status: string
}

export function InvitationsFilterForm({ email, status }: InvitationsFilterFormProps) {
  return (
    <Card className="border border-black/5">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-xl font-semibold tracking-tight">Filters</Card.Title>
        <Card.Description className="text-sm text-muted">Search invitations by email and status.</Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <form method="GET" className="grid gap-4 md:grid-cols-[1.5fr_1fr_auto]">
          <TextField className="flex flex-col gap-2" defaultValue={email}>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" variant="secondary" placeholder="Filter by invited email" />
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
                {INVITATION_FILTER_STATUS_OPTIONS.map(option => (
                  <ListBox.Item id={option.id} key={option.id} textValue={option.label}>
                    {option.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <div className="flex items-end justify-end gap-3">
            <Button type="submit" variant="secondary">
              Apply
            </Button>

            <Link href={INVITATIONS_PATH} className={buttonVariants({ variant: 'outline' })}>
              Clear
            </Link>
          </div>
        </form>
      </Card.Content>
    </Card>
  )
}
