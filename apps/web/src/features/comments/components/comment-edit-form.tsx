'use client'

import { FormTextField } from '@/components/ui/form-fields'
import { PendingSubmitButton } from '@/components/ui/pending-submit-button'
import { updateCommentAction } from '@/features/comments/actions/comment-actions'
import { AlertDialog, Button, Form, toast } from '@heroui/react'
import type { CommentResponse } from '@pulselane/contracts/comments'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

import { initialCommentFormState } from './comment-form-state'

type CommentEditFormProps = {
  taskId: string
  comment: CommentResponse
}

export function CommentEditForm({ taskId, comment }: CommentEditFormProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(updateCommentAction, {
    ...initialCommentFormState,
    fields: {
      body: comment.body
    }
  })

  useEffect(() => {
    if (state.status === 'success' && state.message) {
      toast.success(state.message)
      router.refresh()
    }

    if (state.status === 'error' && state.message) {
      toast.danger(state.message)
    }
  }, [router, state.message, state.status])

  return (
    <AlertDialog>
      <Button size="sm" variant="outline">
        Edit
      </Button>

      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>Edit comment</AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body>
              <Form key={state.formKey} action={formAction} className="flex flex-col gap-4">
                <input type="hidden" name="taskId" value={taskId} />
                <input type="hidden" name="commentId" value={comment.id} />

                <FormTextField
                  label="Comment"
                  name="body"
                  defaultValue={state.fields.body}
                  error={state.fieldErrors.body}
                  isRequired
                  multiline
                />

                <AlertDialog.Footer>
                  <Button slot="close" variant="ghost">
                    Cancel
                  </Button>

                  <PendingSubmitButton idleLabel="Save comment" pendingLabel="Saving comment..." />
                </AlertDialog.Footer>
              </Form>
            </AlertDialog.Body>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  )
}
