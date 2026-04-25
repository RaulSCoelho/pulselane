'use client'

import { Button } from '@heroui/react'
import { useFormStatus } from 'react-dom'

type ProjectFormSubmitButtonProps = {
  idleLabel: string
  pendingLabel: string
  size?: 'sm' | 'md' | 'lg'
}

export function ProjectFormSubmitButton({ idleLabel, pendingLabel, size = 'md' }: ProjectFormSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button isPending={pending} size={size} type="submit" variant="primary">
      {pending ? pendingLabel : idleLabel}
    </Button>
  )
}
