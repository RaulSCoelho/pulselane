'use client'

import { archiveProjectAction } from '@/features/projects/actions/project-actions'
import { AlertDialog, Button, toast } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

import { initialArchiveProjectState } from './project-form-state'

type ProjectArchiveButtonProps = {
  projectId: string
  isDisabled?: boolean
  onArchived?: () => void
}

export function ProjectArchiveButton({ projectId, isDisabled = false, onArchived }: ProjectArchiveButtonProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(archiveProjectAction, initialArchiveProjectState)

  useEffect(() => {
    if (state.status === 'success' && state.message && state.archivedProjectId === projectId) {
      toast.success(state.message)
      onArchived?.()
      router.refresh()
      return
    }

    if (state.status === 'error' && state.message) {
      toast.danger(state.message)
    }
  }, [onArchived, projectId, router, state.archivedProjectId, state.message, state.status])

  return (
    <AlertDialog>
      <Button isDisabled={isDisabled} size="sm" variant="danger">
        Archive
      </Button>

      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="max-w-[calc(100vw-2rem)]">
            <AlertDialog.Header>
              <AlertDialog.Heading>Archive project</AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body>
              This keeps historical data preserved. The backend may block archive when the project still has open tasks.
            </AlertDialog.Body>

            <AlertDialog.Footer className="flex-col sm:flex-row">
              <Button className="w-full sm:w-auto" slot="close" variant="ghost">
                Cancel
              </Button>

              <form action={formAction} className="w-full sm:w-auto">
                <input type="hidden" name="projectId" value={projectId} />

                <Button className="w-full sm:w-auto" isPending={pending} size="sm" type="submit" variant="danger">
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
