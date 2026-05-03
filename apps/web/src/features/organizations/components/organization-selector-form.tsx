'use client'

import { nextClientApi } from '@/http/client-api-client'
import { APP_HOME_PATH } from '@/lib/organizations/organization-context-constants'
import { Alert, Button, Card, toast } from '@heroui/react'
import { MeMembership } from '@pulselane/contracts/auth'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

type OrganizationSelectorFormProps = {
  memberships: MeMembership[]
  activeOrganizationId: string | null
}

export function OrganizationSelectorForm({ memberships, activeOrganizationId }: OrganizationSelectorFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleSelectOrganization(organizationId: string) {
    setErrorMessage(null)

    startTransition(async function submitOrganizationContext() {
      try {
        const response = await nextClientApi<{ ok: boolean; message?: string }>('/api/organization-context', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            organizationId
          })
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { message?: string } | null

          const nextMessage = body?.message ?? 'Unable to set the active organization'
          setErrorMessage(nextMessage)
          toast.danger(nextMessage)
          return
        }

        toast.success('Organization context updated.')
        queryClient.clear()
        router.replace(APP_HOME_PATH)
        router.refresh()
      } catch {
        const nextMessage = 'Unable to set the active organization right now'
        setErrorMessage(nextMessage)
        toast.danger(nextMessage)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {memberships.map(membership => {
        const isActive = membership.organization.id === activeOrganizationId

        return (
          <Card key={membership.id} className="min-w-0 border border-border">
            <Card.Content className="flex min-w-0 flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="text-xl font-medium tracking-normal">{membership.organization.name}</h2>
                <p className="text-sm text-muted">Role: {membership.role}</p>
                <p className="text-sm text-muted break-all">Slug: {membership.organization.slug}</p>
              </div>

              <Button
                className="w-full sm:w-auto"
                type="button"
                isPending={isPending}
                isDisabled={isPending}
                onPress={() => handleSelectOrganization(membership.organization.id)}
              >
                {isActive ? 'Current organization' : 'Use this organization'}
              </Button>
            </Card.Content>
          </Card>
        )
      })}

      {errorMessage ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Unable to switch organization</Alert.Title>
            <Alert.Description>{errorMessage}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
    </div>
  )
}
