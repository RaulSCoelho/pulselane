import { BillingPlan } from '@prisma/client';

export type UsageMetric = 'members' | 'clients' | 'projects' | 'active_tasks';

export const billingPlanLimits: Record<
  BillingPlan,
  Record<UsageMetric, number | null>
> = {
  free: {
    members: 3,
    clients: 10,
    projects: 10,
    active_tasks: 100,
  },
  starter: {
    members: 10,
    clients: 100,
    projects: 100,
    active_tasks: 5000,
  },
  growth: {
    members: null,
    clients: null,
    projects: null,
    active_tasks: null,
  },
};

export const usageMetricLabels: Record<UsageMetric, string> = {
  members: 'members',
  clients: 'clients',
  projects: 'projects',
  active_tasks: 'active tasks',
};
