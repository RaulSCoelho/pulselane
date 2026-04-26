'use client'

import { Button } from '@heroui/react'
import { useFormStatus } from 'react-dom'

type TaskFormSubmitButtonProps = {
  idleLabel: string
  pendingLabel: string
  size?: 'sm' | 'md' | 'lg'
}

export function TaskFormSubmitButton({ idleLabel, pendingLabel, size = 'md' }: TaskFormSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button isPending={pending} size={size} type="submit" variant="primary">
      {pending ? pendingLabel : idleLabel}
    </Button>
  )
}
