'use client'

import { createCheckoutSessionAction } from '@/features/billing/actions/billing-actions'
import { initialBillingRedirectActionState } from '@/features/billing/components/billing-action-state'
import { Alert, Form, toast } from '@heroui/react'
import type { BillingPlanCatalogItem } from '@pulselane/contracts/billing'
import { useActionState, useEffect } from 'react'

import { BillingFormSubmitButton } from './billing-form-submit-button'

type BillingPlanActionFormProps = {
  plan: BillingPlanCatalogItem
  canManage: boolean
}

function getActionLabel(plan: BillingPlanCatalogItem) {
  if (plan.action === 'current') {
    return 'Current plan'
  }

  if (plan.action === 'checkout') {
    if (plan.changeKind === 'upgrade') {
      return `Upgrade to ${plan.displayName}`
    }

    if (plan.changeKind === 'downgrade') {
      return `Downgrade to ${plan.displayName}`
    }

    return `Choose ${plan.displayName}`
  }

  if (plan.action === 'manage_in_portal') {
    return 'Manage in portal'
  }

  return 'Unavailable'
}

export function BillingPlanActionForm({ plan, canManage }: BillingPlanActionFormProps) {
  const [state, formAction] = useActionState(createCheckoutSessionAction, initialBillingRedirectActionState)
  const isCheckout = plan.action === 'checkout'
  const canSubmit = canManage && isCheckout

  useEffect(() => {
    if (state.actionKey !== `checkout:${plan.plan}`) {
      return
    }

    if (state.status === 'success' && state.message && state.redirectUrl) {
      toast.success(state.message)
      window.location.assign(state.redirectUrl)
      return
    }

    if (state.status === 'error' && state.message) {
      toast.danger(state.message)
    }
  }, [plan.plan, state.actionKey, state.message, state.redirectUrl, state.status])

  if (!isCheckout) {
    return (
      <BillingFormSubmitButton
        idleLabel={getActionLabel(plan)}
        pendingLabel="Loading..."
        isDisabled
        variant={plan.action === 'current' ? 'secondary' : 'outline'}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Form action={formAction}>
        <input type="hidden" name="plan" value={plan.plan} />

        <BillingFormSubmitButton
          idleLabel={getActionLabel(plan)}
          pendingLabel="Redirecting..."
          isDisabled={!canSubmit}
          variant="primary"
        />
      </Form>

      {!canManage ? <p className="text-xs text-muted">Only owners and admins can change billing.</p> : null}

      {state.actionKey === `checkout:${plan.plan}` && state.status === 'error' && state.message ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Checkout unavailable</Alert.Title>
            <Alert.Description>{state.message}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
    </div>
  )
}
