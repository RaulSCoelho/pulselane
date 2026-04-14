import { describe } from 'vitest'

import { registerTasksCrudFlowCase } from './tasks-crud-flow.case'
import { registerTasksUnarchiveLimitCase } from './tasks-unarchive-limit.case'

describe('Tasks integration', () => {
  registerTasksCrudFlowCase()
  registerTasksUnarchiveLimitCase()
})
