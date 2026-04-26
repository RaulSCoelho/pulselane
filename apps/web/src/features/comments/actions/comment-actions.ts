'use server'

import { commentActivityHistoryCacheTag, commentCacheTag, commentsCacheTag } from '@/features/comments/api/cache-tags'
import {
  CommentFieldErrors,
  CommentFormState,
  DeleteCommentState,
  initialCommentFormState
} from '@/features/comments/components/comment-form-state'
import { readApiErrorMessage } from '@/http/api-error'
import { serverApi } from '@/http/server-api-client'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import { successResponseSchema } from '@pulselane/contracts'
import {
  CreateCommentRequest,
  UpdateCommentRequest,
  createCommentRequestSchema,
  updateCommentRequestSchema
} from '@pulselane/contracts/comments'
import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'

function buildCommentFields(formData: FormData) {
  return {
    body: String(formData.get('body') ?? '').trim()
  }
}

function mapCreateCommentFieldErrors(error: z.ZodError<CreateCommentRequest>): CommentFieldErrors {
  const flattened = error.flatten().fieldErrors

  return {
    body: flattened.body?.[0]
  }
}

function mapUpdateCommentFieldErrors(error: z.ZodError<UpdateCommentRequest>): CommentFieldErrors {
  const flattened = error.flatten().fieldErrors

  return {
    body: flattened.body?.[0]
  }
}

async function updateCommentCacheTags(taskId: string, commentId?: string) {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return
  }

  updateTag(commentsCacheTag(organizationId, taskId))
  updateTag(commentActivityHistoryCacheTag(organizationId, taskId))

  if (commentId) {
    updateTag(commentCacheTag(organizationId, commentId))
  }
}

export async function createCommentAction(
  previousState: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  const taskId = String(formData.get('taskId') ?? '').trim()
  const fields = buildCommentFields(formData)

  const payload: CreateCommentRequest = {
    taskId,
    body: fields.body
  }

  const parsed = createCommentRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Invalid comment. Review the field and try again.',
      fields,
      fieldErrors: mapCreateCommentFieldErrors(parsed.error),
      formKey: previousState.formKey + 1
    }
  }

  const response = await serverApi('/api/v1/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parsed.data)
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to create comment.'),
      fields,
      fieldErrors: {},
      formKey: previousState.formKey + 1
    }
  }

  await updateCommentCacheTags(taskId)
  revalidatePath(`/app/tasks/${taskId}`)

  return {
    status: 'success',
    message: 'Comment created successfully.',
    fields: initialCommentFormState.fields,
    fieldErrors: {},
    formKey: previousState.formKey + 1
  }
}

export async function updateCommentAction(
  previousState: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  const taskId = String(formData.get('taskId') ?? '').trim()
  const commentId = String(formData.get('commentId') ?? '').trim()
  const fields = buildCommentFields(formData)

  if (!taskId || !commentId) {
    return {
      status: 'error',
      message: 'Missing comment context.',
      fields,
      fieldErrors: {},
      formKey: previousState.formKey + 1
    }
  }

  const payload: UpdateCommentRequest = {
    body: fields.body
  }

  const parsed = updateCommentRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Invalid comment. Review the field and try again.',
      fields,
      fieldErrors: mapUpdateCommentFieldErrors(parsed.error),
      formKey: previousState.formKey + 1
    }
  }

  const response = await serverApi(`/api/v1/comments/${commentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parsed.data)
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to update comment.'),
      fields,
      fieldErrors: {},
      formKey: previousState.formKey + 1
    }
  }

  await updateCommentCacheTags(taskId, commentId)
  revalidatePath(`/app/tasks/${taskId}`)

  return {
    status: 'success',
    message: 'Comment updated successfully.',
    fields,
    fieldErrors: {},
    formKey: previousState.formKey + 1
  }
}

export async function deleteCommentAction(
  _previousState: DeleteCommentState,
  formData: FormData
): Promise<DeleteCommentState> {
  const taskId = String(formData.get('taskId') ?? '').trim()
  const commentId = String(formData.get('commentId') ?? '').trim()

  if (!taskId || !commentId) {
    return {
      status: 'error',
      message: 'Missing comment context.',
      deletedCommentId: null
    }
  }

  const response = await serverApi(`/api/v1/comments/${commentId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to delete comment.'),
      deletedCommentId: null
    }
  }

  const body = successResponseSchema.safeParse(await response.json().catch(() => null))

  if (!body.success || !body.data.success) {
    return {
      status: 'error',
      message: 'Unable to delete comment.',
      deletedCommentId: null
    }
  }

  await updateCommentCacheTags(taskId, commentId)
  revalidatePath(`/app/tasks/${taskId}`)

  return {
    status: 'success',
    message: 'Comment deleted successfully.',
    deletedCommentId: commentId
  }
}
