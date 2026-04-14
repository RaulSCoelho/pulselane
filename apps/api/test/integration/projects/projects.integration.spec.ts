import { describe } from 'vitest'

import { registerProjectOptimisticConcurrencyCase } from './project-optimistic-concurrency.case'
import { registerProjectsCrudFlowCase } from './projects-crud-flow.case'
import { registerProjectsUnarchiveLimitCase } from './projects-unarchive-limit.case'

describe('Projects integration', () => {
  registerProjectsCrudFlowCase()
  registerProjectsUnarchiveLimitCase()
  registerProjectOptimisticConcurrencyCase()
})
