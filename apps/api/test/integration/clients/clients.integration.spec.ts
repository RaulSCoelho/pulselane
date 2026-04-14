import { describe } from 'vitest'

import { registerClientsCrudFlowCase } from './clients-crud-flow.case'
import { registerClientsUnarchiveLimitCase } from './clients-unarchive-limit.case'

describe('Clients integration', () => {
  registerClientsCrudFlowCase()
  registerClientsUnarchiveLimitCase()
})
