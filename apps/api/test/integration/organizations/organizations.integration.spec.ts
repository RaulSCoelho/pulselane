import { describe } from 'vitest'

import { registerOrganizationsListAndCurrentCase } from './list-and-current.case'
import { registerOrganizationsRejectDuplicateSlugCase } from './reject-duplicate-slug.case'
import { registerOrganizationsRejectForeignCurrentCase } from './reject-foreign-organization.case'
import { registerOrganizationsRejectViewerUpdateCase } from './reject-viewer-update.case'

describe('Organizations integration', () => {
  registerOrganizationsListAndCurrentCase()
  registerOrganizationsRejectForeignCurrentCase()
  registerOrganizationsRejectViewerUpdateCase()
  registerOrganizationsRejectDuplicateSlugCase()
})
