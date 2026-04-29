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

  const currentSession = activeSessions.find(session => session.isCurrent)
  const otherActiveSessions = activeSessions.filter(session => !session.isCurrent)

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-black/5">
        <Card.Content className="flex flex-col gap-6 p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Account security</span>
            <h1 className="text-3xl font-semibold tracking-tight">Sessions and devices</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Review active sessions for your account and logout from the current session or all devices.
            </p>
          </div>

          <div className="grid gap-3 sm:min-w-80 sm:grid-cols-3">
            <Card className="border border-black/5" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Active sessions</p>
                <p className="mt-2 text-sm font-medium">
                  {sessionsState.status === 'ready' ? activeSessions.length : 'Unavailable'}
                </p>
              </Card.Content>
            </Card>

            <Card className="border border-black/5" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Other devices</p>
                <p className="mt-2 text-sm font-medium">
                  {sessionsState.status === 'ready' ? otherActiveSessions.length : 'Unavailable'}
                </p>
              </Card.Content>
            </Card>

            <Card className="border border-black/5" variant="secondary">
              <Card.Content className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Current session</p>
                <p className="mt-2 text-sm font-medium">{currentSession ? 'Detected' : 'Not detected'}</p>
              </Card.Content>
            </Card>
          </div>
        </Card.Content>
      </Card>

      {sessionsState.status === 'ready' ? (
        <>
          {sessionsState.freshness === 'stale' ? (
            <Card className="border border-black/5">
              <Card.Content className="p-4">
                <p className="text-sm font-medium text-warning">Using last synced sessions list.</p>
              </Card.Content>
            </Card>
          ) : null}

          <Card className="border border-black/5">
            <Card.Content className="flex flex-col gap-4 p-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold tracking-tight">Session controls</h2>
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
