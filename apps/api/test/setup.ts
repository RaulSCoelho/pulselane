import { afterAll, beforeAll, beforeEach } from 'vitest'

import './support/runtime/test-env'
import { closeTestContext, getTestContext } from './support/runtime/test-context'
import { resetSharedTestDatabase } from './support/runtime/test-database'

beforeAll(async () => {
  await getTestContext()
})

beforeEach(async () => {
  await resetSharedTestDatabase()
})

afterAll(async () => {
  await closeTestContext()
})
