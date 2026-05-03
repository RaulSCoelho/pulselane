'use client'

import { nextClientApi } from '@/http/client-api-client'
import { Button, toast } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

type SessionLogoutButtonsProps = {
  hasOtherActiveSessions: boolean
}

export function SessionLogoutButtons({ hasOtherActiveSessions }: SessionLogoutButtonsProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLoggingOutCurrent, setIsLoggingOutCurrent] = useState(false)
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleLogoutCurrentSession() {
    setIsLoggingOutCurrent(true)

    startTransition(async function logoutCurrentSession() {
      try {
        const response = await nextClientApi('/api/v1/auth/logout', {
          method: 'POST'
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { message?: string } | null
          toast.danger(body?.message ?? 'Unable to logout current session.')
          setIsLoggingOutCurrent(false)
          return
        }

        toast.success('Current session logged out.')
        queryClient.clear()
        router.replace('/login')
        router.refresh()
      } catch {
        toast.danger('Unable to logout current session right now.')
        setIsLoggingOutCurrent(false)
      }
    })
  }

  function handleLogoutAllSessions() {
    setIsLoggingOutAll(true)

    startTransition(async function logoutAllSessions() {
      try {
        const response = await nextClientApi('/api/v1/auth/logout-all', {
          method: 'POST'
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { message?: string } | null
          toast.danger(body?.message ?? 'Unable to logout all sessions.')
          setIsLoggingOutAll(false)
          return
        }

        toast.success('All sessions logged out.')
        queryClient.clear()
        router.replace('/login')
        router.refresh()
      } catch {
        toast.danger('Unable to logout all sessions right now.')
        setIsLoggingOutAll(false)
      }
    })
  }

  return (
    <div className="flex flex-wrap justify-end gap-3">
      <Button
        type="button"
        variant="outline"
        isPending={isPending && isLoggingOutCurrent}
        isDisabled={isPending}
        onPress={handleLogoutCurrentSession}
      >
        Logout current session
      </Button>

      <Button
        type="button"
        variant="danger"
        isPending={isPending && isLoggingOutAll}
        isDisabled={isPending || !hasOtherActiveSessions}
        onPress={handleLogoutAllSessions}
      >
        Logout all devices
      </Button>
    </div>
  )
}
