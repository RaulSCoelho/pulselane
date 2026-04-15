import { describe } from 'vitest'

import { registerTaskBlockedReasonCase } from './task-blocked-reason.case'
import { registerTaskOptimisticConcurrencyCase } from './task-optimistic-concurrency.case'
import { registerTasksCrudFlowCase } from './tasks-crud-flow.case'
import { registerTasksUnarchiveLimitCase } from './tasks-unarchive-limit.case'

describe('Tasks integration', () => {
  registerTasksCrudFlowCase()
  registerTasksUnarchiveLimitCase()
  registerTaskOptimisticConcurrencyCase()
  registerTaskBlockedReasonCase()
})
