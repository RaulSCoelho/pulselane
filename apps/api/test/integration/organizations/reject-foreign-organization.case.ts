import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

export function registerOrganizationsRejectForeignCurrentCase(): void {
  it('should reject current organization lookup when user is not a member of the requested organization', async () => {
    const { app, prisma } = await getTestContext()

    const firstUser = await createAuthenticatedUser(app, prisma, {
      email: 'organizations-first@example.com',
      organizationName: 'Org First Workspace'
    })

    const secondUser = await createAuthenticatedUser(app, prisma, {
      email: 'organizations-second@example.com',
      organizationName: 'Org Second Workspace'
    })

    const response = await expectTyped<{ message: string }>(
      withOrgAuth(request(app.getHttpServer()).get('/api/organizations/current'), {
        accessToken: firstUser.accessToken,
        organizationId: secondUser.organizationId
      }),
      403
    )

    expect(response.body.message).toBe('User is not a member of this organization')
  })
}
