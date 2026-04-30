'use client'

import { archiveTaskAction } from '@/features/tasks/actions/task-actions'
import { AlertDialog, Button, toast } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

import { initialArchiveTaskState } from './task-form-state'

type TaskArchiveButtonProps = {
  taskId: string
  isDisabled?: boolean
  onArchived?: () => void
}

export function TaskArchiveButton({ taskId, isDisabled = false, onArchived }: TaskArchiveButtonProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(archiveTaskAction, initialArchiveTaskState)

  useEffect(() => {
    if (state.status === 'success' && state.message && state.archivedTaskId === taskId) {
      toast.success(state.message)
      onArchived?.()
      router.refresh()
      return
    }

    if (state.status === 'error' && state.message) {
      toast.danger(state.message)
    }
  }, [onArchived, router, state.archivedTaskId, state.message, state.status, taskId])

  return (
    <AlertDialog>
      <Button isDisabled={isDisabled} size="sm" variant="danger">
        Archive
      </Button>

      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>Archive task</AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body>
              This keeps the execution history preserved while removing the task from active work.
            </AlertDialog.Body>

            <AlertDialog.Footer>
              <Button slot="close" variant="ghost">
                Cancel
              </Button>

              <form action={formAction}>
                <input type="hidden" name="taskId" value={taskId} />

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
