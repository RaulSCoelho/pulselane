import type { MembershipRole } from '@pulselane/contracts'

export type InvitationFormValues = {
  email: string
  role: MembershipRole
}

export type InvitationFieldErrors = Partial<Record<keyof InvitationFormValues, string>>

export type InvitationFormState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  fields: InvitationFormValues
  fieldErrors: InvitationFieldErrors
  formKey: number
}

export type InvitationMutationState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  invitationId: string | null
}

export const initialInvitationFormState: InvitationFormState = {
  status: 'idle',
  message: null,
  fields: {
    email: '',
    role: 'member'
  },
  fieldErrors: {},
  formKey: 0
}

export const initialInvitationMutationState: InvitationMutationState = {
  status: 'idle',
  message: null,
  invitationId: null
}
