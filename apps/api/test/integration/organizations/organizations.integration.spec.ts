import { describe } from 'vitest'

import { registerOrganizationsListAndCurrentCase } from './list-and-current.case'
import { registerOrganizationsRejectForeignCurrentCase } from './reject-foreign-organization.case'

describe('Organizations integration', () => {
  registerOrganizationsListAndCurrentCase()
  registerOrganizationsRejectForeignCurrentCase()
})
