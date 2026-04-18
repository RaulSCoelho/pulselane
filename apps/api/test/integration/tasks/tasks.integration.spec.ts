import { describe } from 'vitest'

import { registerTaskBlockedReasonCase } from './task-blocked-reason.case'
import { registerTaskFiltersOrderingCase } from './task-filters-ordering.case'
import { registerTaskOptimisticConcurrencyCase } from './task-optimistic-concurrency.case'
import { registerTasksCreateLimitCase } from './tasks-create-limit.case'
import { registerTasksCrudFlowCase } from './tasks-crud-flow.case'
import { registerTasksUnarchiveLimitCase } from './tasks-unarchive-limit.case'

describe('Tasks integration', () => {
  registerTasksCrudFlowCase()
  registerTasksCreateLimitCase()
  registerTasksUnarchiveLimitCase()
  registerTaskOptimisticConcurrencyCase()
  registerTaskBlockedReasonCase()
  registerTaskFiltersOrderingCase()
})
