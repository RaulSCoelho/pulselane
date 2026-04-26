'use client'

import { Button } from '@heroui/react'
import { useFormStatus } from 'react-dom'

type CommentFormSubmitButtonProps = {
  idleLabel: string
  pendingLabel: string
  size?: 'sm' | 'md' | 'lg'
}

export function CommentFormSubmitButton({ idleLabel, pendingLabel, size = 'md' }: CommentFormSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button isPending={pending} size={size} type="submit" variant="primary">
      {pending ? pendingLabel : idleLabel}
    </Button>
  )
}
