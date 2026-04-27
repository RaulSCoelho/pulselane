import type { MembershipRole } from '@pulselane/contracts'

export type MembershipRoleFormValues = {
  role: MembershipRole
}

export type MembershipRoleFieldErrors = Partial<Record<keyof MembershipRoleFormValues, string>>

export type MembershipRoleFormState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  fields: MembershipRoleFormValues
  fieldErrors: MembershipRoleFieldErrors
  formKey: number
}

export type RemoveMembershipState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  removedMembershipId: string | null
}

export const initialMembershipRoleFormState: MembershipRoleFormState = {
  status: 'idle',
  message: null,
  fields: {
    role: 'viewer'
  },
  fieldErrors: {},
  formKey: 0
}

export const initialRemoveMembershipState: RemoveMembershipState = {
  status: 'idle',
  message: null,
  removedMembershipId: null
}
