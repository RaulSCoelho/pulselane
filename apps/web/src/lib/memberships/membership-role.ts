import type { MembershipRole } from '@pulselane/contracts'

type MembershipRoleOption = {
  id: MembershipRole
  label: string
}

type MembershipFilterRoleOption =
  | {
      id: 'all'
      label: string
    }
  | MembershipRoleOption

export const MEMBERSHIP_ROLE_OPTIONS: MembershipRoleOption[] = [
  {
    id: 'owner',
    label: 'Owner'
  },
  {
    id: 'admin',
    label: 'Admin'
  },
  {
    id: 'member',
    label: 'Member'
  },
  {
    id: 'viewer',
    label: 'Viewer'
  }
]

export const MEMBERSHIP_FILTER_ROLE_OPTIONS: MembershipFilterRoleOption[] = [
  {
    id: 'all',
    label: 'All roles'
  },
  ...MEMBERSHIP_ROLE_OPTIONS
]
