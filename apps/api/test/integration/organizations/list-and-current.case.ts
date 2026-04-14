import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { addOrganizationMembership } from '../../support/factories/domain.factory'
import { withAccessToken, withOrgAuth } from '../../support/http/request-helpers'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

type OrganizationSummary = {
  id: string
  name: string
  slug: string
}

type OrganizationListResponse = {
  items: OrganizationSummary[]
}

export function registerOrganizationsListAndCurrentCase(): void {
  it('should list organizations for current user and resolve current organization from header', async () => {
    const { app, prisma } = await getTestContext()

    const primaryContext = await createAuthenticatedUser(app, prisma, {
      email: 'organizations-primary@example.com',
      organizationName: 'Primary Workspace'
    })

    const secondaryContext = await createAuthenticatedUser(app, prisma, {
      email: 'organizations-secondary@example.com',
      organizationName: 'Secondary Workspace'
    })

    await addOrganizationMembership(prisma, {
      userId: primaryContext.userId,
      organizationId: secondaryContext.organizationId,
      role: 'viewer'
    })

    const listResponse = await expectTyped<OrganizationListResponse>(
      withAccessToken(request(app.getHttpServer()).get('/api/organizations'), primaryContext.accessToken),
      200
    )

    expect(listResponse.body.items).toHaveLength(2)
    expect(
      listResponse.body.items.some(
        item => item.id === primaryContext.organizationId && item.name === 'Primary Workspace'
      )
    ).toBe(true)
    expect(
      listResponse.body.items.some(
        item => item.id === secondaryContext.organizationId && item.name === 'Secondary Workspace'
      )
    ).toBe(true)

    const currentResponse = await expectTyped<OrganizationSummary>(
      withOrgAuth(request(app.getHttpServer()).get('/api/organizations/current'), {
        accessToken: primaryContext.accessToken,
        organizationId: secondaryContext.organizationId
      }),
      200
    )

    expect(currentResponse.body.id).toBe(secondaryContext.organizationId)
    expect(currentResponse.body.name).toBe('Secondary Workspace')
  })
}
