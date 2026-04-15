import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import {
  addOrganizationMembership,
  createClientRecord,
  createProjectRecord,
  createTaskRecord
} from '../../support/factories/domain.factory'
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

type CurrentOrganizationResponse = {
  organization: {
    id: string
    name: string
    slug: string
  }
  currentRole: 'owner' | 'admin' | 'member' | 'viewer'
  plan: {
    plan: 'free' | 'starter' | 'growth'
    status: 'free' | 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
  }
  limits: {
    members: number | null
    clients: number | null
    projects: number | null
    activeTasks: number | null
  }
  usage: {
    members: number
    clients: number
    projects: number
    activeTasks: number
  }
}

export function registerOrganizationsListAndCurrentCase(): void {
  it('should list organizations for current user and return the current organization payload with role plan limits and usage', async () => {
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

    const client = await createClientRecord(prisma, {
      organizationId: secondaryContext.organizationId,
      data: {
        name: 'Secondary Client'
      }
    })

    const project = await createProjectRecord(prisma, {
      organizationId: secondaryContext.organizationId,
      clientId: client.id,
      data: {
        name: 'Secondary Project'
      }
    })

    await createTaskRecord(prisma, {
      organizationId: secondaryContext.organizationId,
      projectId: project.id,
      data: {
        title: 'Secondary Task'
      }
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

    const currentResponse = await expectTyped<CurrentOrganizationResponse>(
      withOrgAuth(request(app.getHttpServer()).get('/api/organizations/current'), {
        accessToken: primaryContext.accessToken,
        organizationId: secondaryContext.organizationId
      }),
      200
    )

    expect(currentResponse.body.organization.id).toBe(secondaryContext.organizationId)
    expect(currentResponse.body.organization.name).toBe('Secondary Workspace')
    expect(currentResponse.body.currentRole).toBe('viewer')
    expect(currentResponse.body.plan.plan).toBe('free')
    expect(currentResponse.body.plan.status).toBe('free')
    expect(currentResponse.body.limits.members).toBe(3)
    expect(currentResponse.body.limits.clients).toBe(10)
    expect(currentResponse.body.limits.projects).toBe(10)
    expect(currentResponse.body.limits.activeTasks).toBe(100)
    expect(currentResponse.body.usage.members).toBe(2)
    expect(currentResponse.body.usage.clients).toBe(1)
    expect(currentResponse.body.usage.projects).toBe(1)
    expect(currentResponse.body.usage.activeTasks).toBe(1)
  })
}
