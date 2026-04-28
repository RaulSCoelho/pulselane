import type { PreviewInvitationResponse } from '@pulselane/contracts/invitations'

export type InvitationPreviewState =
  | {
      status: 'ready'
      data: PreviewInvitationResponse
    }
  | {
      status: 'invalid'
      message: string
    }
