import { readApiErrorMessage } from '@/http/api-error'
import { serverApi } from '@/http/server-api-client'
import { previewInvitationQuerySchema, previewInvitationResponseSchema } from '@pulselane/contracts/invitations'
import { cache } from 'react'

import type { InvitationPreviewState } from './invitation-preview-state'

export const previewInvitation = cache(async function previewInvitation(
  token: string
): Promise<InvitationPreviewState> {
  const parsed = previewInvitationQuerySchema.safeParse({
    token
  })

  if (!parsed.success) {
    return {
      status: 'invalid',
      message: 'Invalid invitation token.'
    }
  }

  const params = new URLSearchParams({
    token: parsed.data.token
  })

  const response = await serverApi(`/api/v1/invitations/preview?${params.toString()}`, {
    method: 'GET'
  })

  if (!response.ok) {
    return {
      status: 'invalid',
      message: await readApiErrorMessage(response, 'Unable to preview invitation.')
    }
  }

  const body = previewInvitationResponseSchema.safeParse(await response.json().catch(() => null))

  if (!body.success) {
    return {
      status: 'invalid',
      message: 'Invitation preview response could not be validated.'
    }
  }

  return {
    status: 'ready',
    data: body.data
  }
})
