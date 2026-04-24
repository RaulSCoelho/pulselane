import type { CurrentOrganizationState } from '../../features/organizations/api/current-organization-state'

export type AppShellOrganizationContextView = {
  organizationName: string
  organizationDetail: string
  activeContextValue: string
  syncNotice?: string
}

export function getAppShellOrganizationContextView(state: CurrentOrganizationState): AppShellOrganizationContextView {
  if (state.status === 'ready') {
    return {
      organizationName: state.data.organization.name,
      organizationDetail: state.data.currentRole,
      activeContextValue: state.data.organization.slug,
      syncNotice: state.freshness === 'stale' ? 'Using last synced context' : undefined
    }
  }

  if (state.status === 'not_selected') {
    return {
      organizationName: 'No organization selected',
      organizationDetail: 'Choose one to unlock operational screens',
      activeContextValue: 'No organization selected'
    }
  }

  if (state.status === 'temporarily_unavailable') {
    return {
      organizationName: 'Organization context temporarily unavailable',
      organizationDetail: 'Try again shortly or continue with cached screens when available',
      activeContextValue: 'Temporarily unavailable'
    }
  }

  if (state.status === 'forbidden') {
    return {
      organizationName: 'Access removed',
      organizationDetail: 'Select another organization or ask an admin for access',
      activeContextValue: 'Access removed'
    }
  }

  if (state.status === 'not_found') {
    return {
      organizationName: 'Organization not found',
      organizationDetail: 'Select another organization to continue',
      activeContextValue: 'Not found'
    }
  }

  return {
    organizationName: 'Session refresh required',
    organizationDetail: 'Redirecting to restore your session',
    activeContextValue: 'Auth required'
  }
}
