export type CommentFormValues = {
  body: string
}

export type CommentFieldErrors = Partial<Record<keyof CommentFormValues, string>>

export type CommentFormState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  fields: CommentFormValues
  fieldErrors: CommentFieldErrors
  formKey: number
}

export type DeleteCommentState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  deletedCommentId: string | null
}

export const initialCommentFormState: CommentFormState = {
  status: 'idle',
  message: null,
  fields: {
    body: ''
  },
  fieldErrors: {},
  formKey: 0
}

export const initialDeleteCommentState: DeleteCommentState = {
  status: 'idle',
  message: null,
  deletedCommentId: null
}
