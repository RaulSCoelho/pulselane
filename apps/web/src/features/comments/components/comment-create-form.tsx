'use client'

import { FormTextField } from '@/components/ui/form-fields'
import { PendingSubmitButton } from '@/components/ui/pending-submit-button'
import { createCommentAction } from '@/features/comments/actions/comment-actions'
import { Card, Form, toast } from '@heroui/react'
import { useActionState, useEffect } from 'react'

import { initialCommentFormState } from './comment-form-state'

type CommentCreateFormProps = {
  taskId: string
}

export function CommentCreateForm({ taskId }: CommentCreateFormProps) {
  const [state, formAction] = useActionState(createCommentAction, initialCommentFormState)
  const resolvedState = state ?? initialCommentFormState

  useEffect(() => {
    if (resolvedState.status === 'success' && resolvedState.message) {
      toast.success(resolvedState.message)
    }
  }, [resolvedState.message, resolvedState.status])

  return (
    <Card className="border border-black/5" variant="secondary">
      <Card.Content className="p-4">
        <Form key={resolvedState.formKey} action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="taskId" value={taskId} />

          <FormTextField
            label="New comment"
            name="body"
            defaultValue={resolvedState.fields.body}
            error={resolvedState.fieldErrors.body}
            isRequired
            placeholder="Add execution context, blockers, decisions, or follow-up notes."
            multiline
          />

          {resolvedState.status === 'error' && resolvedState.message ? (
            <p className="text-sm text-danger">{resolvedState.message}</p>
          ) : null}

          <div className="flex justify-end">
            <PendingSubmitButton idleLabel="Add comment" pendingLabel="Adding comment..." />
          </div>
        </Form>
      </Card.Content>
    </Card>
  )
}
