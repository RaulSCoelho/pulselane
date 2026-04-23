'use client'

import { nextApi } from '@/http/api-client'
import { APP_HOME_PATH } from '@/lib/organizations/organization-context-constants'
import { Button, Card } from '@heroui/react'
import { MeMembership } from '@pulselane/contracts/auth'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

type OrganizationSelectorFormProps = {
  memberships: MeMembership[]
  activeOrganizationId: string | null
}

export function OrganizationSelectorForm({ memberships, activeOrganizationId }: OrganizationSelectorFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleSelectOrganization(organizationId: string) {
    setErrorMessage(null)

    startTransition(async function submitOrganizationContext() {
      try {
        const response = await nextApi<{ ok: boolean; message?: string }>('/api/organization-context', {
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

          setErrorMessage(body?.message ?? 'Unable to set the active organization')
          return
        }

        router.replace(APP_HOME_PATH)
        router.refresh()
      } catch {
        setErrorMessage('Unable to set the active organization right now')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {memberships.map(membership => {
        const isActive = membership.organization.id === activeOrganizationId

        return (
          <Card key={membership.id} className="border border-black/5 shadow-sm">
            <Card.Content className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold tracking-tight text-zinc-950">{membership.organization.name}</h2>
                <p className="text-sm text-zinc-600">Role: {membership.role}</p>
                <p className="text-sm text-zinc-500">Slug: {membership.organization.slug}</p>
              </div>

              <Button
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
        <p role="alert" className="text-sm text-danger whitespace-pre-wrap">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
