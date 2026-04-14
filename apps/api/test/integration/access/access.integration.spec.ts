import { describe } from 'vitest'

import { registerAdminCannotInviteOwnerCase } from './admin-cannot-invite-owner.case'
import { registerAdminCannotUpdateOwnerMembershipCase } from './admin-cannot-update-owner-membership.case'
import { registerCrossTenantClientForbiddenCase } from './cross-tenant-client-forbidden.case'
import { registerCrossTenantProjectForbiddenCase } from './cross-tenant-project-forbidden.case'
import { registerCrossTenantTaskAssigneeForbiddenCase } from './cross-tenant-task-assignee-forbidden.case'
import { registerForeignAssigneeFilterCase } from './foreign-assignee-filter.case'
import { registerForeignClientFilterCase } from './foreign-client-filter.case'
import { registerMissingOrganizationHeaderCase } from './missing-org-header.case'
import { registerOwnerSelfDemotionCase } from './owner-self-demotion.case'
import { registerUnauthenticatedOrgRouteCase } from './unauthenticated-org-route.case'
import { registerViewerTaskAccessCase } from './viewer-task-access.case'

describe('Access integration', () => {
  registerMissingOrganizationHeaderCase()
  registerUnauthenticatedOrgRouteCase()
  registerViewerTaskAccessCase()
  registerOwnerSelfDemotionCase()
  registerForeignAssigneeFilterCase()
  registerForeignClientFilterCase()
  registerCrossTenantClientForbiddenCase()
  registerCrossTenantProjectForbiddenCase()
  registerCrossTenantTaskAssigneeForbiddenCase()
  registerAdminCannotInviteOwnerCase()
  registerAdminCannotUpdateOwnerMembershipCase()
})
