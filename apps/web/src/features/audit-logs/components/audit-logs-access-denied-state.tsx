import { Card } from '@heroui/react'

export function AuditLogsAccessDeniedState() {
  return (
    <Card className="border border-black/5">
      <Card.Content className="flex flex-col gap-2 p-8">
        <h2 className="text-xl font-semibold tracking-tight">Audit logs restricted</h2>
        <p className="text-sm leading-6 text-muted">
          Only organization owners and admins can inspect audit logs. This screen is intentionally read-only and
          restricted because it exposes operational history.
        </p>
      </Card.Content>
    </Card>
  )
}
