import { describe } from 'vitest'

import { registerClientOptimisticConcurrencyCase } from './client-optimistic-concurrency.case'
import { registerClientsCreateLimitCase } from './clients-create-limit.case'
import { registerClientsCrudFlowCase } from './clients-crud-flow.case'
import { registerClientsUnarchiveLimitCase } from './clients-unarchive-limit.case'

describe('Clients integration', () => {
  registerClientsCrudFlowCase()
  registerClientsCreateLimitCase()
  registerClientsUnarchiveLimitCase()
  registerClientOptimisticConcurrencyCase()
})
