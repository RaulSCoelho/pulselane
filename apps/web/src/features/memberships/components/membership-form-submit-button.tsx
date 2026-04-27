'use client'

import { Button } from '@heroui/react'
import { useFormStatus } from 'react-dom'

type MembershipFormSubmitButtonProps = {
  idleLabel: string
  pendingLabel: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
}

export function MembershipFormSubmitButton({
  idleLabel,
  pendingLabel,
  size = 'md',
  variant = 'primary'
}: MembershipFormSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button isPending={pending} size={size} type="submit" variant={variant}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  )
}
