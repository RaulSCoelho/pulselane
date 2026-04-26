'use client'

import { createCommentAction } from '@/features/comments/actions/comment-actions'
import { Card, FieldError, Form, Label, TextArea, TextField, toast } from '@heroui/react'
import { useActionState, useEffect } from 'react'

import { initialCommentFormState } from './comment-form-state'
import { CommentFormSubmitButton } from './comment-form-submit-button'

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

          <TextField
            className="flex flex-col gap-2"
            defaultValue={resolvedState.fields.body}
            isInvalid={Boolean(resolvedState.fieldErrors.body)}
            isRequired
            name="body"
          >
            <Label>New comment</Label>
            <TextArea
              placeholder="Add execution context, blockers, decisions, or follow-up notes."
              variant="secondary"
            />
            <FieldError>{resolvedState.fieldErrors.body}</FieldError>
          </TextField>

          {resolvedState.status === 'error' && resolvedState.message ? (
            <p className="text-sm text-danger">{resolvedState.message}</p>
          ) : null}

          <div className="flex justify-end">
            <CommentFormSubmitButton idleLabel="Add comment" pendingLabel="Adding comment..." />
          </div>
        </Form>
      </Card.Content>
    </Card>
  )
}
