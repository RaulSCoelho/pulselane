import request from 'supertest'
import { expect, it } from 'vitest'

import { getCurrentUser, signupUser } from '../../support/factories/auth.factory'
import { withOrgAuth } from '../../support/http/request-helpers'
import type { CursorPageResponse } from '../../support/http/response.types'
import { expectTyped } from '../../support/http/typed-response'
import { getTestContext } from '../../support/runtime/test-context'

type MembershipItem = {
  id: string
  role: string
  user: {
    id: string
    email: string
    name: string
  }
}

export function registerMembershipsPaginateFilterUpdateCase(): void {
  it('should paginate memberships with cursor, filter memberships, and update role as owner', async () => {
    const { app, prisma } = await getTestContext()

    const { response: ownerSignup } = await signupUser(app, {
      email: 'memberships-owner@example.com',
      organizationName: 'Memberships Workspace'
    })

    const me = await getCurrentUser(app, ownerSignup.body.accessToken)
    const organizationId = me.memberships[0].organization.id

    const secondUser = await prisma.user.create({
      data: {
        name: 'Member User',
        email: 'memberships-member@example.com',
        passwordHash: 'hashed-password'
      }
    })

    const thirdUser = await prisma.user.create({
      data: {
        name: 'Viewer User',
        email: 'memberships-viewer@example.com',
        passwordHash: 'hashed-password'
      }
    })

    const membershipToUpdate = await prisma.membership.create({
      data: {
        userId: secondUser.id,
        organizationId,
        role: 'member'
      }
    })

    await prisma.membership.create({
      data: {
        userId: thirdUser.id,
        organizationId,
        role: 'viewer'
      }
    })

    const firstPage = await expectTyped<CursorPageResponse<MembershipItem>>(
      withOrgAuth(request(app.getHttpServer()).get('/api/memberships').query({ limit: 2 }), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }),
      200
    )

    expect(firstPage.body.items).toHaveLength(2)
    expect(firstPage.body.meta.limit).toBe(2)
    expect(firstPage.body.meta.hasNextPage).toBe(true)
    expect(firstPage.body.meta.nextCursor).toBeTypeOf('string')

    const secondPage = await expectTyped<CursorPageResponse<MembershipItem>>(
      withOrgAuth(
        request(app.getHttpServer())
          .get('/api/memberships')
          .query({
            limit: 2,
            cursor: firstPage.body.meta.nextCursor ?? ''
          }),
        {
          accessToken: ownerSignup.body.accessToken,
          organizationId
        }
      ),
      200
    )

    expect(secondPage.body.items).toHaveLength(1)
    expect(secondPage.body.meta.hasNextPage).toBe(false)
    expect(secondPage.body.meta.nextCursor).toBeNull()

    const filteredPage = await expectTyped<CursorPageResponse<MembershipItem>>(
      withOrgAuth(
        request(app.getHttpServer()).get('/api/memberships').query({
          limit: 10,
          search: 'member',
          role: 'member'
        }),
        {
          accessToken: ownerSignup.body.accessToken,
          organizationId
        }
      ),
      200
    )

    expect(filteredPage.body.items).toHaveLength(1)
    expect(filteredPage.body.items[0].user.email).toBe('memberships-member@example.com')
    expect(filteredPage.body.items[0].role).toBe('member')

    const updateResponse = await expectTyped<MembershipItem>(
      withOrgAuth(request(app.getHttpServer()).patch(`/api/memberships/${membershipToUpdate.id}/role`), {
        accessToken: ownerSignup.body.accessToken,
        organizationId
      }).send({
        role: 'admin'
      }),
      200
    )

    expect(updateResponse.body.role).toBe('admin')
    expect(updateResponse.body.user.email).toBe('memberships-member@example.com')
  })
}
