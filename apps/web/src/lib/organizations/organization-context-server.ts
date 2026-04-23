'use server'

import { cookies } from 'next/headers'

import { ACTIVE_ORGANIZATION_COOKIE_NAME } from './organization-context-constants'

export async function getActiveOrganizationIdFromServerCookies(): Promise<string | null> {
  const cookieStore = await cookies()

  return cookieStore.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value ?? null
}
