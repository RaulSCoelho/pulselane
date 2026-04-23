import { readActiveOrganizationIdFromDocument } from '../organizations/organization-context'
import { ACTIVE_ORGANIZATION_HEADER_NAME } from '../organizations/organization-context-constants'

async function getServerActiveOrganizationId(): Promise<string | null> {
  const { getActiveOrganizationIdFromServerCookies } = await import('../organizations/organization-context-server')

  return getActiveOrganizationIdFromServerCookies()
}

export async function setOrganizationHeaders(request: Request) {
  if (request.headers.has(ACTIVE_ORGANIZATION_HEADER_NAME)) {
    return
  }

  const activeOrganizationId =
    typeof window === 'undefined' ? await getServerActiveOrganizationId() : readActiveOrganizationIdFromDocument()

  if (!activeOrganizationId) {
    return
  }

  request.headers.set(ACTIVE_ORGANIZATION_HEADER_NAME, activeOrganizationId)
}
