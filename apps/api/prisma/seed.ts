import bcrypt from 'bcrypt';
import {
  AuditLogAction,
  ClientStatus,
  MembershipRole,
  Prisma,
  PrismaClient,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';

const prisma = new PrismaClient();
const defaultPassword = '123456';

// The seed dataset mirrors the core tenant hierarchy used by the API:
// organization -> clients -> projects -> tasks, plus sessions and audit history.

const users = [
  {
    id: 'seed_user_raul',
    name: 'Raul Costa',
    email: 'raul@pulselane.dev',
  },
  {
    id: 'seed_user_ana',
    name: 'Ana Martins',
    email: 'ana@brightforge.dev',
  },
  {
    id: 'seed_user_bruno',
    name: 'Bruno Almeida',
    email: 'bruno@northstarlabs.dev',
  },
  {
    id: 'seed_user_clara',
    name: 'Clara Souza',
    email: 'clara@everpeak.dev',
  },
] as const;

const organizations = [
  {
    id: 'seed_org_pulselane',
    name: 'Pulselane Labs',
    slug: 'pulselane-labs',
  },
  {
    id: 'seed_org_brightforge',
    name: 'Brightforge Studio',
    slug: 'brightforge-studio',
  },
  {
    id: 'seed_org_northstar',
    name: 'Northstar Labs',
    slug: 'northstar-labs',
  },
  {
    id: 'seed_org_everpeak',
    name: 'Everpeak Health',
    slug: 'everpeak-health',
  },
] as const;

const memberships = [
  {
    id: 'seed_membership_raul',
    userId: 'seed_user_raul',
    organizationId: 'seed_org_pulselane',
    role: MembershipRole.owner,
  },
  {
    id: 'seed_membership_ana',
    userId: 'seed_user_ana',
    organizationId: 'seed_org_brightforge',
    role: MembershipRole.owner,
  },
  {
    id: 'seed_membership_bruno',
    userId: 'seed_user_bruno',
    organizationId: 'seed_org_northstar',
    role: MembershipRole.owner,
  },
  {
    id: 'seed_membership_clara',
    userId: 'seed_user_clara',
    organizationId: 'seed_org_everpeak',
    role: MembershipRole.owner,
  },
] as const;

const clients = [
  {
    id: 'seed_client_pulselane_acme',
    organizationId: 'seed_org_pulselane',
    name: 'Acme Corp',
    email: 'contact@acme.com',
    companyName: 'Acme Corporation',
    status: ClientStatus.active,
  },
  {
    id: 'seed_client_pulselane_orbit',
    organizationId: 'seed_org_pulselane',
    name: 'Orbit Finance',
    email: 'ops@orbitfinance.com',
    companyName: 'Orbit Finance',
    status: ClientStatus.active,
  },
  {
    id: 'seed_client_pulselane_legacy',
    organizationId: 'seed_org_pulselane',
    name: 'Legacy Retail',
    email: 'finance@legacyretail.com',
    companyName: 'Legacy Retail Group',
    status: ClientStatus.inactive,
  },
  {
    id: 'seed_client_brightforge_harbor',
    organizationId: 'seed_org_brightforge',
    name: 'Harbor Media',
    email: 'hello@harbormedia.co',
    companyName: 'Harbor Media Co.',
    status: ClientStatus.active,
  },
  {
    id: 'seed_client_brightforge_summit',
    organizationId: 'seed_org_brightforge',
    name: 'Summit Gear',
    email: 'sales@summitgear.com',
    companyName: 'Summit Gear',
    status: ClientStatus.active,
  },
  {
    id: 'seed_client_brightforge_moonbase',
    organizationId: 'seed_org_brightforge',
    name: 'Moonbase Travel',
    email: 'team@moonbase.travel',
    companyName: 'Moonbase Travel',
    status: ClientStatus.archived,
  },
  {
    id: 'seed_client_northstar_quarry',
    organizationId: 'seed_org_northstar',
    name: 'Quarry Systems',
    email: 'product@quarrysystems.io',
    companyName: 'Quarry Systems',
    status: ClientStatus.active,
  },
  {
    id: 'seed_client_northstar_lumen',
    organizationId: 'seed_org_northstar',
    name: 'Lumen Freight',
    email: 'ops@lumenfreight.com',
    companyName: 'Lumen Freight',
    status: ClientStatus.active,
  },
  {
    id: 'seed_client_northstar_oldport',
    organizationId: 'seed_org_northstar',
    name: 'Oldport Logistics',
    email: 'it@oldportlogistics.com',
    companyName: 'Oldport Logistics',
    status: ClientStatus.inactive,
  },
  {
    id: 'seed_client_everpeak_greenleaf',
    organizationId: 'seed_org_everpeak',
    name: 'Greenleaf Clinic',
    email: 'admin@greenleafclinic.health',
    companyName: 'Greenleaf Clinic',
    status: ClientStatus.active,
  },
  {
    id: 'seed_client_everpeak_maple',
    organizationId: 'seed_org_everpeak',
    name: 'Maple Diagnostics',
    email: 'support@mapledx.com',
    companyName: 'Maple Diagnostics',
    status: ClientStatus.active,
  },
  {
    id: 'seed_client_everpeak_riverside',
    organizationId: 'seed_org_everpeak',
    name: 'Riverside Care',
    email: 'ops@riversidecare.org',
    companyName: 'Riverside Care',
    status: ClientStatus.archived,
  },
] as const;

const projects = [
  {
    id: 'seed_project_pulselane_website',
    organizationId: 'seed_org_pulselane',
    clientId: 'seed_client_pulselane_acme',
    name: 'Website Redesign',
    description: 'New marketing website focused on demo conversion.',
    status: ProjectStatus.active,
  },
  {
    id: 'seed_project_pulselane_crm',
    organizationId: 'seed_org_pulselane',
    clientId: 'seed_client_pulselane_orbit',
    name: 'CRM Migration',
    description: 'Migrate sales pipeline data and automate lifecycle stages.',
    status: ProjectStatus.on_hold,
  },
  {
    id: 'seed_project_brightforge_brand',
    organizationId: 'seed_org_brightforge',
    clientId: 'seed_client_brightforge_harbor',
    name: 'Brand Refresh',
    description: 'Refresh visual identity and launch assets.',
    status: ProjectStatus.active,
  },
  {
    id: 'seed_project_brightforge_store',
    organizationId: 'seed_org_brightforge',
    clientId: 'seed_client_brightforge_summit',
    name: 'Storefront Revamp',
    description: 'Improve mobile checkout and campaign landing pages.',
    status: ProjectStatus.completed,
  },
  {
    id: 'seed_project_northstar_dashboard',
    organizationId: 'seed_org_northstar',
    clientId: 'seed_client_northstar_quarry',
    name: 'Operations Dashboard',
    description: 'Executive dashboard for delivery KPIs and SLA visibility.',
    status: ProjectStatus.active,
  },
  {
    id: 'seed_project_northstar_api',
    organizationId: 'seed_org_northstar',
    clientId: 'seed_client_northstar_lumen',
    name: 'Carrier API Integration',
    description: 'Connect carrier feeds and normalize shipment statuses.',
    status: ProjectStatus.active,
  },
  {
    id: 'seed_project_everpeak_portal',
    organizationId: 'seed_org_everpeak',
    clientId: 'seed_client_everpeak_greenleaf',
    name: 'Patient Portal MVP',
    description: 'Launch secure access to appointments and care plans.',
    status: ProjectStatus.active,
  },
  {
    id: 'seed_project_everpeak_lab',
    organizationId: 'seed_org_everpeak',
    clientId: 'seed_client_everpeak_maple',
    name: 'Lab Results Delivery',
    description: 'Automate delivery of lab result notifications.',
    status: ProjectStatus.on_hold,
  },
] as const;

const tasks = [
  {
    id: 'seed_task_pulselane_brief',
    organizationId: 'seed_org_pulselane',
    projectId: 'seed_project_pulselane_website',
    assigneeUserId: 'seed_user_raul',
    title: 'Finalize homepage brief',
    description: 'Document positioning, CTA hierarchy and proof points.',
    status: TaskStatus.in_progress,
    priority: TaskPriority.high,
    dueDate: new Date('2026-04-15T14:00:00.000Z'),
  },
  {
    id: 'seed_task_pulselane_copy',
    organizationId: 'seed_org_pulselane',
    projectId: 'seed_project_pulselane_website',
    assigneeUserId: 'seed_user_raul',
    title: 'Prepare hero copy options',
    description: 'Write three headline variants for stakeholder review.',
    status: TaskStatus.todo,
    priority: TaskPriority.medium,
    dueDate: new Date('2026-04-18T14:00:00.000Z'),
  },
  {
    id: 'seed_task_pulselane_mapping',
    organizationId: 'seed_org_pulselane',
    projectId: 'seed_project_pulselane_crm',
    assigneeUserId: 'seed_user_raul',
    title: 'Validate CRM field mapping',
    description: 'Confirm source fields and required transformations.',
    status: TaskStatus.todo,
    priority: TaskPriority.urgent,
    dueDate: new Date('2026-04-11T14:00:00.000Z'),
  },
  {
    id: 'seed_task_brightforge_assets',
    organizationId: 'seed_org_brightforge',
    projectId: 'seed_project_brightforge_brand',
    assigneeUserId: 'seed_user_ana',
    title: 'Assemble launch asset checklist',
    description: 'List social, paid media and email assets for release.',
    status: TaskStatus.in_progress,
    priority: TaskPriority.high,
    dueDate: new Date('2026-04-12T14:00:00.000Z'),
  },
  {
    id: 'seed_task_brightforge_qa',
    organizationId: 'seed_org_brightforge',
    projectId: 'seed_project_brightforge_store',
    assigneeUserId: 'seed_user_ana',
    title: 'Close storefront QA',
    description: 'Review checkout regression fixes and publish sign-off.',
    status: TaskStatus.done,
    priority: TaskPriority.medium,
    dueDate: new Date('2026-03-28T14:00:00.000Z'),
  },
  {
    id: 'seed_task_northstar_kpis',
    organizationId: 'seed_org_northstar',
    projectId: 'seed_project_northstar_dashboard',
    assigneeUserId: 'seed_user_bruno',
    title: 'Define dashboard KPI set',
    description: 'Freeze metrics, targets and refresh cadence.',
    status: TaskStatus.in_progress,
    priority: TaskPriority.high,
    dueDate: new Date('2026-04-17T14:00:00.000Z'),
  },
  {
    id: 'seed_task_northstar_webhooks',
    organizationId: 'seed_org_northstar',
    projectId: 'seed_project_northstar_api',
    assigneeUserId: 'seed_user_bruno',
    title: 'Implement carrier webhook normalization',
    description: 'Map provider events into the internal shipment timeline.',
    status: TaskStatus.todo,
    priority: TaskPriority.urgent,
    dueDate: new Date('2026-04-19T14:00:00.000Z'),
  },
  {
    id: 'seed_task_everpeak_login',
    organizationId: 'seed_org_everpeak',
    projectId: 'seed_project_everpeak_portal',
    assigneeUserId: 'seed_user_clara',
    title: 'Implement patient login journey',
    description: 'Support password login and session expiration rules.',
    status: TaskStatus.in_progress,
    priority: TaskPriority.urgent,
    dueDate: new Date('2026-04-10T18:00:00.000Z'),
  },
  {
    id: 'seed_task_everpeak_notifications',
    organizationId: 'seed_org_everpeak',
    projectId: 'seed_project_everpeak_lab',
    assigneeUserId: 'seed_user_clara',
    title: 'Review lab notification flow',
    description: 'Define retry policy and delivery audit requirements.',
    status: TaskStatus.todo,
    priority: TaskPriority.medium,
    dueDate: new Date('2026-04-22T14:00:00.000Z'),
  },
] as const;

const authSessions = [
  {
    id: 'seed_session_raul',
    userId: 'seed_user_raul',
    deviceId: 'seed-device-raul',
    refreshTokenHash: 'placeholder',
    userAgent: 'Mozilla/5.0 PulselaneSeed/1.0',
    ipAddress: '127.0.0.1',
    expiresAt: new Date('2026-05-07T12:00:00.000Z'),
    lastUsedAt: new Date('2026-04-07T09:15:00.000Z'),
    revokedAt: null,
    compromisedAt: null,
  },
  {
    id: 'seed_session_ana',
    userId: 'seed_user_ana',
    deviceId: 'seed-device-ana',
    refreshTokenHash: 'placeholder',
    userAgent: 'Mozilla/5.0 PulselaneSeed/1.0',
    ipAddress: '127.0.0.1',
    expiresAt: new Date('2026-05-08T12:00:00.000Z'),
    lastUsedAt: new Date('2026-04-07T09:45:00.000Z'),
    revokedAt: null,
    compromisedAt: null,
  },
  {
    id: 'seed_session_bruno',
    userId: 'seed_user_bruno',
    deviceId: 'seed-device-bruno',
    refreshTokenHash: 'placeholder',
    userAgent: 'Mozilla/5.0 PulselaneSeed/1.0',
    ipAddress: '127.0.0.1',
    expiresAt: new Date('2026-05-09T12:00:00.000Z'),
    lastUsedAt: new Date('2026-04-07T10:10:00.000Z'),
    revokedAt: null,
    compromisedAt: null,
  },
  {
    id: 'seed_session_clara',
    userId: 'seed_user_clara',
    deviceId: 'seed-device-clara',
    refreshTokenHash: 'placeholder',
    userAgent: 'Mozilla/5.0 PulselaneSeed/1.0',
    ipAddress: '127.0.0.1',
    expiresAt: new Date('2026-05-10T12:00:00.000Z'),
    lastUsedAt: new Date('2026-04-07T10:30:00.000Z'),
    revokedAt: null,
    compromisedAt: null,
  },
] as const;

const auditLogs: Array<{
  id: string;
  organizationId: string;
  actorUserId: string;
  entityType: string;
  entityId: string;
  action: AuditLogAction;
  metadata: Prisma.InputJsonValue;
  createdAt: Date;
}> = [
  {
    id: 'seed_audit_client_acme_created',
    organizationId: 'seed_org_pulselane',
    actorUserId: 'seed_user_raul',
    entityType: 'client',
    entityId: 'seed_client_pulselane_acme',
    action: AuditLogAction.created,
    metadata: {
      name: 'Acme Corp',
      email: 'contact@acme.com',
      companyName: 'Acme Corporation',
      status: ClientStatus.active,
    },
    createdAt: new Date('2026-04-01T12:00:00.000Z'),
  },
  {
    id: 'seed_audit_client_orbit_created',
    organizationId: 'seed_org_pulselane',
    actorUserId: 'seed_user_raul',
    entityType: 'client',
    entityId: 'seed_client_pulselane_orbit',
    action: AuditLogAction.created,
    metadata: {
      name: 'Orbit Finance',
      email: 'ops@orbitfinance.com',
      companyName: 'Orbit Finance',
      status: ClientStatus.active,
    },
    createdAt: new Date('2026-04-01T12:10:00.000Z'),
  },
  {
    id: 'seed_audit_client_legacy_updated',
    organizationId: 'seed_org_pulselane',
    actorUserId: 'seed_user_raul',
    entityType: 'client',
    entityId: 'seed_client_pulselane_legacy',
    action: AuditLogAction.updated,
    metadata: {
      name: 'Legacy Retail',
      email: 'finance@legacyretail.com',
      companyName: 'Legacy Retail Group',
      status: ClientStatus.inactive,
    },
    createdAt: new Date('2026-04-01T12:20:00.000Z'),
  },
  {
    id: 'seed_audit_project_website_created',
    organizationId: 'seed_org_pulselane',
    actorUserId: 'seed_user_raul',
    entityType: 'project',
    entityId: 'seed_project_pulselane_website',
    action: AuditLogAction.created,
    metadata: {
      clientId: 'seed_client_pulselane_acme',
      name: 'Website Redesign',
      description: 'New marketing website focused on demo conversion.',
      status: ProjectStatus.active,
    },
    createdAt: new Date('2026-04-02T09:00:00.000Z'),
  },
  {
    id: 'seed_audit_project_crm_created',
    organizationId: 'seed_org_pulselane',
    actorUserId: 'seed_user_raul',
    entityType: 'project',
    entityId: 'seed_project_pulselane_crm',
    action: AuditLogAction.created,
    metadata: {
      clientId: 'seed_client_pulselane_orbit',
      name: 'CRM Migration',
      description: 'Migrate sales pipeline data and automate lifecycle stages.',
      status: ProjectStatus.on_hold,
    },
    createdAt: new Date('2026-04-02T09:15:00.000Z'),
  },
  {
    id: 'seed_audit_task_brief_created',
    organizationId: 'seed_org_pulselane',
    actorUserId: 'seed_user_raul',
    entityType: 'task',
    entityId: 'seed_task_pulselane_brief',
    action: AuditLogAction.created,
    metadata: {
      projectId: 'seed_project_pulselane_website',
      assigneeUserId: 'seed_user_raul',
      title: 'Finalize homepage brief',
      status: TaskStatus.in_progress,
      priority: TaskPriority.high,
      dueDate: '2026-04-15T14:00:00.000Z',
    },
    createdAt: new Date('2026-04-03T08:30:00.000Z'),
  },
  {
    id: 'seed_audit_task_mapping_created',
    organizationId: 'seed_org_pulselane',
    actorUserId: 'seed_user_raul',
    entityType: 'task',
    entityId: 'seed_task_pulselane_mapping',
    action: AuditLogAction.created,
    metadata: {
      projectId: 'seed_project_pulselane_crm',
      assigneeUserId: 'seed_user_raul',
      title: 'Validate CRM field mapping',
      status: TaskStatus.todo,
      priority: TaskPriority.urgent,
      dueDate: '2026-04-11T14:00:00.000Z',
    },
    createdAt: new Date('2026-04-03T08:45:00.000Z'),
  },
  {
    id: 'seed_audit_client_harbor_created',
    organizationId: 'seed_org_brightforge',
    actorUserId: 'seed_user_ana',
    entityType: 'client',
    entityId: 'seed_client_brightforge_harbor',
    action: AuditLogAction.created,
    metadata: {
      name: 'Harbor Media',
      email: 'hello@harbormedia.co',
      companyName: 'Harbor Media Co.',
      status: ClientStatus.active,
    },
    createdAt: new Date('2026-04-01T13:00:00.000Z'),
  },
  {
    id: 'seed_audit_client_summit_created',
    organizationId: 'seed_org_brightforge',
    actorUserId: 'seed_user_ana',
    entityType: 'client',
    entityId: 'seed_client_brightforge_summit',
    action: AuditLogAction.created,
    metadata: {
      name: 'Summit Gear',
      email: 'sales@summitgear.com',
      companyName: 'Summit Gear',
      status: ClientStatus.active,
    },
    createdAt: new Date('2026-04-01T13:10:00.000Z'),
  },
  {
    id: 'seed_audit_project_brand_created',
    organizationId: 'seed_org_brightforge',
    actorUserId: 'seed_user_ana',
    entityType: 'project',
    entityId: 'seed_project_brightforge_brand',
    action: AuditLogAction.created,
    metadata: {
      clientId: 'seed_client_brightforge_harbor',
      name: 'Brand Refresh',
      description: 'Refresh visual identity and launch assets.',
      status: ProjectStatus.active,
    },
    createdAt: new Date('2026-04-02T10:00:00.000Z'),
  },
  {
    id: 'seed_audit_task_assets_created',
    organizationId: 'seed_org_brightforge',
    actorUserId: 'seed_user_ana',
    entityType: 'task',
    entityId: 'seed_task_brightforge_assets',
    action: AuditLogAction.created,
    metadata: {
      projectId: 'seed_project_brightforge_brand',
      assigneeUserId: 'seed_user_ana',
      title: 'Assemble launch asset checklist',
      status: TaskStatus.in_progress,
      priority: TaskPriority.high,
      dueDate: '2026-04-12T14:00:00.000Z',
    },
    createdAt: new Date('2026-04-03T09:00:00.000Z'),
  },
  {
    id: 'seed_audit_task_qa_updated',
    organizationId: 'seed_org_brightforge',
    actorUserId: 'seed_user_ana',
    entityType: 'task',
    entityId: 'seed_task_brightforge_qa',
    action: AuditLogAction.updated,
    metadata: {
      projectId: 'seed_project_brightforge_store',
      assigneeUserId: 'seed_user_ana',
      title: 'Close storefront QA',
      status: TaskStatus.done,
      priority: TaskPriority.medium,
      dueDate: '2026-03-28T14:00:00.000Z',
    },
    createdAt: new Date('2026-03-29T16:00:00.000Z'),
  },
  {
    id: 'seed_audit_client_quarry_created',
    organizationId: 'seed_org_northstar',
    actorUserId: 'seed_user_bruno',
    entityType: 'client',
    entityId: 'seed_client_northstar_quarry',
    action: AuditLogAction.created,
    metadata: {
      name: 'Quarry Systems',
      email: 'product@quarrysystems.io',
      companyName: 'Quarry Systems',
      status: ClientStatus.active,
    },
    createdAt: new Date('2026-04-01T14:00:00.000Z'),
  },
  {
    id: 'seed_audit_client_lumen_created',
    organizationId: 'seed_org_northstar',
    actorUserId: 'seed_user_bruno',
    entityType: 'client',
    entityId: 'seed_client_northstar_lumen',
    action: AuditLogAction.created,
    metadata: {
      name: 'Lumen Freight',
      email: 'ops@lumenfreight.com',
      companyName: 'Lumen Freight',
      status: ClientStatus.active,
    },
    createdAt: new Date('2026-04-01T14:10:00.000Z'),
  },
  {
    id: 'seed_audit_project_dashboard_created',
    organizationId: 'seed_org_northstar',
    actorUserId: 'seed_user_bruno',
    entityType: 'project',
    entityId: 'seed_project_northstar_dashboard',
    action: AuditLogAction.created,
    metadata: {
      clientId: 'seed_client_northstar_quarry',
      name: 'Operations Dashboard',
      description: 'Executive dashboard for delivery KPIs and SLA visibility.',
      status: ProjectStatus.active,
    },
    createdAt: new Date('2026-04-02T11:00:00.000Z'),
  },
  {
    id: 'seed_audit_task_kpis_created',
    organizationId: 'seed_org_northstar',
    actorUserId: 'seed_user_bruno',
    entityType: 'task',
    entityId: 'seed_task_northstar_kpis',
    action: AuditLogAction.created,
    metadata: {
      projectId: 'seed_project_northstar_dashboard',
      assigneeUserId: 'seed_user_bruno',
      title: 'Define dashboard KPI set',
      status: TaskStatus.in_progress,
      priority: TaskPriority.high,
      dueDate: '2026-04-17T14:00:00.000Z',
    },
    createdAt: new Date('2026-04-03T10:00:00.000Z'),
  },
  {
    id: 'seed_audit_task_webhooks_created',
    organizationId: 'seed_org_northstar',
    actorUserId: 'seed_user_bruno',
    entityType: 'task',
    entityId: 'seed_task_northstar_webhooks',
    action: AuditLogAction.created,
    metadata: {
      projectId: 'seed_project_northstar_api',
      assigneeUserId: 'seed_user_bruno',
      title: 'Implement carrier webhook normalization',
      status: TaskStatus.todo,
      priority: TaskPriority.urgent,
      dueDate: '2026-04-19T14:00:00.000Z',
    },
    createdAt: new Date('2026-04-03T10:15:00.000Z'),
  },
  {
    id: 'seed_audit_client_greenleaf_created',
    organizationId: 'seed_org_everpeak',
    actorUserId: 'seed_user_clara',
    entityType: 'client',
    entityId: 'seed_client_everpeak_greenleaf',
    action: AuditLogAction.created,
    metadata: {
      name: 'Greenleaf Clinic',
      email: 'admin@greenleafclinic.health',
      companyName: 'Greenleaf Clinic',
      status: ClientStatus.active,
    },
    createdAt: new Date('2026-04-01T15:00:00.000Z'),
  },
  {
    id: 'seed_audit_client_maple_created',
    organizationId: 'seed_org_everpeak',
    actorUserId: 'seed_user_clara',
    entityType: 'client',
    entityId: 'seed_client_everpeak_maple',
    action: AuditLogAction.created,
    metadata: {
      name: 'Maple Diagnostics',
      email: 'support@mapledx.com',
      companyName: 'Maple Diagnostics',
      status: ClientStatus.active,
    },
    createdAt: new Date('2026-04-01T15:10:00.000Z'),
  },
  {
    id: 'seed_audit_project_portal_created',
    organizationId: 'seed_org_everpeak',
    actorUserId: 'seed_user_clara',
    entityType: 'project',
    entityId: 'seed_project_everpeak_portal',
    action: AuditLogAction.created,
    metadata: {
      clientId: 'seed_client_everpeak_greenleaf',
      name: 'Patient Portal MVP',
      description: 'Launch secure access to appointments and care plans.',
      status: ProjectStatus.active,
    },
    createdAt: new Date('2026-04-02T12:00:00.000Z'),
  },
  {
    id: 'seed_audit_task_login_created',
    organizationId: 'seed_org_everpeak',
    actorUserId: 'seed_user_clara',
    entityType: 'task',
    entityId: 'seed_task_everpeak_login',
    action: AuditLogAction.created,
    metadata: {
      projectId: 'seed_project_everpeak_portal',
      assigneeUserId: 'seed_user_clara',
      title: 'Implement patient login journey',
      status: TaskStatus.in_progress,
      priority: TaskPriority.urgent,
      dueDate: '2026-04-10T18:00:00.000Z',
    },
    createdAt: new Date('2026-04-03T11:00:00.000Z'),
  },
  {
    id: 'seed_audit_task_notifications_created',
    organizationId: 'seed_org_everpeak',
    actorUserId: 'seed_user_clara',
    entityType: 'task',
    entityId: 'seed_task_everpeak_notifications',
    action: AuditLogAction.created,
    metadata: {
      projectId: 'seed_project_everpeak_lab',
      assigneeUserId: 'seed_user_clara',
      title: 'Review lab notification flow',
      status: TaskStatus.todo,
      priority: TaskPriority.medium,
      dueDate: '2026-04-22T14:00:00.000Z',
    },
    createdAt: new Date('2026-04-03T11:15:00.000Z'),
  },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash(defaultPassword, 10);
  const refreshTokenHash = await bcrypt.hash('seed-refresh-token', 10);

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        email: user.email,
        passwordHash,
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash,
      },
    });
  }

  for (const organization of organizations) {
    await prisma.organization.upsert({
      where: { id: organization.id },
      update: {
        name: organization.name,
        slug: organization.slug,
      },
      create: organization,
    });
  }

  for (const membership of memberships) {
    await prisma.membership.upsert({
      where: { id: membership.id },
      update: {
        userId: membership.userId,
        organizationId: membership.organizationId,
        role: membership.role,
      },
      create: membership,
    });
  }

  for (const client of clients) {
    await prisma.client.upsert({
      where: { id: client.id },
      update: {
        organizationId: client.organizationId,
        name: client.name,
        email: client.email,
        companyName: client.companyName,
        status: client.status,
      },
      create: client,
    });
  }

  for (const project of projects) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: {
        organizationId: project.organizationId,
        clientId: project.clientId,
        name: project.name,
        description: project.description,
        status: project.status,
      },
      create: project,
    });
  }

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {
        organizationId: task.organizationId,
        projectId: task.projectId,
        assigneeUserId: task.assigneeUserId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
      },
      create: task,
    });
  }

  for (const session of authSessions) {
    await prisma.authSession.upsert({
      where: { id: session.id },
      update: {
        userId: session.userId,
        deviceId: session.deviceId,
        refreshTokenHash,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        expiresAt: session.expiresAt,
        lastUsedAt: session.lastUsedAt,
        revokedAt: session.revokedAt,
        compromisedAt: session.compromisedAt,
      },
      create: {
        ...session,
        refreshTokenHash,
      },
    });
  }

  for (const auditLog of auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: auditLog.id },
      update: {
        organizationId: auditLog.organizationId,
        actorUserId: auditLog.actorUserId,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        action: auditLog.action,
        metadata: auditLog.metadata,
        createdAt: auditLog.createdAt,
      },
      create: auditLog,
    });
  }

  console.log(
    [
      'Seed completed successfully.',
      `Users: ${users.length}`,
      `Organizations: ${organizations.length}`,
      `Memberships: ${memberships.length}`,
      `Clients: ${clients.length}`,
      `Projects: ${projects.length}`,
      `Tasks: ${tasks.length}`,
      `Sessions: ${authSessions.length}`,
      `Audit logs: ${auditLogs.length}`,
      `Default password: ${defaultPassword}`,
    ].join('\n'),
  );
}

main()
  .catch((error) => {
    console.error('Failed to run seed.');
    console.error(error);
    process.exitCode = 1;
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .finally(async () => {
    await prisma.$disconnect();
  });
