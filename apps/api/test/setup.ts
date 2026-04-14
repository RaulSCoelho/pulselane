import { afterAll, beforeAll } from 'vitest'

import './support/runtime/test-env'
import { closeTestContext, getTestContext } from './support/runtime/test-context'
import { clearSharedTestDatabase } from './support/runtime/test-database'

beforeAll(async () => {
  await getTestContext()
  await clearSharedTestDatabase()
})

afterAll(async () => {
  await closeTestContext()
})
