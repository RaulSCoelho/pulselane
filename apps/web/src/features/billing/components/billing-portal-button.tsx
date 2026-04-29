'use client'

import { createBillingPortalSessionAction } from '@/features/billing/actions/billing-actions'
import { initialBillingRedirectActionState } from '@/features/billing/components/billing-action-state'
import { Alert, Form, toast } from '@heroui/react'
import { useActionState, useEffect } from 'react'

import { BillingFormSubmitButton } from './billing-form-submit-button'

type BillingPortalButtonProps = {
  canManage: boolean
  isAvailable: boolean
}

export function BillingPortalButton({ canManage, isAvailable }: BillingPortalButtonProps) {
  const [state, formAction] = useActionState(createBillingPortalSessionAction, initialBillingRedirectActionState)
  const canSubmit = canManage && isAvailable

  useEffect(() => {
    if (state.actionKey !== 'portal') {
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
  }, [state.actionKey, state.message, state.redirectUrl, state.status])

  return (
    <div className="flex flex-col gap-3">
      <Form action={formAction}>
        <BillingFormSubmitButton
          idleLabel="Open billing portal"
          pendingLabel="Opening portal..."
          isDisabled={!canSubmit}
          variant="outline"
        />
      </Form>

      {!isAvailable ? (
        <p className="text-xs text-muted">Portal is available after a Stripe customer exists for this organization.</p>
      ) : null}

      {!canManage ? <p className="text-xs text-muted">Only owners and admins can access the billing portal.</p> : null}

      {state.actionKey === 'portal' && state.status === 'error' && state.message ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Portal unavailable</Alert.Title>
            <Alert.Description>{state.message}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
    </div>
  )
}
