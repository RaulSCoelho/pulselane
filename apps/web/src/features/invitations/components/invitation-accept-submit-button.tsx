'use client'

import { Button } from '@heroui/react'
import { useFormStatus } from 'react-dom'

export function InvitationAcceptSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button isPending={pending} size="lg" type="submit" variant="primary">
      {pending ? 'Accepting invitation...' : 'Accept invitation'}
    </Button>
  )
}
