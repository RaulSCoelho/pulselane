import { projectCacheTag, projectsCacheTag } from '@/features/projects/api/cache-tags'
import { readApiErrorMessage } from '@/http/api-error'
import { resilientResultHasData, type ResilientGetResult } from '@/http/api-result'
import { resilientGet } from '@/http/resilient-fetch'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import {
  ListProjectsQuery,
  ListProjectsResponse,
  ProjectResponse,
  listProjectsQuerySchema,
  listProjectsResponseSchema,
  projectResponseSchema
} from '@pulselane/contracts/projects'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { projectsListResultToState, type ProjectsListState } from './projects-list-state'

export type { ProjectsListState, ProjectsUnavailableReason } from './projects-list-state'

function toQueryString(query: Partial<ListProjectsQuery>) {
  const parsed = listProjectsQuerySchema.safeParse(query)

  if (!parsed.success) {
    return ''
  }

  const params = new URLSearchParams()

  if (parsed.data.cursor) {
    params.set('cursor', parsed.data.cursor)
  }

  if (parsed.data.limit) {
    params.set('limit', String(parsed.data.limit))
  }

  if (parsed.data.search) {
    params.set('search', parsed.data.search)
  }

  if (parsed.data.clientId) {
    params.set('clientId', parsed.data.clientId)
  }

  if (parsed.data.status) {
    params.set('status', parsed.data.status)
  }

  if (parsed.data.includeArchived) {
    params.set('includeArchived', 'true')
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

async function getProjectSnapshotTags(projectId?: string) {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return []
  }

  return projectId
    ? [projectsCacheTag(organizationId), projectCacheTag(organizationId, projectId)]
    : [projectsCacheTag(organizationId)]
}

function throwResilientProjectsError(result: ResilientGetResult<unknown>, message: string): never {
  if (result.status === 'unavailable') {
    throw new Error(`${message} Status: ${result.statusCode ?? result.reason}`)
  }

  throw new Error(`${message} Status: ${result.status}`)
}

export const listProjects = cache(async function listProjects(
  query: Partial<ListProjectsQuery>
): Promise<ProjectsListState> {
  const result = await resilientGet<ListProjectsResponse>({
    key: 'projects.list',
    path: `/api/v1/projects${toQueryString(query)}`,
    schema: listProjectsResponseSchema,
    fallback: 'last-valid',
    tags: await getProjectSnapshotTags(),
    maxAgeSeconds: 120,
    staleIfErrorSeconds: 900,
    staleIfRateLimitedSeconds: 1800,
    tenantScoped: true,
    userScoped: true
  })

  if (resilientResultHasData(result)) {
    return projectsListResultToState(result)
  }

  return projectsListResultToState(result)
})

export const getProjectById = cache(async function getProjectById(projectId: string): Promise<ProjectResponse> {
  const result = await resilientGet<ProjectResponse>({
    key: 'projects.detail',
    path: `/api/v1/projects/${projectId}`,
    schema: projectResponseSchema,
    fallback: 'last-valid',
    tags: await getProjectSnapshotTags(projectId),
    maxAgeSeconds: 120,
    staleIfErrorSeconds: 900,
    staleIfRateLimitedSeconds: 1800,
    tenantScoped: true,
    userScoped: true
  })

  if (result.status === 'not_found') {
    notFound()
  }

  if (resilientResultHasData(result)) {
    return result.data
  }

  throwResilientProjectsError(result, 'Unable to load project.')
})

export const readErrorMessage = readApiErrorMessage
