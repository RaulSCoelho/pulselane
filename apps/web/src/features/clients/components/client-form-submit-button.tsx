'use client'

import { Button } from '@heroui/react'
import { useFormStatus } from 'react-dom'

type ClientFormSubmitButtonProps = {
  idleLabel: string
  pendingLabel: string
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ClientFormSubmitButton({
  idleLabel,
  pendingLabel,
  variant = 'primary',
  size = 'md',
  className
}: ClientFormSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant={variant} size={size} isPending={pending} isDisabled={pending} className={className}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  )
}
