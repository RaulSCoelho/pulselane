import { z } from 'zod'

export const membershipRoleValues = ['owner', 'admin', 'member', 'viewer'] as const
export const membershipRoleSchema = z.enum(membershipRoleValues)
export type MembershipRole = z.infer<typeof membershipRoleSchema>

export const clientStatusValues = ['active', 'inactive', 'archived'] as const
export const clientStatusSchema = z.enum(clientStatusValues)
export type ClientStatus = z.infer<typeof clientStatusSchema>

export const projectStatusValues = ['active', 'on_hold', 'completed', 'archived'] as const
export const projectStatusSchema = z.enum(projectStatusValues)
export type ProjectStatus = z.infer<typeof projectStatusSchema>

export const taskStatusValues = ['todo', 'in_progress', 'blocked', 'done', 'archived'] as const
export const taskStatusSchema = z.enum(taskStatusValues)
export type TaskStatus = z.infer<typeof taskStatusSchema>

export const taskPriorityValues = ['low', 'medium', 'high', 'urgent'] as const
export const taskPrioritySchema = z.enum(taskPriorityValues)
export type TaskPriority = z.infer<typeof taskPrioritySchema>

export const taskSortByValues = ['created_at', 'due_date'] as const
export const taskSortBySchema = z.enum(taskSortByValues)
export type TaskSortBy = z.infer<typeof taskSortBySchema>

export const sortDirectionValues = ['asc', 'desc'] as const
export const sortDirectionSchema = z.enum(sortDirectionValues)
export type SortDirection = z.infer<typeof sortDirectionSchema>

export const auditLogActionValues = ['created', 'updated', 'archived', 'deleted'] as const
export const auditLogActionSchema = z.enum(auditLogActionValues)
export type AuditLogAction = z.infer<typeof auditLogActionSchema>

export const organizationInvitationStatusValues = ['pending', 'accepted', 'revoked', 'expired'] as const
export const organizationInvitationStatusSchema = z.enum(organizationInvitationStatusValues)
export type OrganizationInvitationStatus = z.infer<typeof organizationInvitationStatusSchema>

export const billingPlanValues = ['free', 'starter', 'growth'] as const
export const billingPlanSchema = z.enum(billingPlanValues)
export type BillingPlan = z.infer<typeof billingPlanSchema>

export const billingSubscriptionStatusValues = ['free', 'active', 'trialing', 'past_due', 'canceled', 'incomplete'] as const
export const billingSubscriptionStatusSchema = z.enum(billingSubscriptionStatusValues)
export type BillingSubscriptionStatus = z.infer<typeof billingSubscriptionStatusSchema>

export const billingPlanActionTypeValues = ['current', 'checkout', 'manage_in_portal', 'unavailable'] as const
export const billingPlanActionTypeSchema = z.enum(billingPlanActionTypeValues)
export type BillingPlanActionType = z.infer<typeof billingPlanActionTypeSchema>

export const billingPlanChangeKindValues = ['none', 'upgrade', 'downgrade', 'lateral'] as const
export const billingPlanChangeKindSchema = z.enum(billingPlanChangeKindValues)
export type BillingPlanChangeKind = z.infer<typeof billingPlanChangeKindSchema>

export const commentActivitySourceValues = ['comment', 'audit_log'] as const
export const commentActivitySourceSchema = z.enum(commentActivitySourceValues)
export type CommentActivitySource = z.infer<typeof commentActivitySourceSchema>