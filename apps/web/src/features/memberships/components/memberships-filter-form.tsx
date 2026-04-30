import { MEMBERS_PATH } from '@/lib/memberships/membership-constants'
import { MEMBERSHIP_FILTER_ROLE_OPTIONS } from '@/lib/memberships/membership-role'
import { Button, Card, Input, Label, ListBox, Select, TextField, buttonVariants } from '@heroui/react'
import Link from 'next/link'

type MembershipsFilterFormProps = {
  search: string
  role: string
}

export function MembershipsFilterForm({ search, role }: MembershipsFilterFormProps) {
  return (
    <Card className="border border-border">
      <Card.Header className="flex flex-col gap-2 p-8 pb-0">
        <Card.Title className="text-xl font-medium tracking-normal">Filters</Card.Title>
        <Card.Description className="text-sm text-muted">
          Search members and narrow the list by organization role.
        </Card.Description>
      </Card.Header>

      <Card.Content className="p-8">
        <form method="GET" className="grid gap-4 md:grid-cols-[1.5fr_1fr_auto]">
          <TextField className="flex flex-col gap-2" defaultValue={search}>
            <Label htmlFor="search">Search</Label>
            <Input id="search" name="search" type="text" variant="secondary" placeholder="Search by member name" />
          </TextField>

          <Select
            className="flex flex-col gap-2"
            defaultValue={role || 'all'}
            name="role"
            placeholder="Select role"
            variant="secondary"
          >
            <Label>Role</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {MEMBERSHIP_FILTER_ROLE_OPTIONS.map(option => (
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

            <Link href={MEMBERS_PATH} className={buttonVariants({ variant: 'outline' })}>
              Clear
            </Link>
          </div>
        </form>
      </Card.Content>
    </Card>
  )
}
