import { FormSelectField, FormTextField } from '@/components/ui/form-fields'
import { SectionCard } from '@/components/ui/section-card'
import { INVITATIONS_PATH } from '@/lib/invitations/invitation-constants'
import { INVITATION_FILTER_STATUS_OPTIONS } from '@/lib/invitations/invitation-status'
import { Button, buttonVariants } from '@heroui/react'
import Link from 'next/link'

type InvitationsFilterFormProps = {
  email: string
  status: string
}

export function InvitationsFilterForm({ email, status }: InvitationsFilterFormProps) {
  return (
    <SectionCard
      title="Filters"
      description="Search invitations by email and status."
      titleClassName="text-xl"
      descriptionClassName="text-sm text-muted"
    >
      <form method="GET" className="grid gap-4 md:grid-cols-[1.5fr_1fr_auto]">
        <FormTextField
          label="Email"
          name="email"
          type="email"
          defaultValue={email}
          placeholder="Filter by invited email"
        />

        <FormSelectField
          label="Status"
          name="status"
          options={INVITATION_FILTER_STATUS_OPTIONS}
          defaultValue={status || 'all'}
          placeholder="Select status"
        />

        <div className="flex items-end justify-end gap-3">
          <Button type="submit" variant="secondary">
            Apply
          </Button>

          <Link href={INVITATIONS_PATH} className={buttonVariants({ variant: 'outline' })}>
            Clear
          </Link>
        </div>
      </form>
    </SectionCard>
  )
}
