import { describe } from 'vitest'

import { registerProjectsCrudFlowCase } from './projects-crud-flow.case'
import { registerProjectsUnarchiveLimitCase } from './projects-unarchive-limit.case'

describe('Projects integration', () => {
  registerProjectsCrudFlowCase()
  registerProjectsUnarchiveLimitCase()
})
