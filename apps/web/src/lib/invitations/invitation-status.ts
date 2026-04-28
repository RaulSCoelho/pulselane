import type { OrganizationInvitationStatus } from '@pulselane/contracts'

type InvitationStatusOption = {
  id: OrganizationInvitationStatus
  label: string
}

type InvitationFilterStatusOption =
  | {
      id: 'all'
      label: string
    }
  | InvitationStatusOption

export const INVITATION_STATUS_OPTIONS: InvitationStatusOption[] = [
  {
    id: 'pending',
    label: 'Pending'
  },
  {
    id: 'accepted',
    label: 'Accepted'
  },
  {
    id: 'revoked',
    label: 'Revoked'
  },
  {
    id: 'expired',
    label: 'Expired'
  }
]

export const INVITATION_FILTER_STATUS_OPTIONS: InvitationFilterStatusOption[] = [
  {
    id: 'all',
    label: 'All statuses'
  },
  ...INVITATION_STATUS_OPTIONS
]
