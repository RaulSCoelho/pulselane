import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { ErrorResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

type CurrentOrganizationResponse = {
  organization: {
    id: string
    name: string
    slug: string
  }
}

export function registerOrganizationsRejectDuplicateSlugCase(): void {
  it('should reject updating organization slug when it is already in use', async () => {
    const { app, prisma } = await getTestContext()

    const firstOwner = await createAuthenticatedUser(app, prisma, {
      email: 'organizations-first-owner@example.com',
      organizationName: 'First Workspace'
    })

    const secondOwner = await createAuthenticatedUser(app, prisma, {
      email: 'organizations-second-owner@example.com',
      organizationName: 'Second Workspace'
    })

    const secondCurrent = await expectTyped<CurrentOrganizationResponse>(
      withOrgAuth(request(app.getHttpServer()).get('/api/organizations/current'), secondOwner),
      200
    )

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch('/api/organizations/current'), firstOwner).send({
        slug: secondCurrent.body.organization.slug
      }),
      409
    )

    expect(response.body.message).toBe('Organization slug already in use')
  })
}
