export type InvitationAcceptFormState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  acceptedOrganizationId: string | null
}

export const initialInvitationAcceptFormState: InvitationAcceptFormState = {
  status: 'idle',
  message: null,
  acceptedOrganizationId: null
}
