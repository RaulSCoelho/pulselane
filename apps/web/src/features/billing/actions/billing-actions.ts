'use server'

import { billingPlansCacheTag } from '@/features/billing/api/cache-tags'
import type { BillingRedirectActionState } from '@/features/billing/components/billing-action-state'
import { currentOrganizationCacheTag } from '@/features/organizations/api/cache-tags'
import { readApiErrorMessage } from '@/http/api-error'
import { serverApi } from '@/http/server-api-client'
import { BILLING_PATH } from '@/lib/billing/billing-constants'
import { APP_HOME_PATH } from '@/lib/organizations/organization-context-constants'
import { getActiveOrganizationIdFromServerCookies } from '@/lib/organizations/organization-context-server'
import {
  CreateCheckoutSessionRequest,
  createBillingPortalSessionResponseSchema,
  createCheckoutSessionRequestSchema,
  createCheckoutSessionResponseSchema
} from '@pulselane/contracts/billing'
import { revalidatePath, updateTag } from 'next/cache'

async function updateBillingCacheTags() {
  const organizationId = await getActiveOrganizationIdFromServerCookies()

  if (!organizationId) {
    return
  }

  updateTag(billingPlansCacheTag(organizationId))
  updateTag(currentOrganizationCacheTag(organizationId))
}

export async function createCheckoutSessionAction(
  _previousState: BillingRedirectActionState,
  formData: FormData
): Promise<BillingRedirectActionState> {
  const rawPlan = String(formData.get('plan') ?? '').trim()
  const actionKey = `checkout:${rawPlan}`

  const payload: CreateCheckoutSessionRequest = {
    plan: rawPlan as CreateCheckoutSessionRequest['plan']
  }

  const parsed = createCheckoutSessionRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Invalid plan selection.',
      redirectUrl: null,
      actionKey
    }
  }

  const response = await serverApi('/api/v1/billing/checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parsed.data)
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to create checkout session.'),
      redirectUrl: null,
      actionKey
    }
  }

  const body = createCheckoutSessionResponseSchema.safeParse(await response.json().catch(() => null))

  if (!body.success) {
    return {
      status: 'error',
      message: 'Checkout session response could not be validated safely.',
      redirectUrl: null,
      actionKey
    }
  }

  await updateBillingCacheTags()

  revalidatePath(BILLING_PATH)
  revalidatePath(APP_HOME_PATH)

  return {
    status: 'success',
    message: 'Checkout session created. Redirecting to Stripe.',
    redirectUrl: body.data.url,
    actionKey
  }
}

export async function createBillingPortalSessionAction(): Promise<BillingRedirectActionState> {
  const actionKey = 'portal'

  const response = await serverApi('/api/v1/billing/portal-session', {
    method: 'POST'
  })

  if (!response.ok) {
    return {
      status: 'error',
      message: await readApiErrorMessage(response, 'Unable to create billing portal session.'),
      redirectUrl: null,
      actionKey
    }
  }

  const body = createBillingPortalSessionResponseSchema.safeParse(await response.json().catch(() => null))

  if (!body.success) {
    return {
      status: 'error',
      message: 'Billing portal response could not be validated safely.',
      redirectUrl: null,
      actionKey
    }
  }

  await updateBillingCacheTags()

  revalidatePath(BILLING_PATH)
  revalidatePath(APP_HOME_PATH)

  return {
    status: 'success',
    message: 'Billing portal session created. Redirecting to Stripe.',
    redirectUrl: body.data.url,
    actionKey
  }
}
