import { previewInvitation } from '@/features/invitations/api/preview-server-queries'
import { InvitationAcceptCard } from '@/features/invitations/components/invitation-accept-card'
import { APP_HOME_PATH } from '@/lib/organizations/organization-context-constants'
import { Alert, Button, Card } from '@heroui/react'
import Link from 'next/link'

type InvitationAcceptPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readSearchParam(source: Record<string, string | string[] | undefined>, key: string) {
  const value = source[key]

  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export default async function InvitationAcceptPage({ searchParams }: InvitationAcceptPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const token = readSearchParam(resolvedSearchParams, 'token') ?? ''

  const previewState = await previewInvitation(token)

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      {previewState.status === 'ready' ? (
        <InvitationAcceptCard token={token} invitation={previewState.data} />
      ) : (
        <Card className="w-full max-w-2xl border border-border shadow-sm">
          <Card.Header className="flex flex-col gap-2 p-8 pb-0">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Pulselane invitation</span>
            <Card.Title className="text-2xl font-semibold tracking-normal">Invalid invitation</Card.Title>
            <Card.Description className="text-sm leading-6 text-muted">
              The invitation link could not be validated.
            </Card.Description>
          </Card.Header>

          <Card.Content className="flex flex-col gap-6 p-8">
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Unable to load invitation</Alert.Title>
                <Alert.Description>{previewState.message}</Alert.Description>
              </Alert.Content>
            </Alert>

            <div className="flex justify-end">
              <Link href={APP_HOME_PATH}>
                <Button variant="outline">Go to app</Button>
              </Link>
            </div>
          </Card.Content>
        </Card>
      )}
    </main>
  )
}
