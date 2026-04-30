import { FormSelectField, FormTextField } from '@/components/ui/form-fields'
import { SectionCard } from '@/components/ui/section-card'
import { CLIENT_FILTER_STATUS_OPTIONS } from '@/lib/clients/client-status'
import { Button, Checkbox, buttonVariants } from '@heroui/react'
import Link from 'next/link'

type ClientFiltersFormProps = {
  search: string
  status: string
  includeArchived: boolean
}

export function ClientFiltersForm({ search, status, includeArchived }: ClientFiltersFormProps) {
  return (
    <SectionCard
      title="Filters"
      description="Narrow the operational list without losing tenant context."
      titleClassName="text-xl"
      descriptionClassName="text-sm text-muted"
    >
      <form method="GET" className="grid gap-4 md:grid-cols-[1.5fr_1fr_auto]">
        <FormTextField label="Search" name="search" defaultValue={search} placeholder="Search by client name" />

        <FormSelectField
          label="Status"
          name="status"
          options={CLIENT_FILTER_STATUS_OPTIONS}
          defaultValue={status || 'all'}
          placeholder="Select status"
        />

        <div className="flex flex-col items-end justify-end gap-3 md:flex-row">
          <Checkbox defaultSelected={includeArchived} name="includeArchived" value="true">
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Content>Include archived</Checkbox.Content>
          </Checkbox>

          <Button type="submit" variant="secondary">
            Apply
          </Button>

          <Link href="/app/clients" className={buttonVariants({ variant: 'outline' })}>
            Clear
          </Link>
        </div>
      </form>
    </SectionCard>
  )
}
