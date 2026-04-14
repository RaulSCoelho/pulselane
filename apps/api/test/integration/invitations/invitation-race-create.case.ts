import request from 'supertest'
import { expect, it } from 'vitest'

import { createAuthenticatedUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import { getTestContext } from '../../support/runtime/test-context'

export function registerInvitationRaceCreateCase(): void {
  it('should allow only one pending invitation when two create requests race for the same email', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'invitations-race-create-owner@example.com',
      organizationName: 'Race Create Workspace'
    })

    const [firstCreate, secondCreate] = await Promise.all([
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), owner).send({
        email: 'invitations-race-create-duplicate@example.com',
        role: 'member'
      }),
      withOrgAuth(request(app.getHttpServer()).post('/api/invitations'), owner).send({
        email: 'invitations-race-create-duplicate@example.com',
        role: 'member'
      })
    ])

    const statuses = [firstCreate.status, secondCreate.status].sort((a, b) => a - b)

    expect(statuses).toEqual([201, 409])

    const invitations = await prisma.organizationInvitation.findMany({
      where: {
        organizationId: owner.organizationId,
        email: 'invitations-race-create-duplicate@example.com'
      }
    })

    expect(invitations).toHaveLength(1)
    expect(invitations[0].status).toBe('pending')
  })
}
