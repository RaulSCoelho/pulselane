import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createAuthenticatedUser, getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withAccessToken, withOrgAuth } from '../../support/http/request-helpers'
import type { CursorPageResponse, ErrorResponse, TaskResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

describe('Guard and role edge cases integration', () => {
  it('should reject organization-scoped route without x-organization-id header', async () => {
    const { app } = await getTestContext()

    const { response: signup } = await signupUser(app, {
      email: 'missing-header@example.com',
      organizationName: 'Header Workspace'
    })

    const response = await expectTyped<ErrorResponse>(
      withAccessToken(request(app.getHttpServer()).get('/api/clients'), signup.body.accessToken),
      400
    )

    expect(response.body.statusCode).toBe(400)
    expect(response.body.error).toBe('Bad Request')
    expect(response.body.message).toBe('x-organization-id header is required')
  })

  it('should reject unauthenticated access to organization-scoped route', async () => {
    const { app } = await getTestContext()

    const response = await expectTyped<ErrorResponse>(
      request(app.getHttpServer()).get('/api/clients').set('x-organization-id', 'some-org-id'),
      401
    )

    expect(response.body.statusCode).toBe(401)
    expect(response.body.error).toBe('Unauthorized')
  })

  it('should allow viewer to list tasks but forbid viewer from deleting tasks', async () => {
    const { app, prisma } = await getTestContext()

    const owner = await createAuthenticatedUser(app, prisma, {
      email: 'viewer-role@example.com',
      organizationName: 'Viewer Workspace'
    })

    const clientResponse = await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/clients'), owner).send({
        name: 'Viewer Client'
      }),
      201
    )

    const projectResponse = await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/projects'), owner).send({
        clientId: clientResponse.body.id,
        name: 'Viewer Project'
      }),
      201
    )

    const taskResponse = await expectTyped<TaskResponse>(
      withOrgAuth(request(app.getHttpServer()).post('/api/tasks'), owner).send({
        projectId: projectResponse.body.id,
        title: 'Viewer Task',
        assigneeUserId: owner.userId
      }),
      201
    )

    await prisma.membership.update({
      where: {
        userId_organizationId: {
          userId: owner.userId,
          organizationId: owner.organizationId
        }
      },
      data: {
        role: 'viewer'
      }
    })

    const listResponse = await expectTyped<CursorPageResponse<TaskResponse>>(
      withOrgAuth(request(app.getHttpServer()).get('/api/tasks').query({ limit: 10 }), owner),
      200
    )

    expect(listResponse.body.items).toHaveLength(1)
    expect(listResponse.body.items[0].id).toBe(taskResponse.body.id)
    expect(listResponse.body.meta.limit).toBe(10)

    const deleteResponse = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).delete(`/api/tasks/${taskResponse.body.id}`), owner),
      403
    )

    expect(deleteResponse.body.message).toBe('You do not have permission to perform this action')
  })

  it('should forbid owner from removing own owner role', async () => {
    const { app } = await getTestContext()

    const { response: signup } = await signupUser(app, {
      email: 'self-owner@example.com',
      organizationName: 'Owner Workspace'
    })

    const me = await getCurrentUser(app, signup.body.accessToken)
    const organizationId = me.memberships[0].organization.id
    const ownerMembershipId = me.memberships[0].id

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/memberships/${ownerMembershipId}/role`), {
        accessToken: signup.body.accessToken,
        organizationId
      }).send({
        role: 'admin'
      }),
      403
    )

    expect(response.body.message).toBe('Owner cannot remove own owner role')
  })

  it('should reject task listing when assignee filter belongs to another organization', async () => {
    const { app } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'task-filter-owner@example.com',
      organizationName: 'Task Filter Workspace'
    })

    const { response: outsiderSignup } = await signupUser(app, {
      email: 'task-filter-outsider@example.com',
      organizationName: 'Task Filter Outsider Workspace'
    })

    const ownerMe = await getCurrentUser(app, ownerSignup.body.accessToken)
    const outsiderMe = await getCurrentUser(app, outsiderSignup.body.accessToken)
    const organizationId = ownerMe.memberships[0].organization.id

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(
        request(app.getHttpServer()).get('/api/tasks').query({
          assigneeUserId: outsiderMe.id,
          limit: 10
        }),
        {
          accessToken: ownerSignup.body.accessToken,
          organizationId
        }
      ),
      404
    )

    expect(response.body.message).toBe('Assignee not found in this organization')
  })

  it('should reject project listing when client filter belongs to another organization', async () => {
    const { app } = await getTestContext()

    const { response: ownerASignup } = await signupUser(app, {
      email: 'project-filter-a@example.com',
      organizationName: 'Project Filter Workspace A'
    })

    const { response: ownerBSignup } = await signupUser(app, {
      email: 'project-filter-b@example.com',
      organizationName: 'Project Filter Workspace B'
    })

    const ownerAMe = await getCurrentUser(app, ownerASignup.body.accessToken)
    const ownerBMe = await getCurrentUser(app, ownerBSignup.body.accessToken)

    const organizationAId = ownerAMe.memberships[0].organization.id
    const organizationBId = ownerBMe.memberships[0].organization.id

    const foreignClientResponse = await expectTyped<{ id: string }>(
      withOrgAuth(request(app.getHttpServer()).post('/api/clients'), {
        accessToken: ownerBSignup.body.accessToken,
        organizationId: organizationBId
      }).send({
        name: 'Foreign Filter Client'
      }),
      201
    )

    const response = await expectTyped<ErrorResponse>(
      withOrgAuth(
        request(app.getHttpServer()).get('/api/projects').query({
          clientId: foreignClientResponse.body.id,
          limit: 10
        }),
        {
          accessToken: ownerASignup.body.accessToken,
          organizationId: organizationAId
        }
      ),
      404
    )

    expect(response.body.message).toBe('Client not found')
  })
})
