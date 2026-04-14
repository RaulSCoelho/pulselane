import { describe } from 'vitest'

import { registerMembershipsDemoteSecondOwnerCase } from './demote-second-owner.case'
import { registerMembershipsPaginateFilterUpdateCase } from './paginate-filter-update.case'
import { registerMembershipsRejectAdminPromoteOwnerCase } from './reject-admin-promote-owner.case'
import { registerMembershipsRejectLastOwnerDemotionCase } from './reject-last-owner-demotion.case'

describe('Memberships integration', () => {
  registerMembershipsPaginateFilterUpdateCase()
  registerMembershipsRejectLastOwnerDemotionCase()
  registerMembershipsDemoteSecondOwnerCase()
  registerMembershipsRejectAdminPromoteOwnerCase()
})
