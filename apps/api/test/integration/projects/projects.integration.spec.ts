import { describe } from 'vitest'

import { registerProjectOptimisticConcurrencyCase } from './project-optimistic-concurrency.case'
import { registerProjectRejectArchiveOpenTasksCase } from './project-reject-archive-open-tasks.case'
import { registerProjectsCreateLimitCase } from './projects-create-limit.case'
import { registerProjectsCrudFlowCase } from './projects-crud-flow.case'
import { registerProjectsUnarchiveLimitCase } from './projects-unarchive-limit.case'

describe('Projects integration', () => {
  registerProjectsCrudFlowCase()
  registerProjectsCreateLimitCase()
  registerProjectsUnarchiveLimitCase()
  registerProjectOptimisticConcurrencyCase()
  registerProjectRejectArchiveOpenTasksCase()
})
