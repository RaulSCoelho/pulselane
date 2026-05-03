import type {
  AuditLogAction,
  ClientStatus,
  EmailDeliveryStatus,
  MembershipRole,
  OrganizationInvitationStatus,
  ProjectStatus,
  TaskPriority,
  TaskStatus
} from '@prisma/client'

export type CursorPageMeta = {
  limit: number
  nextCursor: string | null
  hasNextPage: boolean
}

export type CursorPageResponse<TItem> = {
  items: TItem[]
  meta: CursorPageMeta
}

export type ErrorResponse = {
  statusCode: number
  error: string
  message: string | string[]
}

export type TokenResponse = {
  accessToken: string
  expiresIn: number
}

export type CurrentUserResponse = {
  id: string
  name: string
  email: string
  memberships: Array<{
    id: string
    role: MembershipRole
    organization: {
      id: string
      name: string
      slug: string
    }
  }>
}

export type SessionResponse = {
  id: string
  deviceId: string
  userAgent: string | null
  ipAddress: string | null
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string
  isCurrent: boolean
  isActive: boolean
  revokedAt: string | null
  compromisedAt: string | null
}

export type ClientResponse = {
  id: string
  organizationId: string
  name: string
  email: string | null
  companyName: string | null
  status: ClientStatus
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ProjectResponse = {
  id: string
  organizationId: string
  clientId: string
  name: string
  description: string | null
  status: ProjectStatus
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  client?: {
    id: string
    name: string
  } | null
}

export type TaskResponse = {
  id: string
  organizationId: string
  projectId: string
  assigneeUserId: string | null
  title: string
  description: string | null
  blockedReason: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  assignee: {
    id: string
    name: string
    email: string
  } | null
}

export type CommentResponse = {
  id: string
  organizationId: string
  taskId: string
  authorUserId: string
  body: string
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    email: string
  }
}

export type CommentActivityHistoryItemResponse = {
  id: string
  source: 'comment' | 'audit_log'
  action: string
  entityType: string
  entityId: string
  taskId: string
  content: string | null
  occurredAt: string
  deletedAt: string | null
  metadata: Record<string, unknown> | null
  actor: {
    id: string
    name: string
    email: string
  } | null
}

export type InvitationResponse = {
  id: string
  organizationId: string
  email: string
  role: MembershipRole
  status: OrganizationInvitationStatus
  token?: string
  acceptedAt: string | null
  revokedAt: string | null
}

export type EmailDeliveryResponse = {
  id: string
  organizationId: string
  sentBy: string | null
  to: string
  subject: string
  status: EmailDeliveryStatus
  metadata: Record<string, unknown> | null
  sender: {
    id: string
    email: string
  } | null
}

export type AuditLogResponse = {
  id: string
  organizationId: string
  actorUserId: string
  entityType: string
  entityId: string
  action: AuditLogAction
  metadata: Record<string, unknown> | null
  createdAt: string
}
