'use client'

import { Button } from '@heroui/react'
import type { ComponentProps } from 'react'
import { useFormStatus } from 'react-dom'

type PendingSubmitButtonProps = Omit<ComponentProps<typeof Button>, 'children' | 'isPending' | 'type'> & {
  idleLabel: string
  pendingLabel: string
}

export function PendingSubmitButton({
  idleLabel,
  pendingLabel,
  isDisabled,
  size = 'md',
  variant = 'primary',
  ...buttonProps
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button
      {...buttonProps}
      isDisabled={isDisabled || pending}
      isPending={pending}
      size={size}
      type="submit"
      variant={variant}
    >
      {pending ? pendingLabel : idleLabel}
    </Button>
  )
}
