'use client'

import { Alert, Button, buttonVariants, Card } from '@heroui/react'
import Link from 'next/link'

type AppErrorStateProps = {
  title: string
  description: string
  retryLabel?: string
  onRetry?: () => void
  homeHref?: string
  digest?: string | null
}

export function AppErrorState({
  title,
  description,
  retryLabel = 'Try again',
  onRetry,
  homeHref = '/',
  digest
}: AppErrorStateProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-6">
      <Card className="min-w-0 border border-border">
        <Card.Header className="flex min-w-0 flex-col gap-2 p-5 pb-0 sm:p-8 sm:pb-0">
          <Card.Title className="text-xl font-semibold tracking-normal sm:text-2xl">{title}</Card.Title>
          <Card.Description className="text-sm leading-6 text-muted">{description}</Card.Description>
        </Card.Header>

        <Card.Content className="flex min-w-0 flex-col gap-4 p-5 sm:p-8">
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Something went wrong</Alert.Title>
              <Alert.Description>
                The screen failed to render safely. You can retry now or go back to the main flow.
              </Alert.Description>
            </Alert.Content>
          </Alert>

          {digest ? (
            <Card className="min-w-0 border border-border">
              <Card.Content className="px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Error reference</p>
                <p className="mt-1 font-mono text-xs text-foreground break-all">{digest}</p>
              </Card.Content>
            </Card>
          ) : null}
        </Card.Content>

        <Card.Footer className="flex flex-col gap-3 p-5 pt-0 sm:flex-row sm:flex-wrap sm:p-8 sm:pt-0">
          {onRetry ? (
            <Button className="w-full sm:w-auto" onPress={onRetry}>
              {retryLabel}
            </Button>
          ) : null}

          <Link href={homeHref} className={`${buttonVariants({ variant: 'outline' })} w-full sm:w-auto`}>
            Go home
          </Link>
        </Card.Footer>
      </Card>
    </div>
  )
}
