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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-6">
      {previewState.status === 'ready' ? (
        <InvitationAcceptCard token={token} invitation={previewState.data} />
      ) : (
        <Card className="w-full max-w-2xl min-w-0 border border-border shadow-sm">
          <Card.Header className="flex min-w-0 flex-col gap-2 p-5 pb-0 sm:p-8 sm:pb-0">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Pulselane invitation</span>
            <Card.Title className="text-xl font-semibold tracking-normal sm:text-2xl">Invalid invitation</Card.Title>
            <Card.Description className="text-sm leading-6 text-muted">
              The invitation link could not be validated.
            </Card.Description>
          </Card.Header>

          <Card.Content className="flex min-w-0 flex-col gap-6 p-5 sm:p-8">
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Unable to load invitation</Alert.Title>
                <Alert.Description>{previewState.message}</Alert.Description>
              </Alert.Content>
            </Alert>

            <div className="flex justify-stretch sm:justify-end">
              <Link href={APP_HOME_PATH} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto" variant="outline">
                  Go to app
                </Button>
              </Link>
            </div>
          </Card.Content>
        </Card>
      )}
    </main>
  )
}
