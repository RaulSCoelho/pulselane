'use client'

import { archiveClientAction } from '@/features/clients/actions/client-actions'
import { AlertDialog, Button, toast } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

import { initialArchiveClientState } from './client-form-state'

type ClientArchiveButtonProps = {
  clientId: string
  isDisabled?: boolean
  onArchived?: () => void
}

export function ClientArchiveButton({ clientId, isDisabled = false, onArchived }: ClientArchiveButtonProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(archiveClientAction, initialArchiveClientState)

  useEffect(() => {
    if (state.status === 'success' && state.message && state.archivedClientId === clientId) {
      toast.success(state.message)
      onArchived?.()
      router.refresh()
      return
    }

    if (state.status === 'error' && state.message) {
      toast.danger(state.message)
    }
  }, [clientId, onArchived, router, state.archivedClientId, state.message, state.status])

  return (
    <AlertDialog>
      <Button isDisabled={isDisabled} size="sm" variant="danger">
        Archive
      </Button>

      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>Archive client</AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body>
              Existing data stays preserved, but this client should stop receiving new operational work.
            </AlertDialog.Body>

            <AlertDialog.Footer>
              <Button slot="close" variant="ghost">
                Cancel
              </Button>

              <form action={formAction}>
                <input type="hidden" name="clientId" value={clientId} />

                <Button isPending={pending} size="sm" type="submit" variant="danger">
                  Confirm archive
                </Button>
              </form>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  )
}
