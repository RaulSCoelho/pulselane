'use client'

import { Button } from '@heroui/react'
import { useFormStatus } from 'react-dom'

type BillingFormSubmitButtonProps = {
  idleLabel: string
  pendingLabel: string
  isDisabled?: boolean
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
}

export function BillingFormSubmitButton({
  idleLabel,
  pendingLabel,
  isDisabled = false,
  variant = 'primary'
}: BillingFormSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button isDisabled={isDisabled || pending} isPending={pending} size="md" type="submit" variant={variant}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  )
}
