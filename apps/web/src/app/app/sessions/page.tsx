import { PageHeader } from '@/components/ui/page-header'
import { requireAuth } from '@/features/auth/api/server-queries'
import { listSessions } from '@/features/sessions/api/server-queries'
import { SessionLogoutButtons } from '@/features/sessions/components/session-logout-buttons'
import { SessionsEmptyState } from '@/features/sessions/components/sessions-empty-state'
import { SessionsTable } from '@/features/sessions/components/sessions-table'
import { SessionsUnavailableState } from '@/features/sessions/components/sessions-unavailable-state'
import { Card } from '@heroui/react'

export default async function SessionsPage() {
  const me = await requireAuth({ redirectTo: '/app/sessions' })
  const sessionsState = await listSessions(me.id)

  const activeSessions =
    sessionsState.status === 'ready' ? sessionsState.data.filter(session => session.isActive && !session.revokedAt) : []

  const otherActiveSessions = activeSessions.filter(session => !session.isCurrent)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Account security"
        title="Sessions and devices"
        description="Review active sessions for your account and logout from the current session or all devices."
      />

      {sessionsState.status === 'ready' ? (
        <>
          <Card className="border border-border">
            <Card.Content className="flex flex-col gap-4 p-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-medium tracking-normal">Session controls</h2>
                <p className="text-sm leading-6 text-muted">
                  Logging out all devices also logs out this browser. Individual remote-device revocation is not exposed
                  by the current backend contract.
                </p>
              </div>

              <SessionLogoutButtons hasOtherActiveSessions={otherActiveSessions.length > 0} />
            </Card.Content>
          </Card>

          {sessionsState.data.length > 0 ? <SessionsTable items={sessionsState.data} /> : <SessionsEmptyState />}
        </>
      ) : (
        <SessionsUnavailableState reason={sessionsState.reason} />
      )}
    </div>
  )
}
