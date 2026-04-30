import { FormSelectField, FormTextField } from '@/components/ui/form-fields'
import { SectionCard } from '@/components/ui/section-card'
import { AUDIT_LOG_FILTER_ACTION_OPTIONS } from '@/lib/audit-logs/audit-log-action'
import { AUDIT_LOGS_PATH } from '@/lib/audit-logs/audit-log-constants'
import { Button, buttonVariants } from '@heroui/react'
import Link from 'next/link'

type AuditLogsFilterFormProps = {
  action: string
  entityType: string
  entityId: string
  actorUserId: string
}

export function AuditLogsFilterForm({ action, entityType, entityId, actorUserId }: AuditLogsFilterFormProps) {
  return (
    <SectionCard
      title="Filters"
      description="Narrow audit history by action, entity type, entity id, or actor user id."
      titleClassName="text-xl"
      descriptionClassName="text-sm text-muted"
    >
      <form method="GET" className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <FormSelectField
          label="Action"
          name="action"
          options={AUDIT_LOG_FILTER_ACTION_OPTIONS}
          defaultValue={action || 'all'}
          placeholder="Select action"
        />

        <FormTextField label="Entity type" name="entityType" defaultValue={entityType} placeholder="task" />

        <FormTextField label="Entity id" name="entityId" defaultValue={entityId} placeholder="Entity id" />

        <FormTextField label="Actor user id" name="actorUserId" defaultValue={actorUserId} placeholder="User id" />

        <div className="flex items-end justify-end gap-3">
          <Button type="submit" variant="secondary">
            Apply
          </Button>

          <Link href={AUDIT_LOGS_PATH} className={buttonVariants({ variant: 'outline' })}>
            Clear
          </Link>
        </div>
      </form>
    </SectionCard>
  )
}
