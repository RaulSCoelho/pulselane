'use client'

import { Button } from '@heroui/react'
import { useFormStatus } from 'react-dom'

export function OrganizationSettingsSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button isPending={pending} size="lg" type="submit" variant="primary">
      {pending ? 'Saving organization...' : 'Save organization'}
    </Button>
  )
}
