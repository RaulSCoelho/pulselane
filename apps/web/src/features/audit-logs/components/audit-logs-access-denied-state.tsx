import { Card } from '@heroui/react'

export function AuditLogsAccessDeniedState() {
  return (
    <Card className="min-w-0 border border-border">
      <Card.Content className="flex min-w-0 flex-col gap-2 p-5 sm:p-8">
        <h2 className="text-xl font-medium tracking-normal">Audit logs restricted</h2>
        <p className="text-sm leading-6 text-muted">
          Only organization owners and admins can inspect audit logs. This screen is intentionally read-only and
          restricted because it exposes operational history.
        </p>
      </Card.Content>
    </Card>
  )
}
