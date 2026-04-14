import { describe } from 'vitest'

import { registerMembershipsDemoteSecondOwnerCase } from './demote-second-owner.case'
import { registerMembershipsPaginateFilterUpdateCase } from './paginate-filter-update.case'
import { registerMembershipsRejectAdminPromoteOwnerCase } from './reject-admin-promote-owner.case'
import { registerRejectAdminRemoveOwnerCase } from './reject-admin-remove-owner.case'
import { registerMembershipsRejectLastOwnerDemotionCase } from './reject-last-owner-demotion.case'
import { registerRejectLastOwnerRemovalCase } from './reject-last-owner-removal.case'
import { registerRemoveMembershipCase } from './remove-membership.case'

describe('Memberships integration', () => {
  registerMembershipsPaginateFilterUpdateCase()
  registerMembershipsRejectLastOwnerDemotionCase()
  registerMembershipsDemoteSecondOwnerCase()
  registerMembershipsRejectAdminPromoteOwnerCase()
  registerRemoveMembershipCase()
  registerRejectAdminRemoveOwnerCase()
  registerRejectLastOwnerRemovalCase()
})
