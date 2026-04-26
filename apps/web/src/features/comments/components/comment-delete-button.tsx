'use client'

import { deleteCommentAction } from '@/features/comments/actions/comment-actions'
import { AlertDialog, Button, toast } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

import { initialDeleteCommentState } from './comment-form-state'

type CommentDeleteButtonProps = {
  taskId: string
  commentId: string
}

export function CommentDeleteButton({ taskId, commentId }: CommentDeleteButtonProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(deleteCommentAction, initialDeleteCommentState)

  useEffect(() => {
    if (state.status === 'success' && state.message && state.deletedCommentId === commentId) {
      toast.success(state.message)
      router.refresh()
      return
    }

    if (state.status === 'error' && state.message) {
      toast.danger(state.message)
    }
  }, [commentId, router, state.deletedCommentId, state.message, state.status])

  return (
    <AlertDialog>
      <Button size="sm" variant="danger">
        Delete
      </Button>

      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>Delete comment</AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body>
              This performs a soft delete. The comment can still appear in historical audit context depending on backend
              rules.
            </AlertDialog.Body>

            <AlertDialog.Footer>
              <Button slot="close" variant="ghost">
                Cancel
              </Button>

              <form action={formAction}>
                <input type="hidden" name="taskId" value={taskId} />
                <input type="hidden" name="commentId" value={commentId} />

                <Button isPending={pending} size="sm" type="submit" variant="danger">
                  Confirm delete
                </Button>
              </form>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  )
}
