import './support/runtime/test-env'
import { closeTestContext } from './support/runtime/test-context'
import { prepareSharedTestDatabase } from './support/runtime/test-database'

export default async function globalSetup(): Promise<() => Promise<void>> {
  await prepareSharedTestDatabase()

  return async () => {
    await closeTestContext()
  }
}
