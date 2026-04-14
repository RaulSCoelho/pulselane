import type { Test } from 'supertest'

export type OrgAuthContext = {
  accessToken: string
  organizationId: string
}

export function withAccessToken(test: Test, accessToken: string): Test {
  return test.set('Authorization', `Bearer ${accessToken}`)
}

export function withOrganization(test: Test, organizationId: string): Test {
  return test.set('x-organization-id', organizationId)
}

export function withOrgAuth(test: Test, ctx: OrgAuthContext): Test {
  return withOrganization(withAccessToken(test, ctx.accessToken), ctx.organizationId)
}
