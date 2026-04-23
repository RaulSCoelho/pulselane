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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Card className="border border-black/5">
        <Card.Header className="flex flex-col gap-2 p-8 pb-0">
          <Card.Title className="text-2xl font-semibold tracking-tight">{title}</Card.Title>
          <Card.Description className="text-sm leading-6 text-muted">{description}</Card.Description>
        </Card.Header>

        <Card.Content className="flex flex-col gap-4 p-8">
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
            <Card className="border border-black/5">
              <Card.Content className="px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Error reference</p>
                <p className="mt-1 font-mono text-xs text-foreground">{digest}</p>
              </Card.Content>
            </Card>
          ) : null}
        </Card.Content>

        <Card.Footer className="flex flex-wrap gap-3 p-8 pt-0">
          {onRetry ? <Button onPress={onRetry}>{retryLabel}</Button> : null}

          <Link href={homeHref} className={buttonVariants({ variant: 'outline' })}>
            Go home
          </Link>
        </Card.Footer>
      </Card>
    </div>
  )
}
